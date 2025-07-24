# ADR-008: Routing Strategy - File-based vs Programmatic

## Status
Accepted

## Context
Nuxt 3 provides powerful file-based routing by default, automatically generating routes from the file structure in the `pages/` directory. However, for a complex legal case management system, we need to evaluate whether this approach meets all our needs:
- Dynamic routes for matters, documents, and clients
- Nested routes for complex workflows
- Route guards for authentication and authorization
- Breadcrumb generation
- Route-based code splitting
- Type-safe route parameters
- Middleware for cross-cutting concerns

## Decision
We will use Nuxt 3's file-based routing as the primary routing strategy, with programmatic enhancements where needed.

Implementation approach:
- File-based routing for all standard pages
- Route middleware for authentication and authorization
- Typed routes using Nuxt's route typing features
- Dynamic routes for entity pages (matters, documents)
- Nested routes for complex workflows
- Custom navigation guards where needed

## Consequences

### Positive
- Intuitive file structure mirrors route structure
- Automatic route generation reduces boilerplate
- Built-in code splitting per route
- Type-safe route params with Nuxt 3
- Easy to understand and maintain
- Excellent developer experience
- SEO-friendly URLs by default
- Automatic route prefetching

### Negative
- Less flexibility compared to fully programmatic routing
- Complex route patterns may require workarounds
- File naming conventions must be followed
- Nested routes can create deep directory structures

### Neutral
- Team needs to learn Nuxt's routing conventions
- Some routes may need programmatic configuration
- Migration from React Router requires restructuring

## Alternatives Considered

### Alternative 1: Fully Programmatic Routing
- **Pros**: Complete control, familiar to React Router users, flexible
- **Cons**: More boilerplate, lose Nuxt's automatic features, manual code splitting
- **Reason for rejection**: File-based routing provides better DX for most cases

### Alternative 2: Vue Router Only
- **Pros**: Direct control, standard Vue approach
- **Cons**: Lose Nuxt's enhancements, more configuration
- **Reason for rejection**: Nuxt's routing provides additional benefits

### Alternative 3: Hybrid with Heavy Programmatic Use
- **Pros**: Maximum flexibility
- **Cons**: Complexity, two mental models, harder to maintain
- **Reason for rejection**: File-based routing handles 95% of needs

## Implementation Notes

### File Structure
```
pages/
├── index.vue                    // /
├── login.vue                    // /login
├── matters/
│   ├── index.vue               // /matters
│   ├── [id]/
│   │   ├── index.vue          // /matters/:id
│   │   ├── edit.vue           // /matters/:id/edit
│   │   └── documents.vue      // /matters/:id/documents
│   └── new.vue                // /matters/new
├── clients/
│   ├── index.vue              // /clients
│   └── [id].vue               // /clients/:id
├── admin/
│   ├── index.vue              // /admin
│   └── users/
│       ├── index.vue          // /admin/users
│       └── [id].vue           // /admin/users/:id
└── [...slug].vue              // 404 catch-all
```

### Route Middleware
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated.value) {
    return navigateTo('/login', { 
      redirectCode: 401,
      query: { redirect: to.fullPath }
    })
  }
})

// middleware/admin.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useAuthStore()
  
  if (user.value?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }
})
```

### Page Implementation
```vue
<!-- pages/matters/[id]/index.vue -->
<script setup lang="ts">
// Type-safe route params
const route = useRoute('matters-id')
const matterId = route.params.id // TypeScript knows this is string

// Route middleware
definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard'
})

// Data fetching
const { data: matter, error } = await useFetch(`/api/matters/${matterId}`)

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Matter not found'
  })
}
</script>

<template>
  <div>
    <MatterDetail :matter="matter" />
  </div>
</template>
```

### Navigation Helpers
```typescript
// composables/useNavigation.ts
export const useNavigation = () => {
  const router = useRouter()
  
  const goToMatter = (id: string) => {
    return navigateTo({
      name: 'matters-id',
      params: { id }
    })
  }
  
  const goToMatterEdit = (id: string) => {
    return navigateTo(`/matters/${id}/edit`)
  }
  
  return {
    goToMatter,
    goToMatterEdit
  }
}
```

### Dynamic Route Validation
```vue
<!-- pages/matters/[id]/index.vue -->
<script setup>
definePageMeta({
  validate: async (route) => {
    // Validate UUID format
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return isValidUUID.test(route.params.id as string)
  }
})
</script>
```

## References
- [Nuxt 3 Routing Documentation](https://nuxt.com/docs/getting-started/routing)
- [Nuxt 3 Route Middleware](https://nuxt.com/docs/guide/directory-structure/middleware)
- [Vue Router Documentation](https://router.vuejs.org/)
- File-based routing best practices
- ADR-001: Frontend Framework Migration

## History
- **2025-01-02**: Initial draft created
- **2025-01-02**: Decision accepted for file-based routing with enhancements