# Copilot Instructions for NextStop

NextStop is an AI-powered outing planning application. This document provides guidelines for contributing to the project.

## Project Overview

NextStop helps users plan amazing outings with:
- Event management with detailed information (location, time, notes, tags)
- AI-powered analysis for pacing, quality, and theme
- Real-time collaboration capabilities
- Branching paths for flexible planning
- Optional events and backup activities

## Tech Stack

**Frontend:**
- Next.js 16 with App Router
- React 19
- TypeScript (strict mode)
- CSS Modules with Tailwind CSS
- Custom fonts: Playfair Display (headings) + Courier Prime (body)

**Backend:**
- Next.js API Routes (serverless)
- Neon Postgres (Vercel's recommended Postgres solution)
- Upstash Redis (Vercel's recommended Redis solution)
- Vercel Blob (file storage)

**AI:**
- Vercel AI SDK
- OpenAI GPT-4 for analysis and suggestions

**Testing:**
- Vitest for unit/integration tests
- Mock Service Worker (MSW) for API mocking
- Testing Library for component tests

## Code Standards

### General Principles
- Write clean, maintainable, well-documented code
- Follow TypeScript best practices with strict mode
- Ensure all code changes include appropriate tests
- Keep commits focused and atomic
- Update documentation when making functional changes

### TypeScript
- Use explicit types, avoid `any`
- Define interfaces in `types/index.ts`
- Use proper error handling with try/catch
- Leverage TypeScript's type inference where appropriate

### React Components
- Use functional components with hooks
- Keep components focused and single-purpose
- Use CSS Modules for styling
- Include proper TypeScript types for props
- Add accessibility attributes (ARIA labels, semantic HTML)

### API Routes
- Follow Next.js App Router conventions
- Validate input data
- Use proper HTTP status codes
- Include error handling
- Authenticate requests where needed
- Use Neon Postgres via `@/lib/db`
- Use Upstash Redis via `@/lib/redis`

### Styling
- Use CSS Modules for component-specific styles
- Follow the existing design system
- Use CSS variables for colors and spacing
- Maintain responsive design
- Keep animations subtle and purposeful

### Database
- Use parameterized queries (SQL template literals)
- Follow existing schema patterns
- Add indexes for frequently queried fields
- Use transactions for multi-step operations

### Testing
- Write tests for new features and bug fixes
- Use MSW for mocking API calls
- Test edge cases and error scenarios
- Aim for >80% code coverage on critical paths
- Run tests before committing: `npm test`

## Project Structure

```
app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication
│   │   ├── plans/        # Plan CRUD
│   │   ├── events/       # Event CRUD
│   │   └── ai/           # AI features
│   ├── plans/            # Plans pages
│   │   ├── page.tsx      # Plans dashboard
│   │   └── [id]/         # Plan detail
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # Reusable components
├── lib/                  # Utilities
│   ├── db.ts            # Database client
│   └── redis.ts         # Redis client
├── types/               # TypeScript types
├── mocks/               # MSW handlers
│   ├── handlers.ts      # API mocks
│   └── server.ts        # MSW server
└── __tests__/           # Tests
```

## Development Workflow

1. **Before Making Changes:**
   - Understand the existing codebase
   - Check related tests
   - Review API documentation in `API.md`

2. **Making Changes:**
   - Create focused, minimal changes
   - Follow existing patterns
   - Add TypeScript types
   - Update or create tests
   - Update documentation if needed

3. **Testing:**
   - Run tests: `npm test`
   - Run linter: `npm run lint`
   - Test in browser: `npm run dev`
   - Verify all functionality works

4. **Committing:**
   - Write clear commit messages
   - Keep commits atomic
   - Reference issues if applicable

## Key Features to Maintain

### Plans
- Full CRUD operations
- Support for themes and descriptions
- Public/private visibility
- Collaboration support

### Events
- Detailed event information
- Flexible timing (start/end or duration)
- Tags and notes
- Optional events flag

### AI Features
- Pacing analysis (0-10 rating)
- Quality assessment (0-10 rating)
- Theme identification and coherence
- Contextual suggestions
- Event recommendations

### Real-Time Collaboration (In Progress)
- User presence tracking
- Edit state management
- Conflict resolution
- Live updates via Redis pub/sub

## Environment Variables

Required in `.env.local`:
```bash
DATABASE_URL=              # Neon Postgres (Vercel's recommended solution)
UPSTASH_REDIS_REST_URL=   # Upstash Redis (Vercel's recommended solution)
UPSTASH_REDIS_REST_TOKEN= # Upstash token
OPENAI_API_KEY=           # OpenAI API
NEXTAUTH_SECRET=          # Auth secret
NEXTAUTH_URL=             # App URL
```

> **Note**: When deploying to Vercel, these can be automatically configured by adding Neon and Upstash through the Vercel Marketplace (Storage tab). This is the recommended approach as it provides unified billing and automatic configuration.

## Common Tasks

### Adding a New API Endpoint
1. Create route in `app/api/[feature]/route.ts`
2. Add authentication check
3. Validate input
4. Implement logic
5. Add error handling
6. Create MSW mock in `mocks/handlers.ts`
7. Write tests in `__tests__/`

### Adding a New Component
1. Create in `components/[Component].tsx`
2. Create CSS Module `[Component].module.css`
3. Add TypeScript interface for props
4. Include accessibility attributes
5. Write component tests
6. Export from component

### Adding a New Page
1. Create in `app/[page]/page.tsx`
2. Add metadata export
3. Create module CSS file
4. Follow existing page patterns
5. Add to navigation if needed

## Design Guidelines

### Typography
- Headings: Playfair Display (serif, bold)
- Body: Courier Prime (monospace)
- Use font-weight: 700-900 for headings
- Use font-weight: 400-700 for body

### Colors (CSS Variables)
- `--primary-color`: Primary actions
- `--text-primary`: Main text
- `--text-secondary`: Secondary text
- `--border-color`: Borders
- `--ai-bg`: AI feature backgrounds
- Define in global CSS

### Layout
- Max width: 1200px for content
- Consistent padding: 1rem to 2rem
- Responsive breakpoints
- Card-based layouts

### Interactions
- Hover states for all clickable elements
- Smooth transitions (0.2s ease)
- Subtle transforms (translateY)
- Loading states for async operations

## Testing Guidelines

### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('renders correctly', () => {
    // Test implementation
  });
});
```

### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('displays content', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('value')).toBeInTheDocument();
  });
});
```

