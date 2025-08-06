---
task_id: T02_S03_M003
title: CSV Import User Interface for Expense Management
status: pending
estimated_hours: 8
actual_hours: null
assigned_to: Claude
dependencies: ["T01_S03_M003_CSV_Import_Foundation"]
complexity: Medium
updated: null
completed: null
---

# T02_S03_M003: CSV Import User Interface for Expense Management

## Description
Create a comprehensive user interface for CSV import functionality in the expense management system. This includes a drag-and-drop upload interface, preview table with validation results, progress indicators, error display, and confirmation dialogs. The UI will provide an intuitive experience for bulk expense import operations with clear feedback and error handling.

## Acceptance Criteria
- [ ] Create drag-and-drop CSV upload interface with visual feedback
- [ ] Implement preview table showing parsed CSV data with validation
- [ ] Display validation errors with clear, actionable messages
- [ ] Show import progress with detailed status updates
- [ ] Provide error summary and resolution guidance
- [ ] Support template download with proper formatting
- [ ] Implement confirmation dialogs for import operations
- [ ] Add mobile-responsive design for all components
- [ ] Integrate with existing expense list for seamless workflow
- [ ] Include accessibility features for screen readers

## Technical Details

### 1. CSV Upload Component

**Location**: `frontend/app/components/expenses/import/CsvUploadDropzone.vue`

**Component Structure**:
```vue
<template>
  <div class="csv-upload-container">
    <div 
      class="dropzone"
      :class="{ 'drag-over': isDragOver, 'has-error': uploadError }"
      @drop="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
    >
      <div v-if="!selectedFile" class="upload-prompt">
        <Icon name="upload-cloud" class="upload-icon" />
        <h3>{{ $t('expense.import.dropzone.title') }}</h3>
        <p>{{ $t('expense.import.dropzone.description') }}</p>
        <Button variant="outline" @click="triggerFileSelect">
          {{ $t('expense.import.dropzone.selectFile') }}
        </Button>
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          @change="handleFileSelect"
          hidden
        />
      </div>
      
      <div v-else class="file-info">
        <Icon name="file-text" />
        <span class="filename">{{ selectedFile.name }}</span>
        <Button variant="ghost" size="sm" @click="removeFile">
          <Icon name="x" />
        </Button>
      </div>
    </div>
    
    <div class="upload-actions">
      <Button 
        variant="outline" 
        @click="downloadTemplate"
        :disabled="isLoading"
      >
        <Icon name="download" />
        {{ $t('expense.import.downloadTemplate') }}
      </Button>
      
      <Button 
        @click="processFile" 
        :disabled="!selectedFile || isLoading"
        :loading="isLoading"
      >
        {{ $t('expense.import.preview') }}
      </Button>
    </div>
  </div>
</template>
```

**Composable Integration**:
```typescript
// frontend/app/composables/useCsvImport.ts
export const useCsvImport = () => {
  const isLoading = ref(false)
  const uploadError = ref<string | null>(null)
  const previewData = ref<CsvPreviewData | null>(null)
  const importProgress = ref<ImportProgress | null>(null)
  
  const validateFile = (file: File): ValidationResult => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['text/csv', 'application/csv']
    
    if (file.size > maxSize) {
      return { valid: false, error: 'expense.import.errors.fileTooLarge' }
    }
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return { valid: false, error: 'expense.import.errors.invalidFileType' }
    }
    
    return { valid: true }
  }
  
  const previewCsv = async (file: File): Promise<CsvPreviewData> => {
    isLoading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await $fetch<CsvPreviewResponse>(
        '/api/v1/expenses/import/preview',
        {
          method: 'POST',
          body: formData
        }
      )
      
      return response.data
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    isLoading: readonly(isLoading),
    uploadError: readonly(uploadError),
    previewData: readonly(previewData),
    importProgress: readonly(importProgress),
    validateFile,
    previewCsv,
    downloadTemplate,
    importExpenses
  }
}
```

### 2. CSV Preview Table Component

**Location**: `frontend/app/components/expenses/import/CsvPreviewTable.vue`

**Features**:
- Display parsed CSV data in tabular format
- Highlight validation errors with contextual tooltips
- Show row numbers and error counts
- Support column sorting and filtering
- Virtual scrolling for large datasets

