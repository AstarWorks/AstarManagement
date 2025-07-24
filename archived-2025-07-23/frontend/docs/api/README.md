# Aster Management API Documentation

This documentation covers all API endpoints, type definitions, and integration patterns for the Aster Management Nuxt.js frontend.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Type Definitions](#type-definitions)
5. [Error Handling](#error-handling)
6. [Real-time APIs](#real-time-apis)
7. [File Operations](#file-operations)
8. [Best Practices](#best-practices)

## Getting Started

The Aster Management API is a RESTful service that powers the legal case management system. All API requests should be made to the base URL configured in your environment.

### Base URL

```
Development: http://localhost:8080/api/v1
Production: https://api.astermanagement.com/api/v1
```

### Headers

All API requests must include the following headers:

```typescript
{
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer <token>' // For authenticated requests
}
```

### API Client Setup

The API client is configured in the Nuxt.js application using the `$fetch` utility:

```typescript
// plugins/api.client.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const api = $fetch.create({
    baseURL: config.public.apiUrl,
    onRequest({ request, options }) {
      const { token } = useAuthStore()
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        navigateTo('/login')
      }
    }
  })
  
  return {
    provide: {
      api
    }
  }
})
```

## Authentication

See [Authentication Documentation](./authentication.md) for detailed authentication flows.

## API Endpoints

### Matter Management

- [Matter Endpoints](./endpoints/matters.md) - CRUD operations for legal matters
- [Matter Status](./endpoints/matter-status.md) - Status transitions and validations

### User Management

- [User Endpoints](./endpoints/users.md) - User profiles and management
- [Role Management](./endpoints/roles.md) - Role-based access control

### Document Management

- [Document Endpoints](./endpoints/documents.md) - Document upload, download, and management
- [Document Processing](./endpoints/document-processing.md) - OCR and document analysis

### Communication

- [Memo Endpoints](./endpoints/memos.md) - Client memos and internal notes
- [Notifications](./endpoints/notifications.md) - Real-time notifications

## Type Definitions

All TypeScript type definitions are available in the `types/api/` directory:

- [Common Types](../../types/api/common.ts) - Shared types and utilities
- [Matter Types](../../types/api/matters.ts) - Matter-related type definitions
- [User Types](../../types/api/users.ts) - User and authentication types
- [Document Types](../../types/api/documents.ts) - Document-related types

## Error Handling

See [Error Handling Guide](./error-handling.md) for comprehensive error handling patterns.

## Real-time APIs

See [WebSocket Documentation](./websocket.md) for real-time communication patterns.

## File Operations

See [File Upload/Download Guide](./file-operations.md) for handling file operations.

## Best Practices

### 1. Use Composables for API Calls

Always wrap API calls in composables for reusability:

```typescript
// composables/api/useMatters.ts
export const useMatters = () => {
  const { $api } = useNuxtApp()
  
  const fetchMatters = async (params?: MatterQueryParams) => {
    return await $api<PaginatedResponse<Matter>>('/matters', { params })
  }
  
  const createMatter = async (data: CreateMatterDto) => {
    return await $api<Matter>('/matters', {
      method: 'POST',
      body: data
    })
  }
  
  return {
    fetchMatters,
    createMatter
  }
}
```

### 2. Use TanStack Query for Data Fetching

Leverage TanStack Query for caching and synchronization:

```typescript
// composables/useMattersQuery.ts
export const useMattersQuery = (params?: MaybeRef<MatterQueryParams>) => {
  const { fetchMatters } = useMatters()
  
  return useQuery({
    queryKey: ['matters', params],
    queryFn: () => fetchMatters(unref(params))
  })
}
```

### 3. Handle Loading States

Always provide loading feedback:

```vue
<template>
  <div v-if="isPending">Loading matters...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>
    <!-- Render matters -->
  </div>
</template>
```

### 4. Implement Proper Error Boundaries

Use error boundaries to catch and handle errors gracefully:

```vue
<NuxtErrorBoundary>
  <MatterList />
  <template #error="{ error }">
    <ErrorDisplay :error="error" />
  </template>
</NuxtErrorBoundary>
```

## Testing

See [API Testing Guide](./testing.md) for testing strategies and utilities.

## API Collection

Download the [Postman Collection](./aster-management-api.postman_collection.json) for easy API testing and exploration.

## Migration Notes

If migrating from Next.js, see [Migration Guide](./migration.md) for API-specific changes.