# Troubleshooting: Common Migration Issues and Solutions

This guide provides solutions to common issues encountered during the Next.js to Nuxt.js migration for the Aster Management application.

## Framework-Specific Issues

### 1. Vue 3 Reactivity Issues

#### Problem: Lost Reactivity After Destructuring
```typescript
// ❌ Wrong - loses reactivity
const { selectedMatter, filters } = useKanbanStore()

// Changes to store don't trigger component updates
selectedMatter.value = newMatter // Won't trigger reactivity
```

#### Solution: Use storeToRefs
```typescript
// ✅ Correct - maintains reactivity
const store = useKanbanStore()
const { selectedMatter, filters } = storeToRefs(store)
const { setSelectedMatter, updateFilters } = store

// Now changes trigger reactivity
setSelectedMatter(newMatter) // Will trigger component updates
```

#### Problem: Ref Access in Templates vs Script
```vue
<script setup>
const count = ref(0)

// ❌ Wrong - using .value in template
console.log(count.value) // Correct in script
</script>

<template>
  <!-- ❌ Wrong -->
  <div>{{ count.value }}</div>
  
  <!-- ✅ Correct - auto-unwrapped -->
  <div>{{ count }}</div>
</template>
```

### 2. Auto-Import Conflicts

#### Problem: Naming Conflicts with Auto-Imports
```typescript
// Error: 'ref' is already declared
import { ref } from 'vue'
const myRef = ref(null) // Conflicts with auto-imported ref
```

#### Solution: Explicit Imports or Aliasing
```typescript
// Option 1: Remove explicit import (use auto-import)
const myRef = ref(null)

// Option 2: Use aliases
import { ref as vueRef } from 'vue'
const myRef = vueRef(null)

// Option 3: Disable auto-import for specific items
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    presets: [
      {
        from: 'vue',
        imports: ['ref', 'reactive', 'computed'],
        ignore: ['ref'] // Disable auto-import for ref
      }
    ]
  }
})
```

### 3. Component Registration Issues

#### Problem: Component Not Found
```vue
<template>
  <!-- Error: Unknown custom element: <MatterCard> -->
  <MatterCard :matter="matter" />
</template>
```

#### Solution: Check File Naming and Location
```bash
# ✅ Correct structure
components/
├── MatterCard.vue          # Auto-imported as <MatterCard>
├── UI/
│   └── Button.vue          # Auto-imported as <UIButton>
└── features/
    └── KanbanBoard.vue     # Auto-imported as <FeaturesKanbanBoard>
```

```vue
<!-- Manual import if needed -->
<script setup>
import MatterCard from '~/components/MatterCard.vue'
</script>

<template>
  <MatterCard :matter="matter" />
</template>
```

### 4. TypeScript Integration Issues

#### Problem: Type Errors with Nuxt Composables
```typescript
// Error: Cannot find name 'useRoute'
const route = useRoute() // TypeScript can't find the type
```

#### Solution: Enable TypeScript in Nuxt Config
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  typescript: {
    strict: true,
    typeCheck: true
  }
})
```

```typescript
// types/nuxt.d.ts
import type { RouteLocationNormalizedLoaded } from 'vue-router'

