---
applyTo: "**/app/api/**/*.{ts,tsx}"
---

## API Route Requirements

When creating or modifying API routes in NextStop, follow these Next.js App Router conventions and NextStop-specific patterns:

### Route Structure
- Use Next.js App Router conventions (`route.ts` files)
- Export named functions for HTTP methods: `GET`, `POST`, `PATCH`, `DELETE`
- Place route files in appropriate directory structure under `app/api/`

### Authentication & Authorization
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Route logic...
}
```

### Database Queries
```typescript
import { sql } from "@/lib/db";

// Use parameterized queries with template literals
const results = await sql`
  SELECT * FROM plans
  WHERE user_id = ${userId}
  ORDER BY created_at DESC
`;
```

### Input Validation
```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description } = body;

  // Validate required fields
  if (!title) {
    return NextResponse.json(
      { error: "Title is required" }, 
      { status: 400 }
    );
  }

  // Validate data types and formats
  if (typeof title !== 'string' || title.length > 200) {
    return NextResponse.json(
      { error: "Invalid title format" }, 
      { status: 400 }
    );
  }
}
```

### Error Handling
```typescript
export async function GET() {
  try {
    // Route logic...
  } catch (error) {
    console.error("Error in route:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
```

### Response Patterns
- **Success**: Return JSON with appropriate status code
  - `200` for GET requests
  - `201` for POST (resource created)
  - `204` for DELETE (no content)
- **Client Errors**: `400` Bad Request, `401` Unauthorized, `404` Not Found
- **Server Errors**: `500` Internal Server Error

### Best Practices
1. **Always authenticate** - Check session for protected routes
2. **Validate input** - Never trust client data
3. **Use parameterized queries** - Prevent SQL injection
4. **Handle errors gracefully** - Log errors, return user-friendly messages
5. **Return consistent JSON** - Use NextResponse.json() for all responses
6. **Use proper HTTP methods** - GET for reading, POST for creating, PATCH for updating, DELETE for removing
7. **Include proper status codes** - Follow HTTP conventions
8. **Use transactions** - For multi-step database operations
9. **Generate IDs server-side** - Use `nanoid()` for unique identifiers

### NextStop-Specific Patterns

#### Database Access
- Use `sql` from `@/lib/db` (Neon Postgres)
- Use template literal syntax for queries
- Always use parameterized queries

#### Redis for Real-Time Features
- Use `redis` from `@/lib/redis` (Upstash)
- Use for presence tracking, live updates, pub/sub

#### ID Generation
```typescript
import { nanoid } from "nanoid";
const id = nanoid(); // Generate unique ID
```

#### Common Route Patterns

**List Resources:**
```typescript
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  
  const items = await sql`
    SELECT * FROM table 
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
  `;
  
  return NextResponse.json(items);
}
```

**Create Resource:**
```typescript
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  
  const body = await req.json();
  if (!body.requiredField) return badRequest("Field required");
  
  const id = nanoid();
  await sql`INSERT INTO table (id, ...) VALUES (${id}, ...)`;
  
  const result = await sql`SELECT * FROM table WHERE id = ${id}`;
  return NextResponse.json(result[0], { status: 201 });
}
```

**Update Resource:**
```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  
  const body = await req.json();
  
  await sql`
    UPDATE table 
    SET field = ${body.field}, updated_at = NOW()
    WHERE id = ${params.id} AND user_id = ${session.user.id}
  `;
  
  return NextResponse.json({ success: true });
}
```

### Testing API Routes
- Create MSW handlers in `mocks/handlers.ts`
- Test authentication, validation, and error cases
- Mock database and external service calls
