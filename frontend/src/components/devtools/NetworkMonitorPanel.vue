<template>
  <div class="network-monitor-panel">
    <h3 class="panel-title">Network Activity</h3>
    
    <!-- Network Summary -->
    <div class="network-summary">
      <div class="summary-stat">
        <span class="stat-label">Total Requests:</span>
        <span class="stat-value">{{ networkRequests.length }}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Failed:</span>
        <span class="stat-value error">{{ failedRequests }}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Avg Response:</span>
        <span class="stat-value">{{ avgResponseTime }}ms</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Data Transfer:</span>
        <span class="stat-value">{{ totalDataTransfer }}</span>
      </div>
    </div>
    
    <!-- Filters -->
    <div class="filters">
      <label class="filter-item">
        <input 
          type="checkbox" 
          v-model="filters.showQueries"
          class="filter-checkbox"
        />
        <span>Queries</span>
      </label>
      <label class="filter-item">
        <input 
          type="checkbox" 
          v-model="filters.showMutations"
          class="filter-checkbox"
        />
        <span>Mutations</span>
      </label>
      <label class="filter-item">
        <input 
          type="checkbox" 
          v-model="filters.showErrors"
          class="filter-checkbox"
        />
        <span>Errors Only</span>
      </label>
    </div>
    
    <!-- Request List -->
    <div class="request-list">
      <div class="request-header">
        <div class="header-method">Type</div>
        <div class="header-name">Name</div>
        <div class="header-status">Status</div>
        <div class="header-time">Time</div>
        <div class="header-size">Size</div>
      </div>
      
      <div 
        v-for="request in filteredRequests" 
        :key="request.id"
        class="request-item"
        :class="{ 'request-error': request.error }"
        @click="selectedRequest = request"
      >
        <div class="request-method">
          <span class="method-badge" :class="`method-${request.type}`">
            {{ request.type }}
          </span>
        </div>
        <div class="request-name">
          {{ request.name }}
        </div>
        <div class="request-status" :class="`status-${request.status}`">
          {{ request.statusText }}
        </div>
        <div class="request-time">
          {{ request.duration }}ms
        </div>
        <div class="request-size">
          {{ formatBytes(request.size) }}
        </div>
      </div>
    </div>
    
    <!-- Request Details -->
    <div v-if="selectedRequest" class="request-details">
      <div class="details-header">
        <h4>Request Details</h4>
        <button @click="selectedRequest = null" class="close-button">×</button>
      </div>
      
      <div class="details-content">
        <!-- General Info -->
        <div class="detail-section">
          <h5>General</h5>
          <div class="detail-item">
            <span class="detail-label">Type:</span>
            <span class="detail-value">{{ selectedRequest.type }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Key:</span>
            <span class="detail-value code">{{ JSON.stringify(selectedRequest.queryKey) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Started:</span>
            <span class="detail-value">{{ formatTime(selectedRequest.startTime) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">{{ selectedRequest.duration }}ms</span>
          </div>
        </div>
        
        <!-- Request Data -->
        <div v-if="selectedRequest.variables" class="detail-section">
          <h5>Variables</h5>
          <pre class="detail-json">{{ JSON.stringify(selectedRequest.variables, null, 2) }}</pre>
        </div>
        
        <!-- Response Data -->
        <div v-if="selectedRequest.response" class="detail-section">
          <h5>Response</h5>
          <pre class="detail-json">{{ JSON.stringify(selectedRequest.response, null, 2) }}</pre>
        </div>
        
        <!-- Error Details -->
        <div v-if="selectedRequest.error" class="detail-section">
          <h5>Error</h5>
          <div class="error-details">
            <div class="detail-item">
              <span class="detail-label">Message:</span>
              <span class="detail-value error">{{ getErrorMessage(selectedRequest.error) }}</span>
            </div>
            <div v-if="getErrorCode(selectedRequest.error)" class="detail-item">
              <span class="detail-label">Code:</span>
              <span class="detail-value">{{ getErrorCode(selectedRequest.error) }}</span>
            </div>
            <div v-if="getErrorStack(selectedRequest.error)" class="detail-item">
              <span class="detail-label">Stack:</span>
              <pre class="error-stack">{{ getErrorStack(selectedRequest.error) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'

interface NetworkRequest {
  id: string
  type: 'query' | 'mutation'
  name: string
  queryKey?: unknown[]
  variables?: unknown
  startTime: number
  endTime?: number
  duration: number
  status: 'pending' | 'success' | 'error'
  statusText: string
  size: number
  response?: unknown
  error?: unknown
}

const queryClient = useQueryClient()
const networkRequests = ref<NetworkRequest[]>([])
const selectedRequest = ref<NetworkRequest | null>(null)

const filters = reactive({
  showQueries: true,
  showMutations: true,
  showErrors: false
})

// Computed values
const filteredRequests = computed(() => {
  return networkRequests.value.filter(request => {
    if (!filters.showQueries && request.type === 'query') return false
    if (!filters.showMutations && request.type === 'mutation') return false
    if (filters.showErrors && request.status !== 'error') return false
    return true
  }).slice(-100) // Show last 100 requests
})

const failedRequests = computed(() => 
  networkRequests.value.filter(r => r.status === 'error').length
)

const avgResponseTime = computed(() => {
  const completed = networkRequests.value.filter(r => r.duration > 0)
  if (completed.length === 0) return 0
  const total = completed.reduce((sum, r) => sum + r.duration, 0)
  return Math.round(total / completed.length)
})

const totalDataTransfer = computed(() => {
  const total = networkRequests.value.reduce((sum, r) => sum + r.size, 0)
  return formatBytes(total)
})

// Helper functions
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0B'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

// Intercept query and mutation activity
const interceptQueryActivity = () => {
  const queryCache = queryClient.getQueryCache()
  const mutationCache = queryClient.getMutationCache()
  
  // Subscribe to query cache
  const unsubscribeQuery = queryCache.subscribe((event) => {
    if (!event?.query) return
    
    const query = event.query
    const queryHash = query.queryHash
    
    // Find or create request entry
    let request = networkRequests.value.find(r => r.id === queryHash)
    
    if (!request) {
      request = {
        id: queryHash,
        type: 'query',
        name: formatQueryKey(query.queryKey),
        queryKey: query.queryKey,
        startTime: Date.now(),
        duration: 0,
        status: 'pending',
        statusText: 'Pending',
        size: 0
      }
      networkRequests.value.push(request)
    }
    
    // Update based on event type
    if (event.type === 'updated') {
      const state = query.state
      
      if (state.status === 'success') {
        request.endTime = Date.now()
        request.duration = request.endTime - request.startTime
        request.status = 'success'
        request.statusText = 'Success'
        request.response = state.data
        
        try {
          request.size = JSON.stringify(state.data).length
        } catch {}
      } else if (state.status === 'error') {
        request.endTime = Date.now()
        request.duration = request.endTime - request.startTime
        request.status = 'error'
        request.statusText = 'Error'
        request.error = state.error
      }
    }
  })
  
  // Subscribe to mutation cache
  const unsubscribeMutation = mutationCache.subscribe((event) => {
    if (!event?.mutation) return
    
    const mutation = event.mutation
    const mutationId = mutation.mutationId.toString()
    
    // Find or create request entry
    let request = networkRequests.value.find(r => r.id === mutationId)
    
    if (!request) {
      request = {
        id: mutationId,
        type: 'mutation',
        name: mutation.options.mutationKey?.join('.') || 'Mutation',
        variables: mutation.state.variables,
        startTime: Date.now(),
        duration: 0,
        status: 'pending',
        statusText: 'Pending',
        size: 0
      }
      networkRequests.value.push(request)
    }
    
    // Update based on event type
    if (event.type === 'updated') {
      const state = mutation.state
      
      if (state.status === 'success') {
        request.endTime = Date.now()
        request.duration = request.endTime - request.startTime
        request.status = 'success'
        request.statusText = 'Success'
        request.response = state.data
        
        try {
          request.size = JSON.stringify(state.variables).length + 
                        (state.data ? JSON.stringify(state.data).length : 0)
        } catch {}
      } else if (state.status === 'error') {
        request.endTime = Date.now()
        request.duration = request.endTime - request.startTime
        request.status = 'error'
        request.statusText = 'Error'
        request.error = state.error
      }
    }
  })
  
  // Clean up old requests periodically
  const cleanupInterval = setInterval(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    networkRequests.value = networkRequests.value.filter(
      r => r.startTime > fiveMinutesAgo
    )
  }, 60000)
  
  return () => {
    unsubscribeQuery()
    unsubscribeMutation()
    clearInterval(cleanupInterval)
  }
}

// Error handling helpers
interface ErrorLike {
  message?: string
  code?: string | number
  stack?: string
}

const getErrorMessage = (error: unknown): string => {
  if (!error) return 'Unknown error'
  const err = error as ErrorLike
  return err.message || 'Unknown error'
}

const getErrorCode = (error: unknown): string | number | null => {
  if (!error) return null
  const err = error as ErrorLike
  return err.code || null
}

const getErrorStack = (error: unknown): string | null => {
  if (!error) return null
  const err = error as ErrorLike
  return err.stack || null
}

const formatQueryKey = (key: unknown[]): string => {
  if (!key || key.length === 0) return 'Unknown'
  return key.map(k => {
    if (typeof k === 'string') return k
    if (typeof k === 'number') return k.toString()
    if (typeof k === 'object' && k !== null) {
      // Try to extract meaningful identifiers
      if ('id' in k) return `#${k.id}`
      if ('matterId' in k) return `Matter#${k.matterId}`
      return 'Object'
    }
    return String(k)
  }).join('.')
}

// Lifecycle
let cleanup: (() => void) | null = null

onMounted(() => {
  cleanup = interceptQueryActivity()
})

onUnmounted(() => {
  cleanup?.()
})
</script>

<style scoped>
.network-monitor-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--tsqd-text, #1f2937);
  background: var(--tsqd-background, #ffffff);
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

/* Network Summary */
.network-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: var(--tsqd-background, #f9fafb);
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 6px;
}

.stat-label {
  font-size: 11px;
  color: var(--tsqd-text, #6b7280);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--tsqd-text, #1f2937);
}

.stat-value.error {
  color: #dc2626;
}

/* Filters */
.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--tsqd-border, #e5e7eb);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.filter-checkbox {
  cursor: pointer;
}

/* Request List */
.request-list {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
}

.request-header {
  display: grid;
  grid-template-columns: 80px 1fr 80px 80px 80px;
  gap: 8px;
  padding: 8px 12px;
  background: var(--tsqd-background, #f9fafb);
  border-bottom: 1px solid var(--tsqd-border, #e5e7eb);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

.request-item {
  display: grid;
  grid-template-columns: 80px 1fr 80px 80px 80px;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--tsqd-border, #f3f4f6);
  cursor: pointer;
  transition: background-color 0.2s;
}

.request-item:hover {
  background: var(--tsqd-background, #f9fafb);
}

.request-error {
  background: #fee2e2;
}

.request-error:hover {
  background: #fecaca;
}

.method-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.method-query {
  background: #dbeafe;
  color: #1e40af;
}

.method-mutation {
  background: #d1fae5;
  color: #065f46;
}

.request-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 11px;
}

.status-pending {
  color: #3730a3;
}

.status-success {
  color: #059669;
}

.status-error {
  color: #dc2626;
}

/* Request Details */
.request-details {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 50%;
  background: var(--tsqd-background, #ffffff);
  border-left: 1px solid var(--tsqd-border, #e5e7eb);
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--tsqd-border, #e5e7eb);
}

.details-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: var(--tsqd-text, #6b7280);
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-button:hover {
  color: var(--tsqd-text, #1f2937);
}

.details-content {
  padding: 16px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--tsqd-text, #1f2937);
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 12px;
}

.detail-label {
  width: 100px;
  color: var(--tsqd-text, #6b7280);
  flex-shrink: 0;
}

.detail-value {
  color: var(--tsqd-text, #1f2937);
  word-break: break-word;
}

.detail-value.code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 11px;
}

.detail-value.error {
  color: #dc2626;
}

.detail-json {
  background: var(--tsqd-background, #f9fafb);
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.error-stack {
  background: #fee2e2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  overflow-x: auto;
  white-space: pre;
}
</style>