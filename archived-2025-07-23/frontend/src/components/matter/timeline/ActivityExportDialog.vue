<!--
  Activity Export Dialog Component
  
  Provides export functionality for activity timeline data:
  - Multiple export formats (PDF, CSV, JSON)
  - Date range selection
  - Format-specific options
  - Progress tracking
  - Download handling
-->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Download, 
  FileText, 
  Table, 
  Code, 
  Calendar,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader, 
  DialogTitle 
} from '~/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '~/components/ui/select'
import { Progress } from '~/components/ui/progress'
import { DatePicker } from '~/components/ui/date-picker'

// Types
import type { ActivityFilters, ActivityExportOptions } from '~/types/activity'

interface Props {
  /** Dialog open state */
  open: boolean
  /** Matter ID */
  matterId: string
  /** Current filters applied */
  filters: ActivityFilters
  /** Current search term */
  searchTerm: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:open': [open: boolean]
  'export': [options: ActivityExportOptions]
}>()

// Local state
const exportFormat = ref<'pdf' | 'csv' | 'json'>('pdf')
const includeMetadata = ref(true)
const dateRange = ref<{ from: Date; to: Date }>({
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  to: new Date()
})
const isExporting = ref(false)
const exportProgress = ref(0)
const exportError = ref<string | null>(null)
const exportSuccess = ref(false)

// Export format options
const formatOptions = [
  {
    value: 'pdf',
    label: 'PDF Report',
    description: 'Comprehensive report with formatting',
    icon: FileText,
    features: ['Formatted layout', 'Charts and graphs', 'Header/footer', 'Page numbers']
  },
  {
    value: 'csv',
    label: 'CSV Spreadsheet',
    description: 'Data for analysis in Excel/Sheets',
    icon: Table,
    features: ['Tabular data', 'Excel compatible', 'Easy filtering', 'Pivot tables']
  },
  {
    value: 'json',
    label: 'JSON Data',
    description: 'Structured data for developers',
    icon: Code,
    features: ['Complete metadata', 'API compatible', 'Developer friendly', 'No data loss']
  }
]

// Computed properties
const selectedFormatOption = computed(() => {
  return formatOptions.find(option => option.value === exportFormat.value)
})

const isValidDateRange = computed(() => {
  return dateRange.value && 
         dateRange.value.from && 
         dateRange.value.to && 
         dateRange.value.from <= dateRange.value.to
})

const canExport = computed(() => {
  return isValidDateRange.value && !isExporting.value
})

const estimatedRecords = computed(() => {
  // Mock estimation - in real app, this would come from API
  const daysDiff = dateRange.value ? 
    Math.ceil((dateRange.value.to.getTime() - dateRange.value.from.getTime()) / (1000 * 60 * 60 * 24)) : 
    0
  return Math.min(daysDiff * 10, 1000) // Rough estimate
})

// Methods
const handleExport = async () => {
  if (!canExport.value) return
  
  isExporting.value = true
  exportProgress.value = 0
  exportError.value = null
  exportSuccess.value = false
  
  try {
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      exportProgress.value = Math.min(exportProgress.value + 10, 90)
    }, 200)
    
    const exportOptions: ActivityExportOptions = {
      format: exportFormat.value,
      filters: props.filters,
      includeMetadata: includeMetadata.value,
      dateRange: dateRange.value
    }
    
    // Emit export event to parent
    emit('export', exportOptions)
    
    // Simulate completion
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    clearInterval(progressInterval)
    exportProgress.value = 100
    exportSuccess.value = true
    
    // Auto-close after success
    setTimeout(() => {
      handleClose()
    }, 1500)
    
  } catch (error) {
    exportError.value = error instanceof Error ? error.message : 'Export failed'
  } finally {
    isExporting.value = false
  }
}

const handleClose = () => {
  if (!isExporting.value) {
    emit('update:open', false)
    
    // Reset state after dialog closes
    setTimeout(() => {
      exportProgress.value = 0
      exportError.value = null
      exportSuccess.value = false
    }, 300)
  }
}

const handleFormatChange = (format: string) => {
  exportFormat.value = format as 'pdf' | 'csv' | 'json'
}

const setQuickDateRange = (days: number) => {
  const to = new Date()
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  dateRange.value = { from, to }
}

