import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";
import { generateText, tool, jsonSchema, Output } from "ai";
import { groq } from "@ai-sdk/groq";
import { parseTimeString } from "@/lib/timeUtils";
import { validateAndNormalizeAddress, getGeographicCenter } from "@/lib/nominatimUtils";

interface EventListItem {
  title: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
}

interface GeneratedEvent {
  title: string;
  description: string;
  location: string;
  startTime: string | null;
  duration: number | null;
  notes: string | null;
}

interface EventPlacement {
  strategy: 'after' | 'before' | 'end' | 'start';
  referenceEvent: string | null;
  explanation: string;
}

interface EventOption {
  event: GeneratedEvent;
  placement: EventPlacement;
  style: string;
}

interface GenerateEventResponse {
  options: EventOption[];
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getEventEndMinutes(e: EventListItem): number | null {
  if (e.end_time) {
    return parseTimeString(e.end_time);
  }
  if (e.start_time && e.duration) {
    const start = parseTimeString(e.start_time);
    if (start !== null) return start + e.duration;
  }
  return null;
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
    const uniqueLocations: string[] = Array.from(new Set(locations));
    const locationContext = uniqueLocations.join(', ');

    // Create a prompt for AI to parse the user's request
    const prompt = `You are an AI assistant helping to create events for an outing plan. The user has provided a natural language description of an event they want to add.

Plan Title: ${plan.title}
Description: ${plan.description || 'None provided'}
Theme: ${plan.theme || 'None set'}
Date: ${plan.date || 'Not specified'}

Existing Events (in chronological order):
${events.map((e: EventListItem, idx: number) => {
  let endTimeStr = '';
  if (e.end_time) {
    endTimeStr = e.end_time;
  } else if (e.start_time && e.duration) {
    // Compute end time from start + duration
    const [h, m] = e.start_time.split(':').map(Number);
    const endMinutes = h * 60 + m + e.duration;
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }
  return `
${idx + 1}. ${e.title}
   Location: ${e.location || 'Not specified'}
   Start: ${e.start_time || 'Not specified'}
   End: ${endTimeStr || 'Not specified'}
   Duration: ${e.duration ? `${e.duration} minutes` : 'Not specified'}`;
}).join('')}

${locationContext ? `Existing Event Locations: ${locationContext}` : 'No location information available yet.'}

User's Request: "${userInput}"

Please analyze this request and generate exactly 3 different event options with a wide variance of styles.
Each option should represent a distinct interpretation of the user's request — vary the venue, vibe, and details.

IMPORTANT GUIDELINES:

Location Requirements:
- If the user mentions a business/venue (e.g., "Starbucks", "McDonald's", "Whole Foods"), use the lookupAddress tool to get the complete OpenStreetMap address
- Call lookupAddress with a descriptive query like "Starbucks near [existing location]" or "Starbucks in [neighborhood]" based on context from existing events
- The lookupAddress tool will return the full, validated address including street, city, state, and country
- ALWAYS use the lookupAddress tool for any location mentioned by the user - do not make up addresses
- If lookupAddress returns { success: false }, it means the exact address could not be found. In this case, use a general descriptive location like "Starbucks in [neighborhood]" or "[Business Name] near [landmark]" based on the context
- Use existing event locations to provide geographic context when calling lookupAddress

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

Start Time Calculation (CRITICAL - MUST FOLLOW EXACTLY):
- You MUST calculate and provide a startTime in HH:MM format for each option whenever possible
- ABSOLUTE RULE: The new event's startTime MUST be AFTER the preceding event's End time. Look at the "End:" field of the reference event — the new startTime must be later than that end time. NEVER place a start time that overlaps with or comes before the preceding event ends.
- If placing "after" an event: startTime = that event's End time + travel/transition time (10-30 minutes). For example, if the previous event ends at 14:00, the new event should start at 14:15 or later, NOT at 13:30.
- ABSOLUTE RULE: The new event must also END before the NEXT event in the schedule starts. Calculate: new event end = startTime + duration. This must be before the following event's Start time.
- If placing "before" an event: new event must end before that event starts. startTime = that event's Start time - new event duration - travel/transition time
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

    // Get geographic center from existing event locations for better address lookup
    const center = await getGeographicCenter(uniqueLocations);

    // Define the output schema for structured output
    const outputSchema = jsonSchema({
      type: 'object',
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: {
                type: 'object',
                properties: {
                  title: { 
                    type: 'string',
                    description: 'Clear, concise event title'
                  },
                  description: { 
                    type: 'string',
                    description: 'Brief, helpful description that adds context'
                  },
                  location: { 
                    type: 'string',
                    description: 'Specific location with full address or details'
                  },
                  startTime: { 
                    type: ['string', 'null'],
                    description: 'Calculated start time in HH:MM format based on surrounding events, or null'
                  },
                  duration: { 
                    type: ['number', 'null'],
                    description: 'Estimated duration in minutes or null'
                  },
                  notes: { 
                    type: ['string', 'null'],
                    description: 'Any additional notes or null'
                  }
                },
                required: ['title', 'description', 'location', 'startTime', 'duration', 'notes']
              },
              placement: {
                type: 'object',
                properties: {
                  strategy: {
                    type: 'string',
                    enum: ['after', 'before', 'end', 'start'],
                    description: 'Placement strategy for the event'
                  },
                  referenceEvent: {
                    type: ['string', 'null'],
                    description: 'Title of the reference event if "after" or "before", otherwise null'
                  },
                  explanation: {
                    type: 'string',
                    description: 'Brief explanation of placement logic'
                  }
                },
                required: ['strategy', 'referenceEvent', 'explanation']
              },
              style: {
                type: 'string',
                description: 'Short label describing the style/vibe (e.g., "Cozy & Intimate", "Trendy & Upscale", "Quick & Casual")'
              }
            },
            required: ['event', 'placement', 'style']
          }
        }
      },
      required: ['options']
    });

    // Generate AI response with address lookup tool and structured output
    const { output } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.7,
      output: Output.object({ schema: outputSchema }),
      tools: {
        lookupAddress: tool({
          description: 'Look up a complete, validated address using OpenStreetMap. Use this tool whenever the user mentions a location, business name, or venue. Provide as much context as possible in the query (e.g., "Starbucks near Central Park, New York" instead of just "Starbucks"). Returns { success: true, address: "full address" } if found, or { success: false, address: "original query" } if not found. If success is false, use a descriptive location based on the context.',
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
            try {
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
            } catch (error) {
              // Return original query with failure indicator on any error
              console.error('Error in lookupAddress tool:', error);
              return {
                address: query,
                success: false
              };
            }
          }
        })
      },
    });

    // Cast output to the expected type
    const result = output as GenerateEventResponse;

    // Validate the response structure (should always have options due to schema)
    if (!result.options || !Array.isArray(result.options) || result.options.length === 0) {
      console.error("AI response missing options array despite schema:", result);
      return NextResponse.json({
        error: "Failed to generate event options. Please try rephrasing your request with more specific details.",
        details: "Invalid response structure"
      }, { status: 500 });
    }

    // Post-process: validate and fix AI-generated start times against existing schedule
    if (result.options && Array.isArray(result.options)) {
      const DEFAULT_TRANSIT_MINUTES = 15;

      for (const option of result.options) {
        if (!option.event?.startTime) continue;

        const newStart = parseTimeString(option.event.startTime);
        if (newStart === null) continue;

        const newDuration = option.event.duration || 60;
        const newEnd = newStart + newDuration;

        // Find the reference event and determine surrounding events
        const refTitle = option.placement?.referenceEvent;
        const strategy = option.placement?.strategy;

        if (strategy === 'after' && refTitle) {
          // Find the reference event
          const refEvent = events.find((e: EventListItem) => e.title === refTitle);
          if (refEvent) {
            const refEnd = getEventEndMinutes(refEvent);
            if (refEnd !== null && newStart < refEnd + DEFAULT_TRANSIT_MINUTES) {
              // Clamp: start must be at least refEnd + transit
              option.event.startTime = minutesToHHMM(refEnd + DEFAULT_TRANSIT_MINUTES);
            }
          }
        } else if (strategy === 'before' && refTitle) {
          const refEvent = events.find((e: EventListItem) => e.title === refTitle);
          if (refEvent && refEvent.start_time) {
            const refStart = parseTimeString(refEvent.start_time);
            if (refStart !== null && newEnd > refStart - DEFAULT_TRANSIT_MINUTES) {
              // Clamp: must end before refStart - transit
              const clampedStart = refStart - DEFAULT_TRANSIT_MINUTES - newDuration;
              if (clampedStart >= 0) {
                option.event.startTime = minutesToHHMM(clampedStart);
              }
            }
          }
        }

        // Ensure the new event doesn't overlap the following event in the schedule
        const updatedStart = parseTimeString(option.event.startTime);
        if (updatedStart !== null) {
          const updatedEnd = updatedStart + newDuration;

          // Find the next event after the new event's start time
          for (const e of events) {
            const eStart = parseTimeString(e.start_time);
            if (eStart !== null && eStart > updatedStart && updatedEnd > eStart - DEFAULT_TRANSIT_MINUTES) {
              // New event overlaps with the next event — truncate duration to fit
              const maxDuration = eStart - DEFAULT_TRANSIT_MINUTES - updatedStart;
              if (maxDuration > 0) {
                option.event.duration = maxDuration;
              }
              break;
            }
          }
        }
      }
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
