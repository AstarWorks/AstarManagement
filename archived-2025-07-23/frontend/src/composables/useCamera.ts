import { ref, readonly, onUnmounted } from 'vue'
import type { CameraOptions } from '~/schemas/receipt'

/**
 * Camera Composable for Receipt Capture
 * 
 * Provides camera functionality for capturing receipt photos on mobile and desktop devices.
 * Handles camera permissions, stream management, and photo capture with proper error handling.
 */

export interface CameraError {
  name: string
  message: string
  code?: string
}

export function useCamera() {
  // Reactive state
  const stream = ref<MediaStream | null>(null)
  const isSupported = ref(false)
  const isActive = ref(false)
  const error = ref<string | null>(null)
  const isInitializing = ref(false)
  const availableCameras = ref<MediaDeviceInfo[]>([])
  const currentCamera = ref<string | null>(null)

  // Check camera support on initialization
  const checkSupport = () => {
    isSupported.value = !!(
      navigator.mediaDevices?.getUserMedia ||
      // @ts-ignore - Legacy browser support
      (navigator as any).getUserMedia ||
      // @ts-ignore - Legacy browser support
      (navigator as any).webkitGetUserMedia ||
      // @ts-ignore - Legacy browser support  
      (navigator as any).mozGetUserMedia
    )
  }

  // Get available cameras
  const getAvailableCameras = async (): Promise<MediaDeviceInfo[]> => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return []
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(device => device.kind === 'videoinput')
      availableCameras.value = cameras
      return cameras
    } catch (err) {
      console.warn('Failed to enumerate cameras:', err)
      return []
    }
  }

  // Initialize camera with options
  const initializeCamera = async (options: Partial<CameraOptions> = {}) => {
    if (isInitializing.value) return

    isInitializing.value = true
    error.value = null

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported on this device')
      }

      // Stop existing stream
      if (stream.value) {
        stopCamera()
      }

      // Build base video constraints
      const baseVideoConstraints: MediaTrackConstraints = {
        facingMode: options.facingMode || 'environment',
        width: { ideal: options.width || 1920 },
        height: { ideal: options.height || 1080 }
      }

      // If specific camera is requested, add device ID
      let videoConstraints: MediaTrackConstraints = baseVideoConstraints
      if (currentCamera.value && availableCameras.value.length > 0) {
        const camera = availableCameras.value.find(c => c.deviceId === currentCamera.value)
        if (camera) {
          videoConstraints = {
            ...baseVideoConstraints,
            deviceId: { exact: camera.deviceId }
          }
        }
      }

      // Build final constraints
      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
        audio: false
      }

      console.log('Requesting camera access with constraints:', constraints)
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      stream.value = mediaStream
      isActive.value = true
      error.value = null

      // Get actual camera being used
      const videoTrack = mediaStream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        console.log('Camera initialized with settings:', settings)
        
        // Update current camera ID if available
        if (settings.deviceId) {
          currentCamera.value = settings.deviceId
        }
      }

      console.log('Camera initialized successfully')

    } catch (err) {
      const cameraError = err as CameraError
      console.error('Camera initialization failed:', cameraError)
      
      error.value = handleCameraError(cameraError)
      isActive.value = false
      stream.value = null
    } finally {
      isInitializing.value = false
    }
  }

  // Switch between available cameras
  const switchCamera = async () => {
    const cameras = await getAvailableCameras()
    if (cameras.length <= 1) return

    const currentIndex = cameras.findIndex(c => c.deviceId === currentCamera.value)
    const nextIndex = (currentIndex + 1) % cameras.length
    const nextCamera = cameras[nextIndex]

    currentCamera.value = nextCamera.deviceId
    
    if (isActive.value) {
      await initializeCamera()
    }
  }

  // Capture photo from video stream
  const capturePhoto = (videoElement: HTMLVideoElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoElement || !stream.value) {
        reject(new Error('No video stream available'))
        return
      }

      try {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        
        if (!context) {
          reject(new Error('Canvas not supported'))
          return
        }

        // Set canvas dimensions to match video
        canvas.width = videoElement.videoWidth || videoElement.clientWidth
        canvas.height = videoElement.videoHeight || videoElement.clientHeight

        // Draw video frame to canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('Photo captured:', {
              size: blob.size,
              type: blob.type,
              dimensions: `${canvas.width}x${canvas.height}`
            })
            resolve(blob)
          } else {
            reject(new Error('Failed to capture photo'))
          }
        }, 'image/jpeg', 0.9) // High quality for receipts

      } catch (err) {
        console.error('Photo capture failed:', err)
        reject(new Error('Failed to capture photo'))
      }
    })
  }

  // Stop camera stream
  const stopCamera = () => {
    if (stream.value) {
      console.log('Stopping camera stream')
      stream.value.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind, track.label)
      })
      stream.value = null
    }
    isActive.value = false
    error.value = null
  }

  // Handle camera-specific errors
  const handleCameraError = (error: CameraError): string => {
    console.error('Camera error details:', error)

    switch (error.name) {
      case 'NotAllowedError':
        return 'Camera permission denied. Please allow camera access and try again.'
      case 'NotFoundError':
        return 'No camera found on this device.'
      case 'NotReadableError':
        return 'Camera is being used by another application. Please close other camera apps and try again.'
      case 'OverconstrainedError':
        return 'Camera does not support the requested settings. Trying with default settings.'
      case 'SecurityError':
        return 'Camera access blocked for security reasons. Please ensure you are using HTTPS.'
      case 'AbortError':
        return 'Camera initialization was interrupted.'
      case 'TypeError':
        return 'Camera configuration error. Please try again.'
      default:
        if (error.message?.includes('Permission denied')) {
          return 'Camera permission denied. Please allow camera access and try again.'
        }
        if (error.message?.includes('not found')) {
          return 'No camera found on this device.'
        }
        return `Camera error: ${error.message || 'Unknown error occurred'}`
    }
  }

  // Request camera permission (useful for checking before initializing)
  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return false
      }

      // Request minimal permission to check access
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      })
      
      // Stop immediately after permission check
      tempStream.getTracks().forEach(track => track.stop())
      return true

    } catch (err) {
      console.warn('Camera permission check failed:', err)
      return false
    }
  }

  // Check if device has multiple cameras
  const hasMultipleCameras = async (): Promise<boolean> => {
    const cameras = await getAvailableCameras()
    return cameras.length > 1
  }

  // Get camera capabilities (if supported)
  const getCameraCapabilities = (): MediaTrackCapabilities | null => {
    if (!stream.value) return null

    const videoTrack = stream.value.getVideoTracks()[0]
    if (!videoTrack || !videoTrack.getCapabilities) return null

    try {
      return videoTrack.getCapabilities()
    } catch (err) {
      console.warn('Failed to get camera capabilities:', err)
      return null
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopCamera()
  })

  // Initialize support check
  checkSupport()

  return {
    // State
    stream: readonly(stream),
    isSupported: readonly(isSupported),
    isActive: readonly(isActive),
    error: readonly(error),
    isInitializing: readonly(isInitializing),
    availableCameras: readonly(availableCameras),
    currentCamera: readonly(currentCamera),

    // Methods
    initializeCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    requestPermission,
    getAvailableCameras,
    hasMultipleCameras,
    getCameraCapabilities,
    
    // Utilities
    checkSupport
  }
}