import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";
import { generateText, tool, jsonSchema } from "ai";
import { groq } from "@ai-sdk/groq";
import { validateAndNormalizeAddress, getGeographicCenter } from "@/lib/nominatimUtils";

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
${events.map((e: { title: string; location?: string; start_time?: string; duration?: number; description?: string }, idx: number) => `
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
      "location": "<suggested location - use lookupAddress tool to get complete OpenStreetMap address>",
      "duration": <minutes>,
      "notes": "<any notes>"
    },
    "reasoning": "<why this would improve the plan>"
  }
]

IMPORTANT: For any location mentioned in suggested events, use the lookupAddress tool to get the complete, validated address from OpenStreetMap. Include nearby landmarks or existing event locations in your query for better results.`;

    // Get geographic center from existing event locations for better address lookup
    const existingLocations = events
      .filter((e: { location?: string }) => e.location)
      .map((e: { location: string }) => e.location);
    const center = await getGeographicCenter(existingLocations);

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.8,
      tools: {
        lookupAddress: tool({
          description: 'Look up a complete, validated address using OpenStreetMap. Use this tool whenever suggesting a location for an event. Provide as much context as possible in the query.',
          inputSchema: jsonSchema({
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The address or location to look up. Include nearby landmarks, neighborhoods, or existing event locations for better results.'
              }
            },
            required: ['query']
          }),
          execute: async ({ query }: { query: string }) => {
            // Validate and normalize the address using OpenStreetMap Nominatim
            const validatedAddress = await validateAndNormalizeAddress(
              query,
              center?.lat,
              center?.lon
            );
            return {
              address: validatedAddress,
              success: validatedAddress !== query
            };
          }
        })
      },
    });

    let suggestions;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch {
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
