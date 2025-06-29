<template>
  <Dialog v-model:open="open">
    <DialogContent class="template-preview-modal">
      <DialogHeader>
        <div class="preview-header">
          <div class="header-info">
            <DialogTitle>{{ template?.name }}</DialogTitle>
            <div class="template-meta">
              <Badge variant="outline">{{ template?.category.name }}</Badge>
              <Badge variant="secondary">{{ template?.metadata.fileType.toUpperCase() }}</Badge>
              <span class="meta-separator">•</span>
              <span class="meta-text">{{ template?.metadata.pageCount }} pages</span>
              <span class="meta-separator">•</span>
              <span class="meta-text">~{{ template?.metadata.estimatedTime }}min</span>
            </div>
          </div>
          
          <div class="header-actions">
            <Button 
              variant="outline" 
              size="sm" 
              @click="downloadPreview"
              :disabled="downloading"
            >
              <Download class="h-4 w-4 mr-2" />
              {{ downloading ? 'Downloading...' : 'Download Preview' }}
            </Button>
            <Button 
              @click="useTemplate"
              :disabled="!template"
            >
              <FileText class="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </div>
        </div>
      </DialogHeader>
      
      <div class="preview-content">
        <Tabs v-model="activeTab" class="preview-tabs">
          <TabsList class="tabs-list">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="variables" :disabled="!template?.variables.length">
              Variables ({{ template?.variables.length || 0 }})
            </TabsTrigger>
          </TabsList>
          
          <!-- Preview Tab -->
          <TabsContent value="preview" class="preview-tab">
            <div class="preview-controls">
              <div class="zoom-controls">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  @click="zoomOut"
                  :disabled="zoomLevel <= 25"
                  aria-label="Zoom out"
                >
                  <ZoomOut class="h-4 w-4" />
                </Button>
                <span class="zoom-level">{{ zoomLevel }}%</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  @click="zoomIn"
                  :disabled="zoomLevel >= 200"
                  aria-label="Zoom in"
                >
                  <ZoomIn class="h-4 w-4" />
                </Button>
              </div>
              
              <div class="view-controls">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  @click="resetZoom"
                  aria-label="Reset zoom"
                >
                  <RotateCcw class="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  @click="toggleFullscreen"
                  aria-label="Toggle fullscreen"
                >
                  <Maximize class="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div class="preview-viewer" :style="{ zoom: zoomLevel / 100 }">
              <div v-if="previewLoading" class="preview-loading">
                <div class="loading-spinner"></div>
                <p>Loading preview...</p>
              </div>
              
              <iframe 
                v-else-if="template?.previewUrl"
                :src="template.previewUrl"
                class="preview-frame"
                :title="`Preview of ${template.name} template`"
                @load="previewLoading = false"
                @error="handlePreviewError"
              />
              
              <div v-else class="preview-error">
                <FileX class="error-icon" />
                <p>Preview not available</p>
              </div>
            </div>
          </TabsContent>
          
          <!-- Details Tab -->
          <TabsContent value="details" class="details-tab">
            <TemplateDetails 
              v-if="template" 
              :template="template" 
            />
          </TabsContent>
          
          <!-- Variables Tab -->
          <TabsContent value="variables" class="variables-tab">
            <TemplateVariables 
              v-if="template?.variables.length" 
              :variables="template.variables"
              :readonly="true"
            />
            <div v-else class="no-variables">
              <p class="text-muted-foreground">This template has no configurable variables.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Download, 
  FileText, 
  ZoomOut, 
  ZoomIn, 
  RotateCcw, 
  Maximize, 
  FileX 
} from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import TemplateDetails from './TemplateDetails.vue'
import TemplateVariables from './TemplateVariables.vue'
import type { Template } from '@/types/template'

interface Props {
  template: Template | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  use: [template: Template]
  close: []
}>()

// State
const open = defineModel<boolean>('open', { default: false })
const activeTab = ref('preview')
const zoomLevel = ref(100)
const downloading = ref(false)
const previewLoading = ref(true)

// Computed
const isFullscreen = ref(false)

// Watch for template changes
watch(() => props.template, (newTemplate) => {
  if (newTemplate) {
    activeTab.value = 'preview'
    zoomLevel.value = 100
    previewLoading.value = true
  }
})

// Watch for modal open/close
watch(open, (isOpen) => {
  if (isOpen) {
    previewLoading.value = true
  } else {
    emit('close')
  }
})

