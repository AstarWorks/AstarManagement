/**
 * Accessibility Preferences Composable
 * 
 * Manages user preferences for animations, reduced motion, and other accessibility features
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useMediaQuery, useLocalStorage } from '@vueuse/core'
import { MOTION_QUERIES } from '~/constants/animations'

export interface AccessibilityPreferences {
  reduceMotion: boolean
  reduceTransparency: boolean
  highContrast: boolean
  animationsEnabled: boolean
  autoplay: boolean
  keyboardShortcuts: boolean
  screenReaderAnnouncements: boolean
}

export function useAccessibilityPreferences() {
  // System preferences
  const systemPrefersReducedMotion = useMediaQuery(MOTION_QUERIES.prefersReducedMotion)
  const systemPrefersReducedTransparency = useMediaQuery(MOTION_QUERIES.prefersReducedTransparency)
  const systemPrefersHighContrast = useMediaQuery(MOTION_QUERIES.prefersContrast)
  
  // User preferences (stored in localStorage)
  const userPreferences = useLocalStorage<Partial<AccessibilityPreferences>>(
    'aster-accessibility-preferences',
    {}
  )
  
  // Combined preferences (user overrides system)
  const preferences = computed<AccessibilityPreferences>(() => ({
    reduceMotion: userPreferences.value.reduceMotion ?? systemPrefersReducedMotion.value,
    reduceTransparency: userPreferences.value.reduceTransparency ?? systemPrefersReducedTransparency.value,
    highContrast: userPreferences.value.highContrast ?? systemPrefersHighContrast.value,
    animationsEnabled: userPreferences.value.animationsEnabled ?? !systemPrefersReducedMotion.value,
    autoplay: userPreferences.value.autoplay ?? true,
    keyboardShortcuts: userPreferences.value.keyboardShortcuts ?? true,
    screenReaderAnnouncements: userPreferences.value.screenReaderAnnouncements ?? true
  }))
  
  // Update preference
  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    userPreferences.value = {
      ...userPreferences.value,
      [key]: value
    }
  }
  
  // Reset to system defaults
  const resetToSystemDefaults = () => {
    userPreferences.value = {}
  }
  
  // Apply preferences to DOM
  const applyPreferencesToDOM = () => {
    const root = document.documentElement
    
    // Add/remove classes based on preferences
    root.classList.toggle('reduce-motion', preferences.value.reduceMotion)
    root.classList.toggle('reduce-transparency', preferences.value.reduceTransparency)
    root.classList.toggle('high-contrast', preferences.value.highContrast)
    root.classList.toggle('animations-disabled', !preferences.value.animationsEnabled)
    
    // Set CSS variables
    root.style.setProperty('--animations-enabled', preferences.value.animationsEnabled ? '1' : '0')
  }
  
  // Announce changes to screen readers
  const announceChange = (message: string) => {
    if (!preferences.value.screenReaderAnnouncements) return
    
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.textContent = message
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
  
  // Animation permission check
  const canAnimate = computed(() => 
    preferences.value.animationsEnabled && !preferences.value.reduceMotion
  )
  
  // Get animation duration based on preferences
  const getAnimationDuration = (duration: number): number => {
    if (!canAnimate.value) return 0
    if (preferences.value.reduceMotion) return Math.min(duration * 0.5, 200)
    return duration
  }
  
  // Get animation class based on preferences
  const getAnimationClass = (className: string): string => {
    if (!canAnimate.value) return ''
    return className
  }
  
  // Watch for changes and apply to DOM
  watch(preferences, () => {
    applyPreferencesToDOM()
  }, { deep: true })
  
  // Apply on mount
  onMounted(() => {
    applyPreferencesToDOM()
  })
  
  return {
    // State
    preferences,
    systemPrefersReducedMotion,
    systemPrefersReducedTransparency,
    systemPrefersHighContrast,
    
    // Actions
    updatePreference,
    resetToSystemDefaults,
    announceChange,
    
    // Utilities
    canAnimate,
    getAnimationDuration,
    getAnimationClass
  }
}

/**
 * Keyboard navigation helper
 */
export function useKeyboardNavigation(enabled = true) {
  const activeElement = ref<HTMLElement | null>(null)
  const navigationStack = ref<HTMLElement[]>([])
  
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]'
  ].join(', ')
  
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    return Array.from(container.querySelectorAll(focusableSelectors))
  }
  
  const moveFocus = (direction: 'next' | 'prev' | 'up' | 'down' | 'left' | 'right') => {
    if (!enabled) return
    
    const current = document.activeElement as HTMLElement
    if (!current) return
    
    const container = current.closest('[data-keyboard-container]') as HTMLElement
    if (!container) return
    
    const focusables = getFocusableElements(container)
    const currentIndex = focusables.indexOf(current)
    
    let nextIndex: number
    
    switch (direction) {
      case 'next':
        nextIndex = (currentIndex + 1) % focusables.length
        break
      case 'prev':
        nextIndex = (currentIndex - 1 + focusables.length) % focusables.length
        break
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        // For grid navigation, this would need custom logic based on layout
        nextIndex = currentIndex
        break
      default:
        return
    }
    
    focusables[nextIndex]?.focus()
  }
  
  const trapFocus = (container: HTMLElement) => {
    const focusables = getFocusableElements(container)
    if (focusables.length === 0) return
    
    const firstFocusable = focusables[0]
    const lastFocusable = focusables[focusables.length - 1]
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }
    
    container.addEventListener('keydown', handleKeyDown)
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }
  
  const pushFocus = (element: HTMLElement) => {
    activeElement.value = document.activeElement as HTMLElement
    navigationStack.value.push(activeElement.value)
    element.focus()
  }
  
  const popFocus = () => {
    const previous = navigationStack.value.pop()
    if (previous) {
      previous.focus()
      activeElement.value = previous
    }
  }
  
  return {
    activeElement,
    navigationStack,
    moveFocus,
    trapFocus,
    pushFocus,
    popFocus,
    getFocusableElements
  }
}