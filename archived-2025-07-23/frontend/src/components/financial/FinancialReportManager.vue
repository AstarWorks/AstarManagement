<!-- Financial Report Manager Component -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Download, Clock, FileText, Database, FileImage, CheckCircle, AlertCircle, RotateCcw, X, RefreshCw, Settings } from 'lucide-vue-next'
import type { ExportStatus } from '~/composables/useFinancialExport'
import { useFinancialExport } from '~/composables/useFinancialExport'

/**
 * Financial Report Manager Component
 * 
 * Provides a comprehensive interface for managing financial report history,
 * viewing export status, and re-downloading previous exports.
 */

const { 
  exportQueue,
  completedExports,
  failedExports,
  retryExport,
  removeExport,
  clearCompleted,
  clearFailed,
  formatFileSize
} = useFinancialExport()

// Local state
const showDeleteDialog = ref(false)
const selectedExport = ref<ExportStatus | null>(null)
const filterStatus = ref<'all' | 'completed' | 'failed' | 'processing'>('all')

// Computed properties
const filteredExports = computed(() => {
  let exports = [...exportQueue.value]
  
  if (filterStatus.value !== 'all') {
    exports = exports.filter(exp => exp.status === filterStatus.value)
  }
  
  // Sort by creation date (newest first)
  return exports.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const exportSummary = computed(() => ({
  total: exportQueue.value.length,
  completed: completedExports.value.length,
  failed: failedExports.value.length,
  processing: exportQueue.value.filter((exp: ExportStatus) => 
    exp.status === 'pending' || exp.status === 'processing'
  ).length
}))

// Methods
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return CheckCircle
    case 'failed': return AlertCircle
    case 'processing': return Clock
    default: return Clock
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-600'
    case 'failed': return 'text-red-600'
    case 'processing': return 'text-blue-600'
    default: return 'text-gray-600'
  }
}

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'csv': return FileText
    case 'pdf': return FileImage
    case 'json': return Database
    default: return FileText
  }
}

const handleDownload = (exportItem: ExportStatus) => {
  if (exportItem.downloadUrl && typeof window !== 'undefined') {
    const link = document.createElement('a')
    link.href = exportItem.downloadUrl
    link.download = exportItem.filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

const handleRetry = async (exportId: string) => {
  try {
    await retryExport(exportId)
  } catch (err) {
    console.error('Failed to retry export:', err)
  }
}

const confirmDelete = (exportItem: ExportStatus) => {
  selectedExport.value = exportItem
  showDeleteDialog.value = true
}

const handleDelete = () => {
  if (selectedExport.value) {
    removeExport(selectedExport.value.id)
    selectedExport.value = null
    showDeleteDialog.value = false
  }
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getElapsedTime = (startDate: Date, endDate?: Date) => {
  const end = endDate || new Date()
  const elapsed = end.getTime() - startDate.getTime()
  const seconds = Math.floor(elapsed / 1000)
  
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

// Lifecycle
onMounted(() => {
  // Auto-refresh processing exports every 30 seconds
  const interval = setInterval(() => {
    const hasProcessing = exportQueue.value.some((exp: ExportStatus) => 
      exp.status === 'pending' || exp.status === 'processing'
    )
    if (hasProcessing) {
      // In a real implementation, this would refetch from API
      console.log('Refreshing export status...')
    }
  }, 30000)
  
  // Cleanup interval on unmount
  onUnmounted(() => clearInterval(interval))
})
</script>

<template>
  <div class="report-manager">
    <!-- Header -->
    <div class="manager-header">
      <div class="header-content">
        <h2 class="manager-title">Financial Report Manager</h2>
        <p class="manager-description">
          View and manage your exported financial reports
        </p>
      </div>
      
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value">{{ exportSummary.total }}</div>
          <div class="summary-label">Total Reports</div>
        </div>
        <div class="summary-card completed">
          <div class="summary-value">{{ exportSummary.completed }}</div>
          <div class="summary-label">Completed</div>
        </div>
        <div class="summary-card processing">
          <div class="summary-value">{{ exportSummary.processing }}</div>
          <div class="summary-label">Processing</div>
        </div>
        <div class="summary-card failed">
          <div class="summary-value">{{ exportSummary.failed }}</div>
          <div class="summary-label">Failed</div>
        </div>
      </div>
    </div>

    <!-- Filters and Actions -->
    <div class="toolbar">
      <div class="filter-controls">
        <label for="status-filter" class="filter-label">Filter by status:</label>
        <select 
          id="status-filter" 
          v-model="filterStatus" 
          class="filter-select"
        >
          <option value="all">All Reports</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      
      <div class="action-controls">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Settings class="w-4 h-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              @click="clearCompleted" 
              :disabled="completedExports.length === 0"
            >
              Clear Completed
            </DropdownMenuItem>
            <DropdownMenuItem 
              @click="clearFailed" 
              :disabled="failedExports.length === 0"
            >
              Clear Failed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Export List -->
    <div class="export-list">
      <div v-if="filteredExports.length === 0" class="empty-state">
        <FileText class="empty-icon" />
        <h3 class="empty-title">No reports found</h3>
        <p class="empty-description">
          {{ filterStatus === 'all' 
            ? 'No financial reports have been generated yet.' 
            : `No ${filterStatus} reports found.` 
          }}
        </p>
      </div>
      
      <div v-else class="export-grid">
        <div
          v-for="exportItem in filteredExports"
          :key="exportItem.id"
          class="export-card"
          :class="{ 
            'processing': exportItem.status === 'processing',
            'failed': exportItem.status === 'failed' 
          }"
        >
          <!-- Export Header -->
          <div class="export-header">
            <div class="export-info">
              <div class="format-badge">
                <component :is="getFormatIcon(exportItem.format)" class="w-4 h-4" />
                <span>{{ exportItem.format.toUpperCase() }}</span>
              </div>
              <h3 class="export-filename">{{ exportItem.filename }}</h3>
            </div>
            
            <div class="export-status">
              <component 
                :is="getStatusIcon(exportItem.status)" 
                class="w-5 h-5"
                :class="getStatusColor(exportItem.status)"
              />
            </div>
          </div>

          <!-- Export Details -->
          <div class="export-details">
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{{ formatDateTime(exportItem.createdAt) }}</span>
            </div>
            
            <div v-if="exportItem.completedAt" class="detail-row">
              <span class="detail-label">Completed:</span>
              <span class="detail-value">{{ formatDateTime(exportItem.completedAt) }}</span>
            </div>
            
            <div v-if="exportItem.size" class="detail-row">
              <span class="detail-label">Size:</span>
              <span class="detail-value">{{ formatFileSize(exportItem.size) }}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">
                {{ getElapsedTime(exportItem.createdAt, exportItem.completedAt) }}
              </span>
            </div>
            
            <div v-if="exportItem.error" class="error-message">
              <AlertCircle class="w-4 h-4" />
              <span>{{ exportItem.error }}</span>
            </div>
          </div>

          <!-- Progress Bar (for processing exports) -->
          <div 
            v-if="exportItem.status === 'processing'" 
            class="progress-container"
          >
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: `${exportItem.progress}%` }"
              />
            </div>
            <span class="progress-text">{{ exportItem.progress }}%</span>
          </div>

          <!-- Export Actions -->
          <div class="export-actions">
            <Button
              v-if="exportItem.status === 'completed' && exportItem.downloadUrl"
              variant="outline"
              size="sm"
              @click="handleDownload(exportItem)"
            >
              <Download class="w-4 h-4 mr-2" />
              Download
            </Button>
            
            <Button
              v-if="exportItem.status === 'failed'"
              variant="outline"
              size="sm"
              @click="handleRetry(exportItem.id)"
            >
              <RotateCcw class="w-4 h-4 mr-2" />
              Retry
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              @click="confirmDelete(exportItem)"
            >
              <X class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Export</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ selectedExport?.filename }}"? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            Cancel
          </Button>
          <Button variant="destructive" @click="handleDelete">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.report-manager {
  --spacing: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing);
}

