# Vue 3 Development Patterns - Aster Management

This guide covers Vue 3 and Nuxt 3 development patterns, best practices, and conventions used in the Aster Management frontend.

## Table of Contents

1. [Composition API Patterns](#composition-api-patterns)
2. [Component Development](#component-development)
3. [Reactivity Patterns](#reactivity-patterns)
4. [Composables Design](#composables-design)
5. [TypeScript Integration](#typescript-integration)
6. [Nuxt 3 Specific Patterns](#nuxt-3-specific-patterns)
7. [Performance Patterns](#performance-patterns)
8. [Error Handling Patterns](#error-handling-patterns)

## Composition API Patterns

### Script Setup Syntax

Use `<script setup>` for all components as the preferred syntax:

```vue
<script setup lang="ts">
// ✅ Preferred approach
import { ref, computed, onMounted } from 'vue'

// Props with TypeScript
interface Props {
  caseId: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// Emits with TypeScript
const emit = defineEmits<{
  save: [case: Case]
  cancel: []
}>()

// Reactive state
const loading = ref(false)
const case = ref<Case | null>(null)

// Computed properties
const isValid = computed(() => {
  return case.value?.title && case.value.title.length > 0
})

// Methods
const handleSave = () => {
  if (isValid.value && case.value) {
    emit('save', case.value)
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    case.value = await fetchCase(props.caseId)
  } finally {
    loading.value = false
  }
})
</script>
```

### Composable Organization

Structure your script setup logically:

```vue
<script setup lang="ts">
// 1. Imports - external libraries first
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 2. Internal imports
import type { Case, CaseStatus } from '~/types/case'
import { useCases } from '~/composables/api/useCases'

// 3. Props and emits
interface Props {
  initialCase?: Partial<Case>
}

const props = defineProps<Props>()
const emit = defineEmits<{ submit: [case: Case] }>()

// 4. Composables
const router = useRouter()
const { createCase, updateCase, isLoading } = useCases()

// 5. Reactive state
const form = ref({
  title: props.initialCase?.title || '',
  description: props.initialCase?.description || '',
  status: props.initialCase?.status || 'draft' as CaseStatus
})

// 6. Computed properties
const isFormValid = computed(() => {
  return form.value.title.length > 0 && form.value.description.length > 0
})

// 7. Watchers
watch(() => props.initialCase, (newCase) => {
  if (newCase) {
    Object.assign(form.value, newCase)
  }
}, { immediate: true })

// 8. Methods
const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  try {
    const case = await createCase(form.value)
    emit('submit', case)
    router.push(`/cases/${case.id}`)
  } catch (error) {
    console.error('Failed to create case:', error)
  }
}

// 9. Lifecycle hooks
onMounted(() => {
  // Component initialization
})
</script>
```

## Component Development

### Component Patterns

#### Base Component Pattern

Create reusable base components with consistent APIs:

```vue
<!-- components/ui/Button.vue -->
<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <LoadingSpinner v-if="loading" class="mr-2" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return [
    baseClasses,
    variantClasses[props.variant],
    sizeClasses[props.size],
    props.disabled && 'opacity-50 cursor-not-allowed'
  ].filter(Boolean).join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
```

#### Compound Component Pattern

Build complex components from simpler ones:

```vue
<!-- components/legal/CaseCard.vue -->
<template>
  <Card class="case-card">
    <CardHeader>
      <CardTitle>{{ case.title }}</CardTitle>
      <CaseStatusBadge :status="case.status" />
    </CardHeader>
    
    <CardContent>
      <p class="text-gray-600 mb-4">{{ case.description }}</p>
      
      <div class="flex items-center justify-between">
        <CaseMetadata :case="case" />
        <CaseActions 
          :case="case" 
          @edit="$emit('edit', case)"
          @delete="$emit('delete', case)"
        />
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Case } from '~/types/case'

interface Props {
  case: Case
}

defineProps<Props>()

defineEmits<{
  edit: [case: Case]
  delete: [case: Case]
}>()
</script>
```

### Props and Events Patterns

#### Props Validation

Always use TypeScript interfaces for props:

```vue
<script setup lang="ts">
// ✅ Good - TypeScript interface
interface Props {
  // Required props
  caseId: string
  
  // Optional props with default values
  readonly?: boolean
  showActions?: boolean
  
  // Complex object props
  case: {
    id: string
    title: string
    status: CaseStatus
  }
  
  // Array props
  tags?: string[]
  
  // Function props
  onSave?: (case: Case) => void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showActions: true,
  tags: () => [],
  onSave: undefined
})

// ❌ Avoid - runtime validation only
const props = defineProps({
  caseId: {
    type: String,
    required: true
  }
})
</script>
```

#### Event Patterns

Use typed events with descriptive names:

```vue
<script setup lang="ts">
// ✅ Good - Typed events with clear names
const emit = defineEmits<{
  'case:created': [case: Case]
  'case:updated': [case: Case, changes: Partial<Case>]
  'case:deleted': [caseId: string]
  'validation:error': [errors: Record<string, string>]
}>()

// Emit events with proper data
const handleSave = (case: Case) => {
  emit('case:created', case)
}

// ❌ Avoid - Generic event names
const emit = defineEmits<{
  save: [data: any]
  update: [data: any]
}>()
</script>
```

## Reactivity Patterns

### Ref vs Reactive

Use `ref` for primitive values and `reactive` for objects:

```typescript
// ✅ Good - ref for primitives
const count = ref(0)
const loading = ref(false)
const message = ref('')

// ✅ Good - reactive for objects
const form = reactive({
  title: '',
  description: '',
  status: 'draft' as CaseStatus
})

// ✅ Good - ref for objects when you need to replace entire object
const case = ref<Case | null>(null)

// Later...
case.value = newCase // This works and triggers reactivity

// ❌ Avoid - reactive for primitives
const count = reactive({ value: 0 }) // Unnecessary wrapper
```

### Computed Properties

Use computed properties for derived state:

```vue
<script setup lang="ts">
const cases = ref<Case[]>([])
const filter = ref('')
const sortBy = ref<'title' | 'date'>('date')

// ✅ Good - Computed for derived data
const filteredCases = computed(() => {
  return cases.value
    .filter(case => 
      case.title.toLowerCase().includes(filter.value.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy.value === 'title') {
        return a.title.localeCompare(b.title)
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
})

const caseCount = computed(() => filteredCases.value.length)

const hasNoCases = computed(() => cases.value.length === 0)

// ❌ Avoid - Computing in template
// <div>{{ cases.filter(c => c.title.includes(filter)).length }}</div>
</script>
```

### Watchers

Use watchers for side effects:

```vue
<script setup lang="ts">
const searchQuery = ref('')
const searchResults = ref<Case[]>([])

// ✅ Good - Watcher for side effects
watch(searchQuery, async (newQuery, oldQuery) => {
  if (newQuery !== oldQuery && newQuery.length > 2) {
    searchResults.value = await searchCases(newQuery)
  }
}, { debounce: 300 })

// ✅ Good - Immediate watcher
watch(() => props.caseId, async (newId) => {
  if (newId) {
    await fetchCase(newId)
  }
}, { immediate: true })

// ✅ Good - Deep watcher for objects
watch(form, (newForm) => {
  localStorage.setItem('draft-case', JSON.stringify(newForm))
}, { deep: true })

// ❌ Avoid - Using watcher for computed data
watch(cases, () => {
  filteredCases.value = cases.value.filter(c => c.status === 'active')
})
// Use computed instead
</script>
```

## Composables Design

### Composable Structure

Create focused, reusable composables:

```typescript
// composables/useCases.ts
export function useCases() {
  // State
  const cases = ref<Case[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Computed
  const activeCases = computed(() => 
    cases.value.filter(c => c.status === 'active')
  )
  
  // Methods
  const fetchCases = async () => {
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch('/api/cases')
      cases.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch cases'
    } finally {
      loading.value = false
    }
  }
  
  const createCase = async (caseData: CreateCaseRequest) => {
    const newCase = await $fetch('/api/cases', {
      method: 'POST',
      body: caseData
    })
    
    cases.value.push(newCase)
    return newCase
  }
  
  // Lifecycle
  onMounted(() => {
    fetchCases()
  })
  
  // Return only what's needed
  return {
    // Readonly state
    cases: readonly(cases),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    activeCases,
    
    // Methods
    fetchCases,
    createCase
  }
}
```

### Composable Parameters

Make composables configurable:

```typescript
// composables/useCase.ts
interface UseCaseOptions {
  immediate?: boolean
  refetchOnWindowFocus?: boolean
}

export function useCase(id: MaybeRef<string>, options: UseCaseOptions = {}) {
  const {
    immediate = true,
    refetchOnWindowFocus = false
  } = options
  
  const caseId = unref(id)
  const case = ref<Case | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const fetchCase = async () => {
    if (!caseId) return
    
    loading.value = true
    error.value = null
    
    try {
      case.value = await $fetch(`/api/cases/${caseId}`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch case'
    } finally {
      loading.value = false
    }
  }
  
  // Watch for ID changes
  watch(() => unref(id), fetchCase, { immediate })
  
  // Optional: Refetch on window focus
  if (refetchOnWindowFocus) {
    useEventListener('focus', fetchCase)
  }
  
  return {
    case: readonly(case),
    loading: readonly(loading),
    error: readonly(error),
    refresh: fetchCase
  }
}

// Usage
const { case, loading, refresh } = useCase(caseId, {
  immediate: false,
  refetchOnWindowFocus: true
})
```

## TypeScript Integration

### Component Props Types

Define clear prop interfaces:

```vue
<script setup lang="ts">
import type { Case, CaseStatus } from '~/types/case'

// ✅ Good - Comprehensive interface
interface Props {
  // Basic types
  title: string
  description?: string
  
  // Union types
  status: CaseStatus
  
  // Object types
  case: Case
  
  // Array types
  tags: string[]
  
  // Function types
  onSave: (case: Case) => void
  
  // Generic types
  items: Array<{ id: string; name: string }>
  
  // Optional with default
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  showActions: true
})

// ✅ Good - Generic component
interface GenericProps<T> {
  items: T[]
  keyField: keyof T
  onSelect: (item: T) => void
}

// Use in component
// defineProps<GenericProps<Case>>()
</script>
```

### Template Refs

Type your template refs properly:

```vue
<template>
  <input ref="inputRef" type="text" />
  <MyComponent ref="componentRef" />
</template>

<script setup lang="ts">
import MyComponent from './MyComponent.vue'

// ✅ Good - Typed template refs
const inputRef = ref<HTMLInputElement>()
const componentRef = ref<InstanceType<typeof MyComponent>>()

onMounted(() => {
  // TypeScript knows the types
  inputRef.value?.focus()
  componentRef.value?.someMethod()
})
</script>
```

### Composable Types

Type your composables thoroughly:

```typescript
// composables/useApi.ts
interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

interface UseApiReturn<T> {
  data: Readonly<Ref<T | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  execute: () => Promise<void>
}

export function useApi<T>(url: string): UseApiReturn<T> {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const execute = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ApiResponse<T>>(url)
      data.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Request failed'
    } finally {
      loading.value = false
    }
  }
  
  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    execute
  }
}
```

## Nuxt 3 Specific Patterns

### Page Definition

Use `definePageMeta` for page configuration:

```vue
<!-- pages/cases/[id].vue -->
<script setup lang="ts">
// Page metadata
definePageMeta({
  title: 'Case Details',
  description: 'View and manage case details',
  middleware: ['auth', 'case-access'],
  layout: 'default',
  keepalive: false
})

// Server-side data fetching
const route = useRoute()
const { data: case } = await $fetch(`/api/cases/${route.params.id}`)

// Client-side head management
useHead({
  title: `${case.title} - Case Details`,
  meta: [
    { name: 'description', content: case.description }
  ]
})
</script>
```

### Auto-imports

Leverage Nuxt's auto-import system:

```vue
<script setup lang="ts">
// ✅ Auto-imported - no need to import
const route = useRoute() // from vue-router
const { $fetch } = useNuxtApp() // from nuxt
const user = useAuthStore() // from your stores

// ✅ Auto-imported composables
const { data } = await useFetch('/api/cases')

// ✅ Auto-imported utilities
const formatted = formatCurrency(amount)
</script>
```

### Server-Side Rendering

Handle SSR properly:

```vue
<script setup lang="ts">
// ✅ Good - SSR-friendly data fetching
const { data: cases } = await useFetch('/api/cases')

// ✅ Good - Client-only code
onMounted(() => {
  // This runs only on client
  startWebSocketConnection()
})

// ✅ Good - Conditional client-side code
if (process.client) {
  // Client-only code
}

// ❌ Avoid - Direct DOM access during SSR
// document.getElementById('my-element') // Will fail on server
</script>
```

## Performance Patterns

### Lazy Loading

Implement lazy loading for better performance:

```vue
<script setup lang="ts">
// ✅ Good - Lazy component loading
const LazyModal = defineAsyncComponent(() => import('~/components/Modal.vue'))

// ✅ Good - Conditional rendering with lazy loading
const showAdvancedFeatures = ref(false)

const AdvancedFeatures = defineAsyncComponent(
  () => import('~/components/AdvancedFeatures.vue')
)
</script>

<template>
  <div>
    <!-- Regular content -->
    <div>Basic features</div>
    
    <!-- Lazy-loaded advanced features -->
    <AdvancedFeatures 
      v-if="showAdvancedFeatures" 
      :key="'advanced'"
    />
  </div>
</template>
```

### Memo and Optimization

Use computed properties and memoization:

```vue
<script setup lang="ts">
// ✅ Good - Memoized expensive computation
const expensiveComputation = computed(() => {
  return cases.value.reduce((acc, case) => {
    // Expensive calculation
    return acc + calculateCaseValue(case)
  }, 0)
})

// ✅ Good - Debounced search
const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 300)

watch(debouncedQuery, async (query) => {
  if (query) {
    await searchCases(query)
  }
})
</script>
```

## Error Handling Patterns

### Component Error Handling

Implement proper error boundaries:

```vue
<!-- components/ErrorBoundary.vue -->
<template>
  <div v-if="error" class="error-boundary">
    <h2>Something went wrong</h2>
    <p>{{ error.message }}</p>
    <Button @click="retry">Try Again</Button>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
const error = ref<Error | null>(null)

const retry = () => {
  error.value = null
}

onErrorCaptured((err) => {
  error.value = err
  return false // Prevent error from propagating
})
</script>
```

### Async Error Handling

Handle async operations gracefully:

```vue
<script setup lang="ts">
const { data, pending, error, refresh } = await useFetch('/api/cases', {
  // ✅ Good - Handle errors
  onResponseError({ response }) {
    if (response.status === 404) {
      throw new Error('Cases not found')
    }
  },
  
  // ✅ Good - Default data
  default: () => [],
  
  // ✅ Good - Retry on failure
  retry: 3,
  retryDelay: 1000
})

// ✅ Good - Error state handling
const handleError = (err: Error) => {
  console.error('Operation failed:', err)
  useToast().error('Something went wrong. Please try again.')
}
</script>

<template>
  <div>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">
      <p>Error: {{ error.message }}</p>
      <Button @click="refresh">Retry</Button>
    </div>
    <div v-else>
      <!-- Success state -->
      <CaseList :cases="data" />
    </div>
  </div>
</template>
```

## Best Practices Summary

### Do's

1. **Use TypeScript**: Type everything for better DX and fewer bugs
2. **Script Setup**: Use `<script setup>` for all components
3. **Composition API**: Leverage composables for reusable logic
4. **Reactive**: Use reactive patterns appropriately
5. **Performance**: Implement lazy loading and memoization
6. **Error Handling**: Handle errors gracefully at all levels

### Don'ts

1. **Avoid Options API**: Don't mix Options API with Composition API
2. **No Direct DOM**: Avoid direct DOM manipulation
3. **No Mutations**: Don't mutate props or readonly state
4. **No Deep Nesting**: Keep component hierarchy reasonable
5. **No Large Components**: Split large components into smaller ones

### Code Quality

- Use ESLint and Prettier for consistent code style
- Write unit tests for composables and utility functions
- Use TypeScript strict mode
- Follow Vue 3 style guide recommendations
- Document complex logic with JSDoc comments

This guide provides a solid foundation for building maintainable, performant Vue 3 applications with Nuxt 3 in the Aster Management project.