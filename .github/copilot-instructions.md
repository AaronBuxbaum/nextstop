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
- Neon Postgres (database)
- Upstash Redis (real-time features)
- Vercel Blob (file storage)

**AI:**
- Vercel AI SDK
- OpenAI GPT-4 for analysis and suggestions

**Testing:**
- Vitest for unit/integration tests
- Mock Service Worker (MSW) for API mocking
- Testing Library for component tests

## Documentation Policy

### What NOT to Create
**NEVER create markdown files that describe:**
- Implementation details of fixes or features
- Summaries of work completed (IMPLEMENTATION_SUMMARY.md, FEATURE_README.md, etc.)
- Bug fix explanations (TYPESCRIPT_FIX.md, LINTING_FIXES.md, etc.)
- Security summaries (SECURITY_SUMMARY.md)
- Any other temporary documentation intended only for human review

**Rationale:** Such information should be included in pull request descriptions where it's accessible via GitHub. AI agents are provided access to GitHub, so any information useful for understanding work should live there, not as files in the repository.

### What TO Create
**Documentation should ONLY be created when:**
- It provides context that AI agents need to understand the codebase for future work
- It documents APIs, architecture, or patterns that guide future development
- It's placed in the `docs/` folder (if not already in a standard location like README.md)

**Allowed documentation files:**
- `README.md` - Project overview and setup instructions
- `CONTRIBUTING.md` - Contribution guidelines
- `API.md` - API endpoint documentation
- `DEPLOYMENT.md` - Deployment instructions
- `docs/` folder - Any additional AI-agent-oriented documentation

### Working Memory
- Use working memory (think through solutions mentally) instead of creating markdown files for planning, notes, or tracking
- Include summaries and explanations in PR descriptions, not separate files
- Keep code comments focused and minimal unless they explain complex logic

## Code Standards

### General Principles
- Write clean, maintainable, well-documented code
- Follow TypeScript best practices with strict mode
- Ensure all code changes include appropriate tests
- Keep commits focused and atomic
- Update core documentation (README.md, API.md, etc.) when making functional changes that affect public interfaces

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
- **MUST run and pass before considering PR ready:**
  - `npm test` - Run all tests
  - `npm run typecheck` - TypeScript type checking
  - `npm run lint` - ESLint code quality checks

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
   - Run typecheck: `npm run typecheck`
   - Run linter: `npm run lint`
   - **All three must pass before PR is ready**
   - Test in browser: `npm run dev`
   - Verify all functionality works

4. **Committing:**
   - Write clear commit messages
   - Keep commits atomic
   - Reference issues if applicable

5. **Creating Pull Requests:**
   - **ALWAYS create pull requests as ready for review, NOT as drafts**
   - If PR is initially created as draft, convert it to ready for review before completing work
   - Ensure all tests pass before marking PR as ready
   - Include clear description of changes and testing performed

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
DATABASE_URL=              # Neon Postgres
UPSTASH_REDIS_REST_URL=   # Upstash Redis
UPSTASH_REDIS_REST_TOKEN= # Upstash token
OPENAI_API_KEY=           # OpenAI API
NEXTAUTH_SECRET=          # Auth secret
NEXTAUTH_URL=             # App URL
```

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
