# 🎯 Frontend Development Guide - Aster Management

## 📘 TypeScript Development

### Core Rules
- **Package Manager**: Use `bun > pnpm > npm > yarn`
- **Type Safety**: `strict: true` in tsconfig.json and whenever you have completed to write code, please check the code using bun tsc --noEmit
- **Null Handling**: Use optional chaining `?.` and nullish coalescing `??`
- **Imports**: Use ES modules with absolute imports via `@/` prefix
- **Components**: Always use TypeScript interfaces for props

### Code Quality Tools
```bash
# Development commands
bun dev                    # Start Next.js development server
bun build                  # Build for production
bun start                  # Start production server

# Code quality
bunx prettier --write .    # Format code
bunx eslint . --fix       # Lint and fix
bunx tsc --noEmit         # Type check

# Testing
bun test                  # Run tests
bun test --coverage       # Run with coverage

# Storybook
bun storybook            # Start Storybook dev server
bun build-storybook      # Build static Storybook
```

## 🏗️ Architecture Patterns

### Component Structure
```
src/
├── app/                  # Next.js App Router pages
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── examples/        # Example/demo components
│   └── features/        # Feature-specific components
├── stores/              # Zustand state stores
├── lib/
│   ├── schemas/         # Zod validation schemas
│   └── utils.ts         # Utility functions
└── stories/             # Storybook stories
```

### File Naming Conventions
- **Components**: `kebab-case.tsx` (e.g., `matter-form.tsx`)
- **Stores**: `kebab-case-store.ts` (e.g., `matter-store.ts`)
- **Schemas**: `kebab-case-schemas.ts` (e.g., `matter-schemas.ts`)
- **Stories**: `Component.stories.tsx` (e.g., `MatterForm.stories.tsx`)

## 🗃️ State Management with Zustand

### Store Creation Pattern
```typescript
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface StoreState {
  // Data properties
  items: Item[]
  selectedItem: Item | null
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  setItems: (items: Item[]) => void
  selectItem: (item: Item | null) => void
  updateItem: (id: string, updates: Partial<Item>) => void
}

export const useStore = create<StoreState>()( 
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      items: [],
      selectedItem: null,
      isLoading: false,
      error: null,
      
      // Actions
      setItems: (items) => set((state) => {
        state.items = items
      }),
      
      selectItem: (item) => set((state) => {
        state.selectedItem = item
      }),
      
      updateItem: (id, updates) => set((state) => {
        const index = state.items.findIndex(item => item.id === id)
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updates }
        }
      })
    }))
  )
)

// Selector hooks for optimized re-renders
export const useItems = () => useStore((state) => state.items)
export const useSelectedItem = () => useStore((state) => state.selectedItem)
export const useLoadingState = () => useStore((state) => ({
  isLoading: state.isLoading,
  error: state.error
}))
```

### Store Best Practices
- **Immer Middleware**: Use for complex state updates with nested objects
- **Selector Hooks**: Create specific hooks to minimize re-renders
- **Actions**: Keep actions focused and atomic
- **TypeScript**: Always type your store interfaces
- **Async Actions**: Handle loading states and errors consistently

## ✅ Form Validation with Zod

### Schema Definition Pattern
```typescript
import { z } from 'zod'

// Base schema with validation rules
export const ItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

// Form schemas for different operations
export const CreateItemSchema = ItemSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export const UpdateItemSchema = CreateItemSchema.partial().extend({
  id: z.string().uuid()
})

// Type exports
export type Item = z.infer<typeof ItemSchema>
export type CreateItemRequest = z.infer<typeof CreateItemSchema>
export type UpdateItemRequest = z.infer<typeof UpdateItemSchema>

// Validation helpers
export const validateItem = (data: unknown) => ItemSchema.safeParse(data)
```

### Form Integration with react-hook-form
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

