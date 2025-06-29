<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Advanced PDF Viewer</h1>
            <p class="text-muted-foreground">
              T06B_S13 - PDF Annotations and Mobile Features Demo
            </p>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- Document selector -->
            <Select v-model="selectedDocument" @update:model-value="loadDocument">
              <SelectTrigger class="w-64">
                <SelectValue placeholder="Select a document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="doc in sampleDocuments" 
                  :key="doc.id" 
                  :value="doc.id"
                >
                  {{ doc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            
            <!-- Settings -->
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-64">
                <DropdownMenuLabel>Viewer Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem @click="toggleSetting('enableAnnotations')">
                  <div class="flex items-center justify-between w-full">
                    <span>Annotations</span>
                    <Switch 
                      :checked="settings.enableAnnotations" 
                      @update:checked="toggleSetting('enableAnnotations')"
                    />
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem @click="toggleSetting('enableMobileControls')">
                  <div class="flex items-center justify-between w-full">
                    <span>Mobile Controls</span>
                    <Switch 
                      :checked="settings.enableMobileControls" 
                      @update:checked="toggleSetting('enableMobileControls')"
                    />
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem @click="toggleSetting('enableFullscreen')">
                  <div class="flex items-center justify-between w-full">
                    <span>Fullscreen</span>
                    <Switch 
                      :checked="settings.enableFullscreen" 
                      @update:checked="toggleSetting('enableFullscreen')"
                    />
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem @click="toggleSetting('enableTextLayer')">
                  <div class="flex items-center justify-between w-full">
                    <span>Text Selection</span>
                    <Switch 
                      :checked="settings.enableTextLayer" 
                      @update:checked="toggleSetting('enableTextLayer')"
                    />
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem @click="toggleSetting('showPageNumbers')">
                  <div class="flex items-center justify-between w-full">
                    <span>Page Numbers</span>
                    <Switch 
                      :checked="settings.showPageNumbers" 
                      @update:checked="toggleSetting('showPageNumbers')"
                    />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <div class="container mx-auto p-4">
      <!-- Info cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ currentDoc?.name || 'None' }}
            </div>
            <p class="text-xs text-muted-foreground">
              {{ currentDoc?.description || 'Select a document to begin' }}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Annotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ annotationStats.total }}</div>
            <p class="text-xs text-muted-foreground">
              {{ annotationStats.highlights }} highlights, {{ annotationStats.notes }} notes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ isMobile ? 'Mobile' : 'Desktop' }}
            </div>
            <p class="text-xs text-muted-foreground">
              {{ isTouchDevice ? 'Touch enabled' : 'Mouse/keyboard' }}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Fullscreen</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ isFullscreen ? 'Active' : 'Inactive' }}
            </div>
            <p class="text-xs text-muted-foreground">
              {{ isFullscreenSupported ? 'Supported' : 'Not supported' }}
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Keyboard shortcuts info -->
      <Alert class="mb-6">
        <Keyboard class="h-4 w-4" />
        <AlertTitle>Keyboard Shortcuts</AlertTitle>
        <AlertDescription>
          <div class="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div><kbd class="kbd">←/→</kbd> Navigate pages</div>
            <div><kbd class="kbd">+/-</kbd> Zoom in/out</div>
            <div><kbd class="kbd">H</kbd> Toggle highlights</div>
            <div><kbd class="kbd">N</kbd> Toggle notes</div>
            <div><kbd class="kbd">F</kbd> Fullscreen</div>
            <div><kbd class="kbd">Esc</kbd> Clear selection</div>
            <div><kbd class="kbd">Ctrl+G</kbd> Go to page</div>
            <div><kbd class="kbd">0</kbd> Fit to width</div>
          </div>
        </AlertDescription>
      </Alert>

      <!-- PDF Viewer -->
      <Card class="h-[600px] md:h-[800px]">
        <CardContent class="p-0 h-full">
          <AdvancedPdfViewer
            v-if="currentDocumentUrl"
            :src="currentDocumentUrl"
            :document-id="selectedDocument"
            :enable-annotations="settings.enableAnnotations"
            :enable-mobile-controls="settings.enableMobileControls"
            :enable-fullscreen="settings.enableFullscreen"
            :enable-text-layer="settings.enableTextLayer"
            :show-page-numbers="settings.showPageNumbers"
            :keyboard-shortcuts="true"
            :view-mode="'single'"
            @load="handleDocumentLoad"
            @error="handleDocumentError"
            @page-change="handlePageChange"
            @scale-change="handleScaleChange"
            @annotation-added="handleAnnotationAdded"
            @annotation-updated="handleAnnotationUpdated"
            @annotation-deleted="handleAnnotationDeleted"
            @fullscreen-change="handleFullscreenChange"
          />
          
          <!-- Placeholder when no document -->
          <div 
            v-else 
            class="h-full flex items-center justify-center bg-muted/20"
          >
            <div class="text-center text-muted-foreground">
              <FileText class="h-16 w-16 mx-auto mb-4" />
              <h3 class="text-lg font-medium mb-2">No Document Selected</h3>
              <p>Select a PDF document from the dropdown above to begin</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Event log -->
      <Card class="mt-6">
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            Event Log
            <Button variant="outline" size="sm" @click="clearEventLog">
              Clear Log
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="max-h-32 overflow-auto space-y-1">
            <div 
              v-for="(event, index) in eventLog" 
              :key="index"
              class="text-xs font-mono p-2 bg-muted rounded"
            >
              <span class="text-muted-foreground">{{ event.timestamp }}</span>
              <span class="ml-2 font-semibold">{{ event.type }}</span>
              <span class="ml-2">{{ event.data }}</span>
            </div>
            <div v-if="eventLog.length === 0" class="text-center text-muted-foreground py-4">
              No events logged yet
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Settings, Keyboard, FileText } from 'lucide-vue-next'
import { useIsMobile } from '~/composables/useIsMobile'

