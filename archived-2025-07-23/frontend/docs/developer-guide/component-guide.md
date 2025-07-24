# Component Development Guide

This guide covers best practices for developing Vue components in the Aster Management application, including design patterns, styling approaches, and component architecture.

## Component Philosophy

### Single Responsibility Principle

Each component should have one clear purpose:

```vue
<!-- ✅ Good: Focused component -->
<MatterCard :matter="matter" @click="selectMatter" />

<!-- ❌ Bad: Component doing too much -->
<MatterCardWithFormAndModalAndAPICall ... />
```

### Composition Over Configuration

Build complex UIs by composing simple components:

```vue
<!-- Composed from smaller components -->
<template>
  <Card>
    <CardHeader>
      <MatterTitle :matter="matter" />
      <MatterStatus :status="matter.status" />
    </CardHeader>
    <CardContent>
      <MatterDetails :matter="matter" />
    </CardContent>
    <CardFooter>
      <MatterActions :matter="matter" @edit="onEdit" />
    </CardFooter>
  </Card>
</template>
```

## Component Structure

### Standard Component Template

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { Matter } from '~/types/matter'

// 2. Props interface
interface Props {
  matter: Matter
  loading?: boolean
  editable?: boolean
}

// 3. Props definition with defaults
const props = withDefaults(defineProps<Props>(), {
  loading: false,
  editable: true
})

// 4. Emits interface
const emit = defineEmits<{
  update: [matter: Partial<Matter>]
  delete: [id: string]
  select: []
}>()

// 5. Composables and stores
const { user } = useAuth()
const { t } = useI18n()
const toast = useToast()

// 6. Template refs
const cardRef = ref<HTMLDivElement>()

// 7. Reactive data
const isExpanded = ref(false)
const localEdits = ref<Partial<Matter>>({})

// 8. Computed properties
const canEdit = computed(() => 
  props.editable && user.value?.role === 'lawyer'
)

const displayTitle = computed(() => 
  localEdits.value.title || props.matter.title
)

// 9. Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const handleUpdate = async () => {
  try {
    emit('update', localEdits.value)
    toast.success(t('matter.updated'))
  } catch (error) {
    toast.error(t('matter.updateError'))
  }
}

// 10. Watchers
watch(() => props.matter, (newMatter) => {
  localEdits.value = {}
})

// 11. Lifecycle
onMounted(() => {
  // Component initialization
})

// 12. Expose public API (if needed)
defineExpose({
  focus: () => cardRef.value?.focus()
})
</script>

<template>
  <div 
    ref="cardRef"
    class="matter-card"
    :class="{
      'matter-card--expanded': isExpanded,
      'matter-card--loading': loading
    }"
    @click="emit('select')"
  >
    <!-- Template content -->
  </div>
</template>

<style scoped>
/* Component styles */
</style>
```

## Component Types

### Presentational Components

Pure UI components with no business logic:

```vue
<!-- Button.vue -->
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    :class="[
      'btn',
      `btn--${variant}`,
      `btn--${size}`
    ]"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
  >
    <Spinner v-if="loading" />
    <slot v-else />
  </button>
</template>
```

### Container Components

Components that manage state and business logic:

```vue
<!-- MatterListContainer.vue -->
<script setup lang="ts">
const { data: matters, isLoading, error } = useMattersQuery()
const { deleteMatter } = useMatterMutations()

const handleDelete = async (id: string) => {
  if (confirm('Delete this matter?')) {
    await deleteMatter.mutateAsync(id)
  }
}
</script>

<template>
  <div class="matter-list-container">
    <LoadingSpinner v-if="isLoading" />
    <ErrorMessage v-else-if="error" :error="error" />
    <MatterList 
      v-else 
      :matters="matters" 
      @delete="handleDelete"
    />
  </div>
</template>
```

### Layout Components

Components that define page structure:

```vue
<!-- DashboardLayout.vue -->
<script setup lang="ts">
const { isSidebarOpen } = storeToRefs(useUIStore())
</script>

<template>
  <div class="dashboard-layout">
    <AppSidebar :open="isSidebarOpen" />
    <main class="dashboard-content">
      <slot name="header" />
      <div class="dashboard-body">
        <slot />
      </div>
      <slot name="footer" />
    </main>
  </div>
</template>
```

### Form Components

Integrated with VeeValidate and Zod:

```vue
<!-- MatterForm.vue -->
<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  description: z.string().optional()
})

const { handleSubmit, defineField, errors } = useForm({
  validationSchema: toTypedSchema(schema)
})

const [title, titleAttrs] = defineField('title')
const [priority, priorityAttrs] = defineField('priority')
const [description, descriptionAttrs] = defineField('description')

