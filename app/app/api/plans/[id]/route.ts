import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";

// GET /api/plans/[id] - Get a specific plan with all related data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Get current plan values
    const currentPlan = planResult[0];

    // Use provided values or keep current ones
    const updatedTitle = title !== undefined ? title : currentPlan.title;
    const updatedDescription = description !== undefined ? description : currentPlan.description;
    const updatedTheme = theme !== undefined ? theme : currentPlan.theme;
    const updatedIsPublic = isPublic !== undefined ? isPublic : currentPlan.is_public;

    // Execute update with all values
    await sql`
      UPDATE plans 
      SET 
        title = ${updatedTitle},
        description = ${updatedDescription},
        theme = ${updatedTheme},
        is_public = ${updatedIsPublic},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
