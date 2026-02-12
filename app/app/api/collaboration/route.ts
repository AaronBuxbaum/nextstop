import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  setUserPresence,
  getUserPresence,
  setEditingState,
  clearEditingState,
  getEditingStates,
} from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    const [activeUsers, editingStates] = await Promise.all([
      getUserPresence(planId),
      getEditingStates(planId),
    ]);

    return NextResponse.json({ activeUsers, editingStates });
  } catch (error) {
    console.error("Error fetching collaboration state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, action, elementId, elementType } = body;

    if (!planId || typeof planId !== "string") {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userName = session.user.name || "Anonymous";

    switch (action) {
      case "heartbeat":
        await setUserPresence(planId, userId, userName);
        break;

      case "startEditing":
        if (!elementId || typeof elementId !== "string") {
          return NextResponse.json(
            { error: "elementId is required and must be a string" },
            { status: 400 }
          );
        }
        if (!elementType || typeof elementType !== "string") {
          return NextResponse.json(
            { error: "elementType is required and must be a string" },
            { status: 400 }
          );
        }
        if (elementType !== "event" && elementType !== "branch" && elementType !== "plan") {
          return NextResponse.json(
            { error: "elementType must be 'event', 'branch', or 'plan'" },
            { status: 400 }
          );
        }
        await setEditingState(planId, userId, elementId, elementType);
        break;

      case "stopEditing":
        if (!elementId || typeof elementId !== "string") {
          return NextResponse.json(
            { error: "elementId is required and must be a string" },
            { status: 400 }
          );
        }
        await clearEditingState(planId, elementId);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be one of: heartbeat, startEditing, stopEditing" },
          { status: 400 }
        );
    }

    const [activeUsers, editingStates] = await Promise.all([
      getUserPresence(planId),
      getEditingStates(planId),
    ]);

    return NextResponse.json({ activeUsers, editingStates });
  } catch (error) {
    console.error("Error updating collaboration state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
