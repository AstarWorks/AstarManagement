<!--
  Matter Mutation Demo Component
  
  Interactive demo for TanStack Query enhanced mutations showing
  validation, offline support, error handling, and analytics
-->

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { z } from 'zod'
import { 
  useEnhancedCreateMatter,
  useEnhancedUpdateMatter,
  useEnhancedDeleteMatter,
  useEnhancedMoveMatter,
  useOfflineMutationQueue,
  useMutationAnalytics
} from '~/composables/useMatterMutations'
import type { CreateMatterInput, Matter } from '~/types/query'

interface Props {
  simulateOffline?: boolean
  simulateSlowNetwork?: boolean
  enableAnalytics?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  simulateOffline: false,
  simulateSlowNetwork: false,
  enableAnalytics: true
})

// Simulate network conditions
watch(() => props.simulateOffline, (offline) => {
  Object.defineProperty(navigator, 'onLine', { value: !offline })
  window.dispatchEvent(new Event(offline ? 'offline' : 'online'))
})

// Demo state
const matters = ref<Matter[]>([])
const editingMatter = ref<Matter | null>(null)
const showCreateForm = ref(true)

// Form state
const createForm = reactive<CreateMatterInput>({
  title: '',
  description: '',
  priority: 'MEDIUM' as const,
  status: 'draft' as const,
  tags: []
})

const validationErrors = ref<Record<string, string>>({})

// Enhanced mutations
const createMutation = useEnhancedCreateMatter()
const updateMutation = useEnhancedUpdateMatter() 
const deleteMutation = useEnhancedDeleteMatter()
const moveMutation = useEnhancedMoveMatter()

// Offline queue and analytics
const offlineQueue = useOfflineMutationQueue()
const analytics = useMutationAnalytics()

// Form validation
const validateForm = () => {
  validationErrors.value = {}
  
  if (!createForm.title || createForm.title.length < 3) {
    validationErrors.value.title = 'Title must be at least 3 characters'
  }
  
  if (!createForm.priority) {
    validationErrors.value.priority = 'Priority is required'
  }
  
  return Object.keys(validationErrors.value).length === 0
}

// Handlers
const handleCreate = async () => {
  if (!validateForm()) return
  
  try {
    const startTime = Date.now()
    const newMatter = await createMutation.mutateAsync(createForm)
    const latency = Date.now() - startTime
    
    if (newMatter) {
      matters.value.push(newMatter)
      analytics.trackMutation('create', true, latency)
      
      // Reset form
      Object.assign(createForm, {
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'draft',
        tags: []
      })
    }
  } catch (error) {
    const latency = Date.now() - Date.now()
    analytics.trackMutation('create', false, latency)
    console.error('Create failed:', error)
  }
}

const handleUpdate = async (matter: Matter, updates: Partial<Matter>) => {
  try {
    const startTime = Date.now()
    const updated = await updateMutation.mutateAsync({
      id: matter.id,
      data: updates
    })
    const latency = Date.now() - startTime
    
    if (updated) {
      const index = matters.value.findIndex(m => m.id === matter.id)
      if (index !== -1) {
        matters.value[index] = updated
      }
      analytics.trackMutation('update', true, latency)
      editingMatter.value = null
    }
  } catch (error) {
    analytics.trackMutation('update', false, 0)
    console.error('Update failed:', error)
  }
}

const handleDelete = async (matter: Matter) => {
  try {
    const startTime = Date.now()
    const result = await deleteMutation.softDelete(matter)
    const latency = Date.now() - startTime
    
    if (result.success) {
      if (!result.canUndo) {
        // Permanent delete - remove from list
        matters.value = matters.value.filter(m => m.id !== matter.id)
      }
      analytics.trackMutation('delete', true, latency)
    }
  } catch (error) {
    analytics.trackMutation('delete', false, 0)
    console.error('Delete failed:', error)
  }
}

const handleMove = async (matter: Matter, newStatus: string) => {
  try {
    const startTime = Date.now()
    moveMutation.startDrag(matter.id, matter.status)
    
    const moved = await moveMutation.mutateAsync({
      matterId: matter.id,
      newStatus: newStatus as any,
      newPosition: 0
    })
    const latency = Date.now() - startTime
    
    if (moved) {
      const index = matters.value.findIndex(m => m.id === matter.id)
      if (index !== -1) {
        matters.value[index] = moved
      }
      analytics.trackMutation('move', true, latency)
    }
  } catch (error) {
    analytics.trackMutation('move', false, 0)
    console.error('Move failed:', error)
  }
}

