<template>
  <div class="legal-errors-panel">
    <h3 class="panel-title">Legal Domain Errors</h3>
    
    <!-- Error Summary -->
    <div class="error-summary">
      <div 
        v-for="category in errorCategories" 
        :key="category.type"
        class="error-category"
        :class="{ active: selectedCategory === category.type }"
        @click="selectedCategory = category.type"
      >
        <div class="category-icon">{{ category.icon }}</div>
        <div class="category-info">
          <div class="category-name">{{ category.name }}</div>
          <div class="category-count">{{ category.count }}</div>
        </div>
      </div>
    </div>
    
    <!-- Error List -->
    <div class="error-list">
      <div class="list-header">
        <h4>{{ currentCategoryName }} Errors</h4>
        <button v-if="filteredErrors.length > 0" @click="clearErrors" class="clear-button">
          Clear All
        </button>
      </div>
      
      <div v-if="filteredErrors.length === 0" class="empty-state">
        No {{ currentCategoryName.toLowerCase() }} errors recorded
      </div>
      
      <div 
        v-for="error in filteredErrors" 
        :key="error.id"
        class="error-item"
        :class="{ expanded: expandedErrors.has(error.id) }"
      >
        <div class="error-header" @click="toggleError(error.id)">
          <div class="error-main">
            <div class="error-code">{{ error.code }}</div>
            <div class="error-message">{{ error.message }}</div>
          </div>
          <div class="error-meta">
            <span class="error-time">{{ formatTime(error.timestamp) }}</span>
            <span class="error-count" v-if="error.count > 1">×{{ error.count }}</span>
          </div>
        </div>
        
        <div v-if="expandedErrors.has(error.id)" class="error-details">
          <!-- Context -->
          <div v-if="error.context" class="detail-section">
            <h5>Context</h5>
            <div class="context-items">
              <div v-if="error.context.matterId" class="context-item">
                <span class="context-label">Matter ID:</span>
                <span class="context-value">{{ error.context.matterId }}</span>
              </div>
              <div v-if="error.context.userId" class="context-item">
                <span class="context-label">User ID:</span>
                <span class="context-value">{{ error.context.userId }}</span>
              </div>
              <div v-if="error.context.operation" class="context-item">
                <span class="context-label">Operation:</span>
                <span class="context-value">{{ error.context.operation }}</span>
              </div>
            </div>
          </div>
          
          <!-- Legal Requirements -->
          <div v-if="error.legalRequirements" class="detail-section">
            <h5>Legal Requirements</h5>
            <ul class="requirements-list">
              <li v-for="req in error.legalRequirements" :key="req">
                {{ req }}
              </li>
            </ul>
          </div>
          
          <!-- Suggested Actions -->
          <div v-if="error.suggestedActions" class="detail-section">
            <h5>Suggested Actions</h5>
            <ul class="actions-list">
              <li v-for="action in error.suggestedActions" :key="action">
                {{ action }}
              </li>
            </ul>
          </div>
          
          <!-- Stack Trace -->
          <div v-if="error.stack" class="detail-section">
            <h5>Stack Trace</h5>
            <pre class="stack-trace">{{ error.stack }}</pre>
          </div>
          
          <!-- Related Queries -->
          <div v-if="error.queryKey" class="detail-section">
            <h5>Related Query</h5>
            <code class="query-key">{{ JSON.stringify(error.queryKey) }}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'

interface LegalError {
  id: string
  code: string
  message: string
  type: string
  timestamp: number
  count: number
  context?: {
    matterId?: string
    userId?: string
    operation?: string
    [key: string]: unknown
  }
  legalRequirements?: string[]
  suggestedActions?: string[]
  stack?: string
  queryKey?: unknown[]
}

const queryClient = useQueryClient()
const errors = ref<LegalError[]>([])
const selectedCategory = ref('all')
const expandedErrors = ref(new Set<string>())

// Error categories with legal domain focus
const errorCategories = computed(() => {
  const categories = [
    { type: 'all', name: 'All', icon: '📋', count: errors.value.length },
    { 
      type: 'validation', 
      name: 'Validation', 
      icon: '⚠️', 
      count: errors.value.filter(e => e.type === 'validation').length 
    },
    { 
      type: 'access', 
      name: 'Access Control', 
      icon: '🔒', 
      count: errors.value.filter(e => e.type === 'access').length 
    },
    { 
      type: 'document', 
      name: 'Document', 
      icon: '📄', 
      count: errors.value.filter(e => e.type === 'document').length 
    },
    { 
      type: 'compliance', 
      name: 'Compliance', 
      icon: '⚖️', 
      count: errors.value.filter(e => e.type === 'compliance').length 
    },
    { 
      type: 'workflow', 
      name: 'Workflow', 
      icon: '🔄', 
      count: errors.value.filter(e => e.type === 'workflow').length 
    }
  ]
  
  return categories
})

const currentCategoryName = computed(() => {
  const category = errorCategories.value.find(c => c.type === selectedCategory.value)
  return category?.name || 'All'
})

