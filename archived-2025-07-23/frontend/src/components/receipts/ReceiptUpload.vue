<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Camera, 
  Upload, 
  FileImage, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Plus,
  Eye,
  Trash2
} from 'lucide-vue-next'
import { useReceipts } from '~/composables/useReceipts'
import { useOcrProcessing } from '~/composables/useOcrProcessing'
import { validateImageFile, formatFileSize } from '~/utils/imageCompression'
import type { Receipt } from '~/schemas/receipt'

import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { Alert, AlertDescription } from '~/components/ui/alert'
import ReceiptCamera from './ReceiptCamera.vue'
import ReceiptGallery from './ReceiptGallery.vue'

/**
 * Receipt Upload Component
 * 
 * Integrated receipt upload component for expense forms.
 * Supports camera capture, file upload, and receipt management.
 */

interface Props {
  expenseId?: string
  required?: boolean
  multiple?: boolean
  showGallery?: boolean
  autoProcess?: boolean
  maxReceipts?: number
}

interface Emits {
  'update:receipts': [receipts: Receipt[]]
  'receipts-changed': [receipts: Receipt[]]
  error: [message: string]
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  multiple: true,
  showGallery: true,
  autoProcess: true,
  maxReceipts: 10
})

const emit = defineEmits<Emits>()

// Composables
const {
  receipts,
  uploading,
  uploadProgress,
  error: uploadError,
  uploadReceipt,
  deleteReceipt,
  getReceiptsByExpense
} = useReceipts({
  expenseId: props.expenseId,
  autoLoad: !!props.expenseId
})

const {
  queueForProcessing,
  isProcessing: isOcrProcessing
} = useOcrProcessing()

// Component state
const showCamera = ref(false)
const showGallery = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const dragOver = ref(false)
const localError = ref<string | null>(null)

// Computed properties
const linkedReceipts = computed(() => {
  if (props.expenseId) {
    return getReceiptsByExpense(props.expenseId)
  }
  return []
})

const canAddMore = computed(() => {
  return linkedReceipts.value.length < props.maxReceipts
})

const hasRequiredReceipts = computed(() => {
  return !props.required || linkedReceipts.value.length > 0
})

const uploadProgressValue = computed(() => {
  if (uploadProgress.value.total === 0) return 0
  return (uploadProgress.value.current / uploadProgress.value.total) * 100
})

const errorMessage = computed(() => {
  return localError.value || uploadError.value
})

// Card class computed for proper TypeScript typing
const cardClasses = computed(() => {
  const classes = ['border-2', 'border-dashed', 'transition-colors']
  
  if (dragOver.value) {
    classes.push('border-primary', 'bg-primary/5')
  } else if (errorMessage.value) {
    classes.push('border-destructive')
  } else {
    classes.push('border-muted-foreground')
  }
  
  return classes.join(' ')
})

// Handle file selection
const handleFileSelect = (files: FileList | File[]) => {
  const fileArray = Array.from(files)
  processFiles(fileArray)
}

// Process selected files
const processFiles = async (files: File[]) => {
  if (!canAddMore.value) {
    localError.value = `Maximum ${props.maxReceipts} receipts allowed`
    return
  }

  localError.value = null
  const validFiles: File[] = []

  // Validate files
  for (const file of files) {
    const validationError = validateImageFile(file)
    if (validationError) {
      localError.value = validationError
      return
    }
    validFiles.push(file)
  }

  // Limit files if needed
  const availableSlots = props.maxReceipts - linkedReceipts.value.length
  const filesToProcess = validFiles.slice(0, availableSlots)

  if (filesToProcess.length < validFiles.length) {
    localError.value = `Only ${filesToProcess.length} files uploaded (${props.maxReceipts} max)`
  }

  // Upload files
  for (const file of filesToProcess) {
    try {
      const receipt = await uploadReceipt(file, {
        originalFilename: file.name,
        expenseId: props.expenseId,
        metadata: {
          capturedAt: new Date().toISOString(),
          deviceInfo: navigator.userAgent
        }
      })

      if (receipt && props.autoProcess) {
        // Queue for OCR processing
        await queueForProcessing(receipt.id, 'normal')
      }
    } catch (err) {
      console.error('Failed to upload receipt:', err)
      localError.value = 'Failed to upload receipt'
    }
  }

  // Emit updated receipts
  emitReceiptsChange()
}

// Handle camera capture
const handleCameraCapture = async (blob: Blob, metadata: any) => {
  try {
    const receipt = await uploadReceipt(blob, {
      originalFilename: metadata.filename,
      expenseId: props.expenseId,
      metadata: {
        capturedAt: new Date().toISOString(),
        deviceInfo: 'Camera Capture'
      }
    })

    if (receipt && props.autoProcess) {
      await queueForProcessing(receipt.id, 'high') // Higher priority for camera captures
    }

    showCamera.value = false
    emitReceiptsChange()
  } catch (err) {
    console.error('Failed to upload camera capture:', err)
    localError.value = 'Failed to upload captured image'
  }
}

// Handle receipt deletion
const handleDeleteReceipt = async (receiptId: string) => {
  try {
    await deleteReceipt(receiptId)
    emitReceiptsChange()
  } catch (err) {
    console.error('Failed to delete receipt:', err)
    localError.value = 'Failed to delete receipt'
  }
}

// Drag and drop handlers
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  dragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  dragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  dragOver.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    handleFileSelect(files)
  }
}

// File input trigger
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// Camera trigger
const triggerCamera = () => {
  showCamera.value = true
}