const handleUndo = (matterId: string) => {
  deleteMutation.undoDelete(matterId)
  // Matter would be restored in a real implementation
}

// Computed values
const isOnline = computed(() => offlineQueue.isOnline.value)
const queueSize = computed(() => offlineQueue.queueSize.value)
const analyticsData = computed(() => analytics.analytics.value)

const mattersByStatus = computed(() => {
  const groups = {
    DRAFT: matters.value.filter(m => m.status === 'draft'),
    ACTIVE: matters.value.filter(m => m.status === 'active'), 
    REVIEW: matters.value.filter(m => m.status === 'review'),
    COMPLETED: matters.value.filter(m => m.status === 'completed')
  }
  return groups
})

const successRate = computed(() => {
  const total = analyticsData.value.totalMutations
  if (total === 0) return 0
  return Math.round((analyticsData.value.successfulMutations / total) * 100)
})

// Demo data
onMounted(() => {
  // Add some sample matters for demonstration
  matters.value = [
    {
      id: 'demo-1',
      caseNumber: 'CASE-001',
      title: 'Sample Legal Matter 1',
      description: 'This is a demo matter for testing',
      clientName: 'Demo Client 1',
      status: 'draft',
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['demo', 'sample']
    },
    {
      id: 'demo-2', 
      caseNumber: 'CASE-002',
      title: 'Sample Legal Matter 2',
      description: 'Another demo matter',
      clientName: 'Demo Client 2',
      status: 'active',
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['demo']
    }
  ]
})
</script>

