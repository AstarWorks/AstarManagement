<template>
  <div class="pdf-viewer-example min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">PDF Viewer Example</h1>
            <p class="text-sm text-muted-foreground">T06A_S13 Basic PDF Viewer Demo</p>
          </div>
          <div class="flex items-center gap-2">
            <!-- File Upload Button -->
            <input
              ref="fileInput"
              type="file"
              accept=".pdf"
              @change="handleFileUpload"
              class="hidden"
            />
            <Button @click="fileInput?.click()" variant="outline">
              <Upload class="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
            
            <!-- Sample PDF Buttons -->
            <Button 
              @click="loadSamplePdf('sample1')" 
              variant="outline"
              :disabled="loading"
            >
              Load Sample 1
            </Button>
            <Button 
              @click="loadSamplePdf('sample2')" 
              variant="outline"
              :disabled="loading"
            >
              Load Sample 2
            </Button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto p-4">
      <!-- PDF Viewer -->
      <div class="border rounded-lg overflow-hidden shadow-lg bg-card">
        <BasicPdfViewer
          v-if="pdfSrc"
          :src="pdfSrc"
          :initial-scale="1.0"
          :initial-page="1"
          :keyboard-shortcuts="true"
          :enable-text-layer="false"
          :view-mode="viewMode"
          :show-page-numbers="true"
          :auto-load="true"
          @load="handlePdfLoad"
          @error="handlePdfError"
          @page-change="handlePageChange"
          @scale-change="handleScaleChange"
          class="h-[800px]"
        />
        
        <!-- Empty State -->
        <div v-else class="h-[600px] flex flex-col items-center justify-center text-center p-8">
          <FileText class="h-16 w-16 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No PDF Selected</h3>
          <p class="text-muted-foreground mb-6 max-w-md">
            Upload a PDF file or select one of the sample documents to test the PDF viewer functionality.
          </p>
          <div class="flex gap-3">
            <Button @click="fileInput?.click()">
              <Upload class="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
            <Button variant="outline" @click="loadSamplePdf('sample1')">
              Try Sample PDF
            </Button>
          </div>
        </div>
      </div>

      <!-- Controls and Information -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Viewer Controls -->
        <Card>
          <CardHeader>
            <CardTitle>Viewer Controls</CardTitle>
            <CardDescription>
              Configure the PDF viewer settings
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- View Mode -->
            <div class="space-y-2">
              <Label for="view-mode">View Mode</Label>
              <Select v-model="viewMode">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Page</SelectItem>
                  <SelectItem value="continuous">Continuous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Text Layer Toggle -->
            <div class="flex items-center space-x-2">
              <Checkbox 
                id="text-layer" 
                v-model="enableTextLayer"
                :disabled="!pdfSrc"
              />
              <Label for="text-layer">Enable Text Selection</Label>
            </div>

            <!-- Keyboard Shortcuts Toggle -->
            <div class="flex items-center space-x-2">
              <Checkbox 
                id="keyboard-shortcuts" 
                v-model="keyboardShortcuts"
                :disabled="!pdfSrc"
              />
              <Label for="keyboard-shortcuts">Keyboard Shortcuts</Label>
            </div>

            <!-- Reset Button -->
            <Button 
              variant="outline" 
              @click="resetViewer"
              :disabled="!pdfSrc"
              class="w-full"
            >
              Reset Viewer
            </Button>
          </CardContent>
        </Card>

        <!-- Document Information -->
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
            <CardDescription>
              Current PDF document details
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-if="documentInfo">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="font-medium">Pages:</div>
                <div>{{ documentInfo.totalPages }}</div>
                
                <div class="font-medium">Current Page:</div>
                <div>{{ documentInfo.currentPage }}</div>
                
                <div class="font-medium">Zoom:</div>
                <div>{{ Math.round(documentInfo.scale * 100) }}%</div>
                
                <div class="font-medium">Status:</div>
                <div class="flex items-center gap-1">
                  <div 
                    class="w-2 h-2 rounded-full"
                    :class="loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'"
                  />
                  <span>{{ loading ? 'Loading' : error ? 'Error' : 'Ready' }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-muted-foreground">
              No document loaded
            </div>

            <!-- Error Display -->
            <Alert v-if="error" variant="destructive" class="mt-4">
              <AlertTriangle class="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <!-- Feature Demonstration -->
      <Card class="mt-6">
        <CardHeader>
          <CardTitle>Feature Demonstration</CardTitle>
          <CardDescription>
            Test the core PDF viewer features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 border rounded-lg">
              <CheckCircle class="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h4 class="font-medium mb-1">PDF Rendering</h4>
              <p class="text-xs text-muted-foreground">Canvas-based rendering with PDF.js</p>
            </div>
            
            <div class="text-center p-4 border rounded-lg">
              <ZoomIn class="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h4 class="font-medium mb-1">Zoom Controls</h4>
              <p class="text-xs text-muted-foreground">In/out, fit, width, and custom scales</p>
            </div>
            
            <div class="text-center p-4 border rounded-lg">
              <Navigation class="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h4 class="font-medium mb-1">Navigation</h4>
              <p class="text-xs text-muted-foreground">Page navigation with keyboard support</p>
            </div>
            
            <div class="text-center p-4 border rounded-lg">
              <Smartphone class="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <h4 class="font-medium mb-1">Responsive</h4>
              <p class="text-xs text-muted-foreground">Mobile-friendly with touch support</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  ZoomIn, 
  Navigation, 
  Smartphone,
  AlertTriangle
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import BasicPdfViewer from '~/components/document/BasicPdfViewer.vue'

// Page metadata
useHead({
  title: 'PDF Viewer Example - Aster Management',
  meta: [
    { name: 'description', content: 'PDF viewer example demonstrating BasicPdfViewer component functionality' }
  ]
})

// Template refs
const fileInput = ref<HTMLInputElement>()

// PDF viewer state
const pdfSrc = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Viewer configuration
const viewMode = ref<'single' | 'continuous'>('single')
const enableTextLayer = ref(false)
const keyboardShortcuts = ref(true)

// Document information
const documentInfo = ref<{
  totalPages: number
  currentPage: number
  scale: number
} | null>(null)

// Sample PDFs (these would be real PDF URLs in production)
const samplePdfs = {
  sample1: '/samples/sample-legal-document.pdf',
  sample2: '/samples/sample-contract.pdf'
}

// Event handlers
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  if (file.type !== 'application/pdf') {
    error.value = 'Please select a PDF file'
    return
  }

  // Create object URL for the file
  const fileUrl = URL.createObjectURL(file)
  pdfSrc.value = fileUrl
  error.value = null
}

