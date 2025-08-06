---
task_id: T06_S03_M003
title: Attachment Management with Preview and Viewer Components
status: pending
estimated_hours: 7
actual_hours: null
assigned_to: Claude
dependencies: ["T05_S03_M003_File_Upload_Component"]
complexity: Medium
updated: null
completed: null
---

# T06_S03_M003: Attachment Management with Preview and Viewer Components

## Description
Implement comprehensive attachment management components including preview thumbnails, integrated document viewer for PDFs, image gallery, and download functionality. Focus on providing rich viewing experiences for legal documents while maintaining security and performance. Build upon the existing attachment system to provide seamless document management for expense records.

## Acceptance Criteria
- [ ] Create attachment preview component with thumbnails
- [ ] Implement PDF viewer with navigation and zoom controls
- [ ] Build image gallery with lightbox functionality
- [ ] Add document viewer for Word/Excel files (when possible)
- [ ] Implement secure download functionality with progress tracking
- [ ] Support attachment metadata display (size, date, type)
- [ ] Add batch operations (download multiple, delete selection)
- [ ] Integrate with existing attachment cards and pages
- [ ] Responsive design for mobile and desktop viewing
- [ ] Japanese localization for all viewer interfaces

## Technical Details

### 1. Attachment Preview Component

**Location**: `frontend/app/components/attachments/AttachmentPreview.vue`

**Component Interface**:
```vue
<template>
  <div class="attachment-preview" :class="previewClasses">
    <!-- Thumbnail Container -->
    <div class="thumbnail-container" @click="openViewer">
      <!-- Image Thumbnail -->
      <div v-if="isImage" class="image-thumbnail">
        <img 
          :src="thumbnailUrl" 
          :alt="attachment.fileName"
          class="thumbnail-image"
          @load="handleImageLoad"
          @error="handleImageError"
        />
        <div v-if="loading" class="thumbnail-loading">
          <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin" />
        </div>
      </div>

      <!-- PDF Thumbnail -->
      <div v-else-if="isPdf" class="pdf-thumbnail">
        <canvas ref="pdfCanvas" class="pdf-canvas" />
        <div class="pdf-overlay">
          <Icon name="lucide:file-text" class="w-8 h-8 text-white" />
          <span class="pdf-pages">{{ pdfPageCount }} pages</span>
        </div>
      </div>

      <!-- Generic File Thumbnail -->
      <div v-else class="generic-thumbnail">
        <Icon :name="getFileIcon()" class="w-8 h-8 text-muted-foreground" />
        <span class="file-extension">{{ getFileExtension() }}</span>
      </div>

      <!-- Preview Overlay -->
      <div class="preview-overlay">
        <div class="overlay-actions">
          <Button variant="secondary" size="sm" @click.stop="downloadAttachment">
            <Icon name="lucide:download" class="w-4 h-4" />
          </Button>
          <Button v-if="canPreview" variant="secondary" size="sm" @click.stop="openViewer">
            <Icon name="lucide:eye" class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- File Info -->
    <div class="file-info">
      <p class="file-name" :title="attachment.fileName">
        {{ attachment.fileName }}
      </p>
      <div class="file-meta">
        <span class="file-size">{{ formatFileSize(attachment.fileSize) }}</span>
        <span class="file-date">{{ formatDate(attachment.uploadedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IAttachment } from '~/types/expense'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

// Set PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface Props {
  attachment: IAttachment
  size?: 'sm' | 'md' | 'lg'
  clickable?: boolean
  showInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  clickable: true,
  showInfo: true
})

const emit = defineEmits<{
  preview: [attachment: IAttachment]
  download: [attachment: IAttachment]
}>()

const { t } = useI18n()
const pdfCanvas = ref<HTMLCanvasElement>()
const loading = ref(false)
const thumbnailUrl = ref<string>()
const pdfPageCount = ref(0)

const isImage = computed(() => 
  attachment.value.mimeType.startsWith('image/')
)

const isPdf = computed(() => 
  attachment.value.mimeType === 'application/pdf'
)

const canPreview = computed(() => 
  isImage.value || isPdf.value
)

// Generate thumbnails on mount
onMounted(async () => {
  if (isImage.value) {
    await generateImageThumbnail()
  } else if (isPdf.value) {
    await generatePdfThumbnail()
  }
})
</script>
```

### 2. PDF Viewer Component

**Location**: `frontend/app/components/attachments/PdfViewer.vue`

