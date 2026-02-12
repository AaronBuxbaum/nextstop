import { NextRequest, NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";

// Initialize database tables
// This endpoint can be called to set up the database schema
// Protected by INIT_SECRET environment variable in production
export async function POST(req: NextRequest) {
  // In production, require INIT_SECRET to prevent unauthorized initialization
  if (process.env.NODE_ENV === 'production') {
    const initSecret = process.env.INIT_SECRET;
    if (initSecret) {
      const providedSecret = req.headers.get('x-init-secret');
      if (providedSecret !== initSecret) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }
  }

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
      usage: "Send POST request to initialize database tables",
      note: process.env.NODE_ENV === 'production' 
        ? "Requires x-init-secret header in production"
        : "No authentication required in development"
    },
    { status: 200 }
  );
}
