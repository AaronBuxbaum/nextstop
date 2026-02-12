import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";
import { nanoid } from "nanoid";

// POST /api/branches - Create a new branch
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, title, description, previousEventId, nextEventId } = body;

    if (!planId || !title) {
      return NextResponse.json(
        { error: "planId and title are required" },
        { status: 400 }
      );
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

    await sql`
      INSERT INTO branches (id, plan_id, title, description, previous_event_id, next_event_id)
      VALUES (${id}, ${planId}, ${title}, ${description || null}, ${previousEventId || null}, ${nextEventId || null})
    `;

    const result = await sql`
      SELECT * FROM branches WHERE id = ${id}
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
