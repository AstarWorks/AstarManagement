# Routing Guide

This guide covers the routing system in Aster Management using Nuxt 3's file-based routing and navigation patterns.

## File-Based Routing

Nuxt automatically generates routes based on the file structure in the `pages/` directory.

### Basic Routes

```
pages/
├── index.vue              → /
├── about.vue              → /about
├── matters/
│   ├── index.vue          → /matters
│   └── create.vue         → /matters/create
└── settings.vue           → /settings
```

### Dynamic Routes

```
pages/
├── matters/
│   ├── [id].vue           → /matters/:id
│   └── [id]/
│       └── edit.vue       → /matters/:id/edit
├── clients/
│   └── [...slug].vue      → /clients/** (catch-all)
└── [[optional]].vue       → / or /:optional (optional param)
```

#### Dynamic Route Example

```vue
<!-- pages/matters/[id].vue -->
<script setup lang="ts">
const route = useRoute()
const matterId = computed(() => route.params.id as string)

// Fetch matter data
const { data: matter, pending, error } = await useFetch(
  `/api/matters/${matterId.value}`
)

// Handle 404
if (!matter.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Matter not found'
  })
}
</script>

<template>
  <div>
    <h1>Matter: {{ matter.title }}</h1>
    <!-- Matter details -->
  </div>
</template>
```

## Navigation

### Programmatic Navigation

```typescript
// composables/useNavigation.ts
export const useNavigation = () => {
  const router = useRouter()
  const route = useRoute()
  
  // Navigate to a route
  const navigateToMatter = (id: string) => {
    return navigateTo(`/matters/${id}`)
  }
  
  // Navigate with query params
  const navigateWithQuery = (params: Record<string, any>) => {
    return navigateTo({
      path: route.path,
      query: params
    })
  }
  
  // Navigate with replace
  const replaceRoute = (path: string) => {
    return navigateTo(path, { replace: true })
  }
  
  // External navigation
  const navigateExternal = (url: string) => {
    return navigateTo(url, { external: true })
  }
  
  // Go back
  const goBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      navigateTo('/')
    }
  }
  
  return {
    navigateToMatter,
    navigateWithQuery,
    replaceRoute,
    navigateExternal,
    goBack
  }
}
```

### Link Components

```vue
<!-- Internal navigation with NuxtLink -->
<template>
  <nav>
    <NuxtLink to="/" class="nav-link">
      Home
    </NuxtLink>
    
    <NuxtLink 
      :to="{ name: 'matters-id', params: { id: '123' } }"
      class="nav-link"
      active-class="active"
    >
      Matter Details
    </NuxtLink>
    
    <!-- With query params -->
    <NuxtLink 
      :to="{ 
        path: '/matters', 
        query: { status: 'active', sort: 'date' } 
      }"
    >
      Active Matters
    </NuxtLink>
    
    <!-- External link -->
    <NuxtLink 
      to="https://example.com" 
      target="_blank"
      external
    >
      External Link
    </NuxtLink>
  </nav>
</template>

<style>
.nav-link {
  @apply px-4 py-2 text-foreground hover:text-primary;
}

.nav-link.active {
  @apply text-primary font-semibold;
}
</style>
```

## Route Middleware

### Authentication Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated, user } = useAuth()
  
  // Redirect to login if not authenticated
  if (!isAuthenticated.value) {
    return navigateTo('/login', {
      query: { redirect: to.fullPath }
    })
  }
})
```

### Role-Based Access Control

```typescript
// middleware/rbac.ts
export default defineNuxtRouteMiddleware((to) => {
  const { user, hasPermission } = useAuth()
  
  // Check route meta for required permissions
  const requiredPermission = to.meta.permission as string
  
  if (requiredPermission && !hasPermission(requiredPermission)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied'
    })
  }
})
```

### Using Middleware in Pages

```vue
<!-- pages/admin/settings.vue -->
<script setup lang="ts">
// Apply middleware
definePageMeta({
  middleware: ['auth', 'rbac'],
  permission: 'admin.settings.view'
})
</script>

<template>
  <div>
    <h1>Admin Settings</h1>
    <!-- Admin only content -->
  </div>