**Component Structure**:
```vue
<template>
  <div class="csv-preview-container">
    <div class="preview-header">
      <div class="summary">
        <Badge variant="success">
          {{ $t('expense.import.preview.validRows', { count: validRows }) }}
        </Badge>
        <Badge variant="destructive" v-if="errorRows > 0">
          {{ $t('expense.import.preview.errorRows', { count: errorRows }) }}
        </Badge>
      </div>
      
      <div class="actions">
        <Button variant="outline" @click="showErrorsOnly = !showErrorsOnly">
          <Icon name="filter" />
          {{ showErrorsOnly ? $t('common.showAll') : $t('expense.import.showErrorsOnly') }}
        </Button>
      </div>
    </div>
    
    <div class="table-container">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="row-number">#</TableHead>
            <TableHead 
              v-for="column in columns" 
              :key="column.key"
              @click="sortBy(column.key)"
              class="sortable"
            >
              {{ $t(column.label) }}
              <Icon 
                :name="getSortIcon(column.key)" 
                class="sort-icon"
              />
            </TableHead>
            <TableHead class="status">{{ $t('common.status') }}</TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          <TableRow 
            v-for="(row, index) in displayRows" 
            :key="index"
            :class="{ 'error-row': row.hasErrors }"
          >
            <TableCell class="row-number">{{ row.originalIndex + 1 }}</TableCell>
            <TableCell 
              v-for="column in columns" 
              :key="column.key"
              :class="{ 'error-cell': row.errors[column.key] }"
            >
              <Tooltip v-if="row.errors[column.key]">
                <TooltipTrigger>
                  <span class="error-value">{{ row.data[column.key] }}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <div class="error-tooltip">
                    <p class="error-message">{{ $t(row.errors[column.key].message) }}</p>
                    <p class="error-suggestion">{{ $t(row.errors[column.key].suggestion) }}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
              <span v-else>{{ row.data[column.key] }}</span>
            </TableCell>
            <TableCell class="status">
              <Badge 
                :variant="row.hasErrors ? 'destructive' : 'success'"
                size="sm"
              >
                {{ row.hasErrors ? $t('common.error') : $t('common.valid') }}
              </Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
```

### 3. Import Progress Dialog

**Location**: `frontend/app/components/expenses/import/ImportProgressDialog.vue`

**Progress Tracking**:
```vue
<template>
  <Dialog :open="isOpen" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ $t('expense.import.progress.title') }}</DialogTitle>
        <DialogDescription>
          {{ $t('expense.import.progress.description') }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="progress-container">
        <div class="current-phase">
          <Icon :name="getPhaseIcon(progress.phase)" class="phase-icon" />
          <span>{{ $t(`expense.import.phases.${progress.phase}`) }}</span>
        </div>
        
        <div class="progress-bar">
          <div class="progress-track">
            <div 
              class="progress-fill"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          <span class="progress-text">
            {{ progress.processedRows }} / {{ progress.totalRows }}
          </span>
        </div>
        
        <div class="progress-stats">
          <div class="stat">
            <span class="label">{{ $t('expense.import.progress.successful') }}</span>
            <Badge variant="success">{{ progress.successfulRows }}</Badge>
          </div>
          <div class="stat">
            <span class="label">{{ $t('expense.import.progress.errors') }}</span>
            <Badge variant="destructive">{{ progress.errorRows }}</Badge>
          </div>
          <div class="stat" v-if="progress.estimatedTimeRemaining">
            <span class="label">{{ $t('expense.import.progress.timeRemaining') }}</span>
            <span>{{ formatDuration(progress.estimatedTimeRemaining) }}</span>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button 
          variant="outline" 
          @click="cancelImport"
          :disabled="!canCancel"
        >
          {{ $t('common.cancel') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

### 4. Error Summary Component

**Location**: `frontend/app/components/expenses/import/ImportErrorSummary.vue`

**Error Categorization**:
```vue
<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Icon name="alert-triangle" class="text-destructive" />
        {{ $t('expense.import.errors.title') }}
      </CardTitle>
      <CardDescription>
        {{ $t('expense.import.errors.description', { count: totalErrors }) }}
      </CardDescription>
    </CardHeader>
    
    <CardContent>
      <Tabs default-value="by-type">
        <TabsList>
          <TabsTrigger value="by-type">
            {{ $t('expense.import.errors.byType') }}
          </TabsTrigger>
          <TabsTrigger value="by-row">
            {{ $t('expense.import.errors.byRow') }}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="by-type">
          <div class="error-types">
            <div 
              v-for="errorType in errorTypes" 
              :key="errorType.type"
              class="error-type-group"
            >
              <Collapsible>
                <CollapsibleTrigger class="error-type-header">
                  <div class="flex items-center gap-2">
                    <Icon :name="getErrorIcon(errorType.type)" />
                    <span>{{ $t(`expense.import.errorTypes.${errorType.type}`) }}</span>
                    <Badge variant="outline">{{ errorType.count }}</Badge>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div class="error-details">
                    <div 
                      v-for="error in errorType.errors" 
                      :key="error.id"
                      class="error-item"
                    >
                      <span class="row-ref">Row {{ error.rowIndex + 1 }}</span>
                      <span class="field-ref">{{ error.field }}</span>
                      <p class="error-message">{{ $t(error.message) }}</p>
                      <p class="error-suggestion">{{ $t(error.suggestion) }}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="by-row">
          <div class="row-errors">
            <div 
              v-for="rowError in rowErrors" 
              :key="rowError.rowIndex"
              class="row-error-group"
            >
              <div class="row-header">
                <span class="row-number">Row {{ rowError.rowIndex + 1 }}</span>
                <Badge variant="destructive">
                  {{ $t('expense.import.errors.count', { count: rowError.errors.length }) }}
                </Badge>
              </div>
              <div class="row-error-list">
                <div 
                  v-for="error in rowError.errors" 
                  :key="error.field"
                  class="field-error"
                >
                  <strong>{{ error.field }}:</strong>
                  <span>{{ $t(error.message) }}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </CardContent>
    
    <CardFooter>
      <Button @click="exportErrors" variant="outline">
        <Icon name="download" />
        {{ $t('expense.import.errors.export') }}
      </Button>
      <Button @click="fixAndRetry" class="ml-2">
        {{ $t('expense.import.errors.fixAndRetry') }}
      </Button>
    </CardFooter>
  </Card>
