---
task_id: T09_S03_M003
title: Multi-Format Export with Configuration and Progress Tracking
status: pending
estimated_hours: 7
actual_hours: null
assigned_to: Claude
dependencies: ["T08_S03_M003_Bulk_Operations", "T07_S03_M003_Tag_Management_UI"]  
complexity: Medium
updated: null
completed: null
---

# T09_S03_M003: Multi-Format Export with Configuration and Progress Tracking

## Description
Implement comprehensive export functionality supporting multiple formats (CSV, Excel, PDF) with configurable export options, real-time progress indicators, and robust download management. Build upon the existing expense data structure and bulk operations infrastructure to provide legal firms with flexible reporting and data extraction capabilities for compliance and analysis purposes.

## Acceptance Criteria
- [ ] Support CSV, Excel, and PDF export formats
- [ ] Implement export configuration interface with field selection
- [ ] Add date range filtering and custom criteria
- [ ] Create progress indicators for large export operations
- [ ] Build download management with retry functionality
- [ ] Support template-based PDF reports with legal firm branding
- [ ] Implement scheduled exports for recurring reports
- [ ] Add export history tracking and re-download capabilities
- [ ] Handle large datasets with streaming and pagination
- [ ] Japanese localization for all export interfaces and generated files

## Technical Details

### 1. Export Configuration Dialog

**Location**: `frontend/app/components/exports/ExportConfigurationDialog.vue`

