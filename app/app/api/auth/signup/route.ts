import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { sql, initDatabase } from "@/lib/db";
import { nanoid } from "nanoid";

// Track if database has been initialized
let isDbInitialized = false;

export async function POST(req: NextRequest) {
  try {
    // Initialize database on first signup attempt
    if (!isDbInitialized) {
      try {
        await initDatabase();
        isDbInitialized = true;
      } catch (error) {
        // If initialization fails, log but continue - tables might already exist
        console.warn("Database initialization attempted:", error);
      }
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create user
    const userId = nanoid();
    await sql`
      INSERT INTO users (id, name, email, password_hash)
      VALUES (${userId}, ${name}, ${email}, ${passwordHash})
    `;

    return NextResponse.json(
      { message: "User created successfully", userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
