<script setup lang="ts">
import { ref } from 'vue'
import SyncPerformanceMetrics from '~/components/ui/SyncPerformanceMetrics.vue'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'
import { Label } from '~/components/ui/label'
import { useSyncPerformanceMonitor } from '~/composables/useSyncPerformanceMonitor'

// Page meta
definePageMeta({
  title: 'Performance Monitor',
  layout: 'default'
})

// Performance monitor
const { trackSyncOperation, completeSyncOperation } = useSyncPerformanceMonitor()

// UI state
const showDetailed = ref(true)
const showExport = ref(true)

// Simulate sync operations for testing
const simulateOperation = async (type: 'query' | 'mutation' | 'websocket' | 'cache', success = true) => {
  const operationId = trackSyncOperation({
    type,
    operation: `test-${type}-${Date.now()}`,
    success: false,
    dataSize: Math.floor(Math.random() * 10000),
    networkRequests: type === 'cache' ? 0 : 1,
    cacheHit: type === 'cache' ? Math.random() > 0.3 : undefined
  })
  
  // Simulate operation delay
  const delay = Math.floor(Math.random() * 2000) + 100
  await new Promise(resolve => setTimeout(resolve, delay))
  
  // Complete operation
  completeSyncOperation(
    operationId, 
    success, 
    success ? undefined : 'Simulated error'
  )
}

// Batch simulation
const runBatchSimulation = async () => {
  const operations = [
    { type: 'query' as const, count: 5 },
    { type: 'mutation' as const, count: 3 },
    { type: 'websocket' as const, count: 2 },
    { type: 'cache' as const, count: 10 }
  ]
  
  for (const { type, count } of operations) {
    const promises = Array.from({ length: count }, (_, i) => 
      simulateOperation(type, Math.random() > 0.1)
    )
    await Promise.all(promises)
  }
}
</script>

<template>
  <div class="container mx-auto p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Performance Monitor</h1>
        <p class="text-muted-foreground">
          Real-time monitoring of sync operations and system performance
        </p>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center space-x-2">
          <Switch id="detailed" v-model="showDetailed" />
          <Label for="detailed">Detailed view</Label>
        </div>
        <div class="flex items-center space-x-2">
          <Switch id="export" v-model="showExport" />
          <Label for="export">Show export</Label>
        </div>
      </div>
    </div>
    
    <!-- Performance Metrics Component -->
    <SyncPerformanceMetrics 
      :detailed="showDetailed" 
      :show-export="showExport"
    />
    
    <!-- Test Controls -->
    <Card>
      <CardHeader>
        <CardTitle>Test Controls</CardTitle>
        <CardDescription>
          Simulate sync operations to test performance monitoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="simulateOperation('query')"
          >
            Simulate Query
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="simulateOperation('mutation')"
          >
            Simulate Mutation
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="simulateOperation('websocket')"
          >
            Simulate WebSocket
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="simulateOperation('cache')"
          >
            Simulate Cache Op
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="simulateOperation('query', false)"
          >
            Simulate Failure
          </Button>
          <Button
            variant="default"
            size="sm"
            @click="runBatchSimulation"
          >
            Run Batch Test
          </Button>
        </div>
      </CardContent>
    </Card>
    
    <!-- Usage Example -->
    <Card>
      <CardHeader>
        <CardTitle>Usage Example</CardTitle>
        <CardDescription>
          How to integrate performance monitoring in your components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre class="bg-muted p-4 rounded-md overflow-x-auto text-sm"><code>// In your component or composable
import { useSyncPerformanceMonitor } from '~/composables/useSyncPerformanceMonitor'

const { trackSyncOperation, completeSyncOperation } = useSyncPerformanceMonitor()

// Track a query operation
const fetchData = async () => {
  const operationId = trackSyncOperation({
    type: 'query',
    operation: 'fetchMatters',
    success: false
  })
  
  try {
    const data = await $fetch('/api/matters')
    completeSyncOperation(operationId, true)
    return data
  } catch (error) {
    completeSyncOperation(operationId, false, error.message)
    throw error
  }
}

// Track WebSocket messages
ws.on('message', (data) => {
  trackSyncOperation({
    type: 'websocket',
    operation: `ws:${data.type}`,
    success: true,
    dataSize: JSON.stringify(data).length,
    duration: Date.now() - data.timestamp
  })
})

// Track cache operations
const cachedData = queryClient.getQueryData(queryKey)
if (cachedData) {
  trackSyncOperation({
    type: 'cache',
    operation: queryKey.join(':'),
    success: true,
    cacheHit: true,
    duration: 1 // Cache hits are instant
  })
}</code></pre>
      </CardContent>
    </Card>
    
    <!-- Integration Guide -->
    <Card>
      <CardHeader>
        <CardTitle>Integration Guide</CardTitle>
        <CardDescription>
          Steps to integrate performance monitoring in your application
        </CardDescription>
      </CardHeader>
      <CardContent class="prose prose-sm max-w-none">
        <ol class="space-y-2">
          <li>
            <strong>Add the performance monitor component to your layout:</strong>
            <pre class="bg-muted p-2 rounded text-xs mt-1"><code>&lt;SyncPerformanceMetrics :detailed="false" /&gt;</code></pre>
          </li>
          <li>
            <strong>Track TanStack Query operations:</strong>
            <pre class="bg-muted p-2 rounded text-xs mt-1"><code>// In your query options
queryFn: async () => {
  const opId = trackSyncOperation({ type: 'query', operation: 'fetchData' })
  try {
    const data = await api.getData()
    completeSyncOperation(opId, true)
    return data
  } catch (error) {
    completeSyncOperation(opId, false, error.message)
    throw error
  }
}</code></pre>
          </li>
          <li>
            <strong>Monitor WebSocket performance:</strong>
            <pre class="bg-muted p-2 rounded text-xs mt-1"><code>// Already integrated in useRealtimeSync composable
// Metrics are automatically tracked</code></pre>
          </li>
          <li>
            <strong>Export metrics for analysis:</strong>
            <pre class="bg-muted p-2 rounded text-xs mt-1"><code>const { exportMetrics } = useSyncPerformanceMonitor()
// Exports JSON file with all metrics</code></pre>
          </li>
        </ol>
      </CardContent>
    </Card>
  </div>
</template>