// UI Components
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '~/components/ui/dropdown-menu'
import { Switch } from '~/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

// PDF Viewer
import AdvancedPdfViewer from '~/components/document/AdvancedPdfViewer.vue'

// Mobile detection
const { isMobile } = useIsMobile()
const isTouchDevice = computed(() => 'ontouchstart' in window)

// Sample documents
const sampleDocuments = ref([
  {
    id: 'sample-legal-brief',
    name: 'Legal Brief - Contract Dispute',
    description: 'Sample legal brief for contract dispute case',
    url: '/pdf/sample-legal-brief.pdf'
  },
  {
    id: 'sample-court-filing',
    name: 'Court Filing - Motion to Dismiss',
    description: 'Sample court filing document',
    url: '/pdf/sample-court-filing.pdf'
  },
  {
    id: 'sample-contract',
    name: 'Service Agreement Contract',
    description: 'Sample service agreement contract',
    url: '/pdf/sample-contract.pdf'
  },
  {
    id: 'test-document',
    name: 'Test Document (Multi-page)',
    description: 'Multi-page test document for performance testing',
    url: '/pdf/test-document.pdf'
  }
])

// Current document state
const selectedDocument = ref<string>('')
const currentDocumentUrl = ref<string>('')

// Viewer settings
const settings = ref({
  enableAnnotations: true,
  enableMobileControls: true,
  enableFullscreen: true,
  enableTextLayer: false,
  showPageNumbers: true
})

// Viewer state
const currentPage = ref(1)
const currentScale = ref(1)
const isFullscreen = ref(false)
const isFullscreenSupported = ref(true)

// Event logging
const eventLog = ref<Array<{ timestamp: string; type: string; data: string }>>([])

// Annotation statistics (mock data)
const annotationStats = ref({
  total: 0,
  highlights: 0,
  notes: 0,
  byPage: {} as Record<number, number>
})

// Computed
const currentDoc = computed(() => 
  sampleDocuments.value.find(doc => doc.id === selectedDocument.value)
)

// Methods
const loadDocument = (docId: string) => {
  const doc = sampleDocuments.value.find(d => d.id === docId)
  if (doc) {
    currentDocumentUrl.value = doc.url
    logEvent('document-load', `Loading: ${doc.name}`)
  }
}

const toggleSetting = (key: keyof typeof settings.value) => {
  settings.value[key] = !settings.value[key]
  logEvent('setting-change', `${key}: ${settings.value[key]}`)
}

const logEvent = (type: string, data: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLog.value.unshift({ timestamp, type, data })
  
  // Keep only last 20 events
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20)
  }
}

const clearEventLog = () => {
  eventLog.value = []
}

// Event handlers
const handleDocumentLoad = (document: any) => {
  logEvent('pdf-loaded', `${document.numPages} pages`)
}

const handleDocumentError = (error: string) => {
  logEvent('pdf-error', error)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  logEvent('page-change', `Page ${page}`)
}

const handleScaleChange = (scale: number) => {
  currentScale.value = scale
  logEvent('scale-change', `${Math.round(scale * 100)}%`)
}

const handleAnnotationAdded = (annotation: any) => {
  annotationStats.value.total++
  if (annotation.type === 'highlight') {
    annotationStats.value.highlights++
  } else if (annotation.type === 'note') {
    annotationStats.value.notes++
  }
  logEvent('annotation-added', `${annotation.type} on page ${annotation.page}`)
}

const handleAnnotationUpdated = (annotation: any) => {
  logEvent('annotation-updated', `${annotation.type} on page ${annotation.page}`)
}

const handleAnnotationDeleted = (annotation: any) => {
  annotationStats.value.total--
  if (annotation.type === 'highlight') {
    annotationStats.value.highlights--
  } else if (annotation.type === 'note') {
    annotationStats.value.notes--
  }
  logEvent('annotation-deleted', `${annotation.type} on page ${annotation.page}`)
}

const handleFullscreenChange = (fullscreen: boolean) => {
  isFullscreen.value = fullscreen
  logEvent('fullscreen-change', fullscreen ? 'Entered' : 'Exited')
}

// Watch for mobile device and adjust settings
watch(isMobile, (mobile) => {
  if (mobile) {
    logEvent('device-detection', 'Mobile device detected')
  }
}, { immediate: true })

// SEO
useHead({
  title: 'Advanced PDF Viewer - T06B_S13 Demo',
  meta: [
    {
      name: 'description',
      content: 'Advanced PDF viewer with annotations and mobile features for legal document management'
    }
  ]
})
</script>

<style scoped>
.kbd {
  @apply inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded;
}

/* Custom scrollbar for event log */
.max-h-32::-webkit-scrollbar {
  width: 4px;
}

.max-h-32::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-32::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
  border-radius: 2px;
}
</style>