```vue
<template>
  <div class="pdf-viewer">
    <!-- Viewer Header -->
    <div class="viewer-header">
      <div class="viewer-title">
        <h3>{{ attachment.fileName }}</h3>
        <div class="file-meta">
          {{ formatFileSize(attachment.fileSize) }} • 
          {{ t('attachments.viewer.pages', { count: totalPages }) }}
        </div>
      </div>
      
      <div class="viewer-actions">
        <Button variant="outline" size="sm" @click="downloadPdf">
          <Icon name="lucide:download" class="w-4 h-4 mr-2" />
          {{ t('attachments.actions.download') }}
        </Button>
        <Button variant="outline" size="sm" @click="$emit('close')">
          <Icon name="lucide:x" class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Viewer Toolbar -->
    <div class="viewer-toolbar">
      <div class="navigation-controls">
        <Button 
          variant="outline" 
          size="sm" 
          :disabled="currentPage <= 1"
          @click="previousPage"
        >
          <Icon name="lucide:chevron-left" class="w-4 h-4" />
        </Button>
        
        <div class="page-input">
          <Input
            v-model.number="currentPage"
            type="number"
            :min="1"
            :max="totalPages"
            class="w-16 text-center"
            @change="goToPage"
          />
          <span class="page-total">/ {{ totalPages }}</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          :disabled="currentPage >= totalPages"
          @click="nextPage"
        >
          <Icon name="lucide:chevron-right" class="w-4 h-4" />
        </Button>
      </div>

      <div class="zoom-controls">
        <Button variant="outline" size="sm" @click="zoomOut" :disabled="scale <= 0.5">
          <Icon name="lucide:zoom-out" class="w-4 h-4" />
        </Button>
        
        <Select v-model="scaleOption" @update:model-value="handleScaleChange">
          <SelectTrigger class="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fit-width">{{ t('attachments.viewer.fitWidth') }}</SelectItem>
            <SelectItem value="fit-page">{{ t('attachments.viewer.fitPage') }}</SelectItem>
            <SelectItem value="0.5">50%</SelectItem>
            <SelectItem value="0.75">75%</SelectItem>
            <SelectItem value="1">100%</SelectItem>
            <SelectItem value="1.25">125%</SelectItem>
            <SelectItem value="1.5">150%</SelectItem>
            <SelectItem value="2">200%</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm" @click="zoomIn" :disabled="scale >= 3">
          <Icon name="lucide:zoom-in" class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- PDF Canvas Container -->
    <div class="pdf-container" ref="containerRef">
      <div v-if="loading" class="pdf-loading">
        <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin" />
        <p>{{ t('attachments.viewer.loading') }}</p>
      </div>
      
      <div v-else-if="error" class="pdf-error">
        <Icon name="lucide:alert-circle" class="w-8 h-8 text-destructive" />
        <p>{{ error }}</p>
        <Button variant="outline" @click="loadPdf">
          {{ t('common.retry') }}
        </Button>
      </div>
      
      <canvas 
        v-else
        ref="canvasRef" 
        class="pdf-canvas"
        :style="{ transform: `scale(${scale})` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IAttachment } from '~/types/expense'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

interface Props {
  attachment: IAttachment
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

// State
const loading = ref(true)
const error = ref<string>()
const pdfDoc = ref<PDFDocumentProxy>()
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1)
const scaleOption = ref('1')

// Refs
const containerRef = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()

// PDF Operations
const loadPdf = async () => {
  loading.value = true
  error.value = undefined
  
  try {
    // In production, this would fetch the actual PDF file
    const pdfUrl = `/api/attachments/${props.attachment.id}/download`
    
    const loadingTask = pdfjsLib.getDocument(pdfUrl)
    pdfDoc.value = await loadingTask.promise
    totalPages.value = pdfDoc.value.numPages
    
    await renderPage(1)
  } catch (err) {
    error.value = t('attachments.viewer.errorLoading')
    console.error('PDF loading error:', err)
  } finally {
    loading.value = false
  }
}

const renderPage = async (pageNum: number) => {
  if (!pdfDoc.value || !canvasRef.value) return
  
  try {
    const page = await pdfDoc.value.getPage(pageNum)
    const viewport = page.getViewport({ scale: scale.value })
    
    const canvas = canvasRef.value
    const context = canvas.getContext('2d')
    
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    const renderContext = {
      canvasContext: context!,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
    currentPage.value = pageNum
  } catch (err) {
    error.value = t('attachments.viewer.errorRendering')
    console.error('PDF rendering error:', err)
  }
}

// Navigation
const previousPage = () => {
  if (currentPage.value > 1) {
    renderPage(currentPage.value - 1)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    renderPage(currentPage.value + 1)
  }
}

const goToPage = () => {
  const page = Math.max(1, Math.min(currentPage.value, totalPages.value))
  if (page !== currentPage.value) {
    renderPage(page)
  }
}

// Zoom
const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.25, 3)
  scaleOption.value = scale.value.toString()
  renderPage(currentPage.value)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value / 1.25, 0.5)
  scaleOption.value = scale.value.toString()
  renderPage(currentPage.value)
}

const handleScaleChange = (value: string) => {
  if (value === 'fit-width' || value === 'fit-page') {
    // Calculate appropriate scale based on container size
    const container = containerRef.value
    if (container && pdfDoc.value) {
      // Implementation for fit-width/fit-page
    }
  } else {
    scale.value = parseFloat(value)
    renderPage(currentPage.value)
  }
}

// Download
const downloadPdf = async () => {
  // Implement secure download
  const link = document.createElement('a')
  link.href = `/api/attachments/${props.attachment.id}/download`
  link.download = props.attachment.fileName
  link.click()
}

// Load PDF on mount
onMounted(() => {
  loadPdf()
})
</script>
```

