# Component Migration: React to Vue

This guide covers the practical patterns and examples for migrating React components to Vue 3 Single File Components (SFCs) as part of the Aster Management frontend migration.

## Migration Philosophy

The migration from React to Vue follows these core principles:

1. **Preserve Functionality**: Maintain 100% feature parity
2. **Improve Developer Experience**: Leverage Vue's reactive system
3. **Enhance Type Safety**: Better TypeScript integration
4. **Simplify State Management**: Reduce boilerplate code
5. **Maintain Design System**: Keep shadcn styling consistency

## React to Vue Mapping

### 1. Component Structure Transformation

#### React Functional Component
```tsx
// components/MatterCard.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Calendar, User } from 'lucide-react'
import type { Matter } from '@/types/matter'

interface MatterCardProps {
  matter: Matter
  onEdit?: (matter: Matter) => void
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: MatterStatus) => void
  readonly?: boolean
}

export function MatterCard({ 
  matter, 
  onEdit, 
  onDelete, 
  onStatusChange,
  readonly = false 
}: MatterCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    // Side effect logic
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])
  
  const handleStatusChange = async (newStatus: MatterStatus) => {
    setIsLoading(true)
    try {
      await onStatusChange?.(matter.id, newStatus)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="matter-card hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">
            {matter.title}
          </CardTitle>
          {!readonly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Badge variant={matter.status === 'active' ? 'default' : 'secondary'}>
          {matter.status}
        </Badge>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            {matter.dueDate ? formatDate(matter.dueDate) : 'No due date'}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="w-4 h-4 mr-2" />
            {matter.assignee?.name || 'Unassigned'}
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="mt-4 flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onEdit?.(matter)}
            >
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => onDelete?.(matter.id)}
            >
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

#### Vue Single File Component
```vue
<!-- components/MatterCard.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Calendar, User, MoreHorizontal } from 'lucide-vue-next'
import type { Matter, MatterStatus } from '~/types/matter'
import { formatDate } from '~/utils/date'

// Props interface
interface Props {
  matter: Matter
  readonly?: boolean
}

// Emits interface  
interface Emits {
  edit: [matter: Matter]
  delete: [id: string]
  statusChange: [id: string, status: MatterStatus]
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// Reactive state
const isMenuOpen = ref(false)
const isLoading = ref(false)

// Methods
const handleStatusChange = async (newStatus: MatterStatus) => {
  isLoading.value = true
  try {
    emit('statusChange', props.matter.id, newStatus)
  } finally {
    isLoading.value = false
  }
}

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    isMenuOpen.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress)
})
</script>

<template>
  <Card class="matter-card hover:shadow-md transition-shadow">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <CardTitle class="text-lg line-clamp-2">
          {{ matter.title }}
        </CardTitle>
        <Button
          v-if="!readonly"
          variant="ghost"
          size="sm"
          @click="isMenuOpen = !isMenuOpen"
        >
          <MoreHorizontal class="w-4 h-4" />
        </Button>
      </div>
      <Badge :variant="matter.status === 'active' ? 'default' : 'secondary'">
        {{ matter.status }}
      </Badge>
    </CardHeader>
    
    <CardContent>
      <div class="space-y-2">
        <div class="flex items-center text-sm text-muted-foreground">
          <Calendar class="w-4 h-4 mr-2" />
          {{ matter.dueDate ? formatDate(matter.dueDate) : 'No due date' }}
        </div>
        
        <div class="flex items-center text-sm text-muted-foreground">
          <User class="w-4 h-4 mr-2" />
          {{ matter.assignee?.name || 'Unassigned' }}
        </div>
      </div>
      
      <div v-if="isMenuOpen" class="mt-4 flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          @click="emit('edit', matter)"
        >
          Edit
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          @click="emit('delete', matter.id)"
        >
          Delete
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.matter-card {
  /* Component-specific styles if needed */
}
</style>
```

### 2. State Management Migration

#### React useState → Vue ref/reactive

**React Pattern**
```tsx
const [count, setCount] = useState(0)
const [user, setUser] = useState({ name: '', email: '' })
const [items, setItems] = useState<Item[]>([])