</template>
```

## Integration Guidelines

### 1. Existing Component Integration

**Form Components Usage**:
- Leverage existing `Button`, `Card`, `Table` from UI component library
- Use established `Dialog`, `Tooltip`, `Badge` patterns
- Follow existing form validation styling from `frontend/app/components/ui/form/`
- Integrate with `ExpenseFilters` component for consistent UI patterns

**Table Component Integration**:
```typescript
// Use existing table patterns from ExpenseDataTable.vue
import { useTableSorting } from '~/composables/useTableSorting'
import { useTableSelection } from '~/composables/useTableSelection'
import { useVirtualScrolling } from '~/composables/useVirtualScrolling'

export const useCsvPreviewTable = () => {
  const { sortBy, sortOrder, sortedData } = useTableSorting()
  const { selectedRows, toggleSelection } = useTableSelection()
  const { virtualItems, scrollElement } = useVirtualScrolling()
  
  // CSV-specific table logic
  const filterErrorRows = (rows: CsvRow[]) => {
    return rows.filter(row => row.hasErrors)
  }
  
  return {
    sortBy,
    sortOrder,
    sortedData,
    selectedRows,
    toggleSelection,
    virtualItems,
    scrollElement,
    filterErrorRows
  }
}
```

### 2. Validation UI Patterns

**Error Display Integration**:
```vue
<!-- Follow existing validation patterns from ExpenseFormFields.vue -->
<FormMessage 
  v-if="fieldError" 
  :message="$t(fieldError.message)"
  type="error"
/>

<!-- Use consistent error styling -->
<style scoped>
.error-cell {
  @apply border-destructive/50 bg-destructive/5;
}

.error-value {
  @apply text-destructive font-medium;
}

.error-tooltip {
  @apply max-w-xs;
}
</style>
```

### 3. Navigation Integration

**Route Integration**:
```typescript
// Add to existing expense routing in useExpenseRouting.ts
import { useExpenseRouting } from '~/composables/useExpenseRouting'