function MyForm() {
  const form = useForm<CreateItemRequest>({
    resolver: zodResolver(CreateItemSchema),
    defaultValues: {
      title: '',
      status: 'draft',
      priority: 'medium'
    }
  })

  const onSubmit = (data: CreateItemRequest) => {
    // Data is already validated by Zod
    console.log('Valid data:', data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### Validation Best Practices
- **Runtime Validation**: Use Zod for both client and server validation
- **Error Messages**: Provide clear, user-friendly error messages
- **Type Safety**: Export and use inferred types throughout your app
- **Schema Composition**: Use `.extend()`, `.omit()`, `.pick()` for variations
- **Custom Validation**: Use `.refine()` for complex business rules

## 🎨 Component Development with Storybook

### Story Creation Pattern
```typescript
// Component.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MatterCard } from './matter-card'

const meta: Meta<typeof MatterCard> = {
  title: 'Features/MatterCard',
  component: MatterCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    priority: {
      control: { type: 'select' },
      options: ['low', 'medium', 'high', 'urgent']
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    matter: {
      id: '1',
      caseNumber: '2025-CV-0001',
      title: 'Contract Dispute',
      clientName: 'ABC Corporation',
      status: 'in_progress',
      priority: 'high'
    }
  }
}

export const UrgentPriority: Story = {
  args: {
    ...Default.args,
    matter: {
      ...Default.args.matter!,
      priority: 'urgent'
    }
  }
}

// With interaction testing
export const WithInteraction: Story = {
  args: Default.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button')
    await userEvent.click(button)
  }
}
```

### Storybook Best Practices
- **Story Categories**: Use consistent naming (`Features/`, `UI/`, `Examples/`)
- **Autodocs**: Enable for automatic documentation generation
- **Controls**: Add interactive controls for props
- **Variants**: Create stories for different states and edge cases
- **Interaction Tests**: Use `@storybook/testing-library` for user interactions

## 🎯 Icon Usage with Lucide-React

### Icon Integration Pattern
```typescript
import { Scale, FileText, User, AlertTriangle } from 'lucide-react'

// In components
function MatterCard({ priority }: { priority: string }) {
  const PriorityIcon = {
    urgent: AlertTriangle,
    high: AlertTriangle, 
    medium: FileText,
    low: FileText
  }[priority] || FileText

  return (
    <div className="flex items-center gap-2">
      <PriorityIcon className="size-4 text-blue-500" />
      <span>{priority}</span>
    </div>
  )
}

// With shadcn/ui Button
import { Button } from '@/components/ui/button'

function ActionButton() {
  return (
    <Button>
      <Scale className="size-4 mr-2" />
      Legal Action
    </Button>
  )
}
```

### Icon Best Practices
- **Consistent Sizing**: Use Tailwind's `size-*` classes
- **Semantic Icons**: Choose icons that represent the legal domain
- **Color Coordination**: Use theme colors for consistency
- **Accessibility**: Always include meaningful text alongside icons

## 🧩 Component Integration Patterns

### shadcn/ui + Zustand + Zod Pattern
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { CreateMatterSchema, type CreateMatterRequest } from '@/lib/schemas/matter-schemas'
import { useMatterStore } from '@/stores/matter-store'

export function IntegratedComponent() {
  const { addMatter, isLoading } = useMatterStore()
  
  const form = useForm<CreateMatterRequest>({
    resolver: zodResolver(CreateMatterSchema),
    defaultValues: { title: '', clientName: '' }
  })

  const onSubmit = async (data: CreateMatterRequest) => {
    // Validated data from Zod, UI state from Zustand
    const matter = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    addMatter(matter)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="size-4" />
                Title
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter matter title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading}>
          Create Matter
        </Button>
      </form>
    </Form>
  )
}
```

## 🔧 Development Workflow

### Testing Strategy
```bash
# Component testing with Storybook
bun storybook

# Type checking
bunx tsc --noEmit

# Build verification  
bun build

# Validate schemas
echo '{"title":"test"}' | bunx ts-node -e "
  import { CreateMatterSchema } from './src/lib/schemas/matter-schemas'
  const result = CreateMatterSchema.safeParse(JSON.parse(process.stdin.read()))
  console.log(result)
"
```

### Agent-Native CLI Interfaces

#### Store Operations
```bash
# Query store state
bunx ts-node -e "
  import { useMatterStore } from './src/stores/matter-store'
  console.log(useMatterStore.getState().matters.length)
"

# Manipulate state
bunx ts-node -e "
  import { useMatterStore } from './src/stores/matter-store'
  useMatterStore.getState().addMatter(matterData)
"
```

#### Schema Validation
```bash
# Validate data against schemas
echo '{"title":"Test Matter","clientName":"John Doe"}' | \
  bunx ts-node -e "
    import { CreateMatterSchema } from './src/lib/schemas/matter-schemas'
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'))
    console.log(CreateMatterSchema.safeParse(data))
  "
```

#### Component Generation
```bash
# Generate new component with story
bunx plop component ComponentName

# Generate new store
bunx plop store StoreName

# Generate new schema
bunx plop schema SchemaName
```

## 📚 Documentation Standards

### Component Documentation Template
```typescript
/**
 * Brief description of the component's purpose
 * 
 * @description Detailed explanation of what the component does,
 * its role in the application, and any business logic it contains
 * 
 * @param props - Component props interface
 * @returns JSX.Element - The rendered component
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   prop1="value1"
 *   prop2={value2}
 *   onAction={(data) => console.log(data)}
 * />
 * ```
 * 
 * @see {@link RelatedComponent} For related functionality
 * @since 1.0.0
 * 
 * @agent-cli Available via CLI:
 * ```bash
 * # Example CLI usage
 * curl -X POST /api/endpoint -d '{"data": "value"}'
 * ```
 */
export function ComponentName(props: ComponentProps) {
  // Implementation
}
```

### Store Documentation Template
```typescript
/**
 * Store for managing [entity] state and operations
 * 
 * @description Comprehensive state management for [entity] including
 * CRUD operations, filtering, sorting, and UI state management.
 * Implements optimistic updates with rollback capabilities.
 * 
 * @example
 * ```tsx
 * const { items, addItem, isLoading } = useEntityStore()
 * 
 * // Add new item
 * addItem(newItem)
 * 
 * // Use selector hooks for performance
 * const items = useItems()
 * const loading = useLoadingState()
 * ```
 * 
 * @agent-cli Available operations:
 * ```javascript
 * // Direct store access in development
 * useEntityStore.getState().addItem(data)
 * useEntityStore.getState().items.filter(predicate)
 * ```
 */
```

## 🚀 Performance Optimization

### Best Practices
- **Zustand Selectors**: Use specific selector hooks to minimize re-renders
- **React.memo**: Memoize expensive components
- **Zod Parsing**: Cache schema validations when possible
- **Icon Tree-shaking**: Import individual icons from Lucide-React
- **Storybook**: Use for isolated performance testing

### Bundle Optimization
```bash
# Analyze bundle size
bunx @next/bundle-analyzer

# Check for unnecessary imports
bunx depcheck

# Optimize images
bunx next/image for optimized image loading
```

## 🛠️ Troubleshooting

### Common Issues

**Zustand store not updating UI:**
```typescript
// ❌ Wrong - direct mutation
state.items.push(newItem)

// ✅ Correct - with immer middleware
set((state) => {
  state.items.push(newItem)
})
```

**Zod validation not working:**
```typescript
// ❌ Wrong - missing resolver
const form = useForm<FormData>()

// ✅ Correct - with zodResolver
const form = useForm<FormData>({
  resolver: zodResolver(MySchema)
})
```

**Storybook not loading:**
```bash
# Clear cache
rm -rf node_modules/.cache
bun install
bun storybook
```

---

## 📋 Quick Reference

### Library Versions
- Zustand: ^5.0.5
- Zod: ^3.25.64  
- Storybook: ^9.0.10
- Lucide-React: ^0.515.0
- react-hook-form: Latest
- @hookform/resolvers: Latest

### Key Commands
```bash
bun dev              # Start development
bun storybook        # Component development
bunx tsc --noEmit    # Type check
bun build           # Production build
```

This guide provides the foundation for consistent, type-safe, and maintainable frontend development in the Aster Management project.