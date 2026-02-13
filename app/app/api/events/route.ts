import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";
import { nanoid } from "nanoid";
import { calculateDuration, calculateEndTime, parseTimeString } from "@/lib/timeUtils";

// POST /api/events - Create a new event
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      planId,
      title,
      description,
      location,
      startTime,
      endTime,
      duration,
      notes,
      tags = [],
      isOptional = false,
    } = body;

    if (!planId || !title) {
      return NextResponse.json(
        { error: "Plan ID and title are required" },
        { status: 400 }
      );
    }

    // Calculate missing time fields
    const finalStartTime = startTime || null;
    let finalEndTime = endTime || null;
    let finalDuration = duration || null;

    // If start and end times are provided, calculate duration
    if (finalStartTime && finalEndTime && !finalDuration) {
      const calculated = calculateDuration(finalStartTime, finalEndTime);
      if (calculated !== null) {
        finalDuration = calculated;
      }
    }

    // If start time and duration are provided, calculate end time
    if (finalStartTime && finalDuration && !finalEndTime) {
      const calculated = calculateEndTime(finalStartTime, finalDuration);
      if (calculated !== null) {
        finalEndTime = calculated;
      }
    }

    // Verify user has access to the plan
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

    const id = nanoid();

    // Calculate position for the new event
    let position: number;

    if (finalStartTime) {
      // Find the correct position based on chronological order
      const existingEvents = await sql`
        SELECT id, start_time, position FROM events
        WHERE plan_id = ${planId}
        ORDER BY position ASC
      `;

      // Find the first event with a start_time that comes after the new event's start time
      const newTimeMinutes = parseTimeString(finalStartTime);
      let insertAt = existingEvents.length;
      for (let i = 0; i < existingEvents.length; i++) {
        const evStartTime = existingEvents[i].start_time;
        const evMinutes = parseTimeString(evStartTime);
        if (evMinutes !== null && newTimeMinutes !== null && evMinutes > newTimeMinutes) {
          insertAt = i;
          break;
        }
      }
      position = insertAt;

      // Shift positions of events at or after the insert point
      await sql`
        UPDATE events SET position = position + 1, updated_at = CURRENT_TIMESTAMP
        WHERE plan_id = ${planId} AND position >= ${position}
      `;
    } else {
      // No start time: append to the end
      const posResult = await sql`
        SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM events WHERE plan_id = ${planId}
      `;
      position = posResult[0].next_pos;
    }

    await sql`
      INSERT INTO events (
        id, plan_id, title, description, location, 
        start_time, end_time, duration, notes, tags, is_optional, position
      )
      VALUES (
        ${id}, ${planId}, ${title}, ${description || null}, ${location || null},
        ${finalStartTime}, ${finalEndTime}, ${finalDuration}, 
        ${notes || null}, ${JSON.stringify(tags)}, ${isOptional}, ${position}
      )
    `;

    const result = await sql`
      SELECT * FROM events WHERE id = ${id}
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