<template>
  <div class="mutation-demo">
    <!-- Header with status indicators -->
    <header class="demo-header">
      <h1>Enhanced Matter Mutations Demo</h1>
      <div class="status-indicators">
        <div class="status-item" :class="{ 'offline': !isOnline }">
          <span class="indicator" />
          {{ isOnline ? 'Online' : 'Offline' }}
        </div>
        <div v-if="queueSize > 0" class="status-item queue">
          <span class="indicator" />
          {{ queueSize }} queued
        </div>
        <div v-if="props.simulateSlowNetwork" class="status-item slow">
          <span class="indicator" />
          Slow Network
        </div>
      </div>
    </header>

    <div class="demo-content">
      <!-- Create Form -->
      <section v-if="showCreateForm" class="create-section">
        <h2>Create New Matter</h2>
        <form @submit.prevent="handleCreate" class="create-form">
          <div class="form-group">
            <label for="title">Matter Title *</label>
            <input
              id="title"
              v-model="createForm.title"
              type="text"
              :class="{ error: validationErrors.title }"
              placeholder="Enter matter title"
            />
            <span v-if="validationErrors.title" class="error-message">
              {{ validationErrors.title }}
            </span>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="createForm.description"
              placeholder="Enter description (optional)"
              rows="3"
            />
          </div>

          <div class="form-group">
            <label for="priority">Priority *</label>
            <select
              id="priority"
              v-model="createForm.priority"
              :class="{ error: validationErrors.priority }"
            >
              <option value="">Select priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <span v-if="validationErrors.priority" class="error-message">
              {{ validationErrors.priority }}
            </span>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              :disabled="createMutation.isPending.value"
              class="btn btn-primary"
            >
              {{ createMutation.isPending.value ? 'Creating...' : 'Create Matter' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Kanban Board -->
      <section class="kanban-section">
        <h2>Matter Status Board</h2>
        <div class="kanban-board">
          <div
            v-for="(statusMatters, status) in mattersByStatus"
            :key="status"
            class="kanban-column"
          >
            <h3>{{ status }}</h3>
            <div class="matter-list">
              <div
                v-for="matter in statusMatters"
                :key="matter.id"
                class="matter-card"
                :class="{ 
                  'dragging': moveMutation.isDragging(matter.id),
                  'pending-delete': deleteMutation.canUndo(matter.id)
                }"
              >
                <div class="matter-header">
                  <h4>{{ matter.title }}</h4>
                  <span class="priority" :class="matter.priority">
                    {{ matter.priority }}
                  </span>
                </div>
                
                <p v-if="matter.description" class="matter-description">
                  {{ matter.description }}
                </p>
                
                <div class="matter-actions">
                  <button
                    @click="editingMatter = matter"
                    class="btn btn-sm btn-secondary"
                  >
                    Edit
                  </button>
                  
                  <select
                    @change="handleMove(matter, ($event.target as HTMLSelectElement).value)"
                    class="status-select"
                  >
                    <option value="">Move to...</option>
                    <option v-if="status !== 'DRAFT'" value="DRAFT">Draft</option>
                    <option v-if="status !== 'ACTIVE'" value="ACTIVE">Active</option>
                    <option v-if="status !== 'REVIEW'" value="REVIEW">Review</option>
                    <option v-if="status !== 'COMPLETED'" value="COMPLETED">Completed</option>
                  </select>
                  
                  <button
                    v-if="!deleteMutation.canUndo(matter.id)"
                    @click="handleDelete(matter)"
                    class="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                  
                  <button
                    v-else
                    @click="handleUndo(matter.id)"
                    class="btn btn-sm btn-warning"
                  >
                    Undo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Analytics Panel -->
      <section v-if="props.enableAnalytics" class="analytics-section">
        <h2>Mutation Analytics</h2>
        <div class="analytics-panel" data-testid="analytics-panel">
          <div class="analytics-grid">
            <div class="metric">
              <span class="metric-label">Total Mutations</span>
              <span class="metric-value">{{ analyticsData.totalMutations }}</span>
            </div>
            
            <div class="metric">
              <span class="metric-label">Success Rate</span>
              <span class="metric-value">{{ successRate }}%</span>
            </div>
            
            <div class="metric">
              <span class="metric-label">Avg Latency</span>
              <span class="metric-value">{{ Math.round(analyticsData.averageLatency) }}ms</span>
            </div>
            
            <div class="metric">
              <span class="metric-label">Failed</span>
              <span class="metric-value error">{{ analyticsData.failedMutations }}</span>
            </div>
          </div>
          
          <div class="mutation-types">
            <h4>Mutation Types</h4>
            <div class="type-grid">
              <div class="type-item">
                <span>Create:</span>
                <span>{{ analyticsData.mutationTypes.create }}</span>
              </div>
              <div class="type-item">
                <span>Update:</span>
                <span>{{ analyticsData.mutationTypes.update }}</span>
              </div>
              <div class="type-item">
                <span>Delete:</span>
                <span>{{ analyticsData.mutationTypes.delete }}</span>
              </div>
              <div class="type-item">
                <span>Move:</span>
                <span>{{ analyticsData.mutationTypes.move }}</span>
              </div>
            </div>
          </div>
          
          <button
            @click="analytics.resetAnalytics()"
            class="btn btn-sm btn-secondary"
          >
            Reset Analytics
          </button>
        </div>
      </section>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingMatter" class="modal-overlay" @click="editingMatter = null">
      <div class="modal" @click.stop>
        <h3>Edit Matter</h3>
        <form @submit.prevent="handleUpdate(editingMatter, { title: editingMatter.title, priority: editingMatter.priority })">
          <div class="form-group">
            <label>Title</label>
            <input v-model="editingMatter.title" type="text" />
          </div>
          
          <div class="form-group">
            <label>Priority</label>
            <select v-model="editingMatter.priority">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="editingMatter = null" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mutation-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, sans-serif;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.demo-header h1 {
  margin: 0;
  color: #1f2937;
}

.status-indicators {
  display: flex;
  gap: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: #f3f4f6;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-item.offline {
  background: #fef2f2;
  color: #dc2626;
}

.status-item.queue {
  background: #fef3c7;
  color: #d97706;
}

.status-item.slow {
  background: #e0e7ff;
  color: #3730a3;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.demo-content {
  display: grid;
  gap: 2rem;
}

/* Create Form */
.create-section {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.create-form {
  display: grid;
  gap: 1rem;
  max-width: 500px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-group input.error,
.form-group select.error {
  border-color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 0.75rem;
}

/* Kanban Board */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.kanban-column {
  background: #f3f4f6;
  border-radius: 0.5rem;
  padding: 1rem;
  min-height: 400px;
}

.kanban-column h3 {
  margin: 0 0 1rem 0;
  text-align: center;
  text-transform: uppercase;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.matter-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.matter-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  transition: all 0.2s;
}

.matter-card.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.matter-card.pending-delete {
  background: #fef2f2;
  border-color: #fca5a5;
}

.matter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.matter-header h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.priority {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.priority.LOW { background: #e0f2fe; color: #0369a1; }
.priority.MEDIUM { background: #fef3c7; color: #d97706; }
.priority.HIGH { background: #fecaca; color: #dc2626; }
.priority.URGENT { background: #ddd6fe; color: #7c3aed; }

.matter-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
}

.matter-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

/* Analytics */
.analytics-section {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.metric-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.metric-value.error {
  color: #dc2626;
}

.mutation-types h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #374151;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.type-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: white;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-warning {
  background: #d97706;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #b45309;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
  
  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>