### 3. Image Gallery Component

**Location**: `frontend/app/components/attachments/ImageGallery.vue`

```vue
<template>
  <div class="image-gallery">
    <!-- Gallery Grid -->
    <div class="gallery-grid">
      <div
        v-for="(image, index) in images"
        :key="image.id"
        class="gallery-item"
        @click="openLightbox(index)"
      >
        <img
          :src="getImageThumbnail(image)"
          :alt="image.fileName"
          class="gallery-thumbnail"
        />
        <div class="gallery-overlay">
          <Icon name="lucide:eye" class="w-6 h-6 text-white" />
        </div>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <div v-if="lightboxOpen" class="lightbox-modal" @click="closeLightbox">
      <div class="lightbox-container">
        <!-- Lightbox Header -->
        <div class="lightbox-header">
          <div class="image-info">
            <h3>{{ currentImage?.fileName }}</h3>
            <div class="image-meta">
              {{ currentImageIndex + 1 }} / {{ images.length }} • 
              {{ formatFileSize(currentImage?.fileSize || 0) }}
            </div>
          </div>
          
          <div class="lightbox-actions">
            <Button variant="ghost" size="sm" @click="downloadImage">
              <Icon name="lucide:download" class="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" @click="closeLightbox">
              <Icon name="lucide:x" class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <!-- Navigation -->
        <Button
          v-if="images.length > 1"
          class="lightbox-nav lightbox-prev"
          variant="ghost"
          size="sm"
          :disabled="currentImageIndex === 0"
          @click="previousImage"
        >
          <Icon name="lucide:chevron-left" class="w-6 h-6" />
        </Button>

        <Button
          v-if="images.length > 1"
          class="lightbox-nav lightbox-next"
          variant="ghost"
          size="sm"
          :disabled="currentImageIndex === images.length - 1"
          @click="nextImage"
        >
          <Icon name="lucide:chevron-right" class="w-6 h-6" />
        </Button>

        <!-- Main Image -->
        <div class="lightbox-image-container" @click.stop>
          <img
            v-if="currentImage"
            :src="getImageUrl(currentImage)"
            :alt="currentImage.fileName"
            class="lightbox-image"
          />
        </div>

        <!-- Thumbnails Strip -->
        <div v-if="images.length > 1" class="lightbox-thumbnails">
          <div
            v-for="(image, index) in images"
            :key="image.id"
            class="lightbox-thumbnail"
            :class="{ active: index === currentImageIndex }"
            @click="goToImage(index)"
          >
            <img
              :src="getImageThumbnail(image)"
              :alt="image.fileName"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IAttachment } from '~/types/expense'

interface Props {
  attachments: IAttachment[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  download: [attachment: IAttachment]
}>()

const { t } = useI18n()

// Filter only image attachments
const images = computed(() =>
  props.attachments.filter(att => att.mimeType.startsWith('image/'))
)

// Lightbox state
const lightboxOpen = ref(false)
const currentImageIndex = ref(0)

const currentImage = computed(() => 
  images.value[currentImageIndex.value]
)

// Lightbox operations
const openLightbox = (index: number) => {
  currentImageIndex.value = index
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const nextImage = () => {
  if (currentImageIndex.value < images.value.length - 1) {
    currentImageIndex.value++
  }
}

const goToImage = (index: number) => {
  currentImageIndex.value = index
}

const downloadImage = () => {
  if (currentImage.value) {
    emit('download', currentImage.value)
  }
}

// Image URL helpers
const getImageThumbnail = (image: IAttachment): string => {
  return `/api/attachments/${image.id}/thumbnail`
}

const getImageUrl = (image: IAttachment): string => {
  return `/api/attachments/${image.id}/preview`
}

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (!lightboxOpen.value) return
  
  switch (e.key) {
    case 'Escape':
      closeLightbox()
      break
    case 'ArrowLeft':
      previousImage()
      break
    case 'ArrowRight':
      nextImage()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>
```

