# Component Development Guide - Aster Management

This guide covers component development standards, patterns, and best practices for building reusable, accessible, and maintainable Vue components in the Aster Management application.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Design System Integration](#design-system-integration)
3. [Component Patterns](#component-patterns)
4. [Accessibility Guidelines](#accessibility-guidelines)
5. [Storybook Development](#storybook-development)
6. [Testing Components](#testing-components)
7. [Performance Optimization](#performance-optimization)

## Component Architecture

### Component Hierarchy

Our component architecture follows a hierarchical structure:

```
ui/                     # Design System Components (shadcn-vue)
├── Button.vue         # Base button component
├── Input.vue          # Form input component
├── Modal.vue          # Modal dialog component
└── ...

forms/                  # Form-specific Components
├── BaseForm.vue       # Form wrapper with validation
├── CaseForm.vue       # Case creation/editing
├── LoginForm.vue      # Authentication form
└── ...

legal/                  # Domain-specific Components
├── KanbanBoard.vue    # Case management board
├── CaseCard.vue       # Case display component
├── DocumentViewer.vue # PDF document viewer
└── ...

layout/                 # Layout Components
├── Header.vue         # Application header
├── Sidebar.vue        # Navigation sidebar
├── Footer.vue         # Application footer
└── ...
```

### Component Types

#### 1. Base Components (`ui/`)

Foundational components that implement the design system:

```vue
<!-- components/ui/Button.vue -->
<template>
  <button
    :class="cn(buttonVariants({ variant, size }), className)"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

interface Props {
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  disabled?: boolean
  className?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  disabled: false
})
</script>
```

#### 2. Form Components (`forms/`)

Specialized components for form handling:

```vue
<!-- components/forms/BaseForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <slot :errors="errors" :isSubmitting="isSubmitting" />
    
    <div v-if="$slots.actions" class="flex justify-end space-x-2">
      <slot name="actions" :isSubmitting="isSubmitting" />
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { ZodSchema } from 'zod'

interface Props {
  schema: ZodSchema<any>
  initialValues?: Record<string, any>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [values: any]
  error: [error: Error]
}>()

const { handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(props.schema),
  initialValues: props.initialValues
})

const onSubmit = handleSubmit(async (values) => {
  try {
    emit('submit', values)
  } catch (error) {
    emit('error', error as Error)
  }
})
</script>
```

#### 3. Feature Components (`legal/`)

Domain-specific components for legal workflows:

```vue
<!-- components/legal/CaseCard.vue -->
<template>
  <Card 
    class="case-card group cursor-pointer transition-all hover:shadow-md"
    @click="$emit('select', case)"
  >
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <CardTitle class="text-lg font-semibold line-clamp-2">
          {{ case.title }}
        </CardTitle>
        <CaseStatusBadge :status="case.status" />
      </div>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <p class="text-sm text-muted-foreground line-clamp-3">
        {{ case.description }}
      </p>
      
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ formatDate(case.createdAt) }}</span>
        <span>{{ case.clientName }}</span>
      </div>
      
      <div class="flex items-center justify-between">
        <CasePriority :priority="case.priority" />
        <CaseActions
          :case="case"
          @edit="$emit('edit', case)"
          @delete="$emit('delete', case)"
          @archive="$emit('archive', case)"
        />
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Case } from '~/types/case'
import { formatDate } from '~/utils/date'

interface Props {
  case: Case
}

defineProps<Props>()

defineEmits<{
  select: [case: Case]
  edit: [case: Case]
  delete: [case: Case]
  archive: [case: Case]
}>()
</script>

<style scoped>
.case-card {
  @apply relative;
}

.case-card::before {
  content: '';
  @apply absolute top-0 left-0 w-1 h-full bg-primary/20 rounded-l-md transition-all;
}

.case-card:hover::before {
  @apply bg-primary/60;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
```

## Design System Integration

### shadcn-vue Components

We use shadcn-vue as our base design system. All UI components should extend or compose these base components:

```vue
<!-- components/ui/index.ts -->
export { default as Button } from './Button.vue'
export { default as Input } from './Input.vue'
export { default as Label } from './Label.vue'
export { default as Card } from './Card.vue'
export { default as Badge } from './Badge.vue'
// ... other components

<!-- Usage in other components -->
<script setup lang="ts">
import { Button, Input, Label, Card } from '~/components/ui'
</script>
```

### Custom Component Variants

Extend base components with custom variants:

```vue
<!-- components/ui/CaseStatusBadge.vue -->
<template>
  <Badge :variant="statusVariant" :class="cn('case-status-badge', className)">
    <Icon :name="statusIcon" class="w-3 h-3 mr-1" />
    {{ statusText }}
  </Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '~/components/ui'
import type { CaseStatus } from '~/types/case'

interface Props {
  status: CaseStatus
  className?: string
}

const props = defineProps<Props>()

const statusConfig = {
  draft: { variant: 'secondary', icon: 'FileText', text: 'Draft' },
  active: { variant: 'default', icon: 'Play', text: 'Active' },
  'on-hold': { variant: 'warning', icon: 'Pause', text: 'On Hold' },
  completed: { variant: 'success', icon: 'Check', text: 'Completed' },
  archived: { variant: 'outline', icon: 'Archive', text: 'Archived' }
} as const

const statusVariant = computed(() => statusConfig[props.status].variant)
const statusIcon = computed(() => statusConfig[props.status].icon)
const statusText = computed(() => statusConfig[props.status].text)
</script>
```

### Theme Integration

Components should respect the theme system:

```vue
<template>
  <div class="bg-background text-foreground">
    <!-- Component content -->
  </div>
</template>

<style scoped>
/* Use CSS custom properties for theme colors */
.custom-element {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--border));
}

/* Responsive design with Tailwind */
.responsive-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}
</style>
```

## Component Patterns

### Compound Components

Build complex components from simpler ones:

```vue
<!-- components/legal/KanbanBoard.vue -->
<template>
  <div class="kanban-board">
    <KanbanColumn
      v-for="column in columns"
      :key="column.id"
      :column="column"
      :cases="getCasesForColumn(column.id)"
      @case-moved="handleCaseMoved"
      @case-selected="$emit('case-selected', $event)"
    >
      <template #header="{ column }">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">{{ column.title }}</h3>
          <Badge variant="secondary">{{ getCasesForColumn(column.id).length }}</Badge>
        </div>
      </template>
      
      <template #case="{ case }">
        <CaseCard
          :case="case"
          @select="$emit('case-selected', case)"
          @edit="$emit('case-edit', case)"
        />
      </template>
    </KanbanColumn>
  </div>
</template>

<script setup lang="ts">
import type { Case, KanbanColumn } from '~/types/case'

interface Props {
  columns: KanbanColumn[]
  cases: Case[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'case-moved': [caseId: string, fromColumn: string, toColumn: string]
  'case-selected': [case: Case]
  'case-edit': [case: Case]
}>()

const getCasesForColumn = (columnId: string) => {
  return props.cases.filter(case => case.status === columnId)
}

const handleCaseMoved = (caseId: string, fromColumn: string, toColumn: string) => {
  emit('case-moved', caseId, fromColumn, toColumn)
}
</script>
```

### Renderless Components

Create components that provide logic without rendering:

```vue
<!-- components/common/DataProvider.vue -->
<template>
  <slot
    :data="data"
    :loading="loading"
    :error="error"
    :refresh="refresh"
  />
</template>

<script setup lang="ts">
interface Props {
  url: string
  immediate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  immediate: true
})

const { data, pending: loading, error, refresh } = await useFetch(props.url, {
  immediate: props.immediate
})
</script>

<!-- Usage -->
<template>
  <DataProvider url="/api/cases" v-slot="{ data, loading, error }">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <CaseList v-else :cases="data" />
  </DataProvider>
</template>
```

### Higher-Order Components

Create components that enhance other components:

```vue
<!-- components/common/WithLoading.vue -->
<template>
  <div class="relative">
    <div v-if="loading" class="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
      <LoadingSpinner />
    </div>
    <div :class="{ 'opacity-50': loading }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  loading: boolean
}

defineProps<Props>()
</script>

<!-- Usage -->
<template>
  <WithLoading :loading="isSubmitting">
    <CaseForm @submit="handleSubmit" />
  </WithLoading>
</template>
```

## Accessibility Guidelines

### Semantic HTML

Always use semantic HTML elements:

```vue
<template>
  <!-- ✅ Good - Semantic structure -->
  <article class="case-card" role="article">
    <header class="case-header">
      <h2 class="case-title">{{ case.title }}</h2>
    </header>
    
    <main class="case-content">
      <p class="case-description">{{ case.description }}</p>
    </main>
    
    <footer class="case-actions">
      <button type="button" @click="editCase">Edit</button>
    </footer>
  </article>
  
  <!-- ❌ Avoid - Generic divs only -->
  <div class="case-card">
    <div class="case-title">{{ case.title }}</div>
    <div class="case-description">{{ case.description }}</div>
    <div class="case-actions">
      <div @click="editCase">Edit</div>
    </div>
  </div>
</template>
```

### ARIA Labels and Roles

Provide proper ARIA attributes:

```vue
<template>
  <div
    class="kanban-board"
    role="application"
    aria-label="Case management board"
  >
    <div
      v-for="column in columns"
      :key="column.id"
      class="kanban-column"
      role="region"
      :aria-label="`${column.title} cases`"
    >
      <h2 :id="`column-${column.id}-title`" class="column-title">
        {{ column.title }}
      </h2>
      
      <ul
        role="list"
        :aria-labelledby="`column-${column.id}-title`"
        class="case-list"
      >
        <li
          v-for="case in columnCases"
          :key="case.id"
          role="listitem"
          class="case-item"
        >
          <button
            type="button"
            class="case-button"
            :aria-describedby="`case-${case.id}-desc`"
            @click="selectCase(case)"
          >
            <span class="case-title">{{ case.title }}</span>
            <span :id="`case-${case.id}-desc`" class="sr-only">
              Case status: {{ case.status }}, Created: {{ formatDate(case.createdAt) }}
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
```

### Keyboard Navigation

Implement proper keyboard support:

```vue
<template>
  <div
    class="dropdown"
    @keydown="handleKeydown"
  >
    <button
      ref="triggerRef"
      type="button"
      class="dropdown-trigger"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggle"
      @keydown.enter="toggle"
      @keydown.space.prevent="toggle"
      @keydown.arrow-down.prevent="openAndFocusFirst"
    >
      {{ selectedOption?.label || placeholder }}
    </button>
    
    <ul
      v-show="isOpen"
      ref="listRef"
      class="dropdown-list"
      role="listbox"
      :aria-activedescendant="activeDescendant"
    >
      <li
        v-for="(option, index) in options"
        :key="option.value"
        :id="`option-${option.value}`"
        role="option"
        :aria-selected="option.value === selectedValue"
        :class="{ 'active': index === activeIndex }"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      close()
      triggerRef.value?.focus()
      break
    case 'ArrowDown':
      event.preventDefault()
      moveActiveIndex(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveActiveIndex(-1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (activeIndex.value >= 0) {
        selectOption(options.value[activeIndex.value])
      }
      break
  }
}
</script>
```

### Focus Management

Handle focus properly:

```vue
<script setup lang="ts">
const modalRef = ref<HTMLElement>()
const previousFocus = ref<HTMLElement>()

const openModal = () => {
  previousFocus.value = document.activeElement as HTMLElement
  isOpen.value = true
  
  nextTick(() => {
    // Focus first focusable element in modal
    const firstFocusable = modalRef.value?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    firstFocusable?.focus()
  })
}

const closeModal = () => {
  isOpen.value = false
  // Return focus to previously focused element
  previousFocus.value?.focus()
}

// Trap focus within modal
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Tab') {
    trapFocus(event, modalRef.value)
  }
}
</script>
```

## Storybook Development

### Story Structure

Create comprehensive stories for each component:

```typescript
// components/ui/Button.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import Button from './Button.vue'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']
    },
    size: {
      control: 'select', 
      options: ['default', 'sm', 'lg', 'icon']
    },
    onClick: { action: 'clicked' }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    default: 'Button'
  }
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    default: 'Delete'
  }
}

export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="space-y-4">
        <div class="space-x-2">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <div class="space-x-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>
    `
  })
}
```

### Interactive Stories

Create stories that demonstrate component behavior:

```typescript
// components/legal/CaseCard.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import CaseCard from './CaseCard.vue'

const mockCase = {
  id: '1',
  title: 'Patent Application Review',
  description: 'Review and analyze patent application for tech startup',
  status: 'active',
  priority: 'high',
  clientName: 'Tech Startup Inc.',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20')
}

const meta: Meta<typeof CaseCard> = {
  title: 'Legal/CaseCard',
  component: CaseCard,
  parameters: {
    layout: 'padded',
  },
  args: {
    case: mockCase
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const DifferentStatuses: Story = {
  render: () => ({
    components: { CaseCard },
    setup() {
      const cases = [
        { ...mockCase, status: 'draft', title: 'Draft Case' },
        { ...mockCase, status: 'active', title: 'Active Case' },
        { ...mockCase, status: 'on-hold', title: 'On Hold Case' },
        { ...mockCase, status: 'completed', title: 'Completed Case' },
        { ...mockCase, status: 'archived', title: 'Archived Case' }
      ]
      return { cases }
    },
    template: `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CaseCard 
          v-for="case in cases" 
          :key="case.id" 
          :case="case"
          @select="console.log('Selected:', case)"
          @edit="console.log('Edit:', case)"
          @delete="console.log('Delete:', case)"
        />
      </div>
    `
  })
}
```

## Testing Components

### Unit Testing

Test component behavior with Vitest and Vue Test Utils:

```typescript
// components/ui/Button.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button', () => {
  it('renders correctly', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('inline-flex')
  })
  
  it('applies variant classes', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'destructive'
      },
      slots: {
        default: 'Delete'
      }
    })
    
    expect(wrapper.classes()).toContain('bg-destructive')
  })
  
  it('emits click event', async () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
  
  it('disables interaction when disabled', async () => {
    const clickHandler = vi.fn()
    const wrapper = mount(Button, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Click me'
      }
    })
    
    await wrapper.trigger('click')
    expect(clickHandler).not.toHaveBeenCalled()
    expect(wrapper.find('button').element.disabled).toBe(true)
  })
})
```

### Integration Testing

Test component integration with Playwright:

```typescript
// tests/e2e/case-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Case Management', () => {
  test('should create a new case', async ({ page }) => {
    await page.goto('/cases')
    
    // Click new case button
    await page.click('[data-testid="new-case-button"]')
    
    // Fill form
    await page.fill('[data-testid="case-title"]', 'Test Case')
    await page.fill('[data-testid="case-description"]', 'Test Description')
    await page.selectOption('[data-testid="case-status"]', 'active')
    
    // Submit form
    await page.click('[data-testid="submit-button"]')
    
    // Verify case was created
    await expect(page.locator('[data-testid="case-card"]')).toContainText('Test Case')
  })
  
  test('should edit existing case', async ({ page }) => {
    await page.goto('/cases/1')
    
    // Click edit button
    await page.click('[data-testid="edit-case-button"]')
    
    // Update title
    await page.fill('[data-testid="case-title"]', 'Updated Case Title')
    
    // Save changes
    await page.click('[data-testid="save-button"]')
    
    // Verify update
    await expect(page.locator('h1')).toContainText('Updated Case Title')
  })
})
```

## Performance Optimization

### Lazy Loading

Implement component lazy loading:

```vue
<script setup lang="ts">
// Lazy load heavy components
const LazyDocumentViewer = defineAsyncComponent({
  loader: () => import('~/components/legal/DocumentViewer.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})

const LazyChart = defineAsyncComponent(() => import('~/components/charts/BarChart.vue'))
</script>

<template>
  <div>
    <!-- Conditional lazy loading -->
    <LazyDocumentViewer 
      v-if="showDocument" 
      :document="selectedDocument" 
    />
    
    <!-- Lazy load charts -->
    <Suspense>
      <LazyChart :data="chartData" />
      <template #fallback>
        <LoadingSpinner />
      </template>
    </Suspense>
  </div>
</template>
```

### Memo and Computed

Optimize reactive computations:

```vue
<script setup lang="ts">
// Memoize expensive computations
const expensiveComputation = computed(() => {
  return cases.value.reduce((acc, case) => {
    // Expensive calculation
    return acc + calculateCaseComplexity(case)
  }, 0)
})

// Use shallowRef for large objects that don't need deep reactivity
const largeDataset = shallowRef<LargeDataType[]>([])

// Use readonly for data that shouldn't be modified
const readonlyData = readonly(reactiveData)
</script>
```

### Virtual Scrolling

Implement virtual scrolling for large lists:

```vue
<!-- components/common/VirtualList.vue -->
<template>
  <div ref="containerRef" class="virtual-list" @scroll="handleScroll">
    <div class="virtual-list-spacer" :style="{ height: `${totalHeight}px` }">
      <div
        class="virtual-list-items"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="getItemKey(item)"
          class="virtual-list-item"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item" :index="item.index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  items: any[]
  itemHeight: number
  containerHeight: number
  getItemKey: (item: any) => string | number
}

const props = defineProps<Props>()

const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)

const visibleCount = computed(() => 
  Math.ceil(props.containerHeight / props.itemHeight) + 2
)

const startIndex = computed(() => 
  Math.floor(scrollTop.value / props.itemHeight)
)

const endIndex = computed(() => 
  Math.min(startIndex.value + visibleCount.value, props.items.length)
)

const visibleItems = computed(() => 
  props.items.slice(startIndex.value, endIndex.value).map((item, index) => ({
    ...item,
    index: startIndex.value + index
  }))
)

const totalHeight = computed(() => 
  props.items.length * props.itemHeight
)

const offsetY = computed(() => 
  startIndex.value * props.itemHeight
)

const handleScroll = (event: Event) => {
  scrollTop.value = (event.target as HTMLElement).scrollTop
}
</script>
```

This comprehensive component development guide provides the foundation for building high-quality, accessible, and performant Vue components in the Aster Management application. Follow these patterns and practices to ensure consistency and maintainability across the codebase.