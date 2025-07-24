<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'
import { Camera, X, RotateCcw, SwitchCamera, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useCamera } from '~/composables/useCamera'
import { compressImage } from '~/utils/imageCompression'
import type { CompressionOptions } from '~/schemas/receipt'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Alert, AlertDescription } from '~/components/ui/alert'

/**
 * Receipt Camera Component
 * 
 * Mobile-first camera interface for capturing receipt photos with real-time preview,
 * camera switching, and automatic image optimization for OCR processing.
 */

interface Props {
  isOpen: boolean
  compressionOptions?: CompressionOptions
}

interface Emits {
  close: []
  capture: [blob: Blob, metadata: { filename: string; originalSize: number; compressedSize: number }]
  error: [message: string]
}

const props = withDefaults(defineProps<Props>(), {
  compressionOptions: () => ({
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'jpeg',
    maxFileSize: 2 * 1024 * 1024 // 2MB
  })
})

const emit = defineEmits<Emits>()

// Camera composable
const {
  stream,
  isSupported,
  isActive,
  error: cameraError,
  isInitializing,
  availableCameras,
  currentCamera,
  initializeCamera,
  stopCamera,
  capturePhoto,
  switchCamera,
  hasMultipleCameras
} = useCamera()

// Component state
const videoRef = ref<HTMLVideoElement>()
const isCapturing = ref(false)
const captureError = ref<string | null>(null)
const showGuide = ref(true)
const hasMultipleCamerasAvailable = ref(false)

// Computed properties
const canCapture = computed(() => 
  isActive.value && !isCapturing.value && !isInitializing.value
)

const statusMessage = computed(() => {
  if (!isSupported.value) return 'Camera not supported'
  if (cameraError.value) return cameraError.value
  if (isInitializing.value) return 'Initializing camera...'
  if (!isActive.value) return 'Camera not ready'
  return 'Ready to capture'
})

const statusVariant = computed(() => {
  if (!isSupported.value || cameraError.value) return 'destructive'
  if (isInitializing.value) return 'secondary'
  return 'default'
})

// Handle capture action
const handleCapture = async () => {
  if (!canCapture.value || !videoRef.value) return

  isCapturing.value = true
  captureError.value = null

  try {
    console.log('Starting photo capture...')
    
    // Capture photo from video stream
    const blob = await capturePhoto(videoRef.value)
    console.log('Photo captured, starting compression...', {
      originalSize: blob.size,
      type: blob.type
    })

    // Compress image for optimal storage and OCR
    const compressionResult = await compressImage(blob, props.compressionOptions)
    console.log('Image compression completed:', {
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      compressionRatio: compressionResult.compressionRatio,
      dimensions: compressionResult.dimensions
    })

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `receipt-${timestamp}.jpg`

    // Emit capture event with metadata
    emit('capture', compressionResult.blob, {
      filename,
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize
    })

    console.log('Photo capture completed successfully')

  } catch (error) {
    console.error('Photo capture failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to capture photo'
    captureError.value = errorMessage
    emit('error', errorMessage)
  } finally {
    isCapturing.value = false
  }
}

// Handle camera switching
const handleSwitchCamera = async () => {
  if (isCapturing.value || isInitializing.value) return

  try {
    await switchCamera()
  } catch (error) {
    console.error('Failed to switch camera:', error)
    emit('error', 'Failed to switch camera')
  }
}

// Handle retry camera initialization
const handleRetry = async () => {
  captureError.value = null
  await initializeCamera()
}

// Toggle capture guide
const toggleGuide = () => {
  showGuide.value = !showGuide.value
}

// Watch for dialog open/close
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    console.log('Opening camera dialog')
    captureError.value = null
    
    // Check for multiple cameras
    hasMultipleCamerasAvailable.value = await hasMultipleCameras()
    
    // Initialize camera
    await initializeCamera({
      facingMode: 'environment', // Use back camera by default
      width: 1920,
      height: 1080
    })

    // Set video stream when available
    if (stream.value && videoRef.value) {
      videoRef.value.srcObject = stream.value
    }
  } else {
    console.log('Closing camera dialog')
    stopCamera()
    captureError.value = null
  }
})

// Watch for stream changes to update video element
watch(stream, (newStream) => {
  if (newStream && videoRef.value) {
    videoRef.value.srcObject = newStream
  }
})

// Cleanup on unmount
onUnmounted(() => {
  stopCamera()
})