### 4. Attachment Manager Component

**Location**: `frontend/app/components/attachments/AttachmentManager.vue`

```vue
<template>
  <div class="attachment-manager">
    <!-- Manager Header -->
    <div class="manager-header">
      <div class="header-info">
        <h3>{{ t('attachments.manager.title') }}</h3>
        <div class="attachment-count">
          {{ selectedAttachments.length > 0 
            ? t('attachments.manager.selected', { count: selectedAttachments.length })
            : t('attachments.manager.total', { count: attachments.length })
          }}
        </div>
      </div>
      
      <div class="header-actions">
        <Button
          v-if="selectedAttachments.length > 0"
          variant="outline"
          size="sm"
          @click="downloadSelected"
        >
          <Icon name="lucide:download" class="w-4 h-4 mr-2" />
          {{ t('attachments.actions.downloadSelected') }}
        </Button>
        
        <Button
          v-if="selectedAttachments.length > 0"
          variant="outline"
          size="sm"
          @click="deleteSelected"
        >
          <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
          {{ t('attachments.actions.deleteSelected') }}
        </Button>
      </div>
    </div>

    <!-- View Mode Toggle -->
    <div class="view-controls">
      <div class="view-mode-toggle">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          @click="viewMode = 'grid'"
        >
          <Icon name="lucide:grid-3x3" class="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          @click="viewMode = 'list'"
        >
          <Icon name="lucide:list" class="w-4 h-4" />
        </Button>
      </div>
      
      <Select v-model="sortBy" @update:model-value="sortAttachments">
        <SelectTrigger class="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">{{ t('attachments.sort.name') }}</SelectItem>
          <SelectItem value="date">{{ t('attachments.sort.date') }}</SelectItem>
          <SelectItem value="size">{{ t('attachments.sort.size') }}</SelectItem>
          <SelectItem value="type">{{ t('attachments.sort.type') }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Attachments Display -->
    <div class="attachments-container" :class="viewMode">
      <!-- Grid View -->
      <template v-if="viewMode === 'grid'">
        <div class="attachments-grid">
          <div
            v-for="attachment in sortedAttachments"
            :key="attachment.id"
            class="attachment-grid-item"
            :class="{ selected: selectedAttachments.includes(attachment.id) }"
          >
            <Checkbox
              :checked="selectedAttachments.includes(attachment.id)"
              class="attachment-checkbox"
              @update:checked="toggleSelection(attachment.id)"
            />
            
            <AttachmentPreview
              :attachment="attachment"
              size="md"
              @preview="openPreview"
              @download="downloadAttachment"
            />
          </div>
        </div>
      </template>

      <!-- List View -->
      <template v-else>
        <div class="attachments-list">
          <div
            v-for="attachment in sortedAttachments"
            :key="attachment.id"
            class="attachment-list-item"
            :class="{ selected: selectedAttachments.includes(attachment.id) }"
          >
            <Checkbox
              :checked="selectedAttachments.includes(attachment.id)"
              @update:checked="toggleSelection(attachment.id)"
            />
            
            <div class="attachment-icon">
              <Icon :name="getFileIcon(attachment.mimeType)" class="w-8 h-8" />
            </div>
            
            <div class="attachment-details">
              <p class="attachment-name">{{ attachment.fileName }}</p>
              <div class="attachment-meta">
                <span>{{ formatFileSize(attachment.fileSize) }}</span>
                <span>{{ formatDate(attachment.uploadedAt) }}</span>
              </div>
            </div>
            
            <div class="attachment-actions">
              <Button
                variant="ghost"
                size="sm"
                @click="openPreview(attachment)"
              >
                <Icon name="lucide:eye" class="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="downloadAttachment(attachment)"
              >
                <Icon name="lucide:download" class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Preview Modal -->
    <div v-if="previewAttachment" class="preview-modal">
      <PdfViewer
        v-if="previewAttachment.mimeType === 'application/pdf'"
        :attachment="previewAttachment"
        @close="closePreview"
      />
      
      <ImageGallery
        v-else-if="previewAttachment.mimeType.startsWith('image/')"
        :attachments="[previewAttachment]"
        @download="downloadAttachment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IAttachment } from '~/types/expense'

interface Props {
  attachments: IAttachment[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  download: [attachment: IAttachment]
  downloadMultiple: [attachments: IAttachment[]]
  delete: [attachmentIds: string[]]
}>()

const { t } = useI18n()

// State
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref('date')
const selectedAttachments = ref<string[]>([])
const previewAttachment = ref<IAttachment>()

// Computed
const sortedAttachments = computed(() => {
  const sorted = [...props.attachments]
  
  switch (sortBy.value) {
    case 'name':
      return sorted.sort((a, b) => a.fileName.localeCompare(b.fileName))
    case 'date':
      return sorted.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    case 'size':
      return sorted.sort((a, b) => b.fileSize - a.fileSize)
    case 'type':
      return sorted.sort((a, b) => a.mimeType.localeCompare(b.mimeType))
    default:
      return sorted
  }
})

// Selection
const toggleSelection = (attachmentId: string) => {
  const index = selectedAttachments.value.indexOf(attachmentId)
  if (index === -1) {
    selectedAttachments.value.push(attachmentId)
  } else {
    selectedAttachments.value.splice(index, 1)
  }
}

// Actions
const openPreview = (attachment: IAttachment) => {
  previewAttachment.value = attachment
}

const closePreview = () => {
  previewAttachment.value = undefined
}

const downloadAttachment = (attachment: IAttachment) => {
  emit('download', attachment)
}

const downloadSelected = () => {
  const attachments = props.attachments.filter(a => 
    selectedAttachments.value.includes(a.id)
  )
  emit('downloadMultiple', attachments)
}

const deleteSelected = () => {
  if (confirm(t('attachments.confirm.deleteMultiple'))) {
    emit('delete', selectedAttachments.value)
    selectedAttachments.value = []
  }
}
</script>
```

