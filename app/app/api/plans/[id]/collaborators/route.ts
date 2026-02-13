import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";

// GET /api/plans/[id]/collaborators - Get collaborators for a plan
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

    // Verify the user has access to this plan
    const planResult = await sql`
      SELECT p.* FROM plans p
      LEFT JOIN plan_collaborators pc ON p.id = pc.plan_id
      WHERE p.id = ${id}
        AND (p.user_id = ${session.user.id} OR pc.user_id = ${session.user.id})
    `;

    if (planResult.length === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const collaborators = await sql`
      SELECT u.id, u.name, u.email, pc.role
      FROM plan_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.plan_id = ${id}
    `;

    return NextResponse.json(collaborators);
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/plans/[id]/collaborators - Add a collaborator by email
export async function POST(
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
    const { email, role = "editor" } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (role !== "editor" && role !== "viewer") {
      return NextResponse.json({ error: "Role must be 'editor' or 'viewer'" }, { status: 400 });
    }

    // Verify the user owns this plan
    const planResult = await sql`
      SELECT * FROM plans WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    if (planResult.length === 0) {
      return NextResponse.json({ error: "Plan not found or unauthorized" }, { status: 404 });
    }

    // Find the user by email
    const userResult = await sql`
      SELECT id, name, email FROM users WHERE email = ${email}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found with that email" }, { status: 404 });
    }

    const collaboratorUser = userResult[0];

    // Cannot add yourself
    if (collaboratorUser.id === session.user.id) {
      return NextResponse.json({ error: "Cannot add yourself as a collaborator" }, { status: 400 });
    }

    // Add collaborator (upsert)
    await sql`
      INSERT INTO plan_collaborators (plan_id, user_id, role)
      VALUES (${id}, ${collaboratorUser.id}, ${role})
      ON CONFLICT (plan_id, user_id) DO UPDATE SET role = ${role}
    `;

    return NextResponse.json({
      id: collaboratorUser.id,
      name: collaboratorUser.name,
      email: collaboratorUser.email,
      role,
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/plans/[id]/collaborators - Remove a collaborator
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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Verify the user owns this plan
    const planResult = await sql`
      SELECT * FROM plans WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    if (planResult.length === 0) {
      return NextResponse.json({ error: "Plan not found or unauthorized" }, { status: 404 });
    }

    await sql`
      DELETE FROM plan_collaborators
      WHERE plan_id = ${id} AND user_id = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