</template>
```

## Route Guards

### Navigation Guards

```typescript
// plugins/navigation-guards.client.ts
export default defineNuxtPlugin(() => {
  const router = useRouter()
  
  // Before each route
  router.beforeEach((to, from) => {
    // Check for unsaved changes
    const { hasUnsavedChanges } = useFormState()
    
    if (hasUnsavedChanges.value) {
      if (!confirm('You have unsaved changes. Leave anyway?')) {
        return false // Cancel navigation
      }
    }
  })
  
  // After each route
  router.afterEach((to, from) => {
    // Track page views
    if (process.client) {
      gtag('event', 'page_view', {
        page_path: to.fullPath
      })
    }
  })
})
```

### Route Validation

```vue
<!-- pages/matters/[id].vue -->
<script setup lang="ts">
// Validate route params
definePageMeta({
  validate: async (route) => {
    // Check if ID is valid UUID
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return isValidUUID.test(route.params.id as string)
  }
})
</script>
```

## Nested Routes

### Layout Structure

```
pages/
├── matters.vue            → Layout wrapper
└── matters/
    ├── index.vue          → /matters
    ├── create.vue         → /matters/create
    └── [id].vue           → /matters/:id
```

```vue
<!-- pages/matters.vue - Layout wrapper -->
<template>
  <div class="matters-layout">
    <MattersHeader />
    <div class="matters-content">
      <MattersSidebar />
      <main>
        <!-- Child routes render here -->
        <NuxtPage />
      </main>
    </div>
  </div>
</template>
```

## Query Parameters

### Reading Query Parameters

```vue
<script setup lang="ts">
const route = useRoute()

// Reactive query params
const searchQuery = computed(() => route.query.q as string || '')
const currentPage = computed(() => parseInt(route.query.page as string) || 1)
const filters = computed(() => ({
  status: route.query.status as string || 'all',
  priority: route.query.priority as string || 'all'
}))

// Watch for query changes
watch(
  () => route.query,
  (newQuery) => {
    // Refetch data based on new query params
    fetchMatters(newQuery)
  }
)
</script>
```

### Updating Query Parameters

```typescript
// composables/useQueryParams.ts
export const useQueryParams = () => {
  const route = useRoute()
  const router = useRouter()
  
  // Update single param
  const updateParam = (key: string, value: any) => {
    router.push({
      query: {
        ...route.query,
        [key]: value
      }
    })
  }
  
  // Update multiple params
  const updateParams = (params: Record<string, any>) => {
    router.push({
      query: {
        ...route.query,
        ...params
      }
    })
  }
  
  // Remove param
  const removeParam = (key: string) => {
    const query = { ...route.query }
    delete query[key]
    router.push({ query })
  }
  
  // Clear all params
  const clearParams = () => {
    router.push({ query: {} })
  }
  
  return {
    updateParam,
    updateParams,
    removeParam,
    clearParams
  }
}
```

## Route Transitions

### Page Transitions

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage :transition="pageTransition" />
  </NuxtLayout>
</template>

<script setup>
const pageTransition = {
  name: 'page',
  mode: 'out-in',
  onBeforeEnter: (el) => {
    console.log('Before enter')
  },
  onEnter: (el, done) => {
    // Custom animation
    done()
  },
  onAfterEnter: (el) => {
    console.log('After enter')
  }
}
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.3s;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
```

### Custom Transitions

```vue
<!-- pages/matters/index.vue -->
<script setup>
// Page-specific transition
definePageMeta({
  pageTransition: {
    name: 'slide-up',
    mode: 'out-in'
  }
})
</script>

<style>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
```

## Advanced Routing Patterns

### Modal Routes

```typescript
// composables/useModalRoute.ts
export const useModalRoute = () => {
  const route = useRoute()
  const router = useRouter()
  
  const openModal = (modalPath: string) => {
    router.push({
      query: {
        ...route.query,
        modal: modalPath
      }
    })
  }
  
  const closeModal = () => {
    const query = { ...route.query }
    delete query.modal
    router.push({ query })
  }
  
  const isModalOpen = computed(() => !!route.query.modal)
  const modalPath = computed(() => route.query.modal as string)
  
  return {
    openModal,
    closeModal,
    isModalOpen,
    modalPath
  }
}
```

### Tab Navigation

```vue
<!-- pages/matters/[id].vue -->
<script setup>
const route = useRoute()
const activeTab = computed(() => route.query.tab || 'details')

const tabs = [
  { id: 'details', label: 'Details' },
  { id: 'documents', label: 'Documents' },
  { id: 'history', label: 'History' },
  { id: 'billing', label: 'Billing' }
]

const switchTab = (tabId: string) => {
  navigateTo({
    query: { ...route.query, tab: tabId }
  })
}
</script>

<template>
  <div>
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div class="tab-content">
      <MatterDetails v-if="activeTab === 'details'" />
      <MatterDocuments v-else-if="activeTab === 'documents'" />
      <MatterHistory v-else-if="activeTab === 'history'" />
      <MatterBilling v-else-if="activeTab === 'billing'" />
    </div>
  </div>
</template>
```

### Breadcrumb Navigation