```vue
<template>
  <Dialog v-model:open="dialogOpen" class="export-dialog">
    <DialogContent class="export-config-dialog">
      <DialogHeader>
        <DialogTitle>
          <Icon name="lucide:download" class="w-5 h-5 mr-2" />
          {{ $t('exports.configuration.title') }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('exports.configuration.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="export-config-content">
        <!-- Export Format Selection -->
        <div class="config-section">
          <div class="section-header">
            <h4>{{ $t('exports.format.title') }}</h4>
          </div>
          
          <div class="format-options">
            <div
              v-for="format in availableFormats"
              :key="format.value"
              class="format-option"
              :class="{ selected: selectedFormat === format.value }"
              @click="selectedFormat = format.value"
            >
              <div class="format-icon">
                <Icon :name="format.icon" class="w-8 h-8" />
              </div>
              <div class="format-info">
                <h5>{{ format.label }}</h5>
                <p class="format-description">{{ format.description }}</p>
                <div class="format-features">
                  <Badge
                    v-for="feature in format.features"
                    :key="feature"
                    variant="secondary"
                    size="sm"
                  >
                    {{ feature }}
                  </Badge>
                </div>
              </div>
              <div class="format-selector">
                <RadioGroupItem :value="format.value" />
              </div>
            </div>
          </div>
        </div>

        <!-- Data Selection -->
        <div class="config-section">
          <div class="section-header">
            <h4>{{ $t('exports.data.title') }}</h4>
            <Badge variant="outline">
              {{ selectedExpenses.length }} {{ $t('exports.data.expenses') }}
            </Badge>
          </div>

          <!-- Date Range Filter -->
          <div class="date-range-filter">
            <div class="filter-header">
              <Checkbox
                v-model:checked="useDateRange"
                id="use-date-range"
              />
              <Label for="use-date-range" class="ml-2">
                {{ $t('exports.filters.dateRange') }}
              </Label>
            </div>
            
            <div v-if="useDateRange" class="date-range-inputs">
              <div class="date-input">
                <Label>{{ $t('exports.filters.startDate') }}</Label>
                <DatePicker v-model="dateRange.start" />
              </div>
              <div class="date-input">
                <Label>{{ $t('exports.filters.endDate') }}</Label>
                <DatePicker v-model="dateRange.end" />
              </div>
            </div>
          </div>

          <!-- Additional Filters -->
          <div class="additional-filters">
            <div class="filter-group">
              <Label>{{ $t('exports.filters.categories') }}</Label>
              <MultiSelect
                v-model="selectedCategories"
                :options="availableCategories"
                :placeholder="$t('exports.filters.allCategories')"
              />
            </div>
            
            <div class="filter-group">
              <Label>{{ $t('exports.filters.tags') }}</Label>
              <MultiSelect
                v-model="selectedTags"
                :options="availableTags"
                :placeholder="$t('exports.filters.allTags')"
              />
            </div>
            
            <div class="filter-group">
              <Label>{{ $t('exports.filters.status') }}</Label>
              <MultiSelect
                v-model="selectedStatuses"
                :options="availableStatuses"
                :placeholder="$t('exports.filters.allStatuses')"
              />
            </div>
          </div>
        </div>

        <!-- Field Selection -->
        <div class="config-section">
          <div class="section-header">
            <h4>{{ $t('exports.fields.title') }}</h4>
            <div class="field-actions">
              <Button variant="ghost" size="sm" @click="selectAllFields">
                {{ $t('exports.fields.selectAll') }}
              </Button>
              <Button variant="ghost" size="sm" @click="selectEssentialFields">
                {{ $t('exports.fields.selectEssential') }}
              </Button>
            </div>
          </div>
          
          <div class="field-selection">
            <div class="field-categories">
              <div
                v-for="category in fieldCategories"
                :key="category.key"
                class="field-category"
              >
                <div class="category-header">
                  <Checkbox
                    :checked="isCategorySelected(category.key)"
                    :indeterminate="isCategoryPartiallySelected(category.key)"
                    @update:checked="toggleCategorySelection(category.key, $event)"
                  />
                  <Label class="category-label">{{ category.label }}</Label>
                </div>
                
                <div class="category-fields">
                  <div
                    v-for="field in category.fields"
                    :key="field.key"
                    class="field-option"
                  >
                    <Checkbox
                      v-model:checked="selectedFields[field.key]"
                      :id="`field-${field.key}`"
                    />
                    <Label :for="`field-${field.key}`" class="field-label">
                      {{ field.label }}
                    </Label>
                    <span v-if="field.required" class="field-required">*</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PDF-Specific Options -->
        <div v-if="selectedFormat === 'pdf'" class="config-section">
          <div class="section-header">
            <h4>{{ $t('exports.pdf.title') }}</h4>
          </div>
          
          <div class="pdf-options">
            <div class="option-group">
              <Label>{{ $t('exports.pdf.template') }}</Label>
              <Select v-model="pdfTemplate">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    {{ $t('exports.pdf.templates.standard') }}
                  </SelectItem>
                  <SelectItem value="detailed">
                    {{ $t('exports.pdf.templates.detailed') }}
                  </SelectItem>
                  <SelectItem value="summary">
                    {{ $t('exports.pdf.templates.summary') }}
                  </SelectItem>
                  <SelectItem value="legal">
                    {{ $t('exports.pdf.templates.legal') }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div class="option-group">
              <Checkbox v-model:checked="includeSummaryStats" id="include-stats" />
              <Label for="include-stats" class="ml-2">
                {{ $t('exports.pdf.includeSummaryStats') }}
              </Label>
            </div>
            
            <div class="option-group">
              <Checkbox v-model:checked="includeCharts" id="include-charts" />
              <Label for="include-charts" class="ml-2">
                {{ $t('exports.pdf.includeCharts') }}
              </Label>
            </div>
            
            <div class="option-group">
              <Checkbox v-model:checked="includeAttachments" id="include-attachments" />
              <Label for="include-attachments" class="ml-2">
                {{ $t('exports.pdf.includeAttachments') }}
              </Label>
            </div>
          </div>
        </div>

        <!-- Advanced Options -->
        <div class="config-section">
          <div class="section-header">
            <h4>{{ $t('exports.advanced.title') }}</h4>
          </div>
          
          <div class="advanced-options">
            <div class="option-group">
              <Label>{{ $t('exports.advanced.filename') }}</Label>
              <Input
                v-model="customFilename"
                :placeholder="generateDefaultFilename()"
              />
              <p class="option-help">
                {{ $t('exports.advanced.filenameHelp') }}
              </p>
            </div>
            
            <div class="option-group">
              <Checkbox v-model:checked="compressFile" id="compress-file" />
              <Label for="compress-file" class="ml-2">
                {{ $t('exports.advanced.compress') }}
              </Label>
            </div>
            
            <div class="option-group">
              <Checkbox v-model:checked="emailWhenComplete" id="email-complete" />
              <Label for="email-complete" class="ml-2">
                {{ $t('exports.advanced.emailWhenComplete') }}
              </Label>
            </div>
          </div>
        </div>

        <!-- Export Preview -->
        <div class="config-section">
          <div class="section-header">
            <h4>{{ $t('exports.preview.title') }}</h4>
          </div>
          
          <div class="export-preview">
            <div class="preview-stats">
              <div class="stat-item">
                <span class="stat-label">{{ $t('exports.preview.estimatedRows') }}</span>
                <span class="stat-value">{{ estimatedRowCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ $t('exports.preview.estimatedSize') }}</span>
                <span class="stat-value">{{ formatFileSize(estimatedFileSize) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ $t('exports.preview.estimatedTime') }}</span>
                <span class="stat-value">{{ estimatedProcessingTime }}</span>
              </div>
            </div>
            
            <div v-if="previewData.length > 0" class="preview-table">
              <h5>{{ $t('exports.preview.sampleData') }}</h5>
              <div class="preview-grid">
                <div class="preview-header">
                  <div
                    v-for="field in selectedFieldsList"
                    :key="field.key"
                    class="preview-cell header"
                  >
                    {{ field.label }}
                  </div>
                </div>
                <div
                  v-for="(row, index) in previewData.slice(0, 3)"
                  :key="index"
                  class="preview-row"
                >
                  <div
                    v-for="field in selectedFieldsList"
                    :key="field.key"
                    class="preview-cell"
                  >
                    {{ formatPreviewValue(row[field.key], field.type) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <div class="dialog-footer-content">
          <Button variant="outline" @click="saveAsTemplate">
            <Icon name="lucide:save" class="w-4 h-4 mr-2" />
            {{ $t('exports.actions.saveTemplate') }}
          </Button>
          
          <div class="primary-actions">
            <Button variant="outline" @click="dialogOpen = false">
              {{ $t('common.cancel') }}
            </Button>
            <Button @click="startExport" :disabled="!canExport">
              <Icon name="lucide:download" class="w-4 h-4 mr-2" />
              {{ $t('exports.actions.startExport') }}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { IExpense, ExpenseCategory, ExpenseStatus } from '~/types/expense'
import type { ITag } from '~/types/expense/tag'
import { useExportConfiguration } from '~/composables/useExportConfiguration'

interface Props {
  open: boolean
  selectedExpenses: IExpense[]
  preselectedFormat?: 'csv' | 'excel' | 'pdf'
}

interface Emits {
  (event: 'update:open', value: boolean): void
  (event: 'exportStarted', config: ExportConfiguration): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const dialogOpen = useVModel(props, 'open', emit)

// Composables
const {
  availableFormats,
  fieldCategories,
  availableCategories,
  availableTags,
  availableStatuses,
  generatePreview,
  estimateFileSize,
  estimateProcessingTime
} = useExportConfiguration()

// Configuration state
const selectedFormat = ref<'csv' | 'excel' | 'pdf'>(props.preselectedFormat || 'csv')
const selectedFields = ref<Record<string, boolean>>({})
const selectedCategories = ref<string[]>([])
const selectedTags = ref<string[]>([])
const selectedStatuses = ref<string[]>([])
const useDateRange = ref(false)
const dateRange = ref({ start: null, end: null })
const customFilename = ref('')
const compressFile = ref(false)
const emailWhenComplete = ref(false)

// PDF-specific options
const pdfTemplate = ref('standard')
const includeSummaryStats = ref(true)
const includeCharts = ref(false)
const includeAttachments = ref(false)

// Computed
const selectedFieldsList = computed(() => 
  fieldCategories.value
    .flatMap(cat => cat.fields)
    .filter(field => selectedFields.value[field.key])
)

const estimatedRowCount = computed(() => {
  // Apply filters to get actual count
  let filtered = props.selectedExpenses
  
  if (useDateRange.value && dateRange.value.start && dateRange.value.end) {
    filtered = filtered.filter(expense => {
      const expenseDate = new Date(expense.expenseDate)
      return expenseDate >= dateRange.value.start && expenseDate <= dateRange.value.end
    })
  }
  
  return filtered.length
})

const estimatedFileSize = computed(() => 
  estimateFileSize(estimatedRowCount.value, selectedFieldsList.value.length, selectedFormat.value)
)

const estimatedProcessingTime = computed(() =>
  estimateProcessingTime(estimatedRowCount.value, selectedFormat.value)
)

const canExport = computed(() => 
  selectedFieldsList.value.length > 0 && estimatedRowCount.value > 0
)

const previewData = computed(() => 
  generatePreview(props.selectedExpenses.slice(0, 3), selectedFieldsList.value)
)

// Methods
const generateDefaultFilename = (): string => {
  const date = new Date().toISOString().split('T')[0]
  const formatExt = selectedFormat.value === 'excel' ? 'xlsx' : selectedFormat.value
  return `expenses-export-${date}.${formatExt}`
}

const startExport = () => {
  const config: ExportConfiguration = {
    format: selectedFormat.value,
    fields: selectedFieldsList.value,
    filters: {
      categories: selectedCategories.value,
      tags: selectedTags.value,
      statuses: selectedStatuses.value,
      dateRange: useDateRange.value ? dateRange.value : undefined
    },
    options: {
      filename: customFilename.value || generateDefaultFilename(),
      compress: compressFile.value,
      emailWhenComplete: emailWhenComplete.value,
      pdfTemplate: selectedFormat.value === 'pdf' ? pdfTemplate.value : undefined,
      includeSummaryStats: includeSummaryStats.value,
      includeCharts: includeCharts.value,
      includeAttachments: includeAttachments.value
    }
  }
  
  emit('exportStarted', config)
  dialogOpen.value = false
}

// Initialize with default field selection
onMounted(() => {
  selectEssentialFields()
})
</script>
```