const filteredErrors = computed(() => {
  if (selectedCategory.value === 'all') {
    return errors.value
  }
  return errors.value.filter(e => e.type === selectedCategory.value)
})

// Parse and categorize legal domain errors
interface ErrorData {
  code?: string
  message?: string
  response?: {
    data?: {
      code?: string
      message?: string
      requirements?: string[]
      regulations?: string[]
      matterId?: string
      requiredRole?: string
      currentStatus?: string
      targetStatus?: string
      operation?: string
    }
    status?: number
  }
  stack?: string
}

const parseLegalError = (error: ErrorData, queryKey?: unknown[]): LegalError | null => {
  const errorCode = error?.code || error?.response?.data?.code || 'UNKNOWN'
  const errorMessage = error?.message || error?.response?.data?.message || 'Unknown error'
  
  let type = 'general'
  let legalRequirements: string[] = []
  let suggestedActions: string[] = []
  let context: Record<string, unknown> = {}
  
  // Categorize based on error code patterns
  if (errorCode.startsWith('LEGAL_VALIDATION')) {
    type = 'validation'
    legalRequirements = extractLegalRequirements(error)
    suggestedActions = [
      'Review input data for compliance',
      'Check mandatory field requirements',
      'Verify data format specifications'
    ]
  } else if (errorCode.startsWith('MATTER_ACCESS') || error?.response?.status === 403) {
    type = 'access'
    context = extractAccessContext(error, queryKey)
    suggestedActions = [
      'Verify user permissions',
      'Check matter assignment',
      'Review role-based access controls'
    ]
  } else if (errorCode.startsWith('DOC_')) {
    type = 'document'
    suggestedActions = [
      'Check document format',
      'Verify file size limits',
      'Ensure proper document permissions'
    ]
  } else if (errorCode.includes('COMPLIANCE') || errorCode.includes('REGULATORY')) {
    type = 'compliance'
    legalRequirements = extractComplianceRequirements(error)
    suggestedActions = [
      'Review regulatory requirements',
      'Check compliance deadlines',
      'Verify required documentation'
    ]
  } else if (errorCode.includes('WORKFLOW') || errorCode.includes('STATUS')) {
    type = 'workflow'
    context = extractWorkflowContext(error, queryKey)
    suggestedActions = [
      'Check current matter status',
      'Verify workflow prerequisites',
      'Review status transition rules'
    ]
  }
  
  // Extract additional context from query key
  if (queryKey) {
    context = { ...context, ...extractQueryContext(queryKey) }
  }
  
  return {
    id: `${errorCode}-${Date.now()}-${Math.random()}`,
    code: errorCode,
    message: errorMessage,
    type,
    timestamp: Date.now(),
    count: 1,
    context: Object.keys(context).length > 0 ? context : undefined,
    legalRequirements: legalRequirements.length > 0 ? legalRequirements : undefined,
    suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
    stack: error?.stack,
    queryKey
  }
}

// Extract legal requirements from validation errors
const extractLegalRequirements = (error: ErrorData): string[] => {
  const requirements: string[] = []
  
  if (error?.response?.data?.requirements) {
    requirements.push(...error.response.data.requirements)
  }
  
  // Parse common legal validation patterns
  const message = error?.message || ''
  if (message.includes('deadline')) {
    requirements.push('Must meet statutory deadline requirements')
  }
  if (message.includes('signature')) {
    requirements.push('Requires authorized signature')
  }
  if (message.includes('witness')) {
    requirements.push('Requires witness verification')
  }
  
  return requirements
}

// Extract compliance requirements
const extractComplianceRequirements = (error: ErrorData): string[] => {
  const requirements: string[] = []
  
  if (error?.response?.data?.regulations) {
    requirements.push(...error.response.data.regulations)
  }
  
  // Add default compliance checks
  requirements.push('Verify compliance with local regulations')
  requirements.push('Check data protection requirements')
  
  return requirements
}

// Extract access control context
const extractAccessContext = (error: ErrorData, queryKey?: unknown[]): Record<string, unknown> => {
  const context: Record<string, unknown> = {}
  
  if (error?.response?.data?.matterId) {
    context.matterId = error.response.data.matterId
  }
  
  if (error?.response?.data?.requiredRole) {
    context.requiredRole = error.response.data.requiredRole
  }
  
  if (queryKey && queryKey[0] === 'matters' && queryKey[1]) {
    context.matterId = queryKey[1]
  }
  
  return context
}

// Extract workflow context
const extractWorkflowContext = (error: ErrorData, queryKey?: unknown[]): Record<string, unknown> => {
  const context: Record<string, unknown> = {}
  
  if (error?.response?.data?.currentStatus) {
    context.currentStatus = error.response.data.currentStatus
  }
  
  if (error?.response?.data?.targetStatus) {
    context.targetStatus = error.response.data.targetStatus
  }
  
  if (error?.response?.data?.operation) {
    context.operation = error.response.data.operation
  }
  
  return context
}

