<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Download, FileText, Database, FileImage, Settings, Eye, X, CheckCircle, AlertCircle, Clock, RotateCcw } from 'lucide-vue-next'
import type { FinancialFilters } from '~/types/financial'
import type { ExportOptions, ExportStatus } from '~/composables/useFinancialExport'
import { useFinancialExport } from '~/composables/useFinancialExport'
import { formatCurrency } from '~/utils/currencyFormatters'

/**
 * Financial Export Dialog Component
 * 
 * Provides a comprehensive interface for exporting financial data.
 * Includes format selection, options configuration, preview, and export queue management.
 */

interface Props {
  /** Whether the dialog is open */
  open: boolean
  /** Current financial filters */
  filters: FinancialFilters
  /** Whether to show advanced options */
  showAdvanced?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAdvanced: true
})

const emit = defineEmits<{
  /** Emitted when dialog should close */
  close: []
  /** Emitted when export is initiated */
  export: [format: string, options: ExportOptions]
}>()

// Import and use the enhanced financial export composable
const {
  isExporting,
  exportQueue,
  currentExport,
  hasActiveExports,
  completedExports,
  failedExports,
  exportAsCSV,
  exportAsJSON,
  exportAsPDF,
  exportMultiple,
  generatePreview,
  retryExport,
  removeExport,
  clearCompleted,
  clearFailed,
  formatFileSize
} = useFinancialExport()

// Local state
const selectedFormat = ref<'csv' | 'json' | 'pdf' | 'multiple'>('csv')
const selectedFormats = ref<Array<'csv' | 'json' | 'pdf'>>(['csv'])
const customFilename = ref('')
const includeCharts = ref(true)
const includeRawData = ref(true)
const showPreview = ref(false)
const showQueue = ref(false)
const preview = ref<{
  estimatedSize: string
  recordCount: number
  categories: number
  matters: number
  timeRange: string
} | null>(null)

// Format options
const formatOptions = [
  {
    value: 'csv',
    label: 'CSV',
    description: 'Spreadsheet format for data analysis',
    icon: FileText,
    features: ['Raw data', 'Excel compatible', 'Small file size'],
    defaultOptions: { includeRawData: true, includeCharts: false }
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'Structured data format for developers',
    icon: Database,
    features: ['Complete data structure', 'API compatible', 'Machine readable'],
    defaultOptions: { includeRawData: true, includeCharts: false }
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Professional report for presentations',
    icon: FileImage,
    features: ['Charts & graphs', 'Print ready', 'Professional layout'],
    defaultOptions: { includeRawData: false, includeCharts: true }
  },
  {
    value: 'multiple',
    label: 'Multiple Formats',
    description: 'Export in multiple formats at once',
    icon: Download,
    features: ['All formats', 'Batch download', 'Complete package'],
    defaultOptions: { includeRawData: true, includeCharts: true }
  }
]

// Computed properties
const currentFormatOption = computed(() => 
  formatOptions.find(option => option.value === selectedFormat.value)
)

const exportOptions = computed((): ExportOptions => ({
  filename: customFilename.value || undefined,
  includeCharts: includeCharts.value,
  includeRawData: includeRawData.value
}))

const canExport = computed(() => 
  !isExporting.value && 
  (selectedFormat.value !== 'multiple' || selectedFormats.value.length > 0)
)

const queueSummary = computed(() => ({
  total: exportQueue.value.length,
  active: exportQueue.value.filter((exp: ExportStatus) => exp.status === 'pending' || exp.status === 'processing').length,
  completed: completedExports.value.length,
  failed: failedExports.value.length
}))

// Methods
const updateFormatDefaults = () => {
  const option = currentFormatOption.value
  if (option && option.defaultOptions) {
    includeCharts.value = option.defaultOptions.includeCharts ?? true
    includeRawData.value = option.defaultOptions.includeRawData ?? true
  }
}

const toggleFormat = (format: 'csv' | 'json' | 'pdf') => {
  const index = selectedFormats.value.indexOf(format)
  if (index > -1) {
    selectedFormats.value.splice(index, 1)
  } else {
    selectedFormats.value.push(format)
  }
}