const loadSamplePdf = (sample: keyof typeof samplePdfs) => {
  // In a real application, you would load actual sample PDFs
  // For this demo, we'll simulate loading
  loading.value = true
  error.value = null
  
  setTimeout(() => {
    // Simulate PDF loading
    // In production, this would be a real PDF URL
    pdfSrc.value = samplePdfs[sample]
    loading.value = false
  }, 1000)
}

const handlePdfLoad = (document: any) => {
  loading.value = false
  error.value = null
  console.log('PDF loaded:', document)
  
  // Update document info
  if (document && document.numPages) {
    documentInfo.value = {
      totalPages: document.numPages,
      currentPage: 1,
      scale: 1.0
    }
  }
}

const handlePdfError = (errorMessage: string) => {
  loading.value = false
  error.value = errorMessage
  documentInfo.value = null
  console.error('PDF error:', errorMessage)
}

const handlePageChange = (page: number) => {
  if (documentInfo.value) {
    documentInfo.value.currentPage = page
  }
}

const handleScaleChange = (scale: number) => {
  if (documentInfo.value) {
    documentInfo.value.scale = scale
  }
}

const resetViewer = () => {
  pdfSrc.value = null
  documentInfo.value = null
  error.value = null
  loading.value = false
  viewMode.value = 'single'
  enableTextLayer.value = false
  keyboardShortcuts.value = true
}

// Watch for viewer configuration changes
watch([enableTextLayer, keyboardShortcuts], () => {
  // In a real implementation, these would trigger viewer updates
  // For now, they're just reactive to the UI
})
</script>

<style scoped>
/* Custom scrollbar for better UX */
:deep(.pdf-container) {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

:deep(.pdf-container::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.pdf-container::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.pdf-container::-webkit-scrollbar-thumb) {
  background-color: hsl(var(--border));
  border-radius: 4px;
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

/* Card hover effects */
.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;
}

/* Feature demonstration grid responsive */
@media (max-width: 768px) {
  .grid-cols-2.md\\:grid-cols-4 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

/* Status indicator animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.bg-yellow-500 {
  animation: pulse 2s infinite;
}
</style>