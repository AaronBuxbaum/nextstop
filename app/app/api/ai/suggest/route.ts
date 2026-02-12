import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// POST /api/ai/suggest - Get AI suggestions for improving the plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, context } = body;

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    // Get plan with events
    const planResult = await sql`
      SELECT p.* FROM plans p
      LEFT JOIN plan_collaborators pc ON p.id = pc.plan_id
      WHERE p.id = ${planId}
        AND (p.user_id = ${session.user.id} OR pc.user_id = ${session.user.id})
    `;

    if (planResult.length === 0) {
      return NextResponse.json(
        { error: "Plan not found or unauthorized" },
        { status: 404 }
      );
    }

    const plan = planResult[0];

    // Get events
    const events = await sql`
      SELECT * FROM events 
      WHERE plan_id = ${planId}
      ORDER BY start_time, created_at
    `;

    const contextInfo = context ? `\n\nAdditional Context: ${context}` : '';

    const prompt = `You are an expert event planner. Based on the following outing plan, suggest 3-5 improvements or new events that would enhance the experience.

Plan Title: ${plan.title}
Description: ${plan.description || 'None provided'}
Theme: ${plan.theme || 'None set'}

Current Events (${events.length}):
${events.map((e: any, idx: number) => `
${idx + 1}. ${e.title} - ${e.location || 'Location TBD'}
   Time: ${e.start_time || 'TBD'} ${e.duration ? `(${e.duration} min)` : ''}
   ${e.description || ''}
`).join('\n')}${contextInfo}

Please provide suggestions in the following JSON array format:
[
  {
    "type": "event" | "modification" | "theme" | "pacing",
    "title": "<suggestion title>",
    "description": "<detailed description>",
    "event": {
      "title": "<event title>",
      "description": "<event description>",
      "location": "<suggested location>",
      "duration": <minutes>,
      "notes": "<any notes>"
    },
    "reasoning": "<why this would improve the plan>"
  }
]`;

    const { text } = await generateText({
      model: openai("gpt-4-turbo"),
      prompt,
      temperature: 0.8,
    });

    let suggestions;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      return NextResponse.json({
        error: "Failed to parse AI response",
        rawResponse: text,
      }, { status: 500 });
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
