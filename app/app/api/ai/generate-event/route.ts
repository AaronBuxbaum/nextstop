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

    if (typeof userInput !== 'string' || userInput.length > 1000) {
      return NextResponse.json(
        { error: "User input must be a string of 1000 characters or less" },
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

    // Build detailed location context from existing events (deduplicated)
    const locations = events
      .filter((e: EventListItem) => e.location)
      .map((e: EventListItem) => e.location as string);
    const uniqueLocations = Array.from(new Set(locations));
    const locationContext = uniqueLocations.join(', ');

    // Create a prompt for AI to parse the user's request
    const prompt = `You are an AI assistant helping to create events for an outing plan. The user has provided a natural language description of an event they want to add.

Plan Title: ${plan.title}
Description: ${plan.description || 'None provided'}
Theme: ${plan.theme || 'None set'}
Date: ${plan.date || 'Not specified'}

Existing Events (in chronological order):
${events.map((e: EventListItem, idx: number) => `
${idx + 1}. ${e.title}
   Location: ${e.location || 'Not specified'}
   Time: ${e.start_time || 'Not specified'}${e.duration ? ` (${e.duration} minutes)` : ''}
`).join('')}

${locationContext ? `Existing Event Locations: ${locationContext}` : 'No location information available yet.'}

User's Request: "${userInput}"

Please analyze this request and generate exactly 3 different event options with a wide variance of styles.
Each option should represent a distinct interpretation of the user's request — vary the venue, vibe, and details.

Return JSON in this format:
{
  "options": [
    {
      "event": {
        "title": "<event title>",
        "description": "<brief description>",
        "location": "<SPECIFIC location with full address or details>",
        "startTime": "<calculated start time in HH:MM format based on surrounding events, or null>",
        "duration": <estimated duration in minutes or null>,
        "notes": "<any additional notes or null>"
      },
      "placement": {
        "strategy": "after" | "before" | "end" | "start",
        "referenceEvent": "<title of the reference event if 'after' or 'before', otherwise null>",
        "explanation": "<brief explanation of placement logic>"
      },
      "style": "<a short label describing the style/vibe, e.g. 'Cozy & Intimate', 'Trendy & Upscale', 'Quick & Casual'>"
    }
  ]
}

IMPORTANT GUIDELINES:

Location Requirements:
- If the user mentions a business/venue (e.g., "Starbucks", "McDonald's", "Whole Foods"), provide a SPECIFIC, contextual suggestion
- Use the existing event locations to determine the geographic area and suggest locations in that vicinity
- Provide location suggestions in a complete address format when context allows (e.g., "Starbucks at 456 Broadway, Seattle, WA")
- If existing events have specific addresses, infer the neighborhood/area and suggest venues that would logically exist there
- For well-known chains, use realistic naming patterns (e.g., include a plausible street name or landmark near existing events)
- Consider proximity and convenience - suggest locations that fit the geographic flow of the plan
- If location context is limited, provide a descriptive location (e.g., "Starbucks in downtown Seattle area" or "Coffee shop near Pike Place Market")
- Note: These are AI-suggested locations that users can edit and refine

Event Details:
- Extract a clear, concise event title (e.g., "Coffee Break", "Dinner", "Walk in the park")
- Write a brief, helpful description that adds context
- Estimate a reasonable duration based on the activity type:
  * Coffee/quick snack: 20-30 minutes
  * Restaurant meal: 60-90 minutes (lunch) or 90-120 minutes (dinner)
  * Museum/attraction: 90-180 minutes
  * Shopping: 60-120 minutes
  * Walk/outdoor activity: 30-60 minutes

Timing and Placement:
- Analyze the existing events' times to find logical gaps or appropriate placement
- If user specifies "after X" or "before Y", honor that placement
- If no placement specified, determine the best fit based on:
  * Logical flow of events (e.g., coffee before activities, dinner in evening)
  * Time gaps in the schedule
  * Activity sequence that makes sense
- The referenceEvent should match an existing event title as closely as possible
- Provide clear reasoning for your placement choice

Start Time Calculation (IMPORTANT):
- You MUST calculate and provide a startTime in HH:MM format for each option whenever possible
- If a reference event has a start_time and duration, calculate the end time of the reference event, then add reasonable travel/transition time (10-30 minutes depending on distance) to determine the new event's start time
- If placing "after" an event: startTime = reference event end time + estimated travel/transition time
- If placing "before" an event: startTime = reference event start time - new event duration - estimated travel/transition time
- If placing at "start" or "end": use the earliest or latest time slot that makes sense for the plan
- Consider typical hours for activities (coffee: 7-11am, lunch: 11:30am-2pm, dinner: 5-9pm, etc.)
- Consider proximity to other event locations when estimating travel time between them
- Consider which venues would be open at the calculated time
- Only return null for startTime if there is absolutely no timing context available

Multi-Option Variety:
- Generate 3 options with WIDE variance in style, venue type, and vibe
- For example, if the user asks for coffee, one option could be a cozy independent café, another a trendy modern spot, and another a quick grab-and-go chain
- Vary the price range, atmosphere, and character of each option
- Each option should feel like a genuinely different experience`;

    // Generate AI response
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.7,
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
      }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