// Watch for dialog open state
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Reset state when dialog opens
    exportProgress.value = 0
    exportError.value = null
    exportSuccess.value = false
    isExporting.value = false
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Download class="w-5 h-5" />
          Export Activity Timeline
        </DialogTitle>
        <DialogDescription>
          Export activity data for matter {{ matterId }} in your preferred format.
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-6">
        <!-- Format Selection -->
        <div class="space-y-4">
          <Label class="text-base font-medium">Export Format</Label>
          <RadioGroup 
            :value="exportFormat" 
            @update:value="handleFormatChange"
            class="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div 
              v-for="option in formatOptions" 
              :key="option.value"
              class="relative"
            >
              <RadioGroupItem 
                :value="option.value" 
                :id="option.value"
                class="peer sr-only"
              />
              <Label
                :for="option.value"
                class="flex flex-col p-4 border rounded-lg cursor-pointer hover:border-accent-foreground peer-checked:border-primary peer-checked:bg-primary/5 transition-colors"
              >
                <div class="flex items-center gap-3 mb-2">
                  <component :is="option.icon" class="w-5 h-5 text-primary" />
                  <span class="font-medium">{{ option.label }}</span>
                </div>
                <p class="text-sm text-muted-foreground mb-3">
                  {{ option.description }}
                </p>
                <ul class="text-xs text-muted-foreground space-y-1">
                  <li v-for="feature in option.features" :key="feature" class="flex items-center gap-1">
                    <div class="w-1 h-1 bg-current rounded-full"></div>
                    {{ feature }}
                  </li>
                </ul>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <!-- Date Range Selection -->
        <div class="space-y-4">
          <Label class="text-base font-medium">Date Range</Label>
          
          <!-- Quick Date Range Buttons -->
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="days in [7, 30, 90]"
              :key="days"
              @click="setQuickDateRange(days)"
              variant="outline"
              size="sm"
            >
              Last {{ days }} days
            </Button>
            <Button
              @click="setQuickDateRange(365)"
              variant="outline"
              size="sm"
            >
              Last year
            </Button>
          </div>
          
          <!-- Custom Date Range -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label class="text-sm">From Date</Label>
              <DatePicker
                v-model="dateRange.from"
                placeholder="Select start date"
              />
            </div>
            <div class="space-y-2">
              <Label class="text-sm">To Date</Label>
              <DatePicker
                v-model="dateRange.to"
                placeholder="Select end date"
              />
            </div>
          </div>
          
          <div v-if="!isValidDateRange" class="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle class="w-4 h-4" />
            Please select a valid date range
          </div>
        </div>
        
        <!-- Export Options -->
        <div class="space-y-4">
          <Label class="text-base font-medium">Options</Label>
          
          <Card class="bg-muted/50">
            <CardContent class="p-4">
              <div class="flex items-center space-x-2">
                <Checkbox
                  id="include-metadata"
                  v-model:checked="includeMetadata"
                />
                <Label for="include-metadata" class="text-sm">
                  Include detailed metadata
                </Label>
              </div>
              <p class="text-xs text-muted-foreground mt-1 ml-6">
                Includes technical details like IP addresses, session IDs, and system metadata
              </p>
            </CardContent>
          </Card>
        </div>
        
        <!-- Export Summary -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base flex items-center gap-2">
              <Settings class="w-4 h-4" />
              Export Summary
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">Format:</span>
                <span class="font-medium ml-2">{{ selectedFormatOption?.label }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Date Range:</span>
                <span class="font-medium ml-2">
                  {{ dateRange?.from?.toLocaleDateString() }} - 
                  {{ dateRange?.to?.toLocaleDateString() }}
                </span>
              </div>
              <div>
                <span class="text-muted-foreground">Estimated Records:</span>
                <span class="font-medium ml-2">~{{ estimatedRecords }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Metadata:</span>
                <span class="font-medium ml-2">{{ includeMetadata ? 'Included' : 'Excluded' }}</span>
              </div>
            </div>
            
            <!-- Active Filters Summary -->
            <div v-if="filters.types?.length || filters.actors?.length">
              <div class="text-sm text-muted-foreground mb-2">Active Filters:</div>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-if="filters.types?.length"
                  class="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                >
                  {{ filters.types.length }} activity type{{ filters.types.length > 1 ? 's' : '' }}
                </span>
                <span 
                  v-if="filters.actors?.length"
                  class="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                >
                  {{ filters.actors.length }} user{{ filters.actors.length > 1 ? 's' : '' }}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Export Progress -->
        <div v-if="isExporting || exportSuccess || exportError" class="space-y-3">
          <div v-if="isExporting" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Exporting activities...</span>
              <span>{{ exportProgress }}%</span>
            </div>
            <Progress :value="exportProgress" class="w-full" />
          </div>
          
          <div v-if="exportSuccess" class="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle class="w-4 h-4" />
            Export completed successfully! Download should start automatically.
          </div>
          
          <div v-if="exportError" class="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle class="w-4 h-4" />
            {{ exportError }}
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button 
          @click="handleClose" 
          variant="outline"
          :disabled="isExporting"
        >
          Cancel
        </Button>
        <Button 
          @click="handleExport"
          :disabled="!canExport"
          class="min-w-[100px]"
        >
          <Download v-if="!isExporting" class="w-4 h-4 mr-2" />
          <div v-else class="w-4 h-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
          {{ isExporting ? 'Exporting...' : 'Export' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Custom radio group styling */
:deep(.radio-group-item:checked + label) {
  @apply border-primary bg-primary/5;
}

/* Progress bar animation */
.progress-bar {
  transition: width 0.3s ease-in-out;
}

/* Loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  :deep(.dialog-content) {
    @apply max-w-[95vw] max-h-[95vh] overflow-y-auto;
  }
  
  .grid-cols-3 {
    @apply grid-cols-1;
  }
  
  .grid-cols-2 {
    @apply grid-cols-1;
  }
}

/* Focus states for accessibility */
:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
}
</style>