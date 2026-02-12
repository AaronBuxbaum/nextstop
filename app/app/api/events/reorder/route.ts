import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "@/lib/db";

// POST /api/events/reorder - Reorder events within a plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, eventIds } = body;

    if (!planId || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { error: "planId and eventIds array are required" },
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

    // Fetch events to validate time constraints
    const events = await sql`
      SELECT id, start_time FROM events WHERE plan_id = ${planId}
    `;

    const eventMap = new Map<string, string | null>(events.map((e: { id: string; start_time: string | null }) => [e.id, e.start_time]));

    // Validate that events with start_time respect chronological order
    let lastTime: string | null = null;
    for (const eventId of eventIds) {
      const startTime = eventMap.get(eventId) ?? null;
      if (startTime && lastTime && startTime < lastTime) {
        return NextResponse.json(
          { error: "Reordering would violate chronological time constraints" },
          { status: 400 }
        );
      }
      if (startTime) {
        lastTime = startTime;
      }
    }

    // Update positions
    for (let i = 0; i < eventIds.length; i++) {
      await sql`
        UPDATE events SET position = ${i}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${eventIds[i]} AND plan_id = ${planId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
