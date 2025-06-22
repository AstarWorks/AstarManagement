import { nextTick } from 'vue'

/**
 * Utility functions for modal management
 * 
 * Provides common utilities for ID generation, focus management,
 * scroll position restoration, animation coordination, and event handling.
 */

/**
 * Generate a unique modal ID
 */
export function generateModalId(prefix = 'modal'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Focus management utilities for modals
 */
export class FocusManager {
  private previouslyFocused: HTMLElement | null = null
  private focusableSelectors = [
    'button',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]:not([contenteditable="false"])'
  ].join(', ')

  /**
   * Store the currently focused element before opening modal
   */
  storeFocus(): void {
    this.previouslyFocused = document.activeElement as HTMLElement
  }

  /**
   * Restore focus to the previously focused element
   */
  restoreFocus(): void {
    if (this.previouslyFocused && typeof this.previouslyFocused.focus === 'function') {
      try {
        this.previouslyFocused.focus()
      } catch (error) {
        console.warn('[FocusManager] Failed to restore focus:', error)
      }
    }
    this.previouslyFocused = null
  }

  /**
   * Focus the first focusable element in the modal
   */
  focusFirst(container: HTMLElement): boolean {
    const focusableElement = this.getFirstFocusable(container)
    if (focusableElement) {
      focusableElement.focus()
      return true
    }
    return false
  }

  /**
   * Focus the last focusable element in the modal
   */
  focusLast(container: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus()
      return true
    }
    return false
  }

  /**
   * Get all focusable elements in a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = container.querySelectorAll(this.focusableSelectors)
    return Array.from(elements).filter(element => {
      return this.isVisible(element as HTMLElement) && !this.isDisabled(element as HTMLElement)
    }) as HTMLElement[]
  }

  /**
   * Get the first focusable element in a container
   */
  getFirstFocusable(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container)
    return focusableElements.length > 0 ? focusableElements[0] : null
  }

  /**
   * Trap focus within a container (for modal accessibility)
   */
  trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== 'Tab') return

    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const currentElement = document.activeElement as HTMLElement

    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (currentElement === firstElement || !container.contains(currentElement)) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab (forward)
      if (currentElement === lastElement || !container.contains(currentElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0
  }

  private isDisabled(element: HTMLElement): boolean {
    return element.hasAttribute('disabled') || 
           element.getAttribute('aria-disabled') === 'true'
  }
}

/**
 * Scroll position management for modals
 */
export class ScrollManager {
  private scrollPositions = new Map<string, number>()
  private bodyOriginalOverflow: string | null = null
  private bodyOriginalPaddingRight: string | null = null

  /**
   * Store current scroll position
   */
  storeScrollPosition(key: string = 'main'): void {
    this.scrollPositions.set(key, window.pageYOffset || document.documentElement.scrollTop)
  }

  /**
   * Restore scroll position
   */
  restoreScrollPosition(key: string = 'main'): void {
    const position = this.scrollPositions.get(key)
    if (position !== undefined) {
      window.scrollTo(0, position)
      this.scrollPositions.delete(key)
    }
  }

  /**
   * Prevent body scroll (for modal overlay)
   */
  preventBodyScroll(): void {
    if (typeof document === 'undefined') return

    // Store original values
    this.bodyOriginalOverflow = document.body.style.overflow
    this.bodyOriginalPaddingRight = document.body.style.paddingRight

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = this.getScrollbarWidth()

    // Apply scroll prevention
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
  }

  /**
   * Restore body scroll
   */
  restoreBodyScroll(): void {
    if (typeof document === 'undefined') return

    // Restore original styles
    if (this.bodyOriginalOverflow !== null) {
      document.body.style.overflow = this.bodyOriginalOverflow
      this.bodyOriginalOverflow = null
    }

    if (this.bodyOriginalPaddingRight !== null) {
      document.body.style.paddingRight = this.bodyOriginalPaddingRight
      this.bodyOriginalPaddingRight = null
    }
  }