const loadPreview = async () => {
  try {
    showPreview.value = true
    preview.value = await generatePreview(props.filters)
  } catch (err) {
    console.error('Failed to load preview:', err)
    preview.value = null
  }
}

const handleExport = async () => {
  try {
    let downloadUrl: string | null = null
    
    if (selectedFormat.value === 'multiple') {
      // Export multiple formats
      const urls = await exportMultiple(
        selectedFormats.value,
        props.filters,
        exportOptions.value
      )
      downloadUrl = urls[0] || null
    } else {
      // Export single format
      if (selectedFormat.value === 'csv') {
        downloadUrl = await exportAsCSV(props.filters, exportOptions.value)
      } else if (selectedFormat.value === 'json') {
        downloadUrl = await exportAsJSON(props.filters, exportOptions.value)
      } else if (selectedFormat.value === 'pdf') {
        downloadUrl = await exportAsPDF(props.filters, exportOptions.value)
      }
    }
    
    emit('export', selectedFormat.value, exportOptions.value)
    
    // Show queue after export
    showQueue.value = true
    
    if (downloadUrl) {
      console.log('Export completed successfully')
    }
  } catch (err) {
    console.error('Export failed:', err)
    // Error is already handled by the composable
  }
}

const generateFilename = () => {
  const date = new Date().toISOString().split('T')[0]
  const period = props.filters.period
  const format = selectedFormat.value === 'multiple' ? 'package' : selectedFormat.value as string
  
  customFilename.value = `financial-report-${period}-${date}.${format}`
}

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

const handleDownload = (url: string) => {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank')
  }
}

// Watchers
watch(selectedFormat, updateFormatDefaults)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    showQueue.value = false
    showPreview.value = false
  }
})

// Lifecycle
onMounted(() => {
  updateFormatDefaults()
  generateFilename()
})
</script>

