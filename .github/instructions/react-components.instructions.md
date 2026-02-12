---
applyTo: "**/components/**/*.{ts,tsx}"
---

## React Component Requirements

When creating or modifying React components in NextStop, follow these guidelines to maintain consistency with the project's design philosophy and technical standards:

### Component Structure
- Use **functional components** with hooks
- Use **TypeScript** with explicit prop types
- Create companion **CSS Module** for styling (`Component.module.css`)
- Export component as named export

### TypeScript & Props
```typescript
interface ComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
  isActive?: boolean;
}

export function Component({ 
  title, 
  description, 
  onAction, 
  isActive = false 
}: ComponentProps) {
  // Component logic
}
```

### Styling
- Use **CSS Modules** for component-specific styles
- Import styles: `import styles from './Component.module.css'`
- Use CSS variables for colors and spacing
- Follow existing design system patterns
- Maintain distinctive typography (Playfair Display for headings, Courier Prime for body)

```typescript
import styles from './Component.module.css';

export function Component() {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Title</h2>
    </div>
  );
}
```

### Accessibility
1. **Use semantic HTML** - `<button>` for buttons, `<nav>` for navigation, etc.
2. **Add ARIA labels** - Use `aria-label`, `aria-describedby` when needed
3. **Keyboard navigation** - Ensure all interactive elements are keyboard accessible
4. **Focus management** - Handle focus states appropriately
5. **Screen reader support** - Use `role` attributes when semantic HTML isn't sufficient

```typescript
<button
  onClick={handleClick}
  aria-label="Delete event"
  className={styles.button}
>
  <TrashIcon aria-hidden="true" />
</button>
```

### State Management
- Use `useState` for local component state
- Use `useEffect` for side effects
- Use `useCallback` for memoized callbacks
- Use `useMemo` for expensive computations
- Lift state up when needed by multiple components

### Event Handlers
```typescript
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // Handle submission
};

const handleClick = () => {
  // Handle click
};
```

### Conditional Rendering
```typescript
// Conditional rendering
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// Conditional classes
<div className={`${styles.card} ${isActive ? styles.active : ''}`}>

// For complex conditional classes, consider using clsx or classnames:
import clsx from 'clsx';
<div className={clsx(styles.card, {
  [styles.active]: isActive,
  [styles.editing]: isEditing,
  [styles.disabled]: isDisabled
})}>
```

### NextStop Design Principles

#### Typography Hierarchy
- **Headings**: Use Playfair Display (bold, serif)
- **Body text**: Use Courier Prime (monospace)
- **Font weights**: 700-900 for headings, 400-700 for body

#### Color Usage
- Use CSS variables defined in global styles
- `--primary-color` for primary actions
- `--text-primary` for main text
- `--text-secondary` for secondary text
- `--border-color` for borders
- `--ai-bg` for AI feature backgrounds

#### Animation & Transitions
- Keep animations subtle and purposeful
- Use `transition: 0.2s ease` for hover effects
- Use `transform: translateY(-2px)` for lift effects
- Add loading states for async operations

### Common Patterns in NextStop

#### Event Card Pattern
```typescript
interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
}

export function EventCard({ 
  event, 
  onEdit, 
  onDelete, 
  isEditing 
}: EventCardProps) {
  return (
    <div className={`${styles.card} ${isEditing ? styles.editing : ''}`}>
      {/* Card content */}
    </div>
  );
}
```

#### Form Pattern
```typescript
const [formData, setFormData] = useState({
  title: '',
  description: '',
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Handle form submission
};
```

### Best Practices
1. **Keep components focused** - Single responsibility principle
2. **Prop drilling awareness** - Consider context for deeply nested props
3. **Memoization** - Use React.memo() for expensive components
4. **Error boundaries** - Wrap error-prone components
5. **Loading states** - Show feedback during async operations
6. **Empty states** - Handle empty data gracefully
7. **Performance** - Lazy load when appropriate
8. **Reusability** - Design for reuse where it makes sense

### Testing Components
- Write tests in `__tests__/` directory
- Test rendering with different props
- Test user interactions
- Test conditional rendering
- Test accessibility
- Use `@testing-library/react` for testing

### What to Include
- ✅ TypeScript interface for props
- ✅ CSS Module for styles
- ✅ Accessibility attributes
- ✅ Error handling
- ✅ Loading states
- ✅ Hover and focus states
- ✅ Responsive design considerations

### What to Avoid
- ❌ Inline styles (use CSS Modules)
- ❌ `any` type (use explicit types)
- ❌ Generic system fonts (Inter, Roboto, Arial)
- ❌ Overly complex components (split into smaller components)
- ❌ Direct DOM manipulation (use React patterns)
- ❌ Missing accessibility attributes
- ❌ Hardcoded colors (use CSS variables)
