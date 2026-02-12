# API Documentation

This document describes the NextStop API endpoints.

## Base URL

Development: `http://localhost:3000`
Production: `https://your-domain.vercel.app`

## Authentication

Most endpoints require authentication via NextAuth. Include session cookies in your requests.

## Endpoints

### Plans

#### List Plans
```
GET /api/plans
```

Returns all plans for the authenticated user.

**Response:**
```json
[
  {
    "id": "plan_123",
    "title": "Weekend Adventure",
    "description": "A fun weekend getaway",
    "theme": "adventure",
    "user_id": "user_456",
    "is_public": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "collaborators": []
  }
]
```

#### Create Plan
```
POST /api/plans
```

**Request Body:**
```json
{
  "title": "Weekend Adventure",
  "description": "A fun weekend getaway",
  "theme": "adventure",
  "isPublic": false
}
```

**Response:** Returns the created plan object.

#### Get Plan Details
```
GET /api/plans/:id
```

Returns plan with all events, branches, and collaborators.

**Response:**
```json
{
  "id": "plan_123",
  "title": "Weekend Adventure",
  "description": "A fun weekend getaway",
  "theme": "adventure",
  "events": [...],
  "branches": [...],
  "collaborators": [...]
}
```

#### Update Plan
```
PATCH /api/plans/:id
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "theme": "new-theme",
  "isPublic": true
}
```

**Response:** Returns the updated plan object.

#### Delete Plan
```
DELETE /api/plans/:id
```

**Response:**
```json
{
  "success": true
}
```

### Events

#### Create Event
```
POST /api/events
```

**Request Body:**
```json
{
  "planId": "plan_123",
  "title": "Morning Coffee",
  "description": "Start the day at a cozy cafe",
  "location": "Corner Cafe",
  "startTime": "09:00",
  "endTime": "10:00",
  "duration": 60,
  "notes": "Try their specialty blend",
  "tags": ["coffee", "morning"],
  "isOptional": false
}
```

**Response:** Returns the created event object.

#### Update Event
```
PATCH /api/events/:id
```

**Request Body:** Any subset of event fields to update.

**Response:** Returns the updated event object.

#### Delete Event
```
DELETE /api/events/:id
```

**Response:**
```json
{
  "success": true
}
```

### AI Analysis

#### Analyze Plan
```
POST /api/ai/analyze
```

Analyzes a plan's pacing, quality, and theme coherence.

**Request Body:**
```json
{
  "planId": "plan_123"
}
```

**Response:**
```json
{
  "pacing": {
    "rating": 8,
    "feedback": "Good balance of activities...",
    "suggestions": [
      "Consider adding a break between lunch and afternoon activities"
    ]
  },
  "quality": {
    "rating": 7,
    "feedback": "Solid selection of activities...",
    "improvements": [
      "Add more specific timing details"
    ]
  },
  "theme": {
    "suggested": "Urban Exploration",
    "coherence": 9,
    "description": "Events align well with an urban exploration theme"
  }
}
```

#### Get Suggestions
```
POST /api/ai/suggest
```

Get AI-powered suggestions for improving the plan.

**Request Body:**
```json
{
  "planId": "plan_123",
  "context": "Looking for more outdoor activities"
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "id": "sug_1",
      "type": "event",
      "title": "Add a Park Visit",
      "description": "Consider visiting Central Park...",
      "event": {
        "title": "Central Park Walk",
        "description": "Scenic walk through the park",
        "location": "Central Park",
        "duration": 90,
        "notes": "Great for photos"
      },
      "reasoning": "Adds outdoor variety to your urban adventure"
    }
  ]
}
```

#### Generate Event from Natural Language
```
POST /api/ai/generate-event
```

Generate an event from a natural language description, with intelligent placement relative to existing events.

**Request Body:**
```json
{
  "planId": "plan_123",
  "userInput": "I want to go to dinner at Eataly after the walk in the park"
}
```

**Response:**
```json
{
  "event": {
    "title": "Dinner",
    "description": "Dinner at Eataly",
    "location": "Eataly",
    "duration": 90,
    "notes": null
  },
  "placement": {
    "strategy": "after",
    "referenceEvent": "Walk in the park",
    "explanation": "User specified this event should come after the walk"
  }
}
```

**Placement Strategies:**
- `after`: Insert after the specified reference event
- `before`: Insert before the specified reference event  
- `end`: Add at the end of the event list
- `start`: Add at the beginning of the event list

### Authentication

#### Sign In
```
POST /api/auth/signin
```

Handled by NextAuth. See [NextAuth documentation](https://next-auth.js.org/) for details.

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized for this resource)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting for:
- AI endpoints (expensive operations)
- Plan creation (prevent spam)
- Authentication endpoints (prevent brute force)

## Webhooks (Coming Soon)

Real-time updates will be delivered via WebSocket connections.
