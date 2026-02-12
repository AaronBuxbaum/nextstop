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

    const updates = [];
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

    if (title !== undefined) updates.push(sql`title = ${title}`);
    if (description !== undefined) updates.push(sql`description = ${description}`);
    if (location !== undefined) updates.push(sql`location = ${location}`);
    if (startTime !== undefined) updates.push(sql`start_time = ${startTime}`);
    if (endTime !== undefined) updates.push(sql`end_time = ${endTime}`);
    if (duration !== undefined) updates.push(sql`duration = ${duration}`);
    if (notes !== undefined) updates.push(sql`notes = ${notes}`);
    if (tags !== undefined) updates.push(sql`tags = ${JSON.stringify(tags)}`);
    if (isOptional !== undefined) updates.push(sql`is_optional = ${isOptional}`);

    if (updates.length > 0) {
      await sql`
        UPDATE events 
        SET ${sql.unsafe(updates.join(', '))}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
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