<template>
  <Dialog :open="open" @update:open="$emit('close')">
    <DialogContent class="export-dialog max-w-4xl max-h-[90vh] overflow-hidden">
      <div class="flex h-full">
        <!-- Main Export Panel -->
        <div class="flex-1 p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle class="flex items-center gap-2">
              <Download class="w-5 h-5" />
              Export Financial Data
            </DialogTitle>
            <DialogDescription>
              Export your financial data in various formats for analysis and reporting
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-6 mt-6">
            <!-- Format Selection -->
            <div class="format-selection">
              <h3 class="text-lg font-semibold mb-4">Export Format</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="option in formatOptions"
                  :key="option.value"
                  @click="selectedFormat = option.value as 'csv' | 'json' | 'pdf' | 'multiple'"
                  class="format-option"
                  :class="{ 'selected': selectedFormat === option.value }"
                >
                  <div class="format-header">
                    <component :is="option.icon" class="w-6 h-6" />
                    <div>
                      <h4 class="font-semibold">{{ option.label }}</h4>
                      <p class="text-sm text-muted-foreground">{{ option.description }}</p>
                    </div>
                    <div class="radio-indicator" />
                  </div>
                  
                  <ul class="format-features">
                    <li v-for="feature in option.features" :key="feature">
                      {{ feature }}
                    </li>
                  </ul>
                </div>
              </div>
              
              <!-- Multiple formats selection -->
              <div v-if="selectedFormat === 'multiple'" class="mt-4 p-4 border rounded-lg">
                <h4 class="font-medium mb-3">Select formats to include:</h4>
                <div class="flex gap-3">
                  <label
                    v-for="format in ['csv', 'json', 'pdf']"
                    :key="format"
                    class="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      :checked="selectedFormats.includes(format as 'csv' | 'json' | 'pdf')"
                      @update:checked="() => toggleFormat(format as 'csv' | 'json' | 'pdf')"
                    />
                    <span class="text-sm font-medium">{{ (format as string).toUpperCase() }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Export Options -->
            <div v-if="showAdvanced" class="export-options">
              <h3 class="text-lg font-semibold mb-4">Export Options</h3>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium">Custom Filename</label>
                    <p class="text-xs text-muted-foreground">Leave empty for auto-generated name</p>
                  </div>
                  <div class="flex gap-2">
                    <Input
                      v-model="customFilename"
                      placeholder="Enter filename"
                      class="w-64"
                    />
                    <Button variant="outline" size="sm" @click="generateFilename">
                      Generate
                    </Button>
                  </div>
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium">Include Charts</label>
                    <p class="text-xs text-muted-foreground">Add visual charts to the export</p>
                  </div>
                  <Switch v-model:checked="includeCharts" />
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium">Include Raw Data</label>
                    <p class="text-xs text-muted-foreground">Include detailed transaction data</p>
                  </div>
                  <Switch v-model:checked="includeRawData" />
                </div>
              </div>
            </div>

            <!-- Preview -->
            <div class="export-preview">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold">Export Preview</h3>
                <Button variant="outline" size="sm" @click="loadPreview" :disabled="showPreview">
                  <Eye class="w-4 h-4 mr-2" />
                  {{ showPreview ? 'Loaded' : 'Load Preview' }}
                </Button>
              </div>
              
              <div v-if="showPreview && preview" class="preview-content">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="preview-stat">
                    <div class="text-2xl font-bold">{{ preview.recordCount.toLocaleString() }}</div>
                    <div class="text-sm text-muted-foreground">Records</div>
                  </div>
                  <div class="preview-stat">
                    <div class="text-2xl font-bold">{{ preview.categories }}</div>
                    <div class="text-sm text-muted-foreground">Categories</div>
                  </div>
                  <div class="preview-stat">
                    <div class="text-2xl font-bold">{{ preview.matters }}</div>
                    <div class="text-sm text-muted-foreground">Matters</div>
                  </div>
                  <div class="preview-stat">
                    <div class="text-2xl font-bold">{{ preview.estimatedSize }}</div>
                    <div class="text-sm text-muted-foreground">Est. Size</div>
                  </div>
                </div>
                
                <div class="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p class="text-sm">
                    <strong>Time Range:</strong> {{ preview.timeRange }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Export Actions -->
          <div class="flex items-center justify-between mt-8 pt-6 border-t">
            <div class="flex items-center gap-2">
              <Button variant="outline" @click="showQueue = !showQueue">
                <Clock class="w-4 h-4 mr-2" />
                Export Queue ({{ queueSummary.total }})
              </Button>
              
              <div v-if="hasActiveExports" class="flex items-center gap-2 text-sm text-muted-foreground">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Exporting...
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <Button variant="outline" @click="$emit('close')">
                Cancel
              </Button>
              <Button 
                @click="handleExport" 
                :disabled="!canExport"
                class="min-w-[120px]"
              >
                <Download class="w-4 h-4 mr-2" />
                {{ isExporting ? 'Exporting...' : 'Export' }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Export Queue Sidebar -->
        <div v-if="showQueue" class="export-queue-sidebar">
          <div class="queue-header">
            <h3 class="font-semibold">Export Queue</h3>
            <Button variant="ghost" size="sm" @click="showQueue = false">
              <X class="w-4 h-4" />
            </Button>
          </div>
          
          <div class="queue-content">
            <!-- Queue Summary -->
            <div class="queue-summary">
              <div class="summary-stat">
                <span class="text-lg font-bold">{{ queueSummary.total }}</span>
                <span class="text-sm text-muted-foreground">Total</span>
              </div>
              <div class="summary-stat">
                <span class="text-lg font-bold text-blue-600">{{ queueSummary.active }}</span>
                <span class="text-sm text-muted-foreground">Active</span>
              </div>
              <div class="summary-stat">
                <span class="text-lg font-bold text-green-600">{{ queueSummary.completed }}</span>
                <span class="text-sm text-muted-foreground">Done</span>
              </div>
              <div class="summary-stat">
                <span class="text-lg font-bold text-red-600">{{ queueSummary.failed }}</span>
                <span class="text-sm text-muted-foreground">Failed</span>
              </div>
            </div>
            
            <!-- Current Export -->
            <div v-if="currentExport" class="current-export">
              <h4 class="font-medium mb-2">Current Export</h4>
              <div class="export-item active">
                <div class="export-info">
                  <div class="font-medium">{{ currentExport.filename }}</div>
                  <div class="text-sm text-muted-foreground">{{ currentExport.format.toUpperCase() }}</div>
                </div>
                <div class="export-progress">
                  <div class="w-full bg-muted rounded-full h-2">
                    <div 
                      class="bg-primary h-2 rounded-full transition-all"
                      :style="{ width: `${currentExport.progress}%` }"
                    ></div>
                  </div>
                  <span class="text-xs text-muted-foreground">{{ currentExport.progress }}%</span>
                </div>
              </div>
            </div>
            
            <!-- Export History -->
            <div class="export-history">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-medium">Recent Exports</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="sm">
                      <Settings class="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="clearCompleted" :disabled="completedExports.length === 0">
                      Clear Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="clearFailed" :disabled="failedExports.length === 0">
                      Clear Failed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div class="export-list">
                <div
                  v-for="exportItem in exportQueue"
                  :key="exportItem.id"
                  class="export-item"
                >
                  <div class="export-info">
                    <div class="flex items-center gap-2">
                      <component 
                        :is="getStatusIcon(exportItem.status)" 
                        class="w-4 h-4"
                        :class="getStatusColor(exportItem.status)"
                      />
                      <span class="font-medium text-sm">{{ exportItem.filename }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{{ exportItem.format.toUpperCase() }}</span>
                      <span v-if="exportItem.size">{{ formatFileSize(exportItem.size) }}</span>
                      <span>{{ exportItem.createdAt.toLocaleTimeString() }}</span>
                    </div>
                  </div>
                  
                  <div class="export-actions">
                    <Button
                      v-if="exportItem.status === 'completed' && exportItem.downloadUrl"
                      variant="ghost"
                      size="sm"
                      @click="() => exportItem.downloadUrl && handleDownload(exportItem.downloadUrl)"
                    >
                      <Download class="w-3 h-3" />
                    </Button>
                    <Button
                      v-if="exportItem.status === 'failed'"
                      variant="ghost"
                      size="sm"
                      @click="retryExport(exportItem.id)"
                    >
                      <RotateCcw class="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      @click="removeExport(exportItem.id)"
                    >
                      <X class="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div v-if="exportQueue.length === 0" class="text-center text-muted-foreground py-8">
                  No exports yet
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.export-dialog {
  --dialog-spacing: 1.5rem;
}

.format-selection .format-option {
  padding: 1rem;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.format-option:hover {
  border-color: hsl(var(--ring));
}

.format-option.selected {
  border-color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.05);
}

.format-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.format-header > div {
  flex: 1;
}

.radio-indicator {
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--border));
  border-radius: 50%;
  position: relative;
}

.format-option.selected .radio-indicator {
  border-color: hsl(var(--primary));
}

.format-option.selected .radio-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.5rem;
  height: 0.5rem;
  background: hsl(var(--primary));
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.format-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.format-features li {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: hsl(var(--muted));
  border-radius: calc(var(--radius) - 2px);
}

.preview-content {
  padding: 1rem;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  background: hsl(var(--muted) / 0.5);
}

.preview-stat {
  text-align: center;
  padding: 0.75rem;
  background: hsl(var(--card));
  border-radius: calc(var(--radius) - 2px);
}

.export-queue-sidebar {
  width: 350px;
  border-left: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.3);
  display: flex;
  flex-direction: column;
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: between;
  padding: 1rem;
  border-bottom: 1px solid hsl(var(--border));
}

.queue-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.queue-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.summary-stat {
  text-align: center;
  padding: 0.75rem;
  background: hsl(var(--card));
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid hsl(var(--border));
}

.current-export {
  margin-bottom: 1.5rem;
}

.export-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) - 2px);
  background: hsl(var(--card));
  margin-bottom: 0.5rem;
}

.export-item.active {
  border-color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.05);
}

.export-info {
  flex: 1;
  min-width: 0;
}

.export-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.export-actions {
  display: flex;
  gap: 0.25rem;
}

.export-list {
  max-height: 400px;
  overflow-y: auto;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .export-dialog .flex {
    flex-direction: column;
  }
  
  .export-queue-sidebar {
    width: 100%;
    max-height: 300px;
    border-left: none;
    border-top: 1px solid hsl(var(--border));
  }
  
  .format-option .format-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .queue-summary {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .format-option,
  .export-item {
    border-width: 2px;
  }
}
</style>