  private getScrollbarWidth(): number {
    if (typeof document === 'undefined') return 0

    // Create temporary div to measure scrollbar width
    const div = document.createElement('div')
    div.style.width = '100px'
    div.style.height = '100px'
    div.style.overflow = 'scroll'
    div.style.position = 'absolute'
    div.style.top = '-9999px'
    
    document.body.appendChild(div)
    const scrollbarWidth = div.offsetWidth - div.clientWidth
    document.body.removeChild(div)
    
    return scrollbarWidth
  }
}

/**
 * Animation coordination utilities
 */
export class AnimationManager {
  private animationPromises = new Map<string, Promise<void>>()

  /**
   * Wait for CSS animation or transition to complete
   */
  waitForAnimation(element: HTMLElement, timeout = 1000): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now()
      let resolved = false

      const handleEnd = () => {
        if (!resolved) {
          resolved = true
          resolve()
        }
      }

      const handleTimeout = () => {
        if (!resolved) {
          resolved = true
          console.warn('[AnimationManager] Animation timeout reached')
          resolve()
        }
      }

      // Listen for animation events
      element.addEventListener('animationend', handleEnd, { once: true })
      element.addEventListener('transitionend', handleEnd, { once: true })

      // Fallback timeout
      setTimeout(handleTimeout, timeout)

      // If no animation is running, resolve immediately
      const computedStyle = window.getComputedStyle(element)
      const animationDuration = parseFloat(computedStyle.animationDuration) || 0
      const transitionDuration = parseFloat(computedStyle.transitionDuration) || 0

      if (animationDuration === 0 && transitionDuration === 0) {
        handleEnd()
      }
    })
  }

  /**
   * Coordinate entrance animation
   */
  async animateIn(element: HTMLElement, className = 'modal-enter'): Promise<void> {
    element.classList.add(className)
    await nextTick()
    await this.waitForAnimation(element)
  }

  /**
   * Coordinate exit animation
   */
  async animateOut(element: HTMLElement, className = 'modal-exit'): Promise<void> {
    element.classList.add(className)
    await this.waitForAnimation(element)
    element.classList.remove(className)
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Get appropriate animation duration based on user preferences
   */
  getAnimationDuration(defaultDuration = 300): number {
    return this.prefersReducedMotion() ? 0 : defaultDuration
  }
}

/**
 * Event bus for modal communication
 */
export class ModalEventBus {
  private listeners = new Map<string, Set<Function>>()

  /**
   * Subscribe to modal events
   */
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  /**
   * Emit modal event
   */
  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`[ModalEventBus] Error in event listener for "${event}":`, error)
        }
      })
    }
  }

  /**
   * Remove all listeners for an event
   */
  off(event: string): void {
    this.listeners.delete(event)
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear()
  }
}

// Global instances
export const focusManager = new FocusManager()
export const scrollManager = new ScrollManager()
export const animationManager = new AnimationManager()
export const modalEventBus = new ModalEventBus()

/**
 * High-level utility for common modal operations
 */
export const modalUtils = {
  /**
   * Open modal with standard setup
   */
  async openModal(element: HTMLElement): Promise<void> {
    focusManager.storeFocus()
    scrollManager.storeScrollPosition()
    scrollManager.preventBodyScroll()
    
    await nextTick()
    
    focusManager.focusFirst(element)
    modalEventBus.emit('modal:opened', element)
  },

  /**
   * Close modal with standard cleanup
   */
  async closeModal(element: HTMLElement): Promise<void> {
    modalEventBus.emit('modal:closing', element)
    
    await animationManager.animateOut(element)
    
    scrollManager.restoreBodyScroll()
    scrollManager.restoreScrollPosition()
    focusManager.restoreFocus()
    
    modalEventBus.emit('modal:closed', element)
  },

  /**
   * Setup keyboard handlers for modal
   */
  setupKeyboardHandlers(element: HTMLElement, onClose?: () => void): () => void {
    const handleKeydown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (onClose) {
            event.preventDefault()
            onClose()
          }
          break
        case 'Tab':
          focusManager.trapFocus(element, event)
          break
      }
    }

    document.addEventListener('keydown', handleKeydown)
    
    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  }
}