.manager-header {
  margin-bottom: calc(var(--spacing) * 2);
}

.header-content {
  margin-bottom: var(--spacing);
}

.manager-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin: 0 0 0.5rem 0;
}

.manager-description {
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.summary-card {
  padding: 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  text-align: center;
}

.summary-card.completed {
  border-color: hsl(var(--success));
  background: hsl(var(--success) / 0.1);
}

.summary-card.processing {
  border-color: hsl(var(--warning));
  background: hsl(var(--warning) / 0.1);
}

.summary-card.failed {
  border-color: hsl(var(--destructive));
  background: hsl(var(--destructive) / 0.1);
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.summary-label {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  margin-top: 0.25rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing);
  padding: 1rem;
  background: hsl(var(--muted) / 0.3);
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) - 2px);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.export-list {
  min-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(var(--spacing) * 3);
  text-align: center;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: hsl(var(--muted-foreground));
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 0 0 0.5rem 0;
}

.empty-description {
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
}

.export-card {
  padding: 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  transition: all 0.2s ease;
}

.export-card:hover {
  border-color: hsl(var(--ring));
  box-shadow: 0 2px 8px hsl(var(--ring) / 0.1);
}

.export-card.processing {
  border-color: hsl(var(--warning));
}

.export-card.failed {
  border-color: hsl(var(--destructive));
}

.export-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.export-info {
  flex: 1;
}

.format-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  background: hsl(var(--muted));
  border-radius: calc(var(--radius) - 2px);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.5rem;
}

.export-filename {
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 0;
  word-break: break-all;
}

.export-details {
  margin-bottom: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
}

.detail-label {
  color: hsl(var(--muted-foreground));
  font-weight: 500;
}

.detail-value {
  color: hsl(var(--foreground));
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: hsl(var(--destructive) / 0.1);
  border: 1px solid hsl(var(--destructive) / 0.3);
  border-radius: calc(var(--radius) - 2px);
  color: hsl(var(--destructive));
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 0.5rem;
  background: hsl(var(--muted));
  border-radius: calc(var(--radius) - 2px);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: hsl(var(--primary));
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  min-width: 2.5rem;
  text-align: right;
}

.export-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Responsive design */
@media (max-width: 768px) {
  .export-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .export-actions {
    justify-content: stretch;
  }
  
  .export-actions > * {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 0.125rem;
  }
}
</style>