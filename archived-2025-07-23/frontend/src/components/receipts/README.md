# Receipt Management Components

This directory contains Vue 3 components for receipt capture, upload, and management functionality in the Aster Management legal case management system.

## Components

### ReceiptCamera.vue
Mobile-first camera interface for capturing receipt photos.

**Features:**
- Real-time camera preview with device camera access
- Camera switching for devices with multiple cameras
- Visual capture guide overlay for proper receipt positioning
- Automatic image compression for optimal storage and OCR
- Error handling for camera permission issues
- Responsive design optimized for mobile devices

**Props:**
- `isOpen: boolean` - Controls camera modal visibility
- `compressionOptions?: CompressionOptions` - Image compression settings

**Emits:**
- `close: []` - Camera modal closed
- `capture: [blob: Blob, metadata: object]` - Photo captured successfully
- `error: [message: string]` - Camera or capture error occurred

### ReceiptGallery.vue
Comprehensive receipt gallery with filtering and management capabilities.

**Features:**
- Grid-based receipt display with thumbnails
- Advanced filtering by OCR status, date range, and search terms
- Sortable by creation date, filename, amount, or OCR status
- Receipt viewer modal with full-size image and extracted data
- Batch operations and deletion with confirmation
- Virtual scrolling for large collections
- Responsive design for mobile and desktop

**Props:**
- `expenseId?: string` - Filter receipts by expense ID
- `showFilters?: boolean` - Show/hide filter interface
- `selectable?: boolean` - Enable receipt selection mode
- `maxItems?: number` - Limit number of displayed receipts
- `sortBy?: string` - Default sorting field
- `sortOrder?: 'asc' | 'desc'` - Default sort order

**Emits:**
- `select: [receipt: Receipt]` - Receipt selected (when selectable)
- `delete: [receiptId: string]` - Receipt deleted
- `view: [receipt: Receipt]` - Receipt viewed in modal
- `updated: []` - Receipt collection updated

### ReceiptUpload.vue
Integrated upload component for expense forms.

**Features:**
- Drag-and-drop file upload with visual feedback
- Camera capture integration
- File validation and size limits
- Multiple file upload support
- Upload progress tracking
- Automatic OCR processing queue
- Receipt attachment to expenses
- Error handling and user feedback

**Props:**
- `expenseId?: string` - Associate uploads with expense
- `required?: boolean` - Mark receipt as required
- `multiple?: boolean` - Allow multiple receipt uploads
- `showGallery?: boolean` - Show gallery access button
- `autoProcess?: boolean` - Automatically queue for OCR
- `maxReceipts?: number` - Maximum receipt limit

**Emits:**
- `update:receipts: [receipts: Receipt[]]` - v-model support
- `receipts-changed: [receipts: Receipt[]]` - Receipt list updated
- `error: [message: string]` - Upload or processing error

## Composables

### useCamera()
Camera functionality composable with device management.

**Returns:**
- `stream` - Current media stream
- `isSupported` - Camera API support detection
- `isActive` - Camera currently active
- `error` - Current error message
- `isInitializing` - Camera initialization in progress
- `availableCameras` - List of available camera devices
- `initializeCamera()` - Start camera with options
- `stopCamera()` - Stop current camera stream
- `capturePhoto()` - Capture photo from video element
- `switchCamera()` - Switch between available cameras

### useReceipts()
Receipt management composable with API integration.

**Returns:**
- `receipts` - Current receipt collection
- `loading` - API loading state
- `uploading` - Upload in progress
- `error` - Current error message
- `uploadProgress` - Upload progress tracking
- `filteredReceipts` - Filtered receipt collection
- `fetchReceipts()` - Load receipts from API
- `uploadReceipt()` - Upload new receipt
- `updateReceipt()` - Update receipt metadata
- `deleteReceipt()` - Delete receipt
- `linkToExpense()` - Link receipt to expense

### useOcrProcessing()
OCR processing queue management composable.

**Returns:**
- `processingQueue` - Current OCR processing queue
- `results` - OCR processing results
- `processing` - Queue processing active
- `queueStats` - Queue statistics
- `queueForProcessing()` - Add receipt to OCR queue
- `retryOcrProcessing()` - Retry failed OCR
- `getResult()` - Get OCR result for receipt
- `isInQueue()` - Check if receipt is queued
- `forceProcess()` - Skip queue and process immediately