## Integration Guidelines

### 1. Existing Codebase Integration

**Attachment Card Updates** (update `ExpenseAttachmentsCard.vue`):
```vue
<template>
  <Card v-if="attachments && attachments.length > 0">
    <CardHeader>
      <div class="flex justify-between items-center">
        <CardTitle>{{ t('expense.form.fields.attachments') }}</CardTitle>
        <NuxtLink 
          :to="`/expenses/${expenseId}/attachments`" 
          class="text-sm text-primary hover:underline"
        >
          {{ t('expense.actions.manageAttachments') }}
        </NuxtLink>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Replace existing attachment list with preview components -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AttachmentPreview
          v-for="attachment in attachments.slice(0, 6)"
          :key="attachment.id"
          :attachment="attachment"
          size="sm"
          @preview="$emit('preview', attachment)"
          @download="handleDownload"
        />
      </div>
      
      <!-- Show more link if there are additional attachments -->
      <div v-if="attachments.length > 6" class="mt-4 text-center">
        <NuxtLink 
          :to="`/expenses/${expenseId}/attachments`"
          class="text-sm text-primary hover:underline"
        >
          {{ t('attachments.viewAll', { count: attachments.length - 6 }) }}
        </NuxtLink>
      </div>
    </CardContent>
  </Card>
</template>
```

**Attachments Page Updates** (update `pages/expenses/[id]/attachments.vue`):
```vue
<template>
  <div class="expense-attachments-page">
    <!-- Existing upload section -->
    
    <!-- Replace attachment list with manager -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('expense.attachments.list.title') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <AttachmentManager
          :attachments="attachments"
          @download="downloadAttachment"
          @download-multiple="downloadMultipleAttachments"
          @delete="deleteAttachments"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
// Add new methods for batch operations
const downloadMultipleAttachments = async (attachments: IAttachment[]) => {
  // Implement zip download or sequential downloads
  console.log('Downloading multiple attachments:', attachments)
}

const deleteAttachments = async (attachmentIds: string[]) => {
  // Implement batch deletion
  for (const id of attachmentIds) {
    const index = attachments.value.findIndex(a => a.id === id)
    if (index !== -1) {
      attachments.value.splice(index, 1)
    }
  }
}
</script>
```