### 2. Export Progress Dialog

**Location**: `frontend/app/components/exports/ExportProgressDialog.vue`

```vue
<template>
  <Dialog v-model:open="dialogOpen" :close-on-escape="false" :close-on-click-outside="false">
    <DialogContent class="export-progress-dialog">
      <DialogHeader>
        <DialogTitle>
          <Icon name="lucide:download" class="w-5 h-5 mr-2" />
          {{ $t('exports.progress.title') }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('exports.progress.description', { format: exportConfig.format.toUpperCase() }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="progress-content">
        <!-- Overall Progress -->
        <div class="progress-section">
          <div class="progress-header">
            <div class="progress-info">
              <h4>{{ currentStepText }}</h4>
              <div class="progress-stats">
                <span class="processed-count">
                  {{ processedCount }} / {{ totalCount }}
                </span>
                <span class="progress-percentage">
                  ({{ Math.round(progressPercentage) }}%)
                </span>
              </div>
            </div>
            
            <div class="progress-time">
              <span class="elapsed-time">
                {{ $t('exports.progress.elapsed') }}: {{ formatDuration(elapsedTime) }}
              </span>
              <span v-if="estimatedTimeRemaining" class="remaining-time">
                {{ $t('exports.progress.remaining') }}: {{ formatDuration(estimatedTimeRemaining) }}
              </span>
            </div>
          </div>
          
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ 
                width: `${progressPercentage}%`,
                transition: 'width 0.3s ease'
              }"
            />
          </div>
        </div>

        <!-- Step-by-Step Progress -->
        <div class="steps-progress">
          <div
            v-for="(step, index) in exportSteps"
            :key="step.key"
            class="progress-step"
            :class="{
              active: currentStepIndex === index,
              completed: currentStepIndex > index,
              error: step.error
            }"
          >
            <div class="step-indicator">
              <Icon 
                v-if="step.error"
                name="lucide:alert-circle"
                class="w-4 h-4 text-red-500"
              />
              <Icon 
                v-else-if="currentStepIndex > index"
                name="lucide:check"
                class="w-4 h-4 text-green-500"
              />
              <Icon 
                v-else-if="currentStepIndex === index"
                name="lucide:loader-2"
                class="w-4 h-4 animate-spin text-blue-500"
              />
              <div v-else class="step-number">{{ index + 1 }}</div>
            </div>
            
            <div class="step-content">
              <div class="step-title">{{ step.title }}</div>
              <div v-if="step.description" class="step-description">
                {{ step.description }}
              </div>
              <div v-if="step.error" class="step-error">
                {{ step.error }}
              </div>
            </div>
            
            <div v-if="step.duration" class="step-duration">
              {{ formatDuration(step.duration) }}
            </div>
          </div>
        </div>

        <!-- Processing Details -->
        <div v-if="processingDetails" class="processing-details">
          <div class="details-header">
            <h5>{{ $t('exports.progress.processingDetails') }}</h5>
            <Button 
              variant="ghost" 
              size="sm" 
              @click="showDetails = !showDetails"
            >
              {{ showDetails ? $t('common.hideDetails') : $t('common.showDetails') }}
            </Button>
          </div>
          
          <div v-if="showDetails" class="details-content">
            <div class="detail-row">
              <span class="detail-label">{{ $t('exports.progress.recordsProcessed') }}</span>
              <span class="detail-value">{{ processingDetails.recordsProcessed }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('exports.progress.bytesGenerated') }}</span>
              <span class="detail-value">{{ formatFileSize(processingDetails.bytesGenerated) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('exports.progress.averageSpeed') }}</span>
              <span class="detail-value">
                {{ processingDetails.averageSpeed }} {{ $t('exports.progress.recordsPerSecond') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Error Summary -->
        <div v-if="errors.length > 0" class="error-summary">
          <div class="error-header">
            <Icon name="lucide:alert-triangle" class="w-4 h-4 text-yellow-500" />
            <span>{{ $t('exports.progress.warnings') }} ({{ errors.length }})</span>
          </div>
          
          <div class="error-list">
            <div
              v-for="error in errors.slice(0, 3)"
              :key="error.id"
              class="error-item"
            >
              <span class="error-message">{{ error.message }}</span>
              <span class="error-context">{{ error.context }}</span>
            </div>
            
            <div v-if="errors.length > 3" class="more-errors">
              {{ $t('exports.progress.andXMoreErrors', { count: errors.length - 3 }) }}
            </div>
          </div>
        </div>

        <!-- Completion Status -->
        <div v-if="isComplete" class="completion-status">
          <div v-if="isSuccess" class="success-status">
            <Icon name="lucide:check-circle" class="w-6 h-6 text-green-500" />
            <div class="status-content">
              <h4>{{ $t('exports.progress.completed') }}</h4>
              <p>{{ $t('exports.progress.completedDescription') }}</p>
              
              <div class="completion-stats">
                <div class="stat-item">
                  <span class="stat-label">{{ $t('exports.progress.totalRecords') }}</span>
                  <span class="stat-value">{{ totalCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ $t('exports.progress.fileSize') }}</span>
                  <span class="stat-value">{{ formatFileSize(finalFileSize) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ $t('exports.progress.totalTime') }}</span>
                  <span class="stat-value">{{ formatDuration(elapsedTime) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="error-status">
            <Icon name="lucide:x-circle" class="w-6 h-6 text-red-500" />
            <div class="status-content">
              <h4>{{ $t('exports.progress.failed') }}</h4>
              <p>{{ failureMessage }}</p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <div class="dialog-footer-content">
          <!-- Cancel/Stop -->
          <Button 
            v-if="!isComplete"
            variant="outline"
            @click="cancelExport"
            :disabled="cancelling"
          >
            <Icon 
              :name="cancelling ? 'lucide:loader-2' : 'lucide:x'"
              :class="{ 'animate-spin': cancelling, 'w-4 h-4 mr-2': true }"
            />
            {{ cancelling ? $t('exports.actions.cancelling') : $t('exports.actions.cancel') }}
          </Button>
          
          <!-- Download/Retry -->
          <div v-if="isComplete" class="completion-actions">
            <Button
              v-if="!isSuccess"
              variant="outline"
              @click="retryExport"
            >
              <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
              {{ $t('exports.actions.retry') }}
            </Button>
            
            <Button
              v-if="isSuccess && downloadUrl"
              @click="downloadFile"
            >
              <Icon name="lucide:download" class="w-4 h-4 mr-2" />
              {{ $t('exports.actions.download') }}
            </Button>
            
            <Button variant="outline" @click="dialogOpen = false">
              {{ $t('common.close') }}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { ExportConfiguration, ExportProgress } from '~/types/export'
import { useExportProgress } from '~/composables/useExportProgress'

interface Props {
  open: boolean
  exportConfig: ExportConfiguration
  exportId: string
}

interface Emits {
  (event: 'update:open', value: boolean): void
  (event: 'completed', success: boolean): void
  (event: 'cancelled'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const dialogOpen = useVModel(props, 'open', emit)

// Composables
const {
  progress,
  isComplete,
  isSuccess,
  cancelExport,
  retryExport,
  downloadFile
} = useExportProgress(props.exportId)

// Computed progress values
const currentStepIndex = computed(() => progress.value.currentStep)
const currentStepText = computed(() => progress.value.stepText)
const processedCount = computed(() => progress.value.processed)
const totalCount = computed(() => progress.value.total)
const progressPercentage = computed(() => 
  totalCount.value > 0 ? (processedCount.value / totalCount.value) * 100 : 0
)
const elapsedTime = computed(() => progress.value.elapsedTime)
const estimatedTimeRemaining = computed(() => progress.value.estimatedTimeRemaining)

// Watch for completion
watch(isComplete, (complete) => {
  if (complete) {
    emit('completed', isSuccess.value)
  }
})

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
  } else if (minutes > 0) {
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  } else {
    return `${seconds}s`
  }
}
</script>
```

