# T03_S14: Receipt Management - Photo Capture and Upload

## 📋 Task Overview

**Sprint**: S14_M01_Financial_Management  
**Type**: Feature Development  
**Complexity**: Medium  
**Status**: Todo  
**Estimated Hours**: 12-16

### Description
Implement a comprehensive receipt management system for the Aster Management platform that enables mobile camera integration for photo capture, receipt upload with preview functionality, gallery view for managing receipts, and OCR processing queue for automated data extraction. The system should seamlessly integrate with the expense management workflow and provide both mobile-first and desktop interfaces.

### Business Value
- Enables efficient receipt capture on mobile devices for lawyers working remotely
- Automates expense data extraction through OCR processing
- Provides organized receipt gallery for financial record keeping
- Streamlines expense reporting with attached receipt validation
- Improves audit trail and compliance for financial transactions

### Requirements
- ✅ Implement mobile camera integration using Web API
- ✅ Create receipt photo capture component with preview
- ✅ Build receipt upload system with drag-and-drop support
- ✅ Develop receipt gallery view with filtering and search
- ✅ Integrate with existing expense forms for receipt attachment
- ✅ Implement image compression and optimization before upload
- ✅ Create OCR processing queue for automated data extraction
- ✅ Add receipt-expense linking functionality
- ✅ Build responsive interface optimized for mobile usage
- ✅ Integrate with MinIO/GCS object storage system

## 🗄️ Database Schema Reference

Based on the existing `expenses` table that includes receipt handling:

```sql
-- From V005__Create_supporting_tables.sql
CREATE TABLE expenses (
    -- ... other fields
    receipt_filename VARCHAR(500),  -- Store original filename
    receipt_required BOOLEAN DEFAULT true,
    -- ... other fields
);

-- Additional table for receipt metadata (to be created)
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    original_filename VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    image_width INTEGER,
    image_height INTEGER,
    ocr_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        ocr_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
    ),
    ocr_text TEXT,
    ocr_confidence DECIMAL(5,2),
    extracted_amount DECIMAL(10,2),
    extracted_date DATE,
    extracted_vendor VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);
```

## 💻 Technical Guidance

### 1. Camera API Integration for Mobile Browsers

Create a composable for camera functionality:

```typescript
// /src/composables/useCamera.ts
export function useCamera() {
  const stream = ref<MediaStream | null>(null)
  const isSupported = ref(false)
  const isActive = ref(false)
  const error = ref<string | null>(null)

  const initializeCamera = async (constraints: MediaStreamConstraints = {
    video: {
      facingMode: 'environment', // Use back camera
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  }) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported')
      }
      
      isSupported.value = true
      stream.value = await navigator.mediaDevices.getUserMedia(constraints)
      isActive.value = true
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Camera access failed'
      isActive.value = false
    }
  }

  const capturePhoto = (videoElement: HTMLVideoElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) {
        reject(new Error('Canvas not supported'))
        return
      }

      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      context.drawImage(videoElement, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to capture photo'))
        }
      }, 'image/jpeg', 0.8)
    })
  }

  const stopCamera = () => {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
      isActive.value = false
    }
  }

  return {
    stream: readonly(stream),
    isSupported: readonly(isSupported),
    isActive: readonly(isActive),
    error: readonly(error),
    initializeCamera,
    capturePhoto,
    stopCamera
  }
}
```

### 2. Image Compression Before Upload

Create utility for image optimization:

```typescript
// /src/utils/imageCompression.ts
interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp'
}

export async function compressImage(
  file: File | Blob, 
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    if (!ctx) {
      reject(new Error('Canvas not supported'))
      return
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Compression failed'))
        }
      }, `image/${format}`, quality)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}
```

### 3. Receipt Camera Component

