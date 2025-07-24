<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Export Memos</DialogTitle>
        <DialogDescription>
          Choose export format and options for your memo export.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleExport" class="space-y-4">
        <!-- Export Format -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Export Format</label>
          <RadioGroup v-model="exportOptions.format">
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <label for="csv" class="text-sm cursor-pointer">
                CSV - Spreadsheet format
              </label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <label for="pdf" class="text-sm cursor-pointer">
                PDF - Formatted report
              </label>
            </div>
          </RadioGroup>
        </div>

        <!-- Export Options -->
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <Checkbox 
              id="include-content"
              v-model:checked="exportOptions.includeContent"
            />
            <label for="include-content" class="text-sm cursor-pointer">
              Include full memo content
            </label>
          </div>
          
          <div class="flex items-center space-x-2">
            <Checkbox 
              id="include-attachments"
              v-model:checked="exportOptions.includeAttachments"
            />
            <label for="include-attachments" class="text-sm cursor-pointer">
              Include attachment information
            </label>
          </div>
        </div>

        <!-- Export Summary -->
        <div v-if="memoCount > 0" class="p-3 bg-muted rounded-lg">
          <p class="text-sm text-muted-foreground">
            <strong>{{ memoCount }}</strong> memo{{ memoCount === 1 ? '' : 's' }} will be exported
            <span v-if="hasFilters" class="block mt-1">
              with current filters applied
            </span>
          </p>
        </div>

        <!-- Progress Bar -->
        <div v-if="isExporting" class="space-y-2">
          <Progress :value="exportProgress" />
          <p class="text-xs text-center text-muted-foreground">
            Exporting... {{ exportProgress }}%
          </p>
        </div>

        <!-- Error Message -->
        <Alert v-if="exportError" variant="destructive">
          <AlertDescription>
            {{ exportError }}
          </AlertDescription>
        </Alert>

        <!-- Actions -->
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            @click="handleCancel"
            :disabled="isExporting"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            :disabled="!canExport || isExporting"
            :loading="isExporting"
          >
            <Download class="size-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Download } from 'lucide-vue-next'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Progress } from '~/components/ui/progress'
import { Alert, AlertDescription } from '~/components/ui/alert'
import type { MemoExportOptions } from '~/types/memo'

interface Props {
  modelValue: boolean
  memoCount: number
  hasFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasFilters: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'export': [options: MemoExportOptions]
}>()

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const exportOptions = ref<MemoExportOptions>({
  format: 'csv',
  includeContent: false,
  includeAttachments: true
})

const isExporting = ref(false)
const exportProgress = ref(0)
const exportError = ref<string | null>(null)

// Computed
const canExport = computed(() => 
  props.memoCount > 0 && exportOptions.value.format
)

// Methods
const handleExport = async () => {
  if (!canExport.value) return
  
  isExporting.value = true
  exportError.value = null
  exportProgress.value = 0
  
  try {
    // Simulate progress for demo
    const progressInterval = setInterval(() => {
      exportProgress.value = Math.min(exportProgress.value + 10, 90)
    }, 100)
    
    emit('export', exportOptions.value)
    
    // Wait a bit to show completion
    setTimeout(() => {
      clearInterval(progressInterval)
      exportProgress.value = 100
      setTimeout(() => {
        isOpen.value = false
        resetForm()
      }, 500)
    }, 1000)
    
  } catch (error) {
    exportError.value = error instanceof Error ? error.message : 'Export failed'
    isExporting.value = false
  }
}

const handleCancel = () => {
  if (!isExporting.value) {
    isOpen.value = false
    resetForm()
  }
}

const resetForm = () => {
  exportOptions.value = {
    format: 'csv',
    includeContent: false,
    includeAttachments: true
  }
  isExporting.value = false
  exportProgress.value = 0
  exportError.value = null
}

// Reset form when dialog closes
watch(isOpen, (open) => {
  if (!open) {
    resetForm()
  }
})
</script>

<style scoped>
/* Component styles follow existing patterns */
</style>