import { neon } from '@neondatabase/serverless';

// Allow build to succeed without DATABASE_URL
// In production, DATABASE_URL must be set via environment variables for the app to function
// Build-time doesn't require database access, so we use a mock SQL function
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not defined - database operations will fail');
}

// Create a connection pool
export const sql = process.env.DATABASE_URL 
  ? neon(process.env.DATABASE_URL)
  : (() => {
      // Mock SQL function for build time
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockSql = (() => Promise.resolve([])) as any;
      mockSql.unsafe = () => mockSql;
      return mockSql;
    })();

// Database initialization script
// NOTE: This is a simple initialization for development.
// For production, consider using a migration tool like:
// - node-pg-migrate: https://github.com/salsita/node-pg-migrate
// - Prisma Migrate: https://www.prisma.io/docs/concepts/components/prisma-migrate
// - Drizzle ORM: https://orm.drizzle.team/
export const initDatabase = async () => {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Plans table
    await sql`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        theme TEXT,
        user_id TEXT NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    // Events table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        start_time TEXT,
        end_time TEXT,
        duration INTEGER,
        notes TEXT,
        tags JSONB DEFAULT '[]',
        is_optional BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
      )
    `;

    // Branches table
    await sql`
      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        previous_event_id TEXT,
        next_event_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
      )
    `;

    // Branch options table
    await sql`
      CREATE TABLE IF NOT EXISTS branch_options (
        id TEXT PRIMARY KEY,
        branch_id TEXT NOT NULL,
        label TEXT NOT NULL,
        description TEXT,
        decision_logic JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
      )
    `;

    // Branch option events (many-to-many relationship)
    await sql`
      CREATE TABLE IF NOT EXISTS branch_option_events (
        branch_option_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        PRIMARY KEY (branch_option_id, event_id),
        FOREIGN KEY (branch_option_id) REFERENCES branch_options(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `;

    // Plan collaborators table
    await sql`
      CREATE TABLE IF NOT EXISTS plan_collaborators (
        plan_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'viewer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (plan_id, user_id),
        FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};
