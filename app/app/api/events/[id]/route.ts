import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";
import { calculateDuration, calculateEndTime } from "@/lib/timeUtils";

// PATCH /api/events/[id] - Update an event
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Verify user has access to the event's plan
    const eventResult = await sql`
      SELECT e.*, p.user_id as plan_owner
      FROM events e
      JOIN plans p ON e.plan_id = p.id
      LEFT JOIN plan_collaborators pc ON p.id = pc.plan_id
      WHERE e.id = ${id}
        AND (p.user_id = ${session.user.id} OR pc.user_id = ${session.user.id})
    `;

    if (eventResult.length === 0) {
      return NextResponse.json(
        { error: "Event not found or unauthorized" },
        { status: 404 }
      );
    }

    const currentEvent = eventResult[0];
    const {
      title,
      description,
      location,
      startTime,
      endTime,
      duration,
      notes,
      tags,
      isOptional,
    } = body;

    // Use provided values or keep current ones
    let updatedTitle = title !== undefined ? title : currentEvent.title;
    let updatedDescription = description !== undefined ? description : currentEvent.description;
    let updatedLocation = location !== undefined ? location : currentEvent.location;
    let updatedStartTime = startTime !== undefined ? startTime : currentEvent.start_time;
    let updatedEndTime = endTime !== undefined ? endTime : currentEvent.end_time;
    let updatedDuration = duration !== undefined ? duration : currentEvent.duration;
    let updatedNotes = notes !== undefined ? notes : currentEvent.notes;
    let updatedTags = tags !== undefined ? JSON.stringify(tags) : currentEvent.tags;
    let updatedIsOptional = isOptional !== undefined ? isOptional : currentEvent.is_optional;

    // Calculate missing time fields after updates
    // If start and end times are provided, calculate duration
    if (updatedStartTime && updatedEndTime && 
        (startTime !== undefined || endTime !== undefined) && 
        duration === undefined) {
      const calculated = calculateDuration(updatedStartTime, updatedEndTime);
      if (calculated !== null) {
        updatedDuration = calculated;
      }
    }

    // If start time and duration are provided, calculate end time
    if (updatedStartTime && updatedDuration && 
        (startTime !== undefined || duration !== undefined) && 
        endTime === undefined) {
      const calculated = calculateEndTime(updatedStartTime, updatedDuration);
      if (calculated !== null) {
        updatedEndTime = calculated;
      }
    }

    // Execute update with all values
    await sql`
      UPDATE events 
      SET 
        title = ${updatedTitle},
        description = ${updatedDescription},
        location = ${updatedLocation},
        start_time = ${updatedStartTime},
        end_time = ${updatedEndTime},
        duration = ${updatedDuration},
        notes = ${updatedNotes},
        tags = ${updatedTags},
        is_optional = ${updatedIsOptional},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    const result = await sql`
      SELECT * FROM events WHERE id = ${id}
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user has access to the event's plan
    const eventResult = await sql`
      SELECT e.*, p.user_id as plan_owner
      FROM events e
      JOIN plans p ON e.plan_id = p.id
      WHERE e.id = ${id}
        AND p.user_id = ${session.user.id}
    `;

    if (eventResult.length === 0) {
      return NextResponse.json(
        { error: "Event not found or unauthorized" },
        { status: 404 }
      );
    }

    await sql`DELETE FROM events WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
