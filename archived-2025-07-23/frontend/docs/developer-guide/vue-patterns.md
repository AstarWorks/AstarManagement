# Vue 3 Patterns

This guide covers Vue 3 Composition API patterns, best practices, and common patterns used throughout the Aster Management application.

## Composition API Fundamentals

### Script Setup Syntax

We use the `<script setup>` syntax for all components:

```vue
<script setup lang="ts">
// Imports
import { ref, computed, watch } from 'vue'
import type { Matter } from '~/types/matter'

// Props definition
interface Props {
  matter: Matter
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false
})

// Emits definition
const emit = defineEmits<{
  update: [matter: Matter]
  delete: [id: string]
}>()

// Reactive state
const isEditing = ref(false)

// Computed properties
const statusColor = computed(() => {
  return props.matter.status === 'COMPLETED' ? 'green' : 'blue'
})

// Methods
const handleEdit = () => {
  isEditing.value = true
}

// Lifecycle hooks
onMounted(() => {
  console.log('Component mounted')
})
</script>
```

### Reactive State Management

#### ref vs reactive

```typescript
// Use ref for primitives and single values
const count = ref(0)
const name = ref('John')
const isLoading = ref(false)

// Use reactive for objects (but prefer ref for consistency)
const state = reactive({
  user: null,
  permissions: []
})

// Preferred: Use ref even for objects
const user = ref<User | null>(null)
const permissions = ref<Permission[]>([])
```

#### Computed Properties

```typescript
// Basic computed
const fullName = computed(() => 
  `${user.value.firstName} ${user.value.lastName}`
)

// Computed with getter and setter
const selectedMatterIds = computed({
  get: () => matters.value.filter(m => m.selected).map(m => m.id),
  set: (ids: string[]) => {
    matters.value.forEach(m => {
      m.selected = ids.includes(m.id)
    })
  }
})

// Computed with type annotation
const activeMatter = computed<Matter | undefined>(() => 
  matters.value.find(m => m.status === 'ACTIVE')
)
```

#### Watchers

```typescript
// Simple watch
watch(searchQuery, (newQuery) => {
  searchMatters(newQuery)
})

// Watch with options
watch(
  selectedMatter,
  (newMatter, oldMatter) => {
    console.log('Matter changed from', oldMatter, 'to', newMatter)
  },
  {
    immediate: true, // Run immediately
    deep: true // Deep watch objects
  }
)

// Watch multiple sources
watch(
  [() => route.params.id, isAuthenticated],
  ([id, auth]) => {
    if (auth && id) {
      loadMatter(id)
    }
  }
)

// WatchEffect for automatic dependency tracking
watchEffect(() => {
  console.log(`Count is ${count.value}, doubled is ${count.value * 2}`)
})
```

## Component Patterns

### Props and Events

```vue
<script setup lang="ts">
// Comprehensive props definition
interface Props {
  // Required props
  id: string
  title: string
  
  // Optional props with defaults
  status?: MatterStatus
  priority?: MatterPriority
  
  // Complex types
  assignee?: User
  metadata?: Record<string, any>
  
  // Function props
  onValidate?: (value: string) => boolean
}

const props = withDefaults(defineProps<Props>(), {
  status: 'DRAFT',
  priority: 'MEDIUM',
  metadata: () => ({})
})

// Type-safe emits
const emit = defineEmits<{
  // Simple events
  save: []
  cancel: []
  
  // Events with payloads
  update: [updates: Partial<Matter>]
  error: [error: Error]
  
  // Multiple parameters
  change: [field: string, value: any, oldValue: any]
}>()

// Using props and emits
const handleSave = () => {
  if (props.onValidate?.(props.title)) {
    emit('save')
  } else {
    emit('error', new Error('Validation failed'))
  }
}
</script>
```

### Slots and Scoped Slots

