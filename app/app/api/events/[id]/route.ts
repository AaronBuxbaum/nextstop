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
