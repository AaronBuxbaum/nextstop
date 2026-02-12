import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// POST /api/ai/analyze - Analyze a plan for pacing, quality, and theme
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId } = body;

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

    // Create a prompt for AI analysis
    const prompt = `You are an expert event planner analyzing an outing plan. Please analyze the following plan and provide detailed feedback.

Plan Title: ${plan.title}
Description: ${plan.description || 'None provided'}
Current Theme: ${plan.theme || 'None set'}

Events (${events.length}):
${events.map((e: { title: string; location?: string; start_time?: string; end_time?: string; duration?: number; description?: string; notes?: string }, idx: number) => `
${idx + 1}. ${e.title}
   Location: ${e.location || 'Not specified'}
   Time: ${e.start_time || 'Not specified'} - ${e.end_time || 'Not specified'}
   Duration: ${e.duration ? `${e.duration} minutes` : 'Not specified'}
   Description: ${e.description || 'None'}
   Notes: ${e.notes || 'None'}
`).join('\n')}

Please provide a comprehensive analysis in the following JSON format:
{
  "pacing": {
    "rating": <number 0-10>,
    "feedback": "<detailed feedback about the pacing>",
    "suggestions": ["<suggestion 1>", "<suggestion 2>", ...]
  },
  "quality": {
    "rating": <number 0-10>,
    "feedback": "<detailed feedback about quality>",
    "improvements": ["<improvement 1>", "<improvement 2>", ...]
  },
  "theme": {
    "suggested": "<suggested theme>",
    "coherence": <number 0-10>,
    "description": "<description of theme coherence>"
  }
}`;

    // Generate AI response
    const { text } = await generateText({
      model: openai("gpt-4-turbo"),
      prompt,
      temperature: 0.7,
    });

    // Parse the response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      // If parsing fails, return a structured error
      return NextResponse.json({
        error: "Failed to parse AI response",
        rawResponse: text,
      }, { status: 500 });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error analyzing plan:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
