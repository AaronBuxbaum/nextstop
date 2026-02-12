---
applyTo: "**/__tests__/**/*.{test,spec}.{ts,tsx}"
---

## Test File Requirements

When writing tests for NextStop, please follow these guidelines to ensure consistency and maintainability:

### Testing Framework & Tools
- Use **Vitest** for all unit and integration tests
- Use **@testing-library/react** for component testing
- Use **Mock Service Worker (MSW)** for mocking API calls
- Configure tests in `vitest.config.ts`
- Set up global test configuration in `vitest.setup.ts`

### Test Structure
1. **Organize by feature** - Group related tests in describe blocks
2. **Use descriptive names** - Test names should clearly describe what's being tested
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Keep tests focused** - Each test should verify one specific behavior
5. **Test both happy and error paths** - Include edge cases and error scenarios

### Component Testing
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from '@/components/Component';

describe('Component', () => {
  it('renders with required props', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('value')).toBeInTheDocument();
  });
});
```

### API Testing with MSW
```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Override handler for specific test
server.use(
  http.get('/api/endpoint', () => {
    return HttpResponse.json({ data: 'test' });
  })
);
```

### Best Practices
1. **Use semantic queries** - Prefer `getByRole`, `getByLabelText`, `getByText` over test IDs
2. **Test user interactions** - Use `@testing-library/user-event` for user interactions
3. **Avoid implementation details** - Test behavior, not implementation
4. **Mock external dependencies** - Use MSW for API calls, mock external libraries
5. **Clean up after tests** - Use `beforeEach`/`afterEach` for setup and cleanup
6. **Aim for >80% coverage** - Focus on critical paths and business logic
7. **Run tests before committing** - Use `npm test` to run all tests

### Common Patterns in NextStop
- Mock events with complete `Event` type from `@/types`
- Mock plans with user and collaborator data
- Use `render` from `@testing-library/react` for component tests
- Check for accessibility with `getByRole` queries
- Test conditional rendering (edit buttons, loading states)
- Test CSS class application for dynamic styles

### What to Test
- Component rendering with various props
- User interactions (clicks, form submissions)
- Conditional rendering based on props/state
- Error handling and error states
- Loading states
- Accessibility (ARIA attributes, semantic HTML)
- Data transformations and business logic

### What Not to Test
- Third-party library internals
- Next.js framework behavior
- CSS styling (unless testing conditional classes)
- External API implementation details