const onSubmit = handleSubmit(async (values) => {
  // Handle form submission
})
</script>

<template>
  <form @submit="onSubmit">
    <FormField>
      <FormLabel>Title</FormLabel>
      <FormControl>
        <Input v-model="title" v-bind="titleAttrs" />
      </FormControl>
      <FormMessage v-if="errors.title">{{ errors.title }}</FormMessage>
    </FormField>
    <!-- More fields... -->
  </form>
</template>
```

## Component Patterns

### Compound Components

Related components that work together:

```vue
<!-- Tabs compound component -->
<Tabs v-model="activeTab">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="documents">Documents</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  
  <TabsContent value="details">
    <MatterDetails :matter="matter" />
  </TabsContent>
  
  <TabsContent value="documents">
    <MatterDocuments :matter-id="matter.id" />
  </TabsContent>
  
  <TabsContent value="history">
    <MatterHistory :matter-id="matter.id" />
  </TabsContent>
</Tabs>
```

### Renderless Components

Components that provide functionality without UI:

```vue
<!-- MouseTracker.vue -->
<script setup lang="ts">
const x = ref(0)
const y = ref(0)

const update = (event: MouseEvent) => {
  x.value = event.pageX
  y.value = event.pageY
}

onMounted(() => {
  window.addEventListener('mousemove', update)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', update)
})
</script>

<template>
  <slot :x="x" :y="y" />
</template>

<!-- Usage -->
<MouseTracker v-slot="{ x, y }">
  <div>Mouse position: {{ x }}, {{ y }}</div>
</MouseTracker>
```

### Higher-Order Components

Components that enhance other components:

```typescript
// withAuth.ts
export const withAuth = <T extends {}>(
  Component: DefineComponent<T>
): DefineComponent<T> => {
  return defineComponent({
    name: `WithAuth(${Component.name})`,
    setup(props, { slots }) {
      const { isAuthenticated } = useAuth()
      
      return () => {
        if (!isAuthenticated.value) {
          return h('div', 'Please login to view this content')
        }
        
        return h(Component, props, slots)
      }
    }
  })
}
```

## Styling Components

### Scoped Styles

Use scoped styles to prevent CSS leakage:

```vue
<style scoped>
/* Styles only apply to this component */
.matter-card {
  padding: 1rem;
  border: 1px solid var(--border-color);
}

/* Deep selectors for child components */
:deep(.child-class) {
  color: blue;
}
</style>
```

### CSS Modules

For more control over class names:

```vue
<style module>
.card {
  padding: 1rem;
}

.title {
  font-size: 1.5rem;
}
</style>

<template>
  <div :class="$style.card">
    <h2 :class="$style.title">{{ title }}</h2>
  </div>
</template>
```

### Tailwind CSS Integration

Using Tailwind with component classes:

```vue
<template>
  <div class="matter-card">
    <h3 class="matter-card__title">{{ title }}</h3>
    <p class="matter-card__description">{{ description }}</p>
  </div>
</template>

<style scoped>
.matter-card {
  @apply bg-white rounded-lg shadow-md p-4;
}

.matter-card__title {
  @apply text-lg font-semibold text-gray-900 mb-2;
}

.matter-card__description {
  @apply text-sm text-gray-600;
}
</style>
```

### Dynamic Styles

```vue
<script setup>
const primaryColor = computed(() => `hsl(var(--primary))`)

const dynamicStyles = computed(() => ({
  backgroundColor: props.highlight ? primaryColor.value : 'transparent',
  transform: `translateX(${props.offset}px)`
}))
</script>

<template>
  <div :style="dynamicStyles">
    <!-- Content -->
  </div>
</template>
```

## Component Communication

### Props Down, Events Up

```vue
<!-- Parent -->
<template>
  <MatterCard 
    :matter="matter"
    :editable="canEdit"
    @update="handleUpdate"
    @delete="handleDelete"
  />
</template>

<!-- Child (MatterCard.vue) -->
<script setup>
const props = defineProps<{
  matter: Matter
  editable: boolean
}>()

const emit = defineEmits<{
  update: [updates: Partial<Matter>]
  delete: []
}>()

// Emit events instead of mutating props
const updateTitle = (title: string) => {
  emit('update', { title })
}
</script>
```

### Using Provide/Inject

For deeply nested component communication:

```typescript
// Parent component
const formContext = {
  values: reactive({}),
  errors: reactive({}),
  setFieldValue: (field: string, value: any) => {
    formContext.values[field] = value
  }
}

provide('form', formContext)

// Deep child component
const form = inject<FormContext>('form')
if (!form) {
  throw new Error('FormInput must be used within a Form')
}
```

### Event Bus Pattern (Avoid)

```typescript
// ❌ Avoid global event bus
// Use stores or provide/inject instead

