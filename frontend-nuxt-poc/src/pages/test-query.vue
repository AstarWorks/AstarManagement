<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">TanStack Query Test Page</h1>
    
    <!-- SSR/CSR Status -->
    <div class="mb-6 p-4 bg-gray-100 rounded">
      <p class="text-sm">
        <strong>Rendering Mode:</strong> 
        <span class="font-mono">{{ isClient ? 'Client-Side' : 'Server-Side' }}</span>
      </p>
      <p class="text-sm">
        <strong>Hydration Status:</strong> 
        <span class="font-mono">{{ hydrated ? 'Hydrated' : 'Not Hydrated' }}</span>
      </p>
    </div>
    
    <!-- Query Status -->
    <div class="mb-6 p-4 bg-blue-50 rounded">
      <h2 class="text-lg font-semibold mb-2">Query Status</h2>
      <p class="text-sm"><strong>Loading:</strong> {{ isPending }}</p>
      <p class="text-sm"><strong>Error:</strong> {{ error?.message || 'None' }}</p>
      <p class="text-sm"><strong>Data Count:</strong> {{ data?.length || 0 }}</p>
      <p class="text-sm"><strong>Stale:</strong> {{ isStale }}</p>
      <p class="text-sm"><strong>Fetching:</strong> {{ isFetching }}</p>
    </div>
    
    <!-- Data Display -->
    <div v-if="!isPending && data" class="space-y-4">
      <h2 class="text-lg font-semibold">Matters ({{ data.length }})</h2>
      
      <div v-for="matter in data" :key="matter.id" class="p-4 border rounded hover:bg-gray-50">
        <h3 class="font-medium">{{ matter.title }}</h3>
        <p class="text-sm text-gray-600">Status: {{ matter.status }}</p>
        <p class="text-sm text-gray-600">Priority: {{ matter.priority }}</p>
        
        <!-- Mutation Test -->
        <button
          @click="updateStatus(matter.id, 'COMPLETED')"
          :disabled="updateMutation.isPending.value"
          class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {{ updateMutation.isPending.value ? 'Updating...' : 'Mark Completed' }}
        </button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-else-if="isPending" class="text-center py-8">
      <p class="text-gray-600">Loading matters...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">Error: {{ error.message }}</p>
      <button 
        @click="refetch"
        class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Retry
      </button>
    </div>
    
    <!-- Actions -->
    <div class="mt-8 space-x-4">
      <button 
        @click="refetch"
        :disabled="isFetching"
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        Refetch Data
      </button>
      
      <button 
        @click="navigateTo('/kanban')"
        class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Go to Kanban
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Test Page for TanStack Query SSR/CSR Integration
 * 
 * This page tests:
 * - SSR data fetching with TanStack Query
 * - Client-side hydration
 * - Query state management
 * - Mutations with optimistic updates
 * - Cache invalidation
 */

import { useMattersQuery, useUpdateMatterStatus } from '~/composables/useMattersQuery'

// Track client/server and hydration status
const isClient = ref(false)
const hydrated = ref(false)

// Query for matters
const { 
  data, 
  isPending, 
  error, 
  isStale,
  isFetching,
  refetch 
} = useMattersQuery()

// Mutation for updating status
const updateMutation = useUpdateMatterStatus()

// Update matter status
const updateStatus = (id: string, status: string) => {
  updateMutation.mutate({ id, status })
}

// Track hydration
onMounted(() => {
  isClient.value = true
  hydrated.value = true
})

// SEO
useHead({
  title: 'TanStack Query Test | Aster Management',
  meta: [
    {
      name: 'description',
      content: 'Testing TanStack Query SSR/CSR integration'
    }
  ]
})
</script>