### 2. Type System Updates

**Attachment Service Types**:
```typescript
// services/attachmentService.ts
export interface AttachmentPreviewOptions {
  width?: number
  height?: number
  quality?: number
}

export interface BatchDownloadOptions {
  format: 'zip' | 'individual'
  includeMetadata?: boolean
}

export class AttachmentService {
  static async generateThumbnail(
    attachment: IAttachment,
    options: AttachmentPreviewOptions = {}
  ): Promise<string> {
    const { width = 200, height = 200, quality = 0.8 } = options
    return `/api/attachments/${attachment.id}/thumbnail?w=${width}&h=${height}&q=${quality}`
  }

  static async downloadAttachment(attachment: IAttachment): Promise<void> {
    const link = document.createElement('a')
    link.href = `/api/attachments/${attachment.id}/download`
    link.download = attachment.fileName
    link.click()
  }

  static async downloadMultiple(
    attachments: IAttachment[],
    options: BatchDownloadOptions = { format: 'zip' }
  ): Promise<void> {
    if (options.format === 'zip') {
      const ids = attachments.map(a => a.id).join(',')
      const link = document.createElement('a')
      link.href = `/api/attachments/download/batch?ids=${ids}`
      link.download = 'attachments.zip'
      link.click()
    } else {
      // Download individually
      for (const attachment of attachments) {
        await this.downloadAttachment(attachment)
        // Add delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }
}
```

## Research Findings

### Existing Codebase Patterns

**Attachment Display** (from `ExpenseAttachmentsCard.vue`):
- File icon mapping based on MIME type
- File size formatting utilities
- Download functionality placeholder
- Preview capability detection
- Responsive grid layout

**File Handling** (from `pages/expenses/[id]/attachments.vue`):
- File type categorization and icon mapping
- Upload progress tracking patterns
- Error handling for file operations
- Japanese date formatting
- Mock attachment data structure

**UI Patterns**:
- Card-based layouts with consistent styling
- Button variants and sizing
- Icon integration throughout
- Loading states and error messaging

### Performance Considerations

**Large File Handling**:
- Lazy loading for thumbnails
- Progressive image loading
- PDF.js optimization for large documents
- Memory management for image galleries

**User Experience**:
- Smooth transitions for lightbox
- Keyboard navigation support
- Touch gestures for mobile
- Accessibility compliance

## Subtasks
- [ ] Create AttachmentPreview component with thumbnails
- [ ] Implement PDF viewer with navigation controls
- [ ] Build image gallery with lightbox functionality
- [ ] Create comprehensive AttachmentManager component
- [ ] Add batch download functionality with zip support
- [ ] Implement secure download with progress tracking
- [ ] Integrate PDF.js for document viewing
- [ ] Add thumbnail generation for various file types
- [ ] Update existing attachment cards and pages
- [ ] Implement responsive design for all screen sizes
- [ ] Add keyboard navigation and accessibility features
- [ ] Create attachment service utilities

## Testing Requirements
- [ ] PDF viewer loads and displays documents correctly
- [ ] Image gallery shows proper thumbnails and navigation
- [ ] Batch operations work with multiple file selections
- [ ] Download functionality works for all supported file types
- [ ] Preview components handle various file sizes efficiently
- [ ] Responsive design works on all screen sizes
- [ ] Keyboard navigation functions properly
- [ ] Error handling displays appropriate messages

## Success Metrics
- PDF documents load and render within 3 seconds
- Image thumbnails generate within 1 second
- Gallery navigation responds within 100ms
- Batch downloads complete without errors
- Memory usage stays under 100MB for large galleries
- All components work on screens from 320px to 1920px width
- 100% accessibility compliance for keyboard navigation

## Notes
- Focus on legal document viewing experience
- Ensure security for sensitive attorney-client documents
- Consider file size limitations for performance
- Implement proper error boundaries for viewer components
- Support Japanese file names and metadata display
- Consider offline capabilities for downloaded documents

## Implementation Priority
1. AttachmentPreview component with basic thumbnails (25% of effort)
2. PDF viewer with full navigation controls (35% of effort)
3. Image gallery with lightbox functionality (20% of effort)
4. AttachmentManager with batch operations (15% of effort)
5. Integration, testing, and responsive design (5% of effort)