import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";

// PATCH /api/branches/[id] - Update a branch
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

    // Verify user has access to the branch's plan
    const branchResult = await sql`
      SELECT b.*, p.user_id as plan_owner
      FROM branches b
      JOIN plans p ON b.plan_id = p.id
      LEFT JOIN plan_collaborators pc ON p.id = pc.plan_id
      WHERE b.id = ${id}
        AND (p.user_id = ${session.user.id} OR pc.user_id = ${session.user.id})
    `;

    if (branchResult.length === 0) {
      return NextResponse.json(
        { error: "Branch not found or unauthorized" },
        { status: 404 }
      );
    }

    const currentBranch = branchResult[0];
    const { title, description, previousEventId, nextEventId } = body;

    const updatedTitle = title !== undefined ? title : currentBranch.title;
    const updatedDescription = description !== undefined ? description : currentBranch.description;
    const updatedPrevEventId = previousEventId !== undefined ? previousEventId : currentBranch.previous_event_id;
    const updatedNextEventId = nextEventId !== undefined ? nextEventId : currentBranch.next_event_id;

    await sql`
      UPDATE branches
      SET
        title = ${updatedTitle},
        description = ${updatedDescription},
        previous_event_id = ${updatedPrevEventId},
        next_event_id = ${updatedNextEventId},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    const result = await sql`
      SELECT * FROM branches WHERE id = ${id}
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/branches/[id] - Delete a branch
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

    // Verify user has access to the branch's plan
    const branchResult = await sql`
      SELECT b.*, p.user_id as plan_owner
      FROM branches b
      JOIN plans p ON b.plan_id = p.id
      WHERE b.id = ${id}
        AND p.user_id = ${session.user.id}
    `;

    if (branchResult.length === 0) {
      return NextResponse.json(
        { error: "Branch not found or unauthorized" },
        { status: 404 }
      );
    }

    await sql`DELETE FROM branches WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