// Complex state updates
setUser(prev => ({ ...prev, name: 'John' }))
setItems(prev => [...prev, newItem])
```

**Vue Pattern**
```typescript
const count = ref(0)
const user = reactive({ name: '', email: '' })
const items = ref<Item[]>([])

// Direct mutations (reactive)
user.name = 'John'
items.value.push(newItem)

// Or with ref
const user = ref({ name: '', email: '' })
user.value = { ...user.value, name: 'John' }
```

#### React useEffect → Vue watch/watchEffect

**React Pattern**
```tsx
// Mount effect
useEffect(() => {
  loadData()
}, [])

// Dependency effect
useEffect(() => {
  console.log(`Count: ${count}`)
}, [count])

// Cleanup effect
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1)
  }, 1000)
  
  return () => clearInterval(timer)
}, [])
```

**Vue Pattern**
```typescript
// Mount effect
onMounted(() => {
  loadData()
})

// Dependency watching
watch(count, (newCount) => {
  console.log(`Count: ${newCount}`)
})

// Cleanup with lifecycle
let timer: NodeJS.Timeout

onMounted(() => {
  timer = setInterval(() => {
    count.value++
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

// Or with watchEffect
watchEffect((onCleanup) => {
  const timer = setInterval(() => {
    count.value++
  }, 1000)
  
  onCleanup(() => clearInterval(timer))
})
```

### 3. Props and Events Migration

#### React Props and Callbacks
```tsx
interface ComponentProps {
  title: string
  items: Item[]
  onItemClick: (item: Item) => void
  onSubmit: (data: FormData) => Promise<void>
  className?: string
}

function MyComponent({ title, items, onItemClick, onSubmit, className }: ComponentProps) {
  return (
    <div className={className}>
      <h2>{title}</h2>
      {items.map(item => (
        <button key={item.id} onClick={() => onItemClick(item)}>
          {item.name}
        </button>
      ))}
    </div>
  )
}
```

#### Vue Props and Emits
```vue
<script setup lang="ts">
interface Props {
  title: string
  items: Item[]
  class?: string
}

interface Emits {
  itemClick: [item: Item]
  submit: [data: FormData]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div :class="props.class">
    <h2>{{ title }}</h2>
    <button 
      v-for="item in items" 
      :key="item.id"
      @click="emit('itemClick', item)"
    >
      {{ item.name }}
    </button>
  </div>
</template>
```

### 4. Form Handling Migration

#### React Hook Form → VeeValidate

**React Pattern**
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })
  
  const onSubmit = (data: FormData) => {
    console.log(data)
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input 
        {...register('email')} 
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input 
        {...register('password')} 
        type="password" 
        placeholder="Password"
      />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  )
}
```

**Vue Pattern**
```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

type FormData = z.infer<typeof schema>

const { handleSubmit, defineField, errors } = useForm({
  validationSchema: toTypedSchema(schema)
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit((data: FormData) => {
  console.log(data)
})
</script>

<template>
  <form @submit="onSubmit">
    <input 
      v-model="email"
      v-bind="emailAttrs"
      placeholder="Email"
    />
    <span v-if="errors.email">{{ errors.email }}</span>
    
    <input 
      v-model="password"
      v-bind="passwordAttrs"
      type="password" 
      placeholder="Password"
    />
    <span v-if="errors.password">{{ errors.password }}</span>
    
    <button type="submit">Login</button>
  </form>
</template>
```

### 5. Conditional Rendering and Lists

#### React Patterns
```tsx
function ItemList({ items, loading, error }: Props) {
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!items.length) return <div>No items found</div>
  
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}
          {item.isActive && <Badge>Active</Badge>}
        </li>
      ))}
    </ul>
  )
}
```

#### Vue Patterns
```vue
<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else-if="!items.length">No items found</div>
  <ul v-else>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
      <Badge v-if="item.isActive">Active</Badge>
    </li>
  </ul>
</template>
```

### 6. Component Composition Patterns

#### React Higher-Order Components → Vue Composables

**React HOC Pattern**
```tsx
function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { user, isLoading } = useAuth()
    
    if (isLoading) return <div>Loading...</div>
    if (!user) return <Login />
    
    return <Component {...props} user={user} />
  }
}

const ProtectedDashboard = withAuth(Dashboard)
```

**Vue Composable Pattern**
```typescript
// composables/useAuth.ts
export function useAuth() {
  const user = ref<User | null>(null)
  const isLoading = ref(true)
  
  const checkAuth = async () => {
    // Auth logic
  }
  
  onMounted(checkAuth)
  
  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    checkAuth
  }
}
```

```vue
<!-- Dashboard.vue -->
<script setup lang="ts">
const { user, isLoading } = useAuth()

// Redirect if not authenticated
watch([user, isLoading], ([user, loading]) => {
  if (!loading && !user) {
    navigateTo('/login')
  }
})
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <Login v-else-if="!user" />
  <div v-else>
    <!-- Dashboard content -->
    Welcome, {{ user.name }}!
  </div>
</template>
```

#### React Render Props → Vue Scoped Slots

**React Pattern**
```tsx
interface DataProviderProps {
  children: (data: { items: Item[], loading: boolean, error?: string }) => React.ReactNode
}

function DataProvider({ children }: DataProviderProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  
  useEffect(() => {
    fetchItems().then(setItems).catch(setError).finally(() => setLoading(false))
  }, [])
  
  return <>{children({ items, loading, error })}</>
}

// Usage
<DataProvider>
  {({ items, loading, error }) => (
    loading ? <Spinner /> : 
    error ? <ErrorMessage error={error} /> :
    <ItemList items={items} />
  )}
</DataProvider>
```

**Vue Pattern**
```vue
<!-- DataProvider.vue -->
<script setup lang="ts">
const items = ref<Item[]>([])
const loading = ref(true)
const error = ref<string>()

onMounted(async () => {
  try {
    items.value = await fetchItems()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <slot 
    :items="items" 
    :loading="loading" 
    :error="error"
  />
</template>
```

```vue
<!-- Usage -->
<template>
  <DataProvider v-slot="{ items, loading, error }">
    <Spinner v-if="loading" />
    <ErrorMessage v-else-if="error" :error="error" />
    <ItemList v-else :items="items" />
  </DataProvider>
</template>
```

## Advanced Migration Patterns

### 1. Context API → Provide/Inject

**React Context**
```tsx
const ThemeContext = createContext<{ theme: 'light' | 'dark', toggle: () => void }>()

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

**Vue Provide/Inject**
```typescript
// composables/useTheme.ts
const ThemeKey = Symbol('theme') as InjectionKey<{
  theme: Ref<'light' | 'dark'>
  toggle: () => void
}>

export function provideTheme() {
  const theme = ref<'light' | 'dark'>('light')
  
  const toggle = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  
  const themeContext = { theme, toggle }
  provide(ThemeKey, themeContext)
  
  return themeContext
}

export function useTheme() {
  const context = inject(ThemeKey)
  if (!context) {
    throw new Error('useTheme must be used within a theme provider')
  }
  return context
}
```

### 2. Error Boundaries → Vue Error Handling

**React Error Boundary**
```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>
    }
    
    return this.props.children
  }
}
```

**Vue Error Handling**
```vue
<!-- ErrorBoundary.vue -->
<script setup lang="ts">
const hasError = ref(false)
const error = ref<Error | null>(null)

// Global error handler
const app = getCurrentInstance()?.appContext.app
app?.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err, info)
  hasError.value = true
  error.value = err as Error
}

// Component error capture
const onErrorCaptured = (err: Error, instance: any, info: string) => {
  console.error('Component error:', err, info)
  hasError.value = true
  error.value = err
  return false // Prevent propagation
}

// Register error handler
onErrorCaptured(onErrorCaptured)
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <h2>Something went wrong</h2>
    <details v-if="error">
      <summary>Error details</summary>
      <pre>{{ error.message }}</pre>
    </details>
  </div>
  <slot v-else />
</template>
```

## Migration Checklist

When migrating a React component to Vue:

### Pre-Migration
- [ ] Analyze component dependencies
- [ ] Identify state management patterns
- [ ] Document props and callback interfaces
- [ ] Note any React-specific patterns (HOCs, render props)
- [ ] Check for external library dependencies

### During Migration
- [ ] Convert component structure to SFC
- [ ] Migrate useState to ref/reactive
- [ ] Convert useEffect to appropriate Vue lifecycle/watchers
- [ ] Transform props to defineProps
- [ ] Convert callbacks to defineEmits
- [ ] Update event handling syntax
- [ ] Migrate conditional rendering to Vue directives
- [ ] Convert list rendering to v-for
- [ ] Update styling (if needed)

### Post-Migration
- [ ] Test component functionality
- [ ] Verify TypeScript types
- [ ] Check accessibility features
- [ ] Update parent component usage
- [ ] Add to Storybook (if applicable)
- [ ] Update tests
- [ ] Document any breaking changes

## Common Gotchas

### 1. Reactivity Pitfalls
```typescript
// ❌ Wrong - loses reactivity
const { count, increment } = useCountStore()