// ✅ Use store for global state
const notificationStore = useNotificationStore()
notificationStore.add({ message: 'Success!' })
```

## Performance Optimization

### Memoization

```vue
<script setup>
// Memoize expensive computations
const expensiveList = computed(() => 
  useMemo(() => 
    props.items
      .filter(item => item.active)
      .sort((a, b) => b.priority - a.priority)
      .map(item => ({
        ...item,
        formattedDate: formatDate(item.date)
      }))
  )
)
</script>
```

### List Rendering Optimization

```vue
<template>
  <!-- Use :key for list stability -->
  <TransitionGroup name="list" tag="ul">
    <li 
      v-for="item in items" 
      :key="item.id"
      v-memo="[item.id, item.updatedAt]"
    >
      <MatterCard :matter="item" />
    </li>
  </TransitionGroup>
</template>
```

### Conditional Component Loading

```vue
<script setup>
// Load heavy component only when needed
const showAnalytics = ref(false)
const AnalyticsPanel = defineAsyncComponent(() => 
  import('./AnalyticsPanel.vue')
)
</script>

<template>
  <button @click="showAnalytics = true">
    Show Analytics
  </button>
  
  <Suspense v-if="showAnalytics">
    <template #default>
      <AnalyticsPanel />
    </template>
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
```

## Testing Components

### Unit Testing

```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MatterCard from './MatterCard.vue'

describe('MatterCard', () => {
  const mockMatter = {
    id: '1',
    title: 'Test Matter',
    status: 'ACTIVE'
  }
  
  it('renders matter information', () => {
    const wrapper = mount(MatterCard, {
      props: { matter: mockMatter }
    })
    
    expect(wrapper.text()).toContain('Test Matter')
    expect(wrapper.find('[data-testid="status"]').text()).toBe('ACTIVE')
  })
  
  it('emits update event with changes', async () => {
    const wrapper = mount(MatterCard, {
      props: { 
        matter: mockMatter,
        editable: true 
      }
    })
    
    await wrapper.find('input').setValue('New Title')
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.emitted('update')).toBeTruthy()
    expect(wrapper.emitted('update')[0][0]).toEqual({
      title: 'New Title'
    })
  })
})
```

### Component Snapshot Testing

```typescript
it('matches snapshot', () => {
  const wrapper = mount(MatterCard, {
    props: { matter: mockMatter }
  })
  
  expect(wrapper.html()).toMatchSnapshot()
})
```

## Component Documentation

### Using Storybook

```typescript
// MatterCard.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import MatterCard from './MatterCard.vue'

const meta: Meta<typeof MatterCard> = {
  title: 'Components/MatterCard',
  component: MatterCard,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['DRAFT', 'ACTIVE', 'COMPLETED']
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    matter: {
      id: '1',
      title: 'Contract Review',
      status: 'ACTIVE',
      priority: 'HIGH'
    }
  }
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true
  }
}
```

### Component Comments

```vue
<script setup lang="ts">
/**
 * MatterCard Component
 * 
 * Displays a single legal matter in a card format.
 * Supports editing, deletion, and status updates.
 * 
 * @example
 * <MatterCard 
 *   :matter="matter" 
 *   editable
 *   @update="handleUpdate"
 * />
 */

// Component implementation...
</script>
```

## Accessibility

### ARIA Attributes

```vue
<template>
  <div
    role="article"
    :aria-label="`Legal matter: ${matter.title}`"
    :aria-busy="loading"
  >
    <h3 :id="`matter-${matter.id}-title`">
      {{ matter.title }}
    </h3>
    
    <button
      :aria-label="`Edit ${matter.title}`"
      :aria-describedby="`matter-${matter.id}-title`"
      @click="edit"
    >
      <EditIcon aria-hidden="true" />
      <span class="sr-only">Edit</span>
    </button>
  </div>
</template>
```

### Keyboard Navigation

```vue
<script setup>
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      toggle()
      break
    case 'Escape':
      close()
      break
  }
}
</script>

<template>
  <div
    tabindex="0"
    role="button"
    @keydown="handleKeydown"
    @click="toggle"
  >
    <!-- Interactive content -->
  </div>
</template>
```

## Best Practices

1. **Keep components small** - Under 200 lines ideally
2. **Single responsibility** - One component, one job
3. **Props validation** - Always define prop types
4. **Emit events** - Don't mutate props
5. **Use composition API** - Better TypeScript support
6. **Test thoroughly** - Unit and integration tests
7. **Document complex logic** - Help future developers
8. **Optimize performance** - Lazy load when needed
9. **Ensure accessibility** - ARIA labels and keyboard support
10. **Follow naming conventions** - Consistent across project