declare global {
  const useRoute: () => RouteLocationNormalizedLoaded
  const useRouter: () => Router
}
```

## State Management Issues

### 5. Pinia Store Hydration Problems

#### Problem: SSR Hydration Mismatch
```typescript
// Store state differs between server and client
const store = useKanbanStore()
// Server: store.matters = []
// Client: store.matters = [cached data]
// Results in hydration mismatch
```

#### Solution: Proper State Initialization
```typescript
// stores/kanban.ts
export const useKanbanStore = defineStore('kanban', () => {
  const matters = ref<Matter[]>([])
  
  // Initialize state only on client
  if (process.client) {
    const cachedMatters = localStorage.getItem('matters')
    if (cachedMatters) {
      matters.value = JSON.parse(cachedMatters)
    }
  }
  
  return { matters }
}, {
  persist: {
    storage: persistedState.localStorage
  }
})
```

### 6. TanStack Query Configuration Issues

#### Problem: Query Client Not Available
```typescript
// Error: useQueryClient() is called outside of QueryClient context
const queryClient = useQueryClient() // Fails if called outside provider
```

#### Solution: Proper Plugin Setup
```typescript
// plugins/vue-query.client.ts
import type { DehydratedState, VueQueryPluginOptions } from '@tanstack/vue-query'
import { VueQueryPlugin, QueryClient, hydrate, dehydrate } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query')
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchOnWindowFocus: false
      }
    }
  })
  
  const options: VueQueryPluginOptions = { queryClient }
  
  nuxt.vueApp.use(VueQueryPlugin, options)
  
  if (process.server) {
    nuxt.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }
  
  if (process.client) {
    nuxt.hooks.hook('app:created', () => {
      hydrate(queryClient, vueQueryState.value)
    })
  }
})
```

## Routing and Navigation Issues

### 7. Dynamic Route Parameter Issues

#### Problem: Route Parameters Not Reactive
```vue
<script setup>
const route = useRoute()
const id = route.params.id // Not reactive to changes

// When route changes, id doesn't update
</script>
```

#### Solution: Use Computed Properties
```vue
<script setup>
const route = useRoute()
const id = computed(() => route.params.id) // Reactive to changes

// Or watch for changes
watch(() => route.params.id, (newId) => {
  console.log('ID changed to:', newId)
})
</script>
```

### 8. Navigation Guard Issues

#### Problem: Middleware Not Executing
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  console.log('This never runs')
})
```

#### Solution: Proper Middleware Registration
```typescript
// middleware/auth.global.ts (global middleware)
export default defineNuxtRouteMiddleware((to, from) => {
  const { $auth } = useNuxtApp()
  if (!$auth.user) {
    return navigateTo('/login')
  }
})
```

```vue
<!-- pages/dashboard.vue (page-specific middleware) -->
<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>
```

## Build and Development Issues

### 9. Build Failures

#### Problem: Module Not Found Errors
```bash
# Error during build
ERROR  Cannot resolve module '@/components/MatterCard'
```

#### Solution: Check Path Resolution
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  alias: {
    '@': fileURLToPath(new URL('./', import.meta.url)),
    '~': fileURLToPath(new URL('./', import.meta.url))
  }
})
```

#### Problem: TypeScript Build Errors
```bash
# Error: Property 'matters' does not exist on type 'unknown'
const { data: matters } = await useFetch('/api/matters')
```

#### Solution: Proper Type Annotations
```typescript
// Define types
interface Matter {
  id: string
  title: string
  status: string
}

// Use typed fetch
const { data: matters } = await useFetch<Matter[]>('/api/matters')

// Or use $fetch with types
const matters = await $fetch<Matter[]>('/api/matters')
```

### 10. Hot Module Replacement Issues

#### Problem: Changes Not Reflecting
```vue
<!-- Changes to this component don't trigger HMR -->
<template>
  <div>Content doesn't update</div>
</template>
```

#### Solution: Check File Extensions and Structure
```bash
# ✅ Correct file extensions
components/MatterCard.vue   # Not .js or .ts
pages/index.vue            # Not .tsx
layouts/default.vue        # Not .jsx

# ❌ Incorrect
components/MatterCard.tsx  # Won't work with Vue
```

## Performance Issues

### 11. Slow Page Loading

#### Problem: Large Bundle Size
```bash
# Check bundle size
npm run build
npm run analyze

# Large chunks identified
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
# chunks/vendor.js: 850 KB
```

#### Solution: Code Splitting and Lazy Loading
```vue
<!-- Use defineAsyncComponent for large components -->
<script setup>
const KanbanBoard = defineAsyncComponent(() => import('~/components/KanbanBoard.vue'))
const MatterDetail = defineAsyncComponent(() => import('~/components/MatterDetail.vue'))
</script>