### 3. Export Manager Component

**Location**: `frontend/app/components/exports/ExportManager.vue`

```vue
<template>
  <div class="export-manager">
    <!-- Export History -->
    <Card>
      <CardHeader>
        <div class="flex justify-between items-center">
          <div>
            <CardTitle>{{ $t('exports.history.title') }}</CardTitle>
            <CardDescription>{{ $t('exports.history.description') }}</CardDescription>
          </div>
          
          <Button @click="refreshHistory">
            <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
            {{ $t('common.refresh') }}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div v-if="exportHistory.length === 0" class="empty-history">
          <EmptyState
            :title="$t('exports.history.empty.title')"
            :description="$t('exports.history.empty.description')"
            icon="lucide:download"
          />
        </div>
        
        <div v-else class="history-list">
          <div
            v-for="exportItem in exportHistory"
            :key="exportItem.id"
            class="history-item"
          >
            <div class="item-icon">
              <Icon :name="getFormatIcon(exportItem.format)" class="w-6 h-6" />
            </div>
            
            <div class="item-details">
              <div class="item-header">
                <h4 class="item-name">{{ exportItem.filename }}</h4>
                <div class="item-meta">
                  <Badge
                    :variant="getStatusVariant(exportItem.status)"
                    size="sm"
                  >
                    {{ $t(`exports.status.${exportItem.status}`) }}
                  </Badge>
                  <span class="item-date">
                    {{ formatDate(exportItem.createdAt) }}
                  </span>
                </div>
              </div>
              
              <div class="item-info">
                <div class="info-stats">
                  <span class="stat">
                    {{ exportItem.recordCount }} {{ $t('exports.history.records') }}
                  </span>
                  <span class="stat">
                    {{ formatFileSize(exportItem.fileSize) }}
                  </span>
                  <span v-if="exportItem.duration" class="stat">
                    {{ formatDuration(exportItem.duration) }}
                  </span>
                </div>
                
                <div v-if="exportItem.status === 'processing'" class="progress-indicator">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill"
                      :style="{ width: `${exportItem.progress}%` }"
                    />
                  </div>
                  <span class="progress-text">{{ exportItem.progress }}%</span>
                </div>
              </div>
            </div>
            
            <div class="item-actions">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="sm">
                    <Icon name="lucide:more-horizontal" class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    v-if="exportItem.status === 'completed'"
                    @click="downloadExport(exportItem)"
                  >
                    <Icon name="lucide:download" class="w-4 h-4 mr-2" />
                    {{ $t('exports.actions.download') }}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem @click="viewExportDetails(exportItem)">
                    <Icon name="lucide:eye" class="w-4 h-4 mr-2" />
                    {{ $t('exports.actions.viewDetails') }}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    v-if="exportItem.status === 'failed'"
                    @click="retryExport(exportItem)"
                  >
                    <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
                    {{ $t('exports.actions.retry') }}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    v-if="exportItem.status === 'processing'"
                    @click="cancelExport(exportItem)"
                  >
                    <Icon name="lucide:x" class="w-4 h-4 mr-2" />
                    {{ $t('exports.actions.cancel') }}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    @click="deleteExport(exportItem)"
                    class="text-destructive"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
                    {{ $t('exports.actions.delete') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Export Templates -->
    <Card>
      <CardHeader>
        <CardTitle>{{ $t('exports.templates.title') }}</CardTitle>
        <CardDescription>{{ $t('exports.templates.description') }}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div v-if="exportTemplates.length === 0" class="empty-templates">
          <p class="text-sm text-muted-foreground">
            {{ $t('exports.templates.empty') }}
          </p>
        </div>
        
        <div v-else class="templates-grid">
          <div
            v-for="template in exportTemplates"
            :key="template.id"
            class="template-card"
          >
            <div class="template-header">
              <Icon :name="getFormatIcon(template.format)" class="w-5 h-5" />
              <h5 class="template-name">{{ template.name }}</h5>
            </div>
            
            <p class="template-description">{{ template.description }}</p>
            
            <div class="template-meta">
              <span class="template-format">{{ template.format.toUpperCase() }}</span>
              <span class="template-fields">
                {{ template.selectedFields.length }} {{ $t('exports.templates.fields') }}
              </span>
            </div>
            
            <div class="template-actions">
              <Button size="sm" @click="useTemplate(template)">
                {{ $t('exports.templates.use') }}
              </Button>
              <Button variant="ghost" size="sm" @click="editTemplate(template)">
                <Icon name="lucide:edit" class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Scheduled Exports -->
    <Card>
      <CardHeader>
        <div class="flex justify-between items-center">
          <div>
            <CardTitle>{{ $t('exports.scheduled.title') }}</CardTitle>
            <CardDescription>{{ $t('exports.scheduled.description') }}</CardDescription>
          </div>
          
          <Button @click="createScheduledExport">
            <Icon name="lucide:calendar-plus" class="w-4 h-4 mr-2" />
            {{ $t('exports.scheduled.create') }}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div v-if="scheduledExports.length === 0" class="empty-scheduled">
          <p class="text-sm text-muted-foreground">
            {{ $t('exports.scheduled.empty') }}
          </p>
        </div>
        
        <div v-else class="scheduled-list">
          <div
            v-for="scheduled in scheduledExports"
            :key="scheduled.id"
            class="scheduled-item"
          >
            <div class="scheduled-info">
              <h5 class="scheduled-name">{{ scheduled.name }}</h5>
              <div class="scheduled-meta">
                <span class="scheduled-frequency">{{ scheduled.frequency }}</span>
                <span class="scheduled-next">
                  {{ $t('exports.scheduled.nextRun') }}: {{ formatDate(scheduled.nextRun) }}
                </span>
              </div>
            </div>
            
            <div class="scheduled-actions">
              <Button variant="ghost" size="sm" @click="runScheduledExport(scheduled)">
                <Icon name="lucide:play" class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" @click="editScheduledExport(scheduled)">
                <Icon name="lucide:edit" class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import type { ExportHistoryItem, ExportTemplate, ScheduledExport } from '~/types/export'
import { useExportManager } from '~/composables/useExportManager'

const { t } = useI18n()

// Composables
const {
  exportHistory,
  exportTemplates,
  scheduledExports,
  refreshHistory,
  downloadExport,
  retryExport,
  cancelExport,
  deleteExport,
  useTemplate,
  createScheduledExport
} = useExportManager()

const getFormatIcon = (format: string): string => {
  switch (format) {
    case 'csv': return 'lucide:file-text'
    case 'excel': return 'lucide:file-spreadsheet'
    case 'pdf': return 'lucide:file-text'
    default: return 'lucide:file'
  }
}

const getStatusVariant = (status: string): string => {
  switch (status) {
    case 'completed': return 'success'
    case 'processing': return 'warning'
    case 'failed': return 'destructive'
    default: return 'secondary'
  }
}

// Load initial data
onMounted(() => {
  refreshHistory()
})
</script>
```

