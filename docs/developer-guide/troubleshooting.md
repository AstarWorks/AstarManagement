# Troubleshooting Guide - Aster Management

This guide covers common issues, debugging strategies, and solutions for the Nuxt.js frontend application.

## Table of Contents

1. [Development Environment Issues](#development-environment-issues)
2. [Build and Deployment Issues](#build-and-deployment-issues)
3. [Runtime Errors](#runtime-errors)
4. [Performance Issues](#performance-issues)
5. [State Management Issues](#state-management-issues)
6. [Component and UI Issues](#component-and-ui-issues)
7. [Debugging Strategies](#debugging-strategies)
8. [Common Error Messages](#common-error-messages)

## Development Environment Issues

### Bun Installation Problems

#### Issue: `bun: command not found`

**Symptoms:**
```bash
$ bun dev
bun: command not found
```

**Solutions:**

1. **Install Bun:**
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Restart terminal after installation
```

2. **Check PATH:**
```bash
echo $PATH
# Should include ~/.bun/bin

# Add to shell profile if missing
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
# or ~/.zshrc for zsh
```

3. **Verify installation:**
```bash
bun --version
# Should show version number
```

#### Issue: Slow dependency installation

**Symptoms:**
- `bun install` takes longer than expected
- Network timeouts during installation

**Solutions:**

1. **Clear Bun cache:**
```bash
bun pm cache rm
```

2. **Use different registry:**
```bash
bun install --registry https://registry.npmjs.org/
```

3. **Check network connection:**
```bash
# Test connectivity
curl -I https://registry.npmjs.org/

# Use proxy if needed
export https_proxy=http://proxy.company.com:8080
```

### Node.js Version Issues

#### Issue: Node.js version compatibility

**Symptoms:**
```bash
error: The engine "node" is incompatible with this module
```

**Solutions:**

1. **Check required version in package.json:**
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

2. **Use Node Version Manager:**
```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use correct Node version
nvm install 18
nvm use 18
```

3. **Update Node.js directly:**
```bash
# Download from https://nodejs.org/
# Or use package manager
brew install node@18  # macOS
```

### Port Already in Use

#### Issue: Development server port conflict

**Symptoms:**
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Find and kill process:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port
bun dev --port 3001
```

2. **Use environment variable:**
```bash
PORT=3001 bun dev
```

## Build and Deployment Issues

### TypeScript Compilation Errors

#### Issue: Type checking failures during build

**Symptoms:**
```bash
error TS2304: Cannot find name 'process'
error TS2307: Cannot find module '~/types/case'
```

**Solutions:**

1. **Check TypeScript configuration:**
```json
// tsconfig.json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "types": ["node"]
  }
}
```

2. **Fix import paths:**
```typescript
// ✅ Correct
import type { Case } from '~/types/case'
import { useFetch } from '#app'

// ❌ Incorrect
import type { Case } from '../types/case'
import { useFetch } from '@nuxt/kit'
```

3. **Install missing type definitions:**
```bash
bun add -D @types/node
```

### Build Size Issues

#### Issue: Bundle size too large

**Symptoms:**
```bash
Warning: asset size limit exceeded
chunk main.js is 2.5 MB
```

**Solutions:**

1. **Analyze bundle:**
```bash
bun build --analyze
# or
npx nuxi analyze
```

2. **Implement code splitting:**
```typescript
// Use dynamic imports
const LazyComponent = defineAsyncComponent(() => import('~/components/Heavy.vue'))

// Split routes
export default defineNuxtConfig({
  nitro: {
    experimental: {
      wasm: true
    }
  }
})
```

3. **Remove unused dependencies:**
```bash
# Check for unused dependencies
npx depcheck

# Remove unused packages
bun remove unused-package
```

### Environment Variables Not Working

#### Issue: Environment variables undefined in client

**Symptoms:**
```javascript
console.log(process.env.API_URL) // undefined in browser
```

**Solutions:**

1. **Use NUXT_PUBLIC_ prefix:**
```bash
# .env
NUXT_PUBLIC_API_URL=http://localhost:8080/api
NUXT_SECRET_KEY=secret-only-on-server
```

2. **Access via runtimeConfig:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    secretKey: process.env.NUXT_SECRET_KEY,
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL
    }
  }
})

// In component
const config = useRuntimeConfig()
console.log(config.public.apiUrl) // Available on client
console.log(config.secretKey) // Only available on server
```

## Runtime Errors

### Hydration Mismatches

#### Issue: Hydration mismatch warnings

**Symptoms:**
```bash
[Vue warn]: Hydration node mismatch
[Vue warn]: Hydration text content mismatch
```

**Solutions:**

1. **Identify client-only code:**
```vue
<template>
  <div>
    <!-- Use ClientOnly for browser-specific content -->
    <ClientOnly>
      <div>Current time: {{ new Date().toLocaleString() }}</div>
      <template #fallback>
        <div>Loading...</div>
      </template>
    </ClientOnly>
  </div>
</template>
```

2. **Fix SSR/client differences:**
```typescript
// ✅ Correct - consistent on server and client
const isLoggedIn = computed(() => !!authStore.token)

// ❌ Incorrect - different on server and client
const isLoggedIn = computed(() => !!localStorage.getItem('token'))
```

3. **Use process.client guard:**
```typescript
const userAgent = ref('')

onMounted(() => {
  if (process.client) {
    userAgent.value = navigator.userAgent
  }
})
```

### API Request Failures

#### Issue: Network requests failing

**Symptoms:**
```bash
Failed to fetch
CORS error
401 Unauthorized
```

**Solutions:**

1. **Check API configuration:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080/api'
    }
  }
})
```

2. **Handle CORS issues:**
```typescript
// server/api/proxy/[...path].ts
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const config = useRuntimeConfig()
  
  return $fetch(`${config.public.apiBase}/${path}`, {
    headers: getHeaders(event)
  })
})
```

3. **Add error handling:**
```typescript
const { data, error } = await $fetch('/api/cases', {
  onResponseError({ response }) {
    if (response.status === 401) {
      await navigateTo('/auth/login')
    }
  }
})
```

### Component Not Updating

#### Issue: Reactive data not triggering updates

**Symptoms:**
- Component doesn't re-render when data changes
- Computed properties not updating

**Solutions:**

1. **Check reactivity:**
```typescript
// ✅ Correct - reactive
const cases = ref([])
const selectedCase = ref(null)

// ❌ Incorrect - not reactive
let cases = []
let selectedCase = null
```

2. **Ensure proper mutations:**
```typescript
// ✅ Correct - triggers reactivity
cases.value.push(newCase)
cases.value = [...cases.value, newCase]

// ❌ Incorrect - doesn't trigger reactivity
cases.value.length = 0 // Use cases.value = [] instead
```

3. **Use nextTick for DOM updates:**
```typescript
import { nextTick } from 'vue'

const updateAndScroll = async () => {
  data.value = newData
  await nextTick()
  scrollToBottom()
}
```

## Performance Issues

### Slow Page Loading

#### Issue: Initial page load is slow

**Symptoms:**
- Long Time to First Byte (TTFB)
- Slow Time to Interactive (TTI)

**Solutions:**

1. **Optimize critical render path:**
```vue
<template>
  <div>
    <!-- Critical content first -->
    <Header />
    <main>
      <!-- Above-the-fold content -->
      <CriticalContent />
      
      <!-- Lazy load below-the-fold -->
      <LazyWrapper>
        <HeavyComponent />
      </LazyWrapper>
    </main>
  </div>
</template>
```

2. **Implement proper caching:**
```typescript
// composables/useCache.ts
export function useCache<T>(key: string, fetcher: () => Promise<T>) {
  return useLazyAsyncData(key, fetcher, {
    server: true,
    default: () => null,
    transform: (data) => data,
    getCachedData(key) {
      return nuxtApp.ssrContext?.cache?.[key] ?? nuxtApp.payload.data[key]
    }
  })
}
```

3. **Optimize images:**
```vue
<template>
  <NuxtImg
    src="/images/hero.jpg"
    alt="Hero image"
    width="1200"
    height="600"
    loading="lazy"
    format="webp"
    quality="80"
  />
</template>
```

### Memory Leaks

#### Issue: Memory usage increases over time

**Symptoms:**
- Browser becomes sluggish
- Page crashes after extended use

**Solutions:**

1. **Clean up event listeners:**
```typescript
onMounted(() => {
  const handleResize = () => {
    // Handle resize
  }
  
  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})
```

2. **Clear timers and intervals:**
```typescript
const intervalId = ref<NodeJS.Timeout>()

onMounted(() => {
  intervalId.value = setInterval(() => {
    // Do something periodically
  }, 1000)
})

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})
```

3. **Unsubscribe from stores:**
```typescript
const unsubscribe = ref<() => void>()

onMounted(() => {
  const store = useMyStore()
  unsubscribe.value = store.$subscribe(() => {
    // Handle store changes
  })
})

onUnmounted(() => {
  unsubscribe.value?.()
})
```

## State Management Issues

### Pinia Store Not Persisting

#### Issue: Store state resets on page refresh

**Symptoms:**
- User authentication lost on refresh
- Form data disappears

**Solutions:**

1. **Implement persistence:**
```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  
  // Hydrate from cookie
  const hydrate = () => {
    const authCookie = useCookie('auth-token')
    if (authCookie.value) {
      token.value = authCookie.value
    }
  }
  
  // Persist to cookie
  const setToken = (newToken: string) => {
    token.value = newToken
    const authCookie = useCookie('auth-token', {
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    authCookie.value = newToken
  }
  
  return { token, hydrate, setToken }
})
```

2. **Use localStorage for non-sensitive data:**
```typescript
// composables/useLocalStorage.ts
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const value = ref<T>(defaultValue)
  
  onMounted(() => {
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        value.value = JSON.parse(stored)
      } catch (error) {
        console.warn('Failed to parse stored value:', error)
      }
    }
  })
  
  watch(value, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  }, { deep: true })
  
  return value
}
```

### TanStack Query Cache Issues

#### Issue: Stale data or cache not updating

**Symptoms:**
- UI shows outdated information
- New data not appearing after mutation

**Solutions:**

1. **Configure cache properly:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  }
})
```

2. **Invalidate cache after mutations:**
```typescript
const updateCase = useMutation({
  mutationFn: updateCaseApi,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['cases'] })
    queryClient.invalidateQueries({ queryKey: ['cases', caseId] })
  }
})
```

3. **Use optimistic updates:**
```typescript
const updateCase = useMutation({
  mutationFn: updateCaseApi,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ['cases', variables.id] })
    const previousData = queryClient.getQueryData(['cases', variables.id])
    
    queryClient.setQueryData(['cases', variables.id], {
      ...previousData,
      ...variables
    })
    
    return { previousData }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['cases', variables.id], context?.previousData)
  }
})
```

## Component and UI Issues

### Styling Not Applied

#### Issue: CSS classes not working

**Symptoms:**
- Components look unstyled
- Tailwind classes not applied

**Solutions:**

1. **Check Tailwind configuration:**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}"
  ]
}
```

2. **Verify CSS imports:**
```css
/* assets/css/main.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

3. **Check scoped styles:**
```vue
<style scoped>
/* Scoped styles only apply to this component */
.my-class {
  color: red;
}
</style>

<style>
/* Global styles */
.global-class {
  color: blue;
}
</style>
```

### Component Props Not Updating

#### Issue: Child component doesn't react to prop changes

**Symptoms:**
- Component shows initial prop value only
- Changes in parent don't update child

**Solutions:**

1. **Ensure reactive props:**
```vue
<!-- Parent -->
<template>
  <ChildComponent :data="reactiveData" />
</template>

<script setup>
const reactiveData = ref({ value: 'initial' })

// This will trigger child update
reactiveData.value = { value: 'updated' }
</script>
```

2. **Use computed for derived props:**
```vue
<!-- Child -->
<script setup>
interface Props {
  data: { value: string }
}

const props = defineProps<Props>()

// ✅ Correct - reactive to prop changes
const processedData = computed(() => {
  return props.data.value.toUpperCase()
})

// ❌ Incorrect - not reactive
const processedData = props.data.value.toUpperCase()
</script>
```

## Debugging Strategies

### Vue DevTools Setup

1. **Install Vue DevTools:**
```bash
# Browser extension or standalone app
# https://devtools.vuejs.org/guide/installation.html
```

2. **Enable in development:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vue: {
    config: {
      devtools: true
    }
  }
})
```

### Console Debugging

```typescript
// Debug reactive state
import { toRaw } from 'vue'

const debugState = () => {
  console.log('Raw state:', toRaw(state.value))
  console.log('Reactive state:', state.value)
}

// Debug component props
const props = defineProps<Props>()
console.log('Component props:', props)

// Debug computed values
const computed = computed(() => {
  const result = complexCalculation()
  console.log('Computed result:', result)
  return result
})
```

### Network Debugging

```typescript
// Debug API calls
const { data, error, pending } = await $fetch('/api/cases', {
  onRequest({ request, options }) {
    console.log('Request:', request, options)
  },
  onResponse({ response }) {
    console.log('Response:', response.status, response._data)
  },
  onResponseError({ response }) {
    console.error('Response error:', response.status, response._data)
  }
})
```

### Performance Debugging

```typescript
// Measure component render time
onBeforeMount(() => {
  console.time('Component Mount')
})

onMounted(() => {
  console.timeEnd('Component Mount')
})

// Debug large lists
const { data: items } = await useFetch('/api/items')
console.log(`Rendering ${items.value?.length} items`)

// Memory usage
if (performance.memory) {
  console.log('Memory usage:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
  })
}
```

## Common Error Messages

### "Cannot read property 'value' of undefined"

**Cause:** Accessing reactive reference before initialization

**Solution:**
```typescript
// ✅ Correct
const data = ref<MyType | null>(null)
const computed = computed(() => data.value?.someProperty || 'default')

// ❌ Incorrect
const data = ref<MyType>()
const computed = computed(() => data.value.someProperty) // Error if data is undefined
```

### "Module not found"

**Cause:** Incorrect import path or missing dependency

**Solutions:**
```typescript
// Check import paths
import { MyComponent } from '~/components/MyComponent.vue' // ✅
import { MyComponent } from '../components/MyComponent.vue' // Consider using alias

// Install missing dependency
bun add missing-package
```

### "Unexpected token"

**Cause:** Syntax error or TypeScript configuration issue

**Solutions:**
1. Check for syntax errors
2. Verify TypeScript configuration
3. Ensure proper file extensions

### "Maximum call stack size exceeded"

**Cause:** Infinite recursion in reactive references

**Solutions:**
```typescript
// ✅ Correct
const data = ref([])
const filteredData = computed(() => data.value.filter(item => item.active))

// ❌ Incorrect - circular reference
const data = ref([])
const filteredData = computed(() => {
  data.value = data.value.filter(item => item.active) // Modifies source
  return data.value
})
```

## Getting Help

### Community Resources

1. **Nuxt Documentation:** https://nuxt.com/docs
2. **Vue 3 Documentation:** https://vuejs.org/guide/
3. **GitHub Issues:** Check existing issues and discussions
4. **Discord/Slack:** Join community channels

### Creating Bug Reports

When reporting bugs, include:

1. **Environment information:**
```bash
bun --version
node --version
npx nuxi info
```

2. **Minimal reproduction:**
- Create a minimal example
- Include relevant code snippets
- Describe expected vs actual behavior

3. **Error logs:**
- Console errors
- Network tab information
- Browser developer tools output

### Performance Profiling

1. **Use browser dev tools:**
   - Performance tab for runtime analysis
   - Memory tab for memory leaks
   - Network tab for request optimization

2. **Lighthouse audits:**
```bash
npx lighthouse http://localhost:3000 --view
```

3. **Bundle analysis:**
```bash
npx nuxi analyze
```

This troubleshooting guide should help you identify and resolve most common issues in the Aster Management Nuxt.js application. Keep it bookmarked and update it as you encounter new issues and solutions.