// Gallery trigger
const triggerGallery = () => {
  showGallery.value = true
}

// Emit receipts change
const emitReceiptsChange = () => {
  emit('update:receipts', linkedReceipts.value)
  emit('receipts-changed', linkedReceipts.value)
}

// Clear error
const clearError = () => {
  localError.value = null
}

// Watch for receipts changes
watch(linkedReceipts, (newReceipts) => {
  emit('update:receipts', newReceipts)
}, { deep: true })
</script>

<template>
  <div class="space-y-4">
    <!-- Upload Area -->
    <Card 
      :class="cardClasses"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <CardContent class="p-6">
        <div class="text-center space-y-4">
          <!-- Upload Icon -->
          <div class="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Upload class="w-8 h-8 text-muted-foreground" />
          </div>
          
          <!-- Upload Text -->
          <div>
            <h3 class="text-lg font-medium">Upload Receipt</h3>
            <p class="text-sm text-muted-foreground">
              {{ props.multiple ? 'Drag and drop files here, or' : 'Drag and drop a file here, or' }}
            </p>
          </div>
          
          <!-- Upload Buttons -->
          <div class="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              variant="outline" 
              @click="triggerFileInput"
              :disabled="uploading || !canAddMore"
            >
              <FileImage class="w-4 h-4 mr-2" />
              Choose {{ props.multiple ? 'Files' : 'File' }}
            </Button>
            
            <Button 
              variant="outline" 
              @click="triggerCamera"
              :disabled="uploading || !canAddMore"
            >
              <Camera class="w-4 h-4 mr-2" />
              Take Photo
            </Button>
            
            <Button 
              v-if="props.showGallery"
              variant="outline" 
              @click="triggerGallery"
            >
              <Eye class="w-4 h-4 mr-2" />
              View Gallery
            </Button>
          </div>
          
          <!-- File Input -->
          <input
            ref="fileInputRef"
            type="file"
            class="hidden"
            :multiple="props.multiple"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
            @change="($event.target as HTMLInputElement).files && handleFileSelect(($event.target as HTMLInputElement).files!)"
          />
          
          <!-- Upload Constraints -->
          <p class="text-xs text-muted-foreground">
            Supports JPEG, PNG, WebP, HEIC. Max {{ formatFileSize(10 * 1024 * 1024) }} per file.
            <span v-if="props.maxReceipts">
              Max {{ props.maxReceipts }} receipts.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Error Alert -->
    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription class="flex items-center justify-between">
        {{ errorMessage }}
        <Button variant="ghost" size="sm" @click="clearError">
          <X class="w-4 h-4" />
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Upload Progress -->
    <div v-if="uploading" class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span>Uploading receipts...</span>
        <span>{{ uploadProgress.current }}/{{ uploadProgress.total }}</span>
      </div>
      <Progress :value="uploadProgressValue" class="h-2" />
    </div>

    <!-- Linked Receipts -->
    <div v-if="linkedReceipts.length > 0" class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-medium">
          Attached Receipts ({{ linkedReceipts.length }})
        </h4>
        <Badge v-if="props.required && hasRequiredReceipts" variant="default">
          <CheckCircle class="w-3 h-3 mr-1" />
          Required
        </Badge>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card 
          v-for="receipt in linkedReceipts" 
          :key="receipt.id"
          class="group relative overflow-hidden"
        >
          <CardContent class="p-3">
            <div class="flex items-start gap-3">
              <!-- Thumbnail -->
              <div class="flex-shrink-0">
                <img 
                  :src="receipt.thumbnailUrl" 
                  :alt="receipt.originalFilename"
                  class="w-12 h-12 object-cover rounded border"
                />
              </div>
              
              <!-- Receipt Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">
                  {{ receipt.originalFilename }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ formatFileSize(receipt.fileSize) }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <Badge 
                    :variant="receipt.ocrStatus === 'COMPLETED' ? 'default' : receipt.ocrStatus === 'FAILED' ? 'destructive' : 'secondary'"
                    class="text-xs"
                  >
                    {{ receipt.ocrStatus }}
                  </Badge>
                  <span v-if="receipt.extractedAmount" class="text-xs font-mono">
                    ¥{{ receipt.extractedAmount.toLocaleString() }}
                  </span>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  class="h-6 w-6"
                  @click="handleDeleteReceipt(receipt.id)"
                  title="Remove receipt"
                >
                  <Trash2 class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="props.required" class="text-center py-8 border border-dashed border-muted-foreground rounded-lg">
      <AlertCircle class="mx-auto h-8 w-8 text-muted-foreground mb-2" />
      <p class="text-sm text-muted-foreground">Receipt required for this expense</p>
    </div>

    <!-- Camera Modal -->
    <ReceiptCamera
      :is-open="showCamera"
      @close="showCamera = false"
      @capture="handleCameraCapture"
      @error="(msg) => localError = msg"
    />

    <!-- Gallery Modal -->
    <ReceiptGallery
      v-if="showGallery"
      :expense-id="props.expenseId"
      @close="showGallery = false"
      @updated="emitReceiptsChange"
    />
  </div>
</template>

<style scoped>
/* Drag and drop visual feedback */
.border-dashed {
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

/* Smooth hover effects */
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

/* File input styling */
input[type="file"] {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Receipt card hover effects */
.group:hover img {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(1, 1fr);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border-dashed {
    border-width: 2px;
  }
  
  .border-primary {
    border-color: currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .transition-colors,
  .transition-opacity {
    transition: none;
  }
  
  .group:hover img {
    transform: none;
  }
}
</style>