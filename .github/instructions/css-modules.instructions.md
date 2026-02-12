---
applyTo: "**/*.module.css"
---

## CSS Module Styling Requirements

When creating or modifying CSS Module files in NextStop, follow these guidelines to maintain the distinctive design system:

### Design System Variables

NextStop uses a distinctive design system with custom CSS variables defined in `app/globals.css`:

```css
/* Typography */
--font-display: 'Playfair Display', serif;  /* For headings */
--font-body: 'Courier Prime', monospace;    /* For body text */

/* Colors */
--color-primary: #FF3366;    /* Primary brand color */
--color-secondary: #0A0A0A;  /* Dark text/backgrounds */
--color-accent: #FFCC00;     /* Accent color */
--color-bg: #FAFAFA;         /* Background color */
--color-text: #0A0A0A;       /* Text color */

/* Layout */
--spacing-unit: 8px;         /* Base spacing unit */
--border-weight: 3px;        /* Border thickness */
```

### CSS Module Best Practices

1. **Use CSS Modules for component-specific styles**
   - Import: `import styles from './Component.module.css';`
   - Apply: `className={styles.className}`

2. **Use CSS variables instead of hardcoded values**
   ```css
   .card {
     color: var(--color-text);
     background: var(--color-bg);
     font-family: var(--font-body);
   }
   ```

3. **Follow the distinctive typography system**
   ```css
   .heading {
     font-family: var(--font-display);
     font-weight: 700;
     letter-spacing: -0.02em;
   }
   
   .body {
     font-family: var(--font-body);
     line-height: 1.6;
   }
   ```

4. **Use semantic class names**
   - Good: `.card`, `.header`, `.title`, `.actions`
   - Avoid: `.mt-4`, `.flex`, `.text-lg` (use Tailwind for these)

5. **Keep transitions smooth and subtle**
   ```css
   .button {
     transition: all 0.2s ease;
   }
   
   .button:hover {
     transform: translateY(-2px);
   }
   ```

### Component Styling Patterns

#### Card Components
```css
.card {
  background: white;
  border: var(--border-weight) solid var(--color-secondary);
  padding: calc(var(--spacing-unit) * 3);
  margin-bottom: calc(var(--spacing-unit) * 2);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}
```

#### Interactive Elements
```css
.button {
  font-family: var(--font-body);
  font-weight: 700;
  padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 3);
  border: var(--border-weight) solid var(--color-secondary);
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button:hover {
  background: var(--color-secondary);
  transform: translateY(-2px);
}

.button:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

#### Layout Containers
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: calc(var(--spacing-unit) * 4);
}

.grid {
  display: grid;
  gap: calc(var(--spacing-unit) * 3);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

### Responsive Design

Use clamp() for fluid typography:
```css
.heading {
  font-size: clamp(2rem, 5vw, 4rem);
}
```

Use media queries for layout changes:
```css
@media (max-width: 768px) {
  .container {
    padding: calc(var(--spacing-unit) * 2);
  }
}
```

### State Management in CSS

```css
/* Conditional states */
.card.editing {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(255, 51, 102, 0.1);
}

.card.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Loading states */
.loading {
  position: relative;
  pointer-events: none;
}

.loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
}
```

### Accessibility in CSS

```css
/* Focus states */
.button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .card {
    border-width: calc(var(--border-weight) * 1.5);
  }
}
```

### What to Include
- ✅ CSS variables for colors and spacing
- ✅ Distinctive typography (Playfair Display + Courier Prime)
- ✅ Smooth transitions (0.2s ease)
- ✅ Hover states for interactive elements
- ✅ Focus states for accessibility
- ✅ Responsive breakpoints
- ✅ Loading and error states

### What to Avoid
- ❌ Hardcoded colors (use CSS variables)
- ❌ Hardcoded spacing (use calc() with spacing units)
- ❌ Generic fonts (Inter, Roboto, Arial)
- ❌ Overly complex animations
- ❌ !important (unless absolutely necessary)
- ❌ Inline styles in JSX (use CSS Modules)
- ❌ Magic numbers (use variables and calc())

### NextStop-Specific Patterns

#### AI Feature Styling
```css
.aiSection {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: calc(var(--spacing-unit) * 4);
  border-radius: calc(var(--spacing-unit) * 2);
}
```

#### Tags and Badges
```css
.tag {
  display: inline-block;
  padding: calc(var(--spacing-unit) * 0.5) calc(var(--spacing-unit) * 1.5);
  background: var(--color-accent);
  color: var(--color-secondary);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: calc(var(--spacing-unit) * 0.5);
}
```

#### Form Elements
```css
.input {
  font-family: var(--font-body);
  padding: calc(var(--spacing-unit) * 1.5);
  border: var(--border-weight) solid var(--color-secondary);
  background: white;
  font-size: 1rem;
  width: 100%;
}

.input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Performance Considerations
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly for performance-critical animations
- Minimize use of expensive properties like `box-shadow` in animations