### API Tests
Use MSW to mock API calls:
```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Override handler for test
server.use(
  http.get('/api/plans', () => {
    return HttpResponse.json([]);
  })
);
```

## Troubleshooting

### Database Issues
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for connection status
- Review database logs

### Redis Issues  
- Verify Upstash credentials
- Check Redis dashboard
- Test connection with simple get/set

### AI Issues
- Verify OpenAI API key
- Check API usage and rate limits
- Review error messages for quota issues

### Build Issues
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

## Resources

- [Project README](../README.md)
- [API Documentation](../API.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Neon Docs](https://neon.tech/docs)
- [Upstash Docs](https://docs.upstash.com/)
- [OpenAI Docs](https://platform.openai.com/docs)

## Future Development

### Planned Features
- [ ] User authentication UI
- [ ] Real-time collaboration WebSocket
- [ ] Branching UI with decision logic
- [ ] Event visualization timeline
- [ ] Optional events management
- [ ] Plan templates
- [ ] Export functionality
- [ ] Mobile app

### Areas for Improvement
- [ ] Add more comprehensive tests
- [ ] Implement caching strategy
- [ ] Add request rate limiting
- [ ] Improve error messages
- [ ] Add analytics
- [ ] Optimize bundle size
- [ ] Add PWA support

As you work on the project, keep this document updated to help future contributors.