```vue
<!-- /src/components/receipts/ReceiptCamera.vue -->
<script setup lang="ts">
interface Props {
  isOpen: boolean
}

interface Emits {
  close: []
  capture: [blob: Blob]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const videoRef = ref<HTMLVideoElement>()
const { stream, isSupported, isActive, error, initializeCamera, capturePhoto, stopCamera } = useCamera()

const handleCapture = async () => {
  if (!videoRef.value) return
  
  try {
    const blob = await capturePhoto(videoRef.value)
    const compressedBlob = await compressImage(blob, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85
    })
    
    emit('capture', compressedBlob)
    emit('close')
  } catch (err) {
    console.error('Failed to capture photo:', err)
  }
}

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await initializeCamera()
    if (stream.value && videoRef.value) {
      videoRef.value.srcObject = stream.value
    }
  } else {
    stopCamera()
  }
})

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <Dialog :open="isOpen" @update:open="emit('close')">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>Capture Receipt</DialogTitle>
        <DialogDescription>
          Position the receipt in the camera frame and tap capture
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-4">
        <div v-if="!isSupported" class="text-center py-8">
          <Camera class="mx-auto h-12 w-12 text-muted-foreground" />
          <p class="text-sm text-muted-foreground mt-2">
            Camera not supported on this device
          </p>
        </div>
        
        <div v-else-if="error" class="text-center py-8">
          <AlertCircle class="mx-auto h-12 w-12 text-destructive" />
          <p class="text-sm text-destructive mt-2">{{ error }}</p>
          <Button variant="outline" size="sm" class="mt-2" @click="initializeCamera">
            Try Again
          </Button>
        </div>
        
        <div v-else-if="isActive" class="relative">
          <video
            ref="videoRef"
            autoplay
            playsinline
            class="w-full rounded-lg bg-black"
            style="aspect-ratio: 4/3"
          />
          
          <!-- Camera overlay guide -->
          <div class="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
            <div class="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
            <div class="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-white"></div>
            <div class="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-white"></div>
            <div class="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p class="text-sm text-muted-foreground mt-2">Initializing camera...</p>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="emit('close')">Cancel</Button>
        <Button 
          v-if="isActive" 
          @click="handleCapture"
          class="bg-blue-600 hover:bg-blue-700"
        >
          <Camera class="w-4 h-4 mr-2" />
          Capture
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

### 4. Receipt Gallery Interface

```vue
<!-- /src/components/receipts/ReceiptGallery.vue -->
<script setup lang="ts">
interface Props {
  expenseId?: string
  showFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFilters: true
})

const { receipts, loading, fetchReceipts, deleteReceipt } = useReceipts()
const selectedReceipt = ref<Receipt | null>(null)
const showViewer = ref(false)

const filters = ref({
  search: '',
  ocrStatus: '',
  dateRange: { start: '', end: '' }
})

const filteredReceipts = computed(() => {
  let result = receipts.value
  
  if (props.expenseId) {
    result = result.filter(r => r.expenseId === props.expenseId)
  }
  
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(r => 
      r.originalFilename.toLowerCase().includes(search) ||
      r.extractedVendor?.toLowerCase().includes(search) ||
      r.ocrText?.toLowerCase().includes(search)
    )
  }
  
  if (filters.value.ocrStatus) {
    result = result.filter(r => r.ocrStatus === filters.value.ocrStatus)
  }
  
  return result
})

const handleViewReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showViewer.value = true
}

