import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

interface EventListItem {
  title: string;
  location?: string;
  start_time?: string;
  duration?: number;
}

// POST /api/ai/generate-event - Generate an event from natural language input
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, userInput } = body;

    if (!planId || !userInput) {
      return NextResponse.json(
        { error: "Plan ID and user input are required" },
        { status: 400 }
      );
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

    // Get existing events to understand context and ordering
    const events = await sql`
      SELECT * FROM events 
      WHERE plan_id = ${planId}
      ORDER BY start_time, created_at
    `;

    // Create a prompt for AI to parse the user's request
    const prompt = `You are an AI assistant helping to create events for an outing plan. The user has provided a natural language description of an event they want to add.

Plan Title: ${plan.title}
Description: ${plan.description || 'None provided'}
Theme: ${plan.theme || 'None set'}

Existing Events (in order):
${events.map((e: EventListItem, idx: number) => `
${idx + 1}. ${e.title}${e.location ? ` at ${e.location}` : ''}${e.start_time ? ` (${e.start_time})` : ''}${e.duration ? ` - ${e.duration} minutes` : ''}
`).join('')}

User's Request: "${userInput}"

Please analyze this request and extract the following information in JSON format:
{
  "event": {
    "title": "<event title extracted from the request>",
    "description": "<brief description if you can infer it>",
    "location": "<location mentioned or null>",
    "duration": <estimated duration in minutes or null>,
    "notes": "<any additional notes or null>"
  },
  "placement": {
    "strategy": "after" | "before" | "end" | "start",
    "referenceEvent": "<title of the reference event if 'after' or 'before', otherwise null>",
    "explanation": "<brief explanation of placement logic>"
  }
}

Guidelines:
- Extract a clear, concise event title (e.g., "Dinner", "Walk in the park", "Coffee break")
- If a location is mentioned, include it exactly as stated
- Estimate a reasonable duration based on the activity type (e.g., dinner: 90-120 min, coffee: 30 min, museum: 120-180 min)
- For placement, determine if the user specified it should be "after" or "before" a specific event
- If no placement is specified, use "end" to add it at the end
- The referenceEvent should match an existing event title as closely as possible`;

    // Generate AI response
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.3,
    });

    // Parse the response
    let result;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, "Raw text:", text);
      return NextResponse.json({
        error: "Failed to parse AI response",
        rawResponse: text,
      }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating event:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
