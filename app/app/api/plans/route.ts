import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";
import { nanoid } from "nanoid";

// GET /api/plans - Get all plans for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await sql`
      SELECT p.*, 
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pc.user_id,
              'email', u.email,
              'name', u.name
            )
          ) FILTER (WHERE pc.user_id IS NOT NULL), 
          '[]'
        ) as collaborators
      FROM plans p
      LEFT JOIN plan_collaborators pc ON p.id = pc.plan_id
      LEFT JOIN users u ON pc.user_id = u.id
      WHERE p.user_id = ${session.user.id}
        OR pc.user_id = ${session.user.id}
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `;

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/plans - Create a new plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, theme, isPublic = false } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const id = nanoid();
    
    await sql`
      INSERT INTO plans (id, title, description, theme, user_id, is_public)
      VALUES (${id}, ${title}, ${description || null}, ${theme || null}, ${session.user.id}, ${isPublic})
    `;

    const result = await sql`
      SELECT * FROM plans WHERE id = ${id}
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