```vue
<!-- Parent component -->
<template>
  <DataTable :items="matters">
    <!-- Default slot -->
    <template #header>
      <h2>Legal Matters</h2>
    </template>
    
    <!-- Scoped slot -->
    <template #row="{ item, index }">
      <MatterRow :matter="item" :index="index" />
    </template>
    
    <!-- Named slot with props -->
    <template #footer="{ total }">
      <p>Total matters: {{ total }}</p>
    </template>
  </DataTable>
</template>

<!-- DataTable component -->
<script setup lang="ts" generic="T">
interface Props<T> {
  items: T[]
}

const props = defineProps<Props<T>>()
</script>

<template>
  <div class="data-table">
    <div class="header">
      <slot name="header" />
    </div>
    
    <div class="body">
      <div v-for="(item, index) in items" :key="index">
        <slot name="row" :item="item" :index="index" />
      </div>
    </div>
    
    <div class="footer">
      <slot name="footer" :total="items.length" />
    </div>
  </div>
</template>
```

### Provide/Inject Pattern

```typescript
// Parent component - provide
const theme = ref<'light' | 'dark'>('light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

provide('theme', {
  current: readonly(theme),
  toggle: toggleTheme
})

// Child component - inject
interface ThemeContext {
  current: Readonly<Ref<'light' | 'dark'>>
  toggle: () => void
}

const theme = inject<ThemeContext>('theme')
if (!theme) {
  throw new Error('Theme context not provided')
}
```

### Composable Patterns

#### Basic Composable

```typescript
// composables/useCounter.ts
export const useCounter = (initial = 0) => {
  const count = ref(initial)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initial
  
  return {
    count: readonly(count),
    increment,
    decrement,
    reset
  }
}

// Usage in component
const { count, increment } = useCounter(10)
```

#### Composable with Side Effects

```typescript
// composables/useEventListener.ts
export const useEventListener = (
  target: Ref<EventTarget | null> | EventTarget,
  event: string,
  handler: (e: Event) => void
) => {
  const cleanup = ref<(() => void) | null>(null)
  
  const register = () => {
    const element = unref(target)
    if (!element) return
    
    element.addEventListener(event, handler)
    cleanup.value = () => element.removeEventListener(event, handler)
  }
  
  const unregister = () => {
    cleanup.value?.()
    cleanup.value = null
  }
  
  watchEffect(() => {
    unregister()
    register()
  })
  
  onUnmounted(unregister)
  
  return { unregister }
}
```

#### Async Composable

```typescript
// composables/useAsyncData.ts
export const useAsyncData = <T>(
  key: string,
  fetcher: () => Promise<T>
) => {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)
  
  const execute = async () => {
    loading.value = true
    error.value = null
    
    try {
      data.value = await fetcher()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }
  
  // Auto-fetch on mount
  onMounted(execute)
  
  return {
    data: readonly(data),
    error: readonly(error),
    loading: readonly(loading),
    execute,
    refresh: execute
  }
}
```

## TypeScript Integration

### Component Props Types

```typescript
// Shared prop types
interface BaseProps {
  id: string
  class?: string
  style?: StyleValue
}

// Extending interfaces
interface MatterCardProps extends BaseProps {
  matter: Matter
  editable?: boolean
  onUpdate?: (matter: Matter) => void
}

// Generic components
interface ListProps<T> {
  items: T[]
  keyField?: keyof T
  renderItem: (item: T) => VNode
}
```

### Generic Components

```vue
<script setup lang="ts" generic="T extends { id: string }">
interface Props<T> {
  items: T[]
  selectedId?: string
  onSelect?: (item: T) => void
}

const props = defineProps<Props<T>>()

const selectedItem = computed(() => 
  props.items.find(item => item.id === props.selectedId)
)
</script>
```

### Type-Safe Refs

```typescript
// Template refs
const inputRef = ref<HTMLInputElement>()
const componentRef = ref<InstanceType<typeof MyComponent>>()

// Accessing refs safely
const focusInput = () => {
  inputRef.value?.focus()
}

// Component instance methods
const callComponentMethod = () => {
  componentRef.value?.someMethod()
}
```

## Performance Patterns

### Computed vs Methods