// Methods
const zoomIn = () => {
  if (zoomLevel.value < 200) {
    zoomLevel.value = Math.min(200, zoomLevel.value + 25)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 25) {
    zoomLevel.value = Math.max(25, zoomLevel.value - 25)
  }
}

const resetZoom = () => {
  zoomLevel.value = 100
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const downloadPreview = async () => {
  if (!props.template) return
  
  downloading.value = true
  try {
    // Simulate download - replace with actual implementation
    const response = await fetch(props.template.previewUrl)
    const blob = await response.blob()
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.template.name}-preview.${props.template.metadata.fileType}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download preview:', error)
  } finally {
    downloading.value = false
  }
}

const useTemplate = () => {
  if (props.template) {
    emit('use', props.template)
    open.value = false
  }
}

const handlePreviewError = () => {
  previewLoading.value = false
  console.error('Failed to load template preview')
}

// Cleanup on unmount
const cleanup = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
}

// Listen for fullscreen changes
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// Setup fullscreen listener
if (typeof document !== 'undefined') {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
}

// Cleanup on component unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  cleanup()
  if (typeof document !== 'undefined') {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }
})
</script>

<style scoped>
.template-preview-modal {
  @apply w-full max-w-6xl h-[90vh] p-0 overflow-hidden;
}

.preview-header {
  @apply flex items-start justify-between gap-4 p-6 pb-4;
}

.header-info {
  @apply flex-1 space-y-2;
}

.template-meta {
  @apply flex items-center gap-2 text-sm text-muted-foreground;
}

.meta-separator {
  @apply text-muted-foreground/50;
}

.meta-text {
  @apply text-xs;
}

.header-actions {
  @apply flex gap-2 flex-shrink-0;
}

.preview-content {
  @apply flex-1 overflow-hidden;
}

.preview-tabs {
  @apply h-full flex flex-col;
}

.tabs-list {
  @apply mx-6;
}

.preview-tab {
  @apply flex-1 flex flex-col overflow-hidden;
}

.preview-controls {
  @apply flex items-center justify-between px-6 py-3 border-b border-border;
}

.zoom-controls {
  @apply flex items-center gap-2;
}

.zoom-level {
  @apply text-sm font-medium min-w-[3rem] text-center;
}

.view-controls {
  @apply flex items-center gap-1;
}

.preview-viewer {
  @apply flex-1 overflow-auto bg-muted/30 p-4;
  transform-origin: top left;
}

.preview-frame {
  @apply w-full h-full border-0 bg-white rounded shadow-lg;
  min-height: 600px;
}

.preview-loading {
  @apply flex flex-col items-center justify-center h-full space-y-4;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin;
}

.preview-error {
  @apply flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground;
}

.error-icon {
  @apply w-16 h-16;
}

.details-tab,
.variables-tab {
  @apply overflow-auto px-6 py-4;
}

.no-variables {
  @apply text-center py-8;
}

/* Responsive design */
@media (max-width: 768px) {
  .template-preview-modal {
    @apply max-w-full h-full m-0 rounded-none;
  }
  
  .preview-header {
    @apply flex-col gap-3 items-start;
  }
  
  .header-actions {
    @apply w-full justify-stretch;
  }
  
  .header-actions .button {
    @apply flex-1;
  }
  
  .preview-controls {
    @apply flex-col gap-3;
  }
  
  .zoom-controls,
  .view-controls {
    @apply justify-center;
  }
}

/* Fullscreen styles */
:global(.template-preview-modal[data-fullscreen="true"]) {
  @apply fixed inset-0 z-50 max-w-none h-screen;
}

/* Animation for zoom */
.preview-viewer {
  @apply transition-transform duration-200 ease-out;
}

/* Tab content animations */
.tabs-content {
  @apply animate-in fade-in-0 duration-200;
}

/* Focus styles */
.preview-frame:focus {
  @apply outline-none ring-2 ring-primary ring-offset-2;
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

/* Custom scrollbar for preview viewer */
.preview-viewer::-webkit-scrollbar {
  @apply w-3 h-3;
}

.preview-viewer::-webkit-scrollbar-track {
  @apply bg-muted/30;
}

.preview-viewer::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 rounded-full;
}

.preview-viewer::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}

.preview-viewer::-webkit-scrollbar-corner {
  @apply bg-muted/30;
}
</style>