onMounted(() => {
  fetchReceipts(props.expenseId)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <Card v-if="showFilters">
      <CardHeader>
        <CardTitle class="text-lg">Receipt Gallery</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label for="search">Search receipts</Label>
            <Input
              id="search"
              v-model="filters.search"
              placeholder="Search by filename, vendor, or content..."
            />
          </div>
          
          <div>
            <Label for="ocr-status">OCR Status</Label>
            <Select v-model="filters.ocrStatus">
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Receipt Grid -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <SkeletonReceiptCard v-for="i in 6" :key="i" />
    </div>
    
    <div v-else-if="filteredReceipts.length === 0" class="text-center py-12">
      <FileImage class="mx-auto h-12 w-12 text-muted-foreground" />
      <p class="text-muted-foreground mt-2">No receipts found</p>
    </div>
    
    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div
        v-for="receipt in filteredReceipts"
        :key="receipt.id"
        class="group relative aspect-square cursor-pointer"
        @click="handleViewReceipt(receipt)"
      >
        <img
          :src="receipt.thumbnailUrl"
          :alt="receipt.originalFilename"
          class="w-full h-full object-cover rounded-lg border-2 border-transparent group-hover:border-primary transition-colors"
        />
        
        <!-- Overlay with metadata -->
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg">
          <div class="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <p class="text-xs font-medium truncate">{{ receipt.originalFilename }}</p>
            <div class="flex items-center justify-between mt-1">
              <Badge :variant="receipt.ocrStatus === 'COMPLETED' ? 'default' : 'secondary'" class="text-xs">
                {{ receipt.ocrStatus }}
              </Badge>
              <span v-if="receipt.extractedAmount" class="text-xs">
                ¥{{ receipt.extractedAmount.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Delete button -->
        <Button
          size="icon"
          variant="destructive"
          class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
          @click.stop="deleteReceipt(receipt.id)"
        >
          <X class="h-3 w-3" />
        </Button>
      </div>
    </div>

    <!-- Receipt Viewer Modal -->
    <ReceiptViewer
      v-if="selectedReceipt"
      :receipt="selectedReceipt"
      :is-open="showViewer"
      @close="showViewer = false"
      @updated="fetchReceipts(props.expenseId)"
    />
  </div>
</template>
```

### 5. OCR Data Extraction Workflow

Create composable for OCR processing:

```typescript
// /src/composables/useOcrProcessing.ts
export function useOcrProcessing() {
  const processingQueue = ref<string[]>([])
  const results = ref<Map<string, OcrResult>>(new Map())

  const queueForProcessing = async (receiptId: string) => {
    processingQueue.value.push(receiptId)
    
    try {
      // Call backend OCR API
      const result = await $fetch(`/api/receipts/${receiptId}/ocr`, {
        method: 'POST'
      })
      
      results.value.set(receiptId, result)
      
      // Update receipt with extracted data
      await $fetch(`/api/receipts/${receiptId}`, {
        method: 'PATCH',
        body: {
          ocrStatus: 'COMPLETED',
          ocrText: result.text,
          ocrConfidence: result.confidence,
          extractedAmount: result.extractedAmount,
          extractedDate: result.extractedDate,
          extractedVendor: result.extractedVendor
        }
      })
      
    } catch (error) {
      console.error('OCR processing failed:', error)
      
      await $fetch(`/api/receipts/${receiptId}`, {
        method: 'PATCH',
        body: { ocrStatus: 'FAILED' }
      })
    } finally {
      processingQueue.value = processingQueue.value.filter(id => id !== receiptId)
    }
  }

  return {
    processingQueue: readonly(processingQueue),
    results: readonly(results),
    queueForProcessing
  }
}
```

## 📝 Implementation Notes

### Key Considerations

1. **Mobile Camera Optimization**:
   - Use `facingMode: 'environment'` for back camera on mobile
   - Implement proper camera permissions handling
   - Add camera switching capability for devices with multiple cameras
   - Handle orientation changes and screen rotation

2. **Image Compression Strategy**:
   - Target max file size of 2MB for uploads
   - Maintain aspect ratio during compression
   - Use progressive JPEG for better loading experience
   - Implement client-side compression before upload

3. **Receipt Gallery Performance**:
   - Implement virtual scrolling for large collections
   - Use thumbnail generation for grid view
   - Lazy load full-resolution images
   - Cache images locally using IndexedDB

4. **OCR Processing Queue**:
   - Integrate with Google Document AI or similar service
   - Implement retry logic for failed extractions
   - Support batch processing for multiple receipts
   - Store confidence scores for manual review

5. **Cross-Platform Compatibility**:
   - Fallback to file input for devices without camera
   - Support paste from clipboard for desktop users
   - Handle different image formats (JPEG, PNG, HEIC)
   - Test on various mobile browsers and devices

### Error Handling Patterns

```typescript
// Error handling for camera access
const handleCameraError = (error: Error) => {
  if (error.name === 'NotAllowedError') {
    return 'Camera permission denied. Please enable camera access.'
  } else if (error.name === 'NotFoundError') {
    return 'No camera found on this device.'
  } else if (error.name === 'NotReadableError') {
    return 'Camera is being used by another application.'
  }
  return 'Failed to access camera. Please try again.'
}

// Upload error handling
const handleUploadError = (error: any) => {
  if (error.status === 413) {
    return 'File too large. Please compress the image or choose a smaller file.'
  } else if (error.status === 415) {
    return 'File format not supported. Please use JPEG or PNG images.'
  }
  return 'Upload failed. Please check your connection and try again.'
}
```

### Testing Requirements

1. **Unit Tests**:
   - Camera composable functionality
   - Image compression utility
   - OCR result processing
   - Gallery filtering logic

2. **Integration Tests**:
   - Receipt upload workflow
   - Expense-receipt linking
   - OCR processing pipeline
   - Gallery CRUD operations

3. **E2E Tests**:
   - Mobile camera capture flow
   - Desktop drag-and-drop upload
   - Receipt gallery navigation
   - Expense form integration

4. **Performance Tests**:
   - Image compression benchmarks
   - Gallery loading with 100+ receipts
   - Camera initialization time
   - Upload progress accuracy

## 🔗 Dependencies

- **Frontend Technologies**:
  - Vue 3 Composition API for reactive components
  - shadcn-vue for UI components
  - HTML5 Camera API (getUserMedia)
  - Canvas API for image manipulation
  - IndexedDB for local caching

- **Backend Integration**:
  - Spring Boot REST API for receipt management
  - MinIO/GCS for object storage
  - Google Document AI for OCR processing
  - PostgreSQL for metadata storage

- **Related Tasks**:
  - T01_S14: Expense Entry Form (for receipt attachment)
  - T02_S14: Per Diem Recording (for meal receipt capture)
  - S10_M01: OCR AI Integration (for advanced processing)

## ✅ Acceptance Criteria

1. **Camera Functionality**:
   - [ ] Can access device camera on mobile browsers
   - [ ] Captures high-quality receipt photos
   - [ ] Handles permission requests gracefully
   - [ ] Falls back to file upload when camera unavailable

2. **Upload System**:
   - [ ] Supports drag-and-drop on desktop
   - [ ] Compresses images before upload
   - [ ] Shows upload progress indicator
   - [ ] Validates file types and sizes

3. **Gallery Interface**:
   - [ ] Displays receipts in organized grid
   - [ ] Supports search and filtering
   - [ ] Shows OCR processing status
   - [ ] Allows receipt deletion with confirmation

4. **OCR Integration**:
   - [ ] Queues receipts for automatic processing
   - [ ] Extracts key data (amount, date, vendor)
   - [ ] Handles processing failures gracefully
   - [ ] Updates expense forms with extracted data

5. **Mobile Experience**:
   - [ ] Responsive design for all screen sizes
   - [ ] Touch-friendly interface elements
   - [ ] Fast performance on mobile devices
   - [ ] Works offline with sync when online

## 📌 Resources

- [MediaDevices.getUserMedia() API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Canvas API for Image Processing](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [File API for Upload Handling](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [IndexedDB for Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Google Document AI Documentation](https://cloud.google.com/document-ai/docs)
- [Vue 3 Composition API Guide](https://vuejs.org/guide/composition-api.html)