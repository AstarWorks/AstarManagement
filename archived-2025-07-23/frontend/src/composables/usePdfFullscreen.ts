import { ref, computed, readonly, onMounted, onUnmounted, type Ref } from 'vue'
import { useFullscreen } from '@vueuse/core'

interface FullscreenOptions {
  enableOrientationLock?: boolean
  preferredOrientation?: 'landscape' | 'portrait' | 'any'
}

const DEFAULT_OPTIONS: FullscreenOptions = {
  enableOrientationLock: true,
  preferredOrientation: 'landscape'
}

export function usePdfFullscreen(
  target: Ref<HTMLElement | null>,
  options: FullscreenOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { isFullscreen, toggle, exit, enter } = useFullscreen(target)
  
  const isOrientationLocked = ref(false)
  const originalOrientation = ref<string | null>(null)
  const error = ref<string | null>(null)
  
  // Check if orientation lock is supported
  const isOrientationLockSupported = computed(() => {
    return typeof screen !== 'undefined' && 
           'orientation' in screen && 
           typeof (screen.orientation as any).lock === 'function'
  })
  
  // Check if fullscreen is supported
  const isFullscreenSupported = computed(() => {
    return typeof document !== 'undefined' && 
           ('fullscreenEnabled' in document || 
            'webkitFullscreenEnabled' in document)
  })
  
  // Lock orientation to specified mode
  const lockOrientation = async (orientation?: string): Promise<void> => {
    if (!isOrientationLockSupported.value) {
      console.warn('Orientation lock not supported')
      return
    }
    
    try {
      const targetOrientation = orientation || opts.preferredOrientation || 'landscape'
      
      // Store original orientation before locking
      if (screen.orientation && !isOrientationLocked.value) {
        originalOrientation.value = screen.orientation.type
      }
      
      // Use type assertion for orientation lock since types might not be fully updated
      await (screen.orientation as any).lock?.(targetOrientation)
      isOrientationLocked.value = true
      error.value = null
    } catch (err) {
      console.warn('Failed to lock orientation:', err)
      error.value = 'Failed to lock orientation'
      // Don't throw - orientation lock is a nice-to-have feature
    }
  }
  
  // Unlock orientation
  const unlockOrientation = (): void => {
    if (!isOrientationLockSupported.value) {
      return
    }
    
    try {
      screen.orientation.unlock()
      isOrientationLocked.value = false
      originalOrientation.value = null
      error.value = null
    } catch (err) {
      console.warn('Failed to unlock orientation:', err)
      error.value = 'Failed to unlock orientation'
    }
  }
  
  // Enter fullscreen with optional orientation lock
  const enterFullscreen = async (): Promise<void> => {
    error.value = null
    
    try {
      await enter()
      
      // Lock orientation after entering fullscreen
      if (opts.enableOrientationLock && isFullscreen.value) {
        await lockOrientation()
      }
    } catch (err) {
      error.value = 'Failed to enter fullscreen'
      console.error('Failed to enter fullscreen:', err)
      throw err
    }
  }
  
  // Exit fullscreen and restore orientation
  const exitFullscreen = async (): Promise<void> => {
    error.value = null
    
    try {
      // Unlock orientation before exiting fullscreen
      if (isOrientationLocked.value) {
        unlockOrientation()
      }
      
      await exit()
    } catch (err) {
      error.value = 'Failed to exit fullscreen'
      console.error('Failed to exit fullscreen:', err)
      throw err
    }
  }
  
  // Toggle fullscreen mode
  const toggleFullscreen = async (): Promise<void> => {
    if (isFullscreen.value) {
      await exitFullscreen()
    } else {
      await enterFullscreen()
    }
  }
  
  // Handle fullscreen change events
  const handleFullscreenChange = (): void => {
    if (!isFullscreen.value) {
      // Cleanup when exiting fullscreen (e.g., via ESC key)
      if (isOrientationLocked.value) {
        unlockOrientation()
      }
    }
  }
  
  // Handle orientation change events
  const handleOrientationChange = (): void => {
    // Re-lock orientation if it was unlocked unexpectedly
    if (isFullscreen.value && opts.enableOrientationLock && !isOrientationLocked.value) {
      lockOrientation()
    }
  }
  
  // Keyboard shortcuts
  const handleKeydown = (event: KeyboardEvent): void => {
    // ESC key handling is automatic via fullscreen API
    if (event.key === 'F11') {
      event.preventDefault()
      toggleFullscreen()
    }
    
    // F key for fullscreen toggle
    if (event.key === 'f' || event.key === 'F') {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        toggleFullscreen()
      }
    }
  }
  
  // Get current orientation info
  const orientationInfo = computed(() => {
    if (typeof screen === 'undefined' || !screen.orientation) {
      return {
        angle: 0,
        type: 'unknown',
        isLandscape: window.innerWidth > window.innerHeight,
        isPortrait: window.innerHeight > window.innerWidth
      }
    }
    
    return {
      angle: screen.orientation.angle,
      type: screen.orientation.type,
      isLandscape: screen.orientation.type.includes('landscape'),
      isPortrait: screen.orientation.type.includes('portrait')
    }
  })
  
  // Setup event listeners
  onMounted(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeydown)
    
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange)
    }
  })
  
  // Cleanup event listeners
  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.removeEventListener('keydown', handleKeydown)
    
    if (screen.orientation) {
      screen.orientation.removeEventListener('change', handleOrientationChange)
    }
    
    // Cleanup on unmount
    if (isOrientationLocked.value) {
      unlockOrientation()
    }
  })
  
  return {
    // State
    isFullscreen: readonly(isFullscreen),
    isOrientationLocked: readonly(isOrientationLocked),
    error: readonly(error),
    
    // Computed
    isFullscreenSupported,
    isOrientationLockSupported,
    orientationInfo,
    
    // Actions
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    lockOrientation,
    unlockOrientation
  }
}