<template>
  <div class="document-preview">
    <!-- Preview Header -->
    <div class="preview-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Badge :variant="previewError ? 'destructive' : 'default'">
            {{ format.toUpperCase() }} Preview
          </Badge>
          
          <div class="format-selector">
            <Select v-model="currentFormat" @update:model-value="handleFormatChange">
              <SelectTrigger class="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="structured">Structure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <!-- Refresh Controls -->
          <div class="refresh-controls">
            <Button
              @click="refreshPreview"
              :disabled="previewLoading"
              size="sm"
              variant="outline"
            >
              <RefreshCw :class="['h-3 w-3 mr-2', { 'animate-spin': previewLoading }]" />
              Refresh
            </Button>
            
            <Button
              @click="toggleAutoRefresh"
              size="sm"
              :variant="autoRefresh ? 'default' : 'outline'"
            >
              <Timer class="h-3 w-3 mr-2" />
              Auto
            </Button>
          </div>
          
          <!-- Zoom Controls -->
          <div class="zoom-controls" v-if="format === 'pdf'">
            <Button
              @click="zoomOut"
              size="sm"
              variant="outline"
              :disabled="zoomLevel <= 50"
            >
              <ZoomOut class="h-3 w-3" />
            </Button>
            <span class="text-sm text-muted-foreground px-2">
              {{ zoomLevel }}%
            </span>
            <Button
              @click="zoomIn"
              size="sm"
              variant="outline"
              :disabled="zoomLevel >= 200"
            >
              <ZoomIn class="h-3 w-3" />
            </Button>
          </div>
          
          <!-- Full Screen -->
          <Button
            @click="toggleFullscreen"
            size="sm"
            variant="outline"
          >
            <Maximize2 class="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div class="preview-status">
        <div class="text-xs text-muted-foreground">
          {{ lastRefresh ? `Updated ${formatRelativeTime(lastRefresh)}` : 'Never updated' }}
        </div>
        
        <div v-if="previewStats" class="text-xs text-muted-foreground">
          {{ previewStats.variables }} variables • 
          {{ previewStats.pages }} pages • 
          {{ previewStats.renderTime }}ms
        </div>
      </div>
    </div>

    <!-- Preview Content -->
    <div class="preview-content" ref="previewContainer">
      <!-- Loading State -->
      <div v-if="previewLoading" class="preview-loading">
        <div class="loading-container">
          <div class="loading-spinner">
            <Loader2 class="h-8 w-8 animate-spin text-blue-500" />
          </div>
          <div class="loading-text">
            <div class="font-medium">Generating Preview</div>
            <div class="text-sm text-muted-foreground">
              Processing template variables...
            </div>
          </div>
        </div>
        <div class="preview-skeleton">
          <Skeleton class="h-96 w-full" />
        </div>
      </div>
      
      <!-- Error State -->
      <Alert v-else-if="previewError" variant="destructive" class="m-4">
        <AlertTriangle class="h-4 w-4" />
        <AlertTitle>Preview Generation Failed</AlertTitle>
        <AlertDescription>
          {{ previewError }}
          <Button
            @click="refreshPreview"
            size="sm"
            variant="outline"
            class="ml-3"
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
      
      <!-- Success State -->
      <div v-else class="preview-document">
        <!-- HTML Preview -->
        <div 
          v-if="currentFormat === 'html'"
          class="html-preview"
          :style="{ transform: `scale(${zoomLevel / 100})` }"
        >
          <div 
            v-html="sanitizedContent"
            class="document-content"
          />
        </div>
        
        <!-- PDF Preview -->
        <div 
          v-else-if="currentFormat === 'pdf'"
          class="pdf-preview"
        >
          <iframe
            :src="previewContent"
            class="pdf-iframe"
            :style="{ 
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left'
            }"
            @load="handlePdfLoad"
            @error="handlePdfError"
          />
        </div>
        
        <!-- Structured Preview -->
        <div 
          v-else-if="currentFormat === 'structured'"
          class="structured-preview"
        >
          <DocumentStructuredPreview
            :content="structuredContent"
            :template-id="templateId"
            :variables="detectedVariables"
          />
        </div>
      </div>
    </div>

    <!-- Preview Footer -->
    <div class="preview-footer" v-if="!previewLoading && !previewError">
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <div class="preview-info">
          Document ready for generation
        </div>
        
        <div class="preview-actions">
          <Button
            @click="downloadPreview"
            size="sm"
            variant="outline"
          >
            <Download class="h-3 w-3 mr-2" />
            Download Preview
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  RefreshCw, 
  Timer, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  AlertTriangle,
  Loader2,
  Download
} from 'lucide-vue-next'
import DOMPurify from 'dompurify'

// UI Components
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Skeleton } from '~/components/ui/skeleton'

// Child Components
import DocumentStructuredPreview from './DocumentStructuredPreview.vue'

// Composables
import { useDocumentPreview } from '~/composables/document-generation/useDocumentPreview'
import { formatRelativeTime } from '~/utils/formatters'

// Props
interface Props {
  templateId: string
  matterId: string
  format?: 'html' | 'pdf' | 'structured'
  refreshMode?: 'auto' | 'manual'
  autoRefreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  format: 'html',
  refreshMode: 'manual',
  autoRefreshInterval: 5000
})

// Emits
const emit = defineEmits<{
  error: [error: string]
  loaded: [stats: any]
  formatChanged: [format: string]
}>()