## Utilities

### imageCompression.ts
Client-side image optimization utilities.

**Functions:**
- `compressImage()` - Compress image with options
- `getImageMetadata()` - Extract image metadata
- `validateImageFile()` - Validate file before upload
- `createThumbnail()` - Generate thumbnail image
- `compressBatch()` - Batch compress multiple images
- `formatFileSize()` - Format bytes for display
- `isOptimalForOCR()` - Check OCR suitability

## Types and Schemas

### Receipt Types
- `Receipt` - Complete receipt record interface
- `ReceiptUpload` - Upload request data structure
- `ReceiptFilters` - Search and filter options
- `OcrResult` - OCR processing result
- `ReceiptStats` - Statistics and metrics

### Validation Schemas
- `receiptSchema` - Complete receipt validation
- `receiptUploadSchema` - Upload validation
- `receiptSearchSchema` - Search parameter validation
- `ocrResultSchema` - OCR result validation
- `cameraOptionsSchema` - Camera configuration validation

## Integration Examples

### Basic Receipt Upload in Form

```vue
<template>
  <form @submit="handleSubmit">
    <!-- Other form fields -->
    
    <ReceiptUpload
      v-model:receipts="formData.receipts"
      :expense-id="expenseId"
      :required="true"
      :max-receipts="5"
      @error="handleReceiptError"
    />
    
    <Button type="submit">Submit Expense</Button>
  </form>
</template>

<script setup lang="ts">
import { ReceiptUpload } from '~/components/receipts'

const formData = ref({
  receipts: [],
  // other fields
})

const handleReceiptError = (error: string) => {
  console.error('Receipt error:', error)
}
</script>
```

### Standalone Receipt Gallery

```vue
<template>
  <ReceiptGallery
    :show-filters="true"
    :selectable="false"
    sort-by="createdAt"
    sort-order="desc"
    @view="handleReceiptView"
    @delete="handleReceiptDelete"
  />
</template>

<script setup lang="ts">
import { ReceiptGallery } from '~/components/receipts'
import type { Receipt } from '~/types/receipt'

const handleReceiptView = (receipt: Receipt) => {
  console.log('Viewing receipt:', receipt.id)
}

const handleReceiptDelete = (receiptId: string) => {
  console.log('Receipt deleted:', receiptId)
}
</script>
```

### Camera Capture Only

```vue
<template>
  <div>
    <Button @click="showCamera = true">
      <Camera class="w-4 h-4 mr-2" />
      Capture Receipt
    </Button>
    
    <ReceiptCamera
      :is-open="showCamera"
      :compression-options="{ maxWidth: 1920, quality: 0.9 }"
      @close="showCamera = false"
      @capture="handleCapture"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { ReceiptCamera } from '~/components/receipts'

const showCamera = ref(false)

const handleCapture = (blob: Blob, metadata: any) => {
  console.log('Photo captured:', metadata.filename, blob.size)
  // Process captured image
}

const handleError = (error: string) => {
  console.error('Camera error:', error)
}
</script>
```

## Testing

Each component includes comprehensive test coverage:

- **Unit Tests**: Component logic and state management
- **Integration Tests**: API interactions and data flow
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Large dataset handling
- **Accessibility Tests**: Screen reader and keyboard navigation

## Browser Support

- **Chrome/Edge**: Full camera and file API support
- **Firefox**: Full support with camera permissions
- **Safari**: Full support with HEIC format handling
- **Mobile Browsers**: Optimized touch interface

## Performance Considerations

- **Image Compression**: Client-side optimization before upload
- **Virtual Scrolling**: Efficient rendering of large galleries
- **Lazy Loading**: Deferred thumbnail loading
- **Caching**: Local storage for recent images
- **Progressive Enhancement**: Graceful degradation without camera

## Security Features

- **File Validation**: Strict MIME type and size checking
- **Permission Handling**: Proper camera access management
- **Data Sanitization**: Safe handling of user uploads
- **Error Boundaries**: Graceful error recovery
- **Audit Logging**: Complete action tracking