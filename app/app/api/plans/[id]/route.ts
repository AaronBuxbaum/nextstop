import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";

// GET /api/plans/[id] - Get a specific plan with all related data
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Get plan with authorization check
    const planResult = await sql`
      SELECT p.* FROM plans p
      LEFT JOIN plan_collaborators pc ON p.id = pc.plan_id
      WHERE p.id = ${id}
        AND (p.user_id = ${session.user.id} OR pc.user_id = ${session.user.id} OR p.is_public = true)
    `;

    if (planResult.length === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const plan = planResult[0];

    // Get events
    const events = await sql`
      SELECT * FROM events 
      WHERE plan_id = ${id}
      ORDER BY created_at
    `;

    // Get branches with options
    const branches = await sql`
      SELECT 
        b.*,
        json_agg(
          json_build_object(
            'id', bo.id,
            'label', bo.label,
            'description', bo.description,
            'decisionLogic', bo.decision_logic
          )
        ) as options
      FROM branches b
      LEFT JOIN branch_options bo ON b.id = bo.branch_id
      WHERE b.plan_id = ${id}
      GROUP BY b.id
      ORDER BY b.created_at
    `;

    // Get collaborators
    const collaborators = await sql`
      SELECT u.id, u.name, u.email, pc.role
      FROM plan_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.plan_id = ${id}
    `;

    return NextResponse.json({
      ...plan,
      events,
      branches,
      collaborators,
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/plans/[id] - Update a plan
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { title, description, theme, isPublic } = body;

    // Check authorization
    const planResult = await sql`
      SELECT * FROM plans 
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    if (planResult.length === 0) {
      return NextResponse.json({ error: "Plan not found or unauthorized" }, { status: 404 });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push(`title = $${updates.length + 1}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${updates.length + 1}`);
      values.push(description);
    }
    if (theme !== undefined) {
      updates.push(`theme = $${updates.length + 1}`);
      values.push(theme);
    }
    if (isPublic !== undefined) {
      updates.push(`is_public = $${updates.length + 1}`);
      values.push(isPublic);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length > 1) { // More than just updated_at
      await sql`
        UPDATE plans 
        SET ${sql.unsafe(updates.join(', '))}
        WHERE id = ${id}
      `;
    }

    const result = await sql`
      SELECT * FROM plans WHERE id = ${id}
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/plans/[id] - Delete a plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check authorization
    const planResult = await sql`
      SELECT * FROM plans 
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    if (planResult.length === 0) {
      return NextResponse.json({ error: "Plan not found or unauthorized" }, { status: 404 });
    }

    await sql`DELETE FROM plans WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
