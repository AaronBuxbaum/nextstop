import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";

// Initialize database tables
// This endpoint can be called to set up the database schema
export async function POST() {
  try {
    await initDatabase();
    return NextResponse.json(
      { message: "Database initialized successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { 
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check database status
export async function GET() {
  return NextResponse.json(
    { 
      message: "Database initialization endpoint",
      usage: "Send POST request to initialize database tables"
    },
    { status: 200 }
  );
}