// Extract context from query key
const extractQueryContext = (queryKey: unknown[]): Record<string, unknown> => {
  const context: Record<string, unknown> = {}
  
  if (queryKey[0] === 'matters' && queryKey[1]) {
    context.resource = 'matter'
    if (typeof queryKey[1] === 'string') {
      context.matterId = queryKey[1]
    }
  } else if (queryKey[0] === 'documents' && queryKey[1]) {
    context.resource = 'document'
    context.documentId = queryKey[1]
  }
  
  return context
}

// Intercept errors from query and mutation caches
const interceptErrors = () => {
  const queryCache = queryClient.getQueryCache()
  const mutationCache = queryClient.getMutationCache()
  
  // Subscribe to query errors
  const unsubscribeQuery = queryCache.subscribe((event) => {
    if (event?.query?.state?.status === 'error') {
      const error = parseLegalError(event.query.state.error, event.query.queryKey)
      if (error) {
        addError(error)
      }
    }
  })
  
  // Subscribe to mutation errors
  const unsubscribeMutation = mutationCache.subscribe((event) => {
    if (event?.mutation?.state?.status === 'error') {
      const error = parseLegalError(
        event.mutation.state.error, 
        event.mutation.options.mutationKey as unknown[]
      )
      if (error) {
        addError(error)
      }
    }
  })
  
  return () => {
    unsubscribeQuery()
    unsubscribeMutation()
  }
}

// Add error with deduplication
const addError = (newError: LegalError) => {
  const existingIndex = errors.value.findIndex(
    e => e.code === newError.code && e.message === newError.message
  )
  
  if (existingIndex !== -1) {
    // Increment count for duplicate errors
    errors.value[existingIndex].count++
    errors.value[existingIndex].timestamp = newError.timestamp
  } else {
    // Add new error
    errors.value.unshift(newError)
    
    // Keep only last 100 errors
    if (errors.value.length > 100) {
      errors.value = errors.value.slice(0, 100)
    }
  }
}

// UI actions
const toggleError = (errorId: string) => {
  if (expandedErrors.value.has(errorId)) {
    expandedErrors.value.delete(errorId)
  } else {
    expandedErrors.value.add(errorId)
  }
}

const clearErrors = () => {
  if (selectedCategory.value === 'all') {
    errors.value = []
  } else {
    errors.value = errors.value.filter(e => e.type !== selectedCategory.value)
  }
  expandedErrors.value.clear()
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// Lifecycle
let cleanup: (() => void) | null = null

onMounted(() => {
  cleanup = interceptErrors()
})

onUnmounted(() => {
  cleanup?.()
})
</script>

<style scoped>
.legal-errors-panel {
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

/* Error Summary */
.error-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.error-category {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--tsqd-background, #f9fafb);
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.error-category:hover {
  border-color: var(--tsqd-accent, #3b82f6);
}

.error-category.active {
  background: var(--tsqd-accent, #3b82f6);
  color: white;
  border-color: var(--tsqd-accent, #3b82f6);
}

.category-icon {
  font-size: 24px;
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 13px;
  font-weight: 500;
}

.category-count {
  font-size: 20px;
  font-weight: 600;
  margin-top: 2px;
}

/* Error List */
.error-list {
  flex: 1;
  overflow-y: auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.clear-button {
  padding: 6px 12px;
  background: var(--tsqd-background, #ffffff);
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-button:hover {
  background: var(--tsqd-background, #f9fafb);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--tsqd-text, #6b7280);
  font-size: 14px;
}

/* Error Items */
.error-item {
  margin-bottom: 12px;
  background: var(--tsqd-background, #ffffff);
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
}

.error-item.expanded {
  border-color: var(--tsqd-accent, #3b82f6);
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.error-header:hover {
  background: var(--tsqd-background, #f9fafb);
}

.error-main {
  flex: 1;
  min-width: 0;
}

.error-code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 4px;
}

.error-message {
  font-size: 13px;
  color: var(--tsqd-text, #1f2937);
  line-height: 1.4;
}

.error-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.error-time {
  font-size: 11px;
  color: var(--tsqd-text, #6b7280);
}

.error-count {
  padding: 2px 6px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

/* Error Details */
.error-details {
  padding: 0 12px 12px 12px;
  border-top: 1px solid var(--tsqd-border, #e5e7eb);
}

.detail-section {
  margin-top: 16px;
}

.detail-section h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--tsqd-text, #6b7280);
  text-transform: uppercase;
}

.context-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.context-item {
  display: flex;
  font-size: 12px;
}

.context-label {
  width: 100px;
  color: var(--tsqd-text, #6b7280);
}

.context-value {
  font-family: 'Monaco', 'Courier New', monospace;
  color: var(--tsqd-text, #1f2937);
}

.requirements-list,
.actions-list {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  line-height: 1.6;
}

.requirements-list li {
  color: #dc2626;
}

.actions-list li {
  color: #059669;
}

.stack-trace {
  background: var(--tsqd-background, #f9fafb);
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre;
}

.query-key {
  display: block;
  background: var(--tsqd-background, #f9fafb);
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 6px;
  padding: 8px 12px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  overflow-x: auto;
}
</style>