<template>
  <Suspense>
    <KanbanBoard v-if="showKanban" />
    <MatterDetail v-else-if="showDetail" />
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>
```

```typescript
// nuxt.config.ts - Optimize build
export default defineNuxtConfig({
  build: {
    splitChunks: {
      layouts: true,
      pages: true,
      commons: true
    }
  },
  
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router'],
            ui: ['@radix-ui/vue-dialog', '@radix-ui/vue-dropdown-menu']
          }
        }
      }
    }
  }
})
```

### 12. Memory Leaks

#### Problem: Event Listeners Not Cleaned Up
```vue
<script setup>
// ❌ Memory leak - listener never removed
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  // Missing cleanup!
})
</script>
```

#### Solution: Proper Cleanup
```vue
<script setup>
// ✅ Proper cleanup
const handleKeyDown = (e: KeyboardEvent) => {
  // Handle key press
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// Or use VueUse for automatic cleanup
const { escape } = useMagicKeys()
watch(escape, (pressed) => {
  if (pressed) {
    // Handle escape key
  }
})
</script>
```

## API and Data Fetching Issues

### 13. SSR Data Fetching Problems

#### Problem: Data Not Available on Server
```vue
<script setup>
// ❌ Wrong - localStorage not available on server
const savedData = localStorage.getItem('matters')
const matters = ref(JSON.parse(savedData || '[]'))
</script>
```

#### Solution: Client-Side Only Code
```vue
<script setup>
// ✅ Correct - check for client-side
const matters = ref<Matter[]>([])

onMounted(() => {
  if (process.client) {
    const savedData = localStorage.getItem('matters')
    if (savedData) {
      matters.value = JSON.parse(savedData)
    }
  }
})

// Or use ClientOnly component
</script>

<template>
  <div>
    <ServerOnlyContent />
    <ClientOnly>
      <ClientOnlyContent />
    </ClientOnly>
  </div>
</template>
```

### 14. API Route Configuration

#### Problem: API Routes Not Working
```bash
# Error: API route not found
GET /api/matters 404 Not Found
```

#### Solution: Check File Structure
```bash
# ✅ Correct API route structure
server/
└── api/
    ├── matters/
    │   ├── index.get.ts      # GET /api/matters
    │   ├── index.post.ts     # POST /api/matters
    │   └── [id].get.ts       # GET /api/matters/:id
    └── health.get.ts         # GET /api/health
```

```typescript
// server/api/matters/index.get.ts
export default defineEventHandler(async (event) => {
  // Handle GET request
  return await getMatters()
})
```

## Styling and UI Issues

### 15. Tailwind CSS Not Working

#### Problem: Styles Not Applied
```vue
<template>
  <!-- Styles not applied -->
  <div class="bg-blue-500 text-white p-4">
    Content
  </div>
</template>
```

#### Solution: Configure Tailwind Properly
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  
  css: ['~/assets/css/main.css']
})
```

```css
/* assets/css/main.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue"
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
```

### 16. Scoped Styles Not Working

#### Problem: Styles Bleeding Between Components
```vue
<style scoped>
/* These styles leak to other components */
.card {
  background: blue;
}
</style>
```

#### Solution: Use CSS Modules or Better Selectors
```vue
<template>
  <div class="matter-card">
    <h3 class="matter-card__title">{{ title }}</h3>
  </div>
</template>

<style scoped>
/* Use component-specific class names */
.matter-card {
  background: blue;
}

.matter-card__title {
  color: white;
}

/* Or use CSS modules */
:deep(.external-component) {
  /* Styles for child components */
}
</style>
```

## Testing Issues

### 17. Vitest Configuration Problems

#### Problem: Tests Not Running
```bash
# Error: No test files found
ERROR: No test suite found in the specified paths
```

#### Solution: Configure Test Patterns
```typescript
// vitest.config.ts
export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: [
      'test/**/*.{test,spec}.{js,ts}',
      'components/**/*.{test,spec}.{js,ts}',
      'composables/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.nuxt'
    ]
  }
})
```

### 18. Component Testing Issues

#### Problem: Component Won't Mount
```typescript
// Error: Cannot mount component
const wrapper = mount(MatterCard, {
  props: { matter: mockMatter }
}) // Fails due to missing dependencies
```

#### Solution: Provide Required Context
```typescript
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import MatterCard from '~/components/MatterCard.vue'

const wrapper = mount(MatterCard, {
  props: { matter: mockMatter },
  global: {
    plugins: [createTestingPinia()],
    stubs: {
      NuxtLink: true,
      ClientOnly: true
    },
    mocks: {
      $fetch: vi.fn(),
      useRouter: () => ({ push: vi.fn() }),
      useRoute: () => ({ params: {} })
    }
  }
})
```

## Deployment Issues

### 19. Production Build Failures

#### Problem: Build Fails in Production
```bash
# Error during production build
ERROR: RollupError: "ref" is not exported by "node_modules/vue/dist/vue.esm-bundler.js"
```

#### Solution: Configure Build Properly
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  build: {
    transpile: ['@tanstack/vue-query']
  },
  
  vite: {
    define: {
      __VUE_PROD_DEVTOOLS__: false
    },
    optimizeDeps: {
      include: ['vue', '@vue/runtime-core']
    }
  }
})
```

### 20. Environment Variable Issues

#### Problem: Environment Variables Not Available
```typescript
// ❌ Wrong - env var not available in production
const apiUrl = process.env.API_URL // undefined in production
```

#### Solution: Use Runtime Config
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Private (server-only)
    apiSecret: process.env.API_SECRET,
    
    // Public (client + server)
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080'
    }
  }
})
```