```typescript
// ✅ Use computed for derived state
const filteredMatters = computed(() => 
  matters.value.filter(m => m.status === activeStatus.value)
)

// ❌ Don't use methods for derived state
const getFilteredMatters = () => 
  matters.value.filter(m => m.status === activeStatus.value)

// ✅ Use methods for actions
const submitForm = async () => {
  await api.submitMatter(formData.value)
}
```

### Conditional Rendering

```vue
<template>
  <!-- Use v-show for frequent toggles -->
  <div v-show="isVisible">
    Frequently toggled content
  </div>
  
  <!-- Use v-if for conditional presence -->
  <ExpensiveComponent v-if="shouldRender" />
  
  <!-- Use key for list stability -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
</template>
```

### Lazy Components

```typescript
// Lazy load heavy components
const HeavyChart = defineAsyncComponent({
  loader: () => import('~/components/analytics/HeavyChart.vue'),
  loadingComponent: ChartSkeleton,
  errorComponent: ChartError,
  delay: 200, // Show loading after 200ms
  timeout: 10000 // Timeout after 10s
})
```

## Lifecycle Patterns

### Setup Lifecycle

```typescript
// Lifecycle hooks in setup
onBeforeMount(() => {
  console.log('Before mount')
})

onMounted(() => {
  // DOM is ready
  initializeThirdPartyLibrary()
})

onBeforeUpdate(() => {
  console.log('Before update')
})

onUpdated(() => {
  // DOM has been updated
})

onBeforeUnmount(() => {
  // Cleanup before removal
})

onUnmounted(() => {
  // Component has been removed
  cleanupResources()
})

onErrorCaptured((err, instance, info) => {
  console.error('Error captured:', err)
  // Return false to prevent propagation
  return false
})
```

### Async Setup Pattern

```vue
<script setup>
// For async operations, use top-level await with Suspense
const data = await fetchInitialData()

// Or use immediate async function
const loadData = async () => {
  loading.value = true
  try {
    data.value = await fetchData()
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
```

## Testing Patterns

### Component Testing

```typescript
import { mount } from '@vue/test-utils'
import MatterCard from '~/components/MatterCard.vue'

describe('MatterCard', () => {
  it('renders matter title', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          id: '1',
          title: 'Test Matter',
          status: 'ACTIVE'
        }
      }
    })
    
    expect(wrapper.text()).toContain('Test Matter')
  })
  
  it('emits update event', async () => {
    const wrapper = mount(MatterCard, {
      props: { matter: mockMatter }
    })
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('update')).toBeTruthy()
    expect(wrapper.emitted('update')[0]).toEqual([mockMatter])
  })
})
```

### Composable Testing

```typescript
import { useCounter } from '~/composables/useCounter'

describe('useCounter', () => {
  it('increments count', () => {
    const { count, increment } = useCounter()
    
    expect(count.value).toBe(0)
    increment()
    expect(count.value).toBe(1)
  })
})
```

## Common Pitfalls and Solutions

### Reactivity Loss

```typescript
// ❌ Loses reactivity
const { title, status } = matter.value

// ✅ Maintains reactivity
const title = computed(() => matter.value.title)
const status = computed(() => matter.value.status)

// ✅ Or use toRefs
const { title, status } = toRefs(matter.value)
```

### Memory Leaks

```typescript
// ❌ Potential memory leak
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// ✅ Proper cleanup
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// ✅ Or use composable
useEventListener(window, 'resize', handleResize)
```

### Infinite Loops

```typescript
// ❌ Infinite loop
watch(data, () => {
  data.value = processData(data.value) // Modifies watched value
})

// ✅ Avoid modifying watched values
watch(data, (newData) => {
  processedData.value = processData(newData)
})
```

## Best Practices Summary

1. **Always use TypeScript** for better type safety
2. **Prefer composition API** over options API
3. **Extract logic to composables** for reusability
4. **Use readonly refs** when exposing state
5. **Clean up side effects** in onUnmounted
6. **Avoid inline functions** in templates
7. **Use computed for derived state** instead of methods
8. **Keep components focused** and small
9. **Test components and composables** thoroughly
10. **Document complex logic** with comments