// Handle dialog close
const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="max-w-lg p-0 gap-0">
      <DialogHeader class="p-6 pb-0">
        <DialogTitle class="flex items-center gap-2">
          <Camera class="w-5 h-5" />
          Capture Receipt
        </DialogTitle>
        <DialogDescription>
          Position the receipt in the camera frame and tap capture. The image will be automatically optimized for processing.
        </DialogDescription>
      </DialogHeader>
      
      <div class="relative">
        <!-- Camera Status -->
        <div class="px-6 py-2">
          <Badge :variant="statusVariant" class="text-xs">
            {{ statusMessage }}
          </Badge>
        </div>

        <!-- Camera View -->
        <div class="px-6 pb-4">
          <!-- Error State -->
          <div v-if="!isSupported" class="text-center py-12 space-y-4">
            <Camera class="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p class="text-sm font-medium">Camera not supported</p>
              <p class="text-xs text-muted-foreground">
                Your device doesn't support camera access
              </p>
            </div>
          </div>
          
          <!-- Camera Error -->
          <div v-else-if="cameraError" class="text-center py-12 space-y-4">
            <AlertCircle class="mx-auto h-12 w-12 text-destructive" />
            <div>
              <p class="text-sm font-medium text-destructive">{{ cameraError }}</p>
              <Button variant="outline" size="sm" class="mt-3" @click="handleRetry">
                <RotateCcw class="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
          
          <!-- Loading State -->
          <div v-else-if="isInitializing" class="text-center py-12 space-y-4">
            <Loader2 class="mx-auto h-8 w-8 animate-spin text-primary" />
            <div>
              <p class="text-sm font-medium">Initializing camera</p>
              <p class="text-xs text-muted-foreground">
                Please allow camera access when prompted
              </p>
            </div>
          </div>
          
          <!-- Camera Active -->
          <div v-else-if="isActive" class="relative bg-black rounded-lg overflow-hidden">
            <video
              ref="videoRef"
              autoplay
              playsinline
              muted
              class="w-full aspect-[4/3] object-cover bg-black"
            />
            
            <!-- Camera Overlay Guide -->
            <div v-if="showGuide" class="absolute inset-0 pointer-events-none">
              <!-- Corner guides -->
              <div class="absolute inset-4 border-2 border-white/50 rounded-lg">
                <div class="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                <div class="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                <div class="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                <div class="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>
              </div>
              
              <!-- Instructions -->
              <div class="absolute bottom-4 left-4 right-4 text-center">
                <div class="bg-black/50 text-white text-xs px-3 py-2 rounded-full backdrop-blur-sm">
                  Position receipt within the frame
                </div>
              </div>
            </div>
            
            <!-- Camera Controls Overlay -->
            <div class="absolute top-4 right-4 flex gap-2">
              <!-- Switch Camera -->
              <Button
                v-if="hasMultipleCamerasAvailable"
                variant="secondary"
                size="icon"
                class="w-8 h-8 bg-black/50 border-white/20 text-white hover:bg-black/70"
                @click="handleSwitchCamera"
                :disabled="isInitializing || isCapturing"
              >
                <SwitchCamera class="w-4 h-4" />
              </Button>
              
              <!-- Toggle Guide -->
              <Button
                variant="secondary"
                size="icon"
                class="w-8 h-8 bg-black/50 border-white/20 text-white hover:bg-black/70"
                @click="toggleGuide"
              >
                <span class="text-xs">{{ showGuide ? 'Hide' : 'Show' }}</span>
              </Button>
            </div>
          </div>
          
          <!-- Camera Not Ready -->
          <div v-else class="text-center py-12 space-y-4">
            <Camera class="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p class="text-sm font-medium">Camera not ready</p>
              <p class="text-xs text-muted-foreground">
                Waiting for camera initialization
              </p>
            </div>
          </div>
        </div>

        <!-- Capture Error Alert -->
        <div v-if="captureError" class="px-6 pb-4">
          <Alert variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>
              {{ captureError }}
            </AlertDescription>
          </Alert>
        </div>
      </div>
      
      <!-- Dialog Footer -->
      <DialogFooter class="p-6 pt-0">
        <Button variant="outline" @click="handleClose" :disabled="isCapturing">
          Cancel
        </Button>
        
        <Button 
          v-if="canCapture" 
          @click="handleCapture"
          :disabled="!canCapture"
          class="bg-blue-600 hover:bg-blue-700"
        >
          <Loader2 v-if="isCapturing" class="w-4 h-4 mr-2 animate-spin" />
          <Camera v-else class="w-4 h-4 mr-2" />
          {{ isCapturing ? 'Capturing...' : 'Capture Receipt' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Ensure video maintains aspect ratio */
video {
  object-fit: cover;
}

/* Hide video controls */
video::-webkit-media-controls {
  display: none !important;
}

video::-webkit-media-controls-panel {
  display: none !important;
}

video::-webkit-media-controls-play-button {
  display: none !important;
}

video::-webkit-media-controls-start-playback-button {
  display: none !important;
}

/* Smooth transitions for overlay elements */
.absolute {
  transition: opacity 0.2s ease;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .aspect-\[4\/3\] {
    aspect-ratio: 3/4; /* Better for mobile receipt capture */
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border-white\/50 {
    border-color: white;
    border-width: 3px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
  
  .transition-opacity {
    transition: none;
  }
}
</style>