// State
const previewContainer = ref<HTMLElement>()
const currentFormat = ref(props.format)
const zoomLevel = ref(100)
const autoRefresh = ref(props.refreshMode === 'auto')
const fullscreen = ref(false)

// Preview composable
const {
  previewContent,
  previewLoading,
  previewError,
  previewStats,
  lastRefresh,
  generatePreview,
  refreshPreview: baseRefreshPreview
} = useDocumentPreview()

// Computed
const sanitizedContent = computed(() => {
  if (currentFormat.value === 'html' && previewContent.value) {
    return DOMPurify.sanitize(previewContent.value, {
      ALLOWED_TAGS: [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 'br', 'hr', 'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'img', 'a'
      ],
      ALLOWED_ATTR: ['class', 'style', 'href', 'src', 'alt', 'title']
    })
  }
  return previewContent.value
})

const structuredContent = computed(() => {
  try {
    return currentFormat.value === 'structured' && previewContent.value
      ? JSON.parse(previewContent.value)
      : null
  } catch {
    return null
  }
})

const detectedVariables = computed(() => {
  // Mock detected variables - in real implementation, this would come from the template
  return [
    { name: 'client_name', value: 'John Doe', type: 'text' },
    { name: 'matter_title', value: 'Estate Planning', type: 'text' },
    { name: 'date_created', value: '2025-06-30', type: 'date' },
    { name: 'lawyer_name', value: 'Sarah Johnson', type: 'text' },
    { name: 'fee_amount', value: '$5,000', type: 'currency' }
  ]
})

// Auto-refresh interval
let refreshInterval: NodeJS.Timeout | null = null

// Methods
const refreshPreview = async () => {
  try {
    await baseRefreshPreview({
      templateId: props.templateId,
      matterId: props.matterId,
      format: currentFormat.value
    })
    
    emit('loaded', previewStats.value)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Preview generation failed'
    emit('error', errorMessage)
  }
}

const handleFormatChange = (newFormat: string) => {
  currentFormat.value = newFormat as 'html' | 'pdf' | 'structured'
  emit('formatChanged', newFormat)
  refreshPreview()
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  
  refreshInterval = setInterval(() => {
    if (autoRefresh.value && !previewLoading.value) {
      refreshPreview()
    }
  }, props.autoRefreshInterval)
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

const zoomIn = () => {
  if (zoomLevel.value < 200) {
    zoomLevel.value = Math.min(200, zoomLevel.value + 25)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 50) {
    zoomLevel.value = Math.max(50, zoomLevel.value - 25)
  }
}

const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value
  
  if (fullscreen.value && previewContainer.value) {
    previewContainer.value.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const handlePdfLoad = () => {
  // PDF loaded successfully
}

const handlePdfError = () => {
  emit('error', 'Failed to load PDF preview')
}

const downloadPreview = () => {
  // Implementation for downloading preview
  const blob = new Blob([previewContent.value || ''], { 
    type: currentFormat.value === 'html' ? 'text/html' : 'application/pdf' 
  })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `preview.${currentFormat.value}`
  link.click()
  
  URL.revokeObjectURL(url)
}

// Watchers
watch([() => props.templateId, () => props.matterId], () => {
  if (props.templateId && props.matterId) {
    refreshPreview()
  }
}, { immediate: true })

watch(() => props.refreshMode, (newMode) => {
  autoRefresh.value = newMode === 'auto'
  
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// Lifecycle
onMounted(() => {
  if (props.refreshMode === 'auto') {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.document-preview {
  @apply h-full flex flex-col border rounded-lg bg-background;
}

.preview-header {
  @apply border-b p-4 space-y-3;
}

.format-selector {
  @apply flex items-center;
}

.refresh-controls {
  @apply flex items-center gap-1;
}

.zoom-controls {
  @apply flex items-center border rounded-lg;
}

.preview-status {
  @apply flex items-center justify-between;
}

.preview-content {
  @apply flex-1 overflow-auto relative;
}

.preview-loading {
  @apply absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm;
}

.loading-container {
  @apply flex items-center gap-3 mb-6;
}

.loading-spinner {
  @apply flex-shrink-0;
}

.loading-text {
  @apply text-center;
}

.preview-skeleton {
  @apply absolute inset-4;
}

.preview-document {
  @apply h-full;
}

.html-preview {
  @apply p-6 h-full overflow-auto;
  transform-origin: top left;
}

.document-content {
  @apply prose prose-sm max-w-none;
  /* Legal document styling */
  font-family: 'Times New Roman', serif;
  line-height: 1.6;
}

.pdf-preview {
  @apply h-full relative overflow-auto;
}

.pdf-iframe {
  @apply w-full h-full border-0;
}

.structured-preview {
  @apply p-4 h-full overflow-auto;
}

.preview-footer {
  @apply border-t p-3 bg-muted/50;
}

.preview-info {
  @apply flex items-center gap-2;
}

.preview-actions {
  @apply flex items-center gap-2;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .preview-header {
    @apply p-3;
  }
  
  .refresh-controls,
  .zoom-controls {
    @apply hidden;
  }
  
  .html-preview {
    @apply p-4;
  }
}

/* Print styles */
@media print {
  .preview-header,
  .preview-footer {
    @apply hidden;
  }
  
  .document-content {
    @apply text-black;
  }
}
</style>