export const useExpenseImportRouting = () => {
  const { navigateToExpenseList } = useExpenseRouting()
  
  const navigateToImport = () => {
    return navigateTo('/expenses/import')
  }
  
  const navigateToImportHistory = () => {
    return navigateTo('/expenses/import/history')
  }
  
  const onImportComplete = (result: ImportResult) => {
    if (result.success) {
      navigateToExpenseList({
        message: 'expense.import.successMessage',
        type: 'success'
      })
    }
  }
  
  return {
    navigateToImport,
    navigateToImportHistory,
    onImportComplete
  }
}
```

### 4. State Management Integration

**Pinia Store Integration**:
```typescript
// Extend existing expense store or create dedicated import store
export const useExpenseImportStore = defineStore('expenseImport', () => {
  const importHistory = ref<ImportRecord[]>([])
  const currentImport = ref<ImportSession | null>(null)
  const isImporting = ref(false)
  
  const startImport = async (file: File) => {
    isImporting.value = true
    currentImport.value = {
      id: generateId(),
      filename: file.name,
      startTime: new Date(),
      status: 'processing'
    }
  }
  
  const updateProgress = (progress: ImportProgress) => {
    if (currentImport.value) {
      currentImport.value.progress = progress
    }
  }
  
  const completeImport = (result: ImportResult) => {
    if (currentImport.value) {
      currentImport.value.status = result.success ? 'completed' : 'failed'
      currentImport.value.result = result
      currentImport.value.endTime = new Date()
      
      importHistory.value.unshift(currentImport.value)
      currentImport.value = null
    }
    isImporting.value = false
  }
  
  return {
    importHistory: readonly(importHistory),
    currentImport: readonly(currentImport),
    isImporting: readonly(isImporting),
    startImport,
    updateProgress,
    completeImport
  }
})
```

## Research Findings

### Existing UI Patterns

**Component Structure** (from `frontend/app/components/expenses/`):
- Consistent card-based layouts for major features
- Table components with sorting, filtering, and pagination
- Form components with validation and error display
- Modal dialogs for complex operations
- Responsive design with mobile adaptations

**Validation Display** (from `ExpenseFormFields.vue`):
- Real-time validation with error messages
- Field-level error highlighting
- Consistent error styling and iconography
- Accessible error announcements

**Table Components** (from `ExpenseDataTable.vue`):
- Virtual scrolling for performance
- Column sorting and filtering
- Row selection with bulk operations
- Empty states and loading skeletons
- Mobile-responsive table design

### Form Component Patterns

**File Upload** (research needed - implement consistent with existing patterns):
- Drag-and-drop interface standards
- File validation and error display
- Progress indicators for uploads
- Accessible file input alternatives

## Subtasks
- [ ] Create drag-and-drop CSV upload component
- [ ] Implement CSV preview table with validation display
- [ ] Build import progress dialog with real-time updates
- [ ] Create comprehensive error summary component
- [ ] Add template download functionality
- [ ] Implement import confirmation dialogs
- [ ] Create mobile-responsive layouts
- [ ] Add accessibility features (ARIA labels, keyboard navigation)
- [ ] Integrate with existing expense navigation
- [ ] Create Storybook stories for all components

## Testing Requirements
- [ ] Drag-and-drop functionality works across all browsers
- [ ] File validation provides clear error messages
- [ ] Preview table handles large datasets efficiently
- [ ] Progress dialog updates in real-time
- [ ] Error display is comprehensive and actionable
- [ ] Template download generates valid CSV files
- [ ] Mobile interface is fully functional
- [ ] Accessibility standards are met (WCAG 2.1 AA)
- [ ] Integration with existing expense workflow is seamless

## Success Metrics
- CSV upload completion rate > 95%
- User error resolution rate > 80% without support
- Preview table renders 1000 rows in under 2 seconds
- Import progress updates within 1 second intervals
- Mobile usability score > 85%
- Accessibility compliance score > 95%
- User satisfaction rating > 4.0/5.0

## Notes
- Prioritize user experience and clear error communication
- Ensure consistent styling with existing expense management UI
- Consider users may not be technically proficient with CSV files
- Progress feedback is critical for large import operations
- Error messages should be actionable and educational
- Template should be immediately usable without modification

## Dependencies Analysis
- Depends on T01_S03_M003 for backend CSV processing API
- Integrates with existing UI component library
- Uses established expense store and routing patterns
- Leverages existing table and form validation components

## Implementation Priority
1. CSV upload and preview components (35% of effort)
2. Validation display and error handling (25% of effort)
3. Progress tracking and status feedback (20% of effort)
4. Template download and integration (10% of effort)
5. Mobile responsiveness and accessibility (10% of effort)