```typescript
// composables/useBreadcrumbs.ts
export const useBreadcrumbs = () => {
  const route = useRoute()
  
  const breadcrumbs = computed(() => {
    const items = []
    const paths = route.path.split('/').filter(Boolean)
    
    // Always include home
    items.push({ label: 'Home', path: '/' })
    
    // Build breadcrumb trail
    let currentPath = ''
    for (const segment of paths) {
      currentPath += `/${segment}`
      
      // Handle dynamic segments
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const paramName = segment.slice(1, -1)
        const paramValue = route.params[paramName]
        items.push({
          label: paramValue as string,
          path: currentPath.replace(segment, paramValue as string)
        })
      } else {
        items.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1),
          path: currentPath
        })
      }
    }
    
    return items
  })
  
  return { breadcrumbs }
}
```

## SEO and Meta Tags

### Page Meta Configuration

```vue
<!-- pages/matters/[id].vue -->
<script setup>
const route = useRoute()
const { data: matter } = await useFetch(`/api/matters/${route.params.id}`)

// Dynamic meta tags
useHead({
  title: () => matter.value?.title || 'Matter Details',
  meta: [
    {
      name: 'description',
      content: () => matter.value?.description || 'Legal matter details'
    },
    {
      property: 'og:title',
      content: () => matter.value?.title
    },
    {
      property: 'og:url',
      content: () => `https://aster.example.com${route.fullPath}`
    }
  ]
})

// Structured data
useSchemaOrg([
  defineWebPage({
    name: () => matter.value?.title,
    description: () => matter.value?.description
  })
])
</script>
```

## Error Handling

### Custom Error Pages

```vue
<!-- error.vue -->
<script setup>
interface Props {
  error: {
    statusCode: number
    statusMessage: string
    data?: any
  }
}

const props = defineProps<Props>()

const handleError = () => {
  clearError({ redirect: '/' })
}

const errorMessages = {
  404: 'Page not found',
  403: 'Access denied',
  500: 'Internal server error'
}

const errorMessage = computed(() => 
  errorMessages[props.error.statusCode] || props.error.statusMessage
)
</script>

<template>
  <div class="error-page">
    <h1>{{ error.statusCode }}</h1>
    <p>{{ errorMessage }}</p>
    <Button @click="handleError">
      Go Home
    </Button>
  </div>
</template>
```

### Route Error Handling

```typescript
// middleware/error-handler.ts
export default defineNuxtRouteMiddleware(async (to) => {
  try {
    // Validate route access
    await checkRouteAccess(to)
  } catch (error) {
    // Handle specific errors
    if (error.code === 'SUBSCRIPTION_REQUIRED') {
      return navigateTo('/subscription/upgrade')
    }
    
    // Throw to error page
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})
```

## Performance Optimization

### Route Prefetching

```vue
<!-- Prefetch on hover -->
<NuxtLink 
  to="/matters/123" 
  prefetch
>
  View Matter
</NuxtLink>

<!-- Disable prefetch -->
<NuxtLink 
  to="/heavy-page" 
  :prefetch="false"
>
  Heavy Page
</NuxtLink>

<!-- Custom prefetch strategy -->
<script setup>
const prefetchMatter = (id: string) => {
  // Manually prefetch data
  if (process.client) {
    setTimeout(() => {
      $fetch(`/api/matters/${id}`, { method: 'HEAD' })
    }, 100)
  }
}
</script>
```

### Lazy Loading Routes

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    payloadExtraction: false // Disable for large pages
  },
  
  routeRules: {
    '/admin/**': { index: false }, // Don't index admin pages
    '/matters/**': { cors: true }, // Enable CORS
    '/api/**': { proxy: 'https://api.example.com' }
  }
})
```

## Best Practices

1. **Use Type-Safe Navigation**
   ```typescript
   // Define route names
   type RouteNames = 'index' | 'matters' | 'matters-id'
   
   // Type-safe navigation
   navigateTo({ name: 'matters-id' as RouteNames, params: { id: '123' } })
   ```

2. **Handle Loading States**
   ```vue
   <template>
     <div v-if="pending">Loading...</div>
     <div v-else-if="error">Error: {{ error.message }}</div>
     <div v-else>{{ data }}</div>
   </template>
   ```

3. **Validate Route Parameters**
   - Always validate dynamic parameters
   - Use proper error handling
   - Provide fallbacks for invalid routes

4. **Optimize Navigation**
   - Use prefetch for frequently accessed routes
   - Implement proper loading indicators
   - Cache route data when appropriate

5. **Maintain Clean URLs**
   - Use meaningful route names
   - Keep URLs short and descriptive
   - Use query params for filters, not core navigation