```typescript
// In components or composables
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl // Always available
```

## Debugging Strategies

### 21. Vue DevTools Not Working

#### Problem: DevTools Not Connecting
```bash
# Vue DevTools shows "No Vue app detected"
```

#### Solution: Enable DevTools in Development
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  vite: {
    define: {
      __VUE_PROD_DEVTOOLS__: process.env.NODE_ENV !== 'production'
    }
  }
})
```

### 22. Debug Mode Configuration

#### Enable Comprehensive Debugging
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  debug: process.env.NODE_ENV === 'development',
  
  sourcemap: {
    server: true,
    client: true
  },
  
  vite: {
    logLevel: 'info',
    clearScreen: false
  },
  
  typescript: {
    strict: true,
    typeCheck: 'build'
  }
})
```

## Quick Reference: Common Error Messages

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `Cannot read property 'value' of undefined` | Accessing .value on non-ref | Check if variable is a ref, use without .value in template |
| `Unknown custom element` | Component not imported/registered | Check file naming, ensure component is in components/ directory |
| `useXXX is not defined` | Auto-import not working | Add to imports in nuxt.config.ts or import manually |
| `Hydration node mismatch` | SSR/client state difference | Use ClientOnly component or process.client checks |
| `Cannot resolve module` | Path resolution issue | Check alias configuration in nuxt.config.ts |
| `Module not found: @/...` | Incorrect path alias | Verify @ alias points to correct directory |
| `TypeError: Cannot read properties of null` | Component not mounted | Use v-if to check component existence |
| `Failed to resolve import` | Missing dependency | Install required package or check import path |
| `Invalid hook call` | Vue composition API misuse | Use composables only in setup() or other composables |
| `Pinia store not found` | Store not initialized | Ensure store is defined and imported correctly |

## Migration Validation Checklist

### Functionality
- [ ] All pages load without errors
- [ ] Navigation works correctly
- [ ] Forms submit and validate properly
- [ ] API calls work as expected
- [ ] State management functions correctly
- [ ] Real-time updates work

### Performance
- [ ] Bundle size is optimized
- [ ] Page load times are acceptable
- [ ] Hot reload works in development
- [ ] Memory usage is reasonable
- [ ] No memory leaks detected

### Development Experience
- [ ] TypeScript compilation works
- [ ] Auto-imports function correctly
- [ ] DevTools are accessible
- [ ] Tests run successfully
- [ ] Linting passes

### Production Readiness
- [ ] Build process completes
- [ ] Environment variables work
- [ ] SSR renders correctly
- [ ] Error handling is in place
- [ ] Monitoring is configured

By following this troubleshooting guide, most common issues encountered during the Next.js to Nuxt.js migration can be resolved quickly and efficiently. Remember to check the official Nuxt.js documentation for the most up-to-date solutions and best practices.