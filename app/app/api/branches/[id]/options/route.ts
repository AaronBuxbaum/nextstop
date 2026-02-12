import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";
import { nanoid } from "nanoid";

// POST /api/branches/[id]/options - Add a branch option
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: branchId } = await params;
    const body = await req.json();
    const { label, description, decisionLogic } = body;

    if (!label) {
      return NextResponse.json(
        { error: "Label is required" },
        { status: 400 }
      );
    }

    // Verify user has access to the branch's plan
    const branchResult = await sql`
      SELECT b.*, p.user_id as plan_owner
      FROM branches b
      JOIN plans p ON b.plan_id = p.id
      LEFT JOIN plan_collaborators pc ON p.id = pc.plan_id
      WHERE b.id = ${branchId}
        AND (p.user_id = ${session.user.id} OR pc.user_id = ${session.user.id})
    `;

    if (branchResult.length === 0) {
      return NextResponse.json(
        { error: "Branch not found or unauthorized" },
        { status: 404 }
      );
    }

    const optionId = nanoid();

    await sql`
      INSERT INTO branch_options (id, branch_id, label, description, decision_logic)
      VALUES (${optionId}, ${branchId}, ${label}, ${description || null}, ${decisionLogic ? JSON.stringify(decisionLogic) : null})
    `;

    const result = await sql`
      SELECT * FROM branch_options WHERE id = ${optionId}
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error adding branch option:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
