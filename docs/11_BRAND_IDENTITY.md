# Brand Identity - SOLV Languages

## Brand Name

**SOLV Languages** (formerly French Fluency Forge)

## Color Palette

### Primary Colors

Defined in `src/index.css` as CSS variables:

```css
--carbon: #1a1a1a      /* Deep black */
--graphite: #2d2d2d    /* Dark gray */
--bone: #f5f5f0        /* Off-white */
--steel: #6b7280       /* Mid gray */
```

### Accent Colors

```css
--orange: #f97316      /* Vibrant orange */
--magenta: #ec4899     /* Bright magenta */
--uv: #8b5cf6          /* Purple/UV */
```

### Usage

- **Background:** Carbon with radial gradients
- **Cards:** Graphite/Bone depending on theme
- **Text:** Bone (dark mode) / Carbon (light mode)
- **Accents:** Orange (primary), Magenta (secondary), UV (tertiary)
- **Borders:** Steel

## Typography

### Fonts

**Sans-serif (Body):**
- **Inter** - Primary font for body text, UI elements
- Weights: 400, 500, 600, 700

**Serif (Headlines):**
- **Space Grotesk** - Headlines, emphasis
- Weights: 500, 700

**Monospace (Code):**
- **IBM Plex Mono** - Code snippets, technical data
- Weights: 400, 600

### Font Loading

Fonts loaded via Google Fonts in `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap');
```

### Tailwind Configuration

`tailwind.config.ts`:

```typescript
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  serif: ['Space Grotesk', 'serif'],
  mono: ['IBM Plex Mono', 'monospace'],
}
```

## Visual Effects

### Background

**Radial Gradients:**
```css
background: 
  radial-gradient(circle at 20% 80%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
  radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
  radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.1) 0%, transparent 50%);
```

**Film Grain Effect:**
```css
&::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,...");
  opacity: 0.03;
  pointer-events: none;
}
```

### Shadows

- **Cards:** `shadow-sm` (subtle)
- **Elevated:** `shadow-lg` (prominent)
- **Hover:** `hover:shadow-md` (interactive)

## UI Patterns

### Cards

```tsx
<Card className="border-border bg-card">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Buttons

**Variants:**
- `default` - Primary action (orange)
- `secondary` - Secondary action
- `outline` - Tertiary action
- `ghost` - Minimal action
- `destructive` - Dangerous action

**Sizes:**
- `sm` - Small (compact)
- `default` - Standard
- `lg` - Large (prominent)
- `icon` - Icon only

### Badges

```tsx
<Badge variant="default">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Error</Badge>
```

### Icons

**Library:** Lucide React

**Usage:**
```tsx
import { Check, X, AlertCircle } from 'lucide-react';

<Check className="w-4 h-4 text-green-500" />
```

**Sizes:**
- `w-3 h-3` - Extra small (12px)
- `w-4 h-4` - Small (16px)
- `w-5 h-5` - Medium (20px)
- `w-6 h-6` - Large (24px)

## Spacing System

**Tailwind Scale:**
- `gap-2` / `p-2` - 8px
- `gap-3` / `p-3` - 12px
- `gap-4` / `p-4` - 16px
- `gap-6` / `p-6` - 24px
- `gap-8` / `p-8` - 32px

**Consistent Usage:**
- Card padding: `p-6`
- Card gaps: `gap-6`
- Section spacing: `space-y-6`
- Button gaps: `gap-2`

## Responsive Design

### Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile-First Approach

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Stacks on mobile, 2 cols on tablet, 3 cols on desktop */}
</div>
```

## Accessibility

### Semantic HTML

- Use proper heading hierarchy (h1 → h2 → h3)
- Use `<button>` for actions
- Use `<a>` for navigation
- Use `<label>` for form fields

### ARIA Labels

```tsx
<button aria-label="Close dialog">
  <X className="w-4 h-4" />
</button>
```

### Keyboard Navigation

- All interactive elements focusable
- Tab order logical
- Escape closes modals
- Enter submits forms

### Color Contrast

- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Use `text-muted-foreground` for secondary text

## Animation

### Framer Motion

Used for:
- Badge unlock animations
- Page transitions
- Hover effects
- Loading states

Example:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

### CSS Transitions

```tsx
<div className="transition-colors hover:bg-accent">
  {/* Smooth color transition */}
</div>
```

## Voice & Tone

### Anti-School Vocabulary

**Avoid:**
- Student
- Teacher
- Lesson
- Homework
- Flashcards
- Class
- Grade

**Use:**
- Member / Learner
- Coach
- Session / Conversation
- Practice
- Phrases
- Group / Cohort
- Score / Progress

### Writing Style

- **Direct:** Get to the point quickly
- **Motivating:** Focus on progress and wins
- **Honest:** No false promises
- **Conversational:** Speak like a human
- **Action-oriented:** Clear CTAs

### UI Copy Examples

**Good:**
- "Welcome back, Tom"
- "Add your first habit and start stacking wins"
- "Pick a real-world outcome and lock it in"
- "Your timeline starts after your first check-in"

**Bad:**
- "Welcome back, student"
- "Complete your homework"
- "Study these flashcards"
- "Your grade is..."

## Design Principles

1. **Clarity over cleverness** - Make it obvious
2. **Speed over perfection** - Fast interactions
3. **Progress over performance** - Show momentum
4. **Autonomy over automation** - User control
5. **Conversation over content** - Speaking-first

## Component Library

**shadcn/ui components used:**
- Button, Card, Input, Textarea
- Dialog, Sheet, Drawer
- Select, Checkbox, Radio, Switch
- Badge, Progress, Separator
- Tabs, Accordion, Collapsible
- Tooltip, Popover, Dropdown
- Table, Avatar, Skeleton
- Toast (Sonner)

**Customizations:**
- Colors mapped to SOLV palette
- Fonts updated to Inter/Space Grotesk/IBM Plex Mono
- Spacing adjusted for consistency