// ✅ Correct - maintains reactivity
const store = useCountStore()
const { count } = storeToRefs(store)
const { increment } = store
```

### 2. Ref Access in Templates
```vue
<script setup>
const count = ref(0)
</script>

<template>
  <!-- ✅ Correct - auto-unwrapped in template -->
  <div>{{ count }}</div>
  
  <!-- ❌ Wrong - don't use .value in template -->
  <div>{{ count.value }}</div>
</template>
```

### 3. Event Handling Differences
```vue
<template>
  <!-- React: onClick={() => handleClick(item)} -->
  <!-- Vue: @click="() => handleClick(item)" or @click="handleClick(item)" -->
  <button @click="handleClick(item)">Click me</button>
  
  <!-- For preventing default and stopping propagation -->
  <form @submit.prevent="handleSubmit">
    <button @click.stop="handleClick">Click me</button>
  </form>
</template>
```

### 4. TypeScript Integration
```vue
<script setup lang="ts">
// ✅ Correct - proper typing
interface Props {
  items: Item[]
}

const props = defineProps<Props>()

// ❌ Wrong - missing type annotation
const items = ref([])

// ✅ Correct - with type annotation
const items = ref<Item[]>([])
</script>
```

## Performance Considerations

### Vue Advantages
1. **Reactive System**: More efficient updates than React's reconciliation
2. **Compiler Optimizations**: Vue's compiler provides better optimizations
3. **Smaller Bundle**: Vue 3 has a smaller runtime footprint
4. **Built-in Optimizations**: No need for useMemo/useCallback equivalents

### Migration Tips
1. **Remove React Optimizations**: Most React performance patterns are unnecessary in Vue
2. **Leverage Vue's Reactivity**: Use computed properties instead of manual optimizations
3. **Component Splitting**: Use defineAsyncComponent for code splitting
4. **v-memo**: Use sparingly for expensive list items

## Conclusion

The migration from React to Vue 3 components generally results in:
- **Less boilerplate code**
- **More intuitive reactivity**
- **Better TypeScript integration**
- **Improved developer experience**
- **Comparable or better performance**

The Vue 3 Composition API provides a familiar experience for React developers while offering more powerful reactivity and composition patterns.