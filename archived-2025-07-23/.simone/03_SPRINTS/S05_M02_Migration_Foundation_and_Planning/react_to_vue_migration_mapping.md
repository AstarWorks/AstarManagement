# React to Vue Migration Mapping Guide

## React Hooks → Vue Composition API

### useState → ref/reactive

```tsx
// React
const [count, setCount] = useState(0)
const [user, setUser] = useState({ name: '', email: '' })

// Vue
const count = ref(0)
const user = reactive({ name: '', email: '' })
```

### useEffect → watch/watchEffect/onMounted

```tsx
// React - Component mount
useEffect(() => {
  loadData()
}, [])

// Vue
onMounted(() => {
  loadData()
})

// React - Dependency watching
useEffect(() => {
  console.log(`Count changed to ${count}`)
}, [count])

// Vue
watch(count, (newVal) => {
  console.log(`Count changed to ${newVal}`)
})
```

### useMemo → computed

```tsx
// React
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(count)
}, [count])

// Vue
const expensiveValue = computed(() => {
  return computeExpensiveValue(count.value)
})
```

### useCallback → Function stability not needed in Vue

```tsx
// React
const handleClick = useCallback(() => {
  setCount(c => c + 1)
}, [])

// Vue - Functions are naturally stable
const handleClick = () => {
  count.value++
}
```

### useRef → ref/templateRef

```tsx
// React
const inputRef = useRef<HTMLInputElement>(null)
<input ref={inputRef} />

// Vue
const inputRef = ref<HTMLInputElement>()
<input ref="inputRef" />
```

### useContext → provide/inject

```tsx
// React
const ThemeContext = createContext('light')
const theme = useContext(ThemeContext)

// Vue
// Parent component
provide('theme', 'light')

// Child component
const theme = inject('theme')
```

## Component Patterns

### React.forwardRef → defineComponent with attrs

```tsx
// React
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return <button ref={ref} {...props} />
})

// Vue
const Button = defineComponent({
  inheritAttrs: false,
  setup(props, { attrs }) {
    return () => h('button', attrs)
  }
})
```

### React.memo → No direct equivalent (Vue is reactive by default)

```tsx
// React
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>
})

// Vue - Computed properties and reactive system handle this automatically
// Use v-memo directive for list optimizations if needed
<div v-memo="[data]">{{ data }}</div>
```

### Higher-Order Components → Composables

```tsx
// React HOC
function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { user } = useAuth()
    if (!user) return <Login />
    return <Component {...props} user={user} />
  }
}

// Vue Composable
function useAuth() {
  const user = ref(null)
  // auth logic
  return { user, isAuthenticated: computed(() => !!user.value) }
}
```

### Render Props → Scoped Slots

```tsx
// React
<DataProvider
  render={({ data, loading }) => (
    loading ? <Spinner /> : <DataDisplay data={data} />
  )}
/>

// Vue
<DataProvider v-slot="{ data, loading }">
  <Spinner v-if="loading" />
  <DataDisplay v-else :data="data" />
</DataProvider>
```

## State Management

### Zustand → Pinia

```tsx
// React/Zustand
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// Component
const { count, increment } = useStore()

// Vue/Pinia
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const increment = () => count.value++
  
  return { count, increment }
})

// Component
const store = useCounterStore()
const { count } = storeToRefs(store)
const { increment } = store
```

## Form Handling

### React Hook Form → VeeValidate

```tsx
// React Hook Form + Zod
const schema = z.object({
  email: z.string().email(),
})

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema)
})

// Vue/VeeValidate + Zod
const schema = z.object({
  email: z.string().email(),
})

const { handleSubmit, defineField } = useForm({
  validationSchema: toTypedSchema(schema)
})

const [email, emailAttrs] = defineField('email')
```

## Error Boundaries

### React Error Boundary → Vue errorCaptured

```tsx
// React
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo)
  }
}

// Vue
export default {
  errorCaptured(error, instance, info) {
    console.error(error, info)
    return false // prevents propagation
  }
}
```

## Key Migration Considerations

1. **Reactivity System**: Vue's reactivity is more explicit - need to use `.value` for refs
2. **Template Syntax**: JSX → Vue templates with directives (v-if, v-for, v-model)
3. **Event Handling**: onClick → @click, onChange → @input or v-model
4. **Props**: Similar concept but with different validation syntax
5. **Lifecycle**: Different names but similar concepts
6. **Performance**: Vue's reactivity system eliminates need for useMemo/useCallback in most cases
7. **TypeScript**: Vue 3 has excellent TS support but requires different patterns

## Component Migration Strategy

1. Start with leaf components (no children)
2. Migrate shared UI components first
3. Then migrate feature components
4. Finally migrate layout/container components
5. Update stores in parallel with components
6. Maintain both versions during transition