## Technical Guidance

### Export Processing Architecture

**Backend Export Service Integration**:
```typescript
// composables/useExportService.ts
import type { ExportConfiguration, ExportProgress } from '~/types/export'

export function useExportService() {
  const startExport = async (config: ExportConfiguration): Promise<string> => {
    const response = await $fetch('/api/v1/exports', {
      method: 'POST',
      body: config
    })
    return response.exportId
  }

  const getExportProgress = async (exportId: string): Promise<ExportProgress> => {
    return await $fetch(`/api/v1/exports/${exportId}/progress`)
  }

  const downloadExport = async (exportId: string): Promise<void> => {
    const response = await $fetch(`/api/v1/exports/${exportId}/download`, {
      responseType: 'blob'
    })
    
    // Create download link
    const url = window.URL.createObjectURL(response as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `export-${exportId}`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const cancelExport = async (exportId: string): Promise<void> => {
    await $fetch(`/api/v1/exports/${exportId}/cancel`, {
      method: 'POST'
    })
  }

  return {
    startExport,
    getExportProgress,
    downloadExport,
    cancelExport
  }
}
```

**Integration with Bulk Operations**:
```vue
<!-- In BulkOperationsToolbar.vue -->
<template>
  <!-- Add export dropdown -->
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="sm">
        <Icon name="lucide:download" class="w-4 h-4 mr-2" />
        {{ $t('expenses.bulk.export') }}
        <Icon name="lucide:chevron-down" class="w-4 h-4 ml-2" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem @click="quickExport('csv')">
        <Icon name="lucide:file-text" class="w-4 h-4 mr-2" />
        {{ $t('exports.formats.csv') }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="quickExport('excel')">
        <Icon name="lucide:file-spreadsheet" class="w-4 h-4 mr-2" />
        {{ $t('exports.formats.excel') }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="quickExport('pdf')">
        <Icon name="lucide:file-text" class="w-4 h-4 mr-2" />
        {{ $t('exports.formats.pdf') }}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="openExportConfig">
        <Icon name="lucide:settings" class="w-4 h-4 mr-2" />
        {{ $t('exports.actions.configure') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

## Research Findings

### Existing Codebase Patterns

**File Handling** (from attachment system):
- Secure download URL generation
- Progress tracking for uploads/downloads
- File type validation and icons
- Error handling for file operations

**Bulk Operations** (from useTableSelection):
- Selection state management
- Batch processing patterns
- Progress tracking infrastructure
- Error recovery mechanisms

**API Integration Patterns**:
- RESTful endpoints with proper error handling
- Streaming responses for large data
- Background job processing
- Real-time progress updates via WebSocket or polling

### Performance Considerations

**Large Dataset Handling**:
- Server-side pagination for export queries
- Streaming JSON/CSV generation
- Memory-efficient processing
- Background job queuing for large exports

**Client-Side Optimization**:
- Progressive loading of export history
- Lazy loading of export templates
- Efficient progress polling intervals
- Memory management for large downloads

## Implementation Notes

### Step-by-Step Approach

1. **Export Configuration Interface** (30% of effort):
   - Build configuration dialog with format selection
   - Implement field selection and filtering options
   - Add preview functionality and size estimation

2. **Progress Tracking System** (25% of effort):
   - Create progress dialog with real-time updates
   - Implement cancellation and retry functionality
   - Add error handling and recovery options

3. **Export Processing** (25% of effort):
   - Build backend export service integration
   - Implement format-specific generation
   - Add template and scheduling features

4. **Management Interface** (20% of effort):
   - Create export history and management
   - Add template creation and editing
   - Implement scheduled export configuration

### Export Format Specifications

**CSV Format**:
- UTF-8 encoding with BOM for Excel compatibility
- Configurable delimiter (comma, semicolon, tab)
- Proper escaping for special characters
- Japanese text support

**Excel Format**:
- XLSX format with multiple worksheets
- Styled headers and data formatting
- Auto-sizing columns
- Chart generation for summary data

**PDF Format**:
- Professional report layouts
- Legal firm branding and headers
- Summary statistics and charts
- Attachment thumbnails (optional)

## Subtasks
- [ ] Create ExportConfigurationDialog with format selection
- [ ] Implement field selection interface with categories
- [ ] Build ExportProgressDialog with real-time updates
- [ ] Create useExportService composable for API integration
- [ ] Implement CSV export with configurable options
- [ ] Add Excel export with formatting and charts
- [ ] Build PDF export with professional templates
- [ ] Create ExportManager component for history and templates
- [ ] Add scheduled export functionality
- [ ] Implement export template creation and management
- [ ] Add progress tracking with cancellation support
- [ ] Create Japanese localization for all export interfaces

## Testing Requirements
- [ ] Export configuration saves and loads correctly
- [ ] Progress tracking updates accurately during export
- [ ] Large datasets export without memory issues
- [ ] All formats generate correctly formatted files
- [ ] Cancellation works properly during processing
- [ ] Error handling provides useful feedback
- [ ] Japanese text exports correctly in all formats
- [ ] Scheduled exports run at correct intervals

## Success Metrics
- Exports complete within 30 seconds for 1000+ records
- Progress updates every 2 seconds during processing
- Memory usage stays under 100MB during export
- Generated files open correctly in target applications
- Error recovery succeeds for 90% of failures
- All Japanese text displays correctly in exported files
- Export history loads within 1 second

## Notes
- Focus on legal compliance reporting needs
- Consider regulatory data retention requirements
- Implement proper security for sensitive data export
- Support large datasets common in legal billing
- Plan for integration with case management systems
- Consider offline export capabilities for large files