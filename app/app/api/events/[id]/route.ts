import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";

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
    const updatedTitle = title !== undefined ? title : currentEvent.title;
    const updatedDescription = description !== undefined ? description : currentEvent.description;
    const updatedLocation = location !== undefined ? location : currentEvent.location;
    const updatedStartTime = startTime !== undefined ? startTime : currentEvent.start_time;
    const updatedEndTime = endTime !== undefined ? endTime : currentEvent.end_time;
    const updatedDuration = duration !== undefined ? duration : currentEvent.duration;
    const updatedNotes = notes !== undefined ? notes : currentEvent.notes;
    const updatedTags = tags !== undefined ? JSON.stringify(tags) : currentEvent.tags;
    const updatedIsOptional = isOptional !== undefined ? isOptional : currentEvent.is_optional;

    // Check if start_time changed and if reordering is needed
    const startTimeChanged = startTime !== undefined && startTime !== currentEvent.start_time;
    let needsReorder = false;
    let newPosition = currentEvent.position;

    if (startTimeChanged && updatedStartTime) {
      // Get all events in the plan ordered by position
      const allEvents = await sql`
        SELECT id, start_time, position
        FROM events
        WHERE plan_id = ${currentEvent.plan_id}
        ORDER BY position ASC
      `;

      // Find the correct position based on chronological order
      // Events should be ordered by start_time if they have one
      let targetPosition = 0;
      for (let i = 0; i < allEvents.length; i++) {
        const evt = allEvents[i];
        // Skip the current event
        if (evt.id === id) continue;
        
        // If this event has a start_time and it's before our updated time, increment position
        if (evt.start_time && evt.start_time < updatedStartTime) {
          targetPosition = i + 1;
        }
      }

      // Only reorder if position actually changed
      if (targetPosition !== currentEvent.position) {
        needsReorder = true;
        newPosition = targetPosition;
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

    // Reorder if needed
    if (needsReorder) {
      const allEvents = await sql`
        SELECT id, position
        FROM events
        WHERE plan_id = ${currentEvent.plan_id}
        ORDER BY position ASC
      `;

      // Build new order: remove current event and insert at new position
      const eventIds = allEvents.map((e: { id: string }) => e.id);
      const currentIndex = eventIds.indexOf(id);
      if (currentIndex !== -1) {
        eventIds.splice(currentIndex, 1);
      }
      eventIds.splice(newPosition, 0, id);

      // Update positions for all events in batches to avoid too many queries
      // Use Promise.all to update them in parallel
      await Promise.all(
        eventIds.map((eventId, idx) => 
          sql`
            UPDATE events
            SET position = ${idx}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${eventId}
          `
        )
      );
    }

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
