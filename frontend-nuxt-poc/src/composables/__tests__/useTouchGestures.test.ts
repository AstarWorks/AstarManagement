import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTouchGestures } from '../useTouchGestures'

// Mock DOM APIs
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

const mockWindow = {
  innerWidth: 1024,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

const mockDocument = {
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  },
  body: {
    style: {}
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

// Setup global mocks
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
})

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
})

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
})

describe('useTouchGestures', () => {
  let composable: ReturnType<typeof useTouchGestures>

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mocks to default values
    mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    mockWindow.innerWidth = 1024
    mockDocument.body.style = {}
  })

  afterEach(() => {
    // Clean up any listeners
    vi.clearAllMocks()
  })

  describe('Device Detection', () => {
    it('detects desktop correctly', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      mockWindow.innerWidth = 1024
      
      composable = useTouchGestures()
      
      expect(composable.touchDevice.value).toBe('desktop')
      expect(composable.isMobile.value).toBe(false)
      expect(composable.isTablet.value).toBe(false)
      expect(composable.shouldUseTouchEvents.value).toBe(false)
    })

    it('detects mobile correctly by user agent', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
      mockWindow.innerWidth = 375
      
      composable = useTouchGestures()
      
      expect(composable.touchDevice.value).toBe('mobile')
      expect(composable.isMobile.value).toBe(true)
      expect(composable.isTablet.value).toBe(false)
      expect(composable.shouldUseTouchEvents.value).toBe(true)
    })

    it('detects mobile correctly by screen width', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      mockWindow.innerWidth = 400
      
      composable = useTouchGestures()
      
      expect(composable.touchDevice.value).toBe('mobile')
      expect(composable.isMobile.value).toBe(true)
    })

    it('detects tablet correctly by user agent', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/537.36'
      mockWindow.innerWidth = 768
      
      composable = useTouchGestures()
      
      expect(composable.touchDevice.value).toBe('tablet')
      expect(composable.isMobile.value).toBe(false)
      expect(composable.isTablet.value).toBe(true)
      expect(composable.shouldUseTouchEvents.value).toBe(true)
    })

    it('detects tablet correctly by screen width', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      mockWindow.innerWidth = 800
      
      composable = useTouchGestures()
      
      expect(composable.touchDevice.value).toBe('tablet')
      expect(composable.isTablet.value).toBe(true)
    })

    it('detects Android devices correctly', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36'
      mockWindow.innerWidth = 400
      
      composable = useTouchGestures()
      
      expect(composable.touchDevice.value).toBe('mobile')
      expect(composable.isMobile.value).toBe(true)
    })
  })

  describe('Configuration Values', () => {
    it('provides correct drag delays for different devices', () => {
      // Mobile
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
      composable = useTouchGestures()
      expect(composable.dragDelay.value).toBe(200)

      // Tablet
      mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/537.36'
      composable = useTouchGestures()
      expect(composable.dragDelay.value).toBe(100)

      // Desktop
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      mockWindow.innerWidth = 1024
      composable = useTouchGestures()
      expect(composable.dragDelay.value).toBe(0)
    })

    it('provides correct touch thresholds for different devices', () => {
      // Mobile
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
      composable = useTouchGestures()
      expect(composable.touchStartThreshold.value).toBe(15)

      // Tablet
      mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/537.36'
      composable = useTouchGestures()
      expect(composable.touchStartThreshold.value).toBe(10)

      // Desktop
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      mockWindow.innerWidth = 1024
      composable = useTouchGestures()
      expect(composable.touchStartThreshold.value).toBe(5)
    })

    it('provides correct fallback tolerance for touch devices', () => {
      // Touch device
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
      composable = useTouchGestures()
      expect(composable.fallbackTolerance.value).toBe(5)

      // Desktop
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      mockWindow.innerWidth = 1024
      composable = useTouchGestures()
      expect(composable.fallbackTolerance.value).toBe(0)
    })
  })

  describe('Sortable Configuration', () => {
    it('provides basic configuration for desktop', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      mockWindow.innerWidth = 1024
      composable = useTouchGestures()
      
      const config = composable.getSortableConfig()
      
      expect(config).toEqual({
        animation: 150,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        dragClass: 'drag-active',
        forceFallback: false,
        fallbackClass: 'drag-fallback',
        removeCloneOnHide: true,
        preventOnFilter: false,
        scrollSensitivity: 30,
        scrollSpeed: 10
      })
    })

    it('provides touch-optimized configuration for mobile', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
      composable = useTouchGestures()
      
      const config = composable.getSortableConfig()
      
      expect(config).toMatchObject({
        animation: 150,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        dragClass: 'drag-active',
        forceFallback: true,
        fallbackClass: 'drag-fallback',
        delay: 200,
        delayOnTouchStart: true,
        touchStartThreshold: 15,
        fallbackTolerance: 5,
        dragoverBubble: false,
        scrollSensitivity: 50,
        scrollSpeed: 20
      })
    })

    it('provides touch-optimized configuration for tablet', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/537.36'
      composable = useTouchGestures()
      
      const config = composable.getSortableConfig()
      
      expect(config).toMatchObject({
        forceFallback: true,
        delay: 100,
        touchStartThreshold: 10,
        fallbackTolerance: 5
      })
    })
  })

  describe('Touch Event Handlers', () => {
    beforeEach(() => {
      composable = useTouchGestures()
    })

    it('handles touch start events', () => {
      const mockTouchEvent = {
        touches: [{
          clientX: 100,
          clientY: 200
        }]
      } as TouchEvent

      const startTime = Date.now()
      composable.onTouchStart(mockTouchEvent)
      
      // Verify that touch start time was recorded (within reasonable range)
      expect(Date.now() - startTime).toBeLessThan(100)
    })

    it('handles touch end events', () => {
      const mockTouchEvent = {} as TouchEvent

      // First start a touch
      const startEvent = { touches: [{ clientX: 100, clientY: 200 }] } as TouchEvent
      composable.onTouchStart(startEvent)
      
      // Wait a bit and end touch
      setTimeout(() => {
        composable.onTouchEnd(mockTouchEvent)
      }, 50)
    })

    it('handles touch move events', () => {
      const mockTouchEvent = {
        touches: [{
          clientX: 150,
          clientY: 250
        }]
      } as TouchEvent

      // Should not throw error
      expect(() => composable.onTouchMove(mockTouchEvent)).not.toThrow()
    })
  })

  describe('Lifecycle and Event Listeners', () => {
    it('adds event listeners on mount for touch devices', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
      composable = useTouchGestures()
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true })
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false })
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true })
    })

    it('does not add touch listeners for desktop', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      mockWindow.innerWidth = 1024
      composable = useTouchGestures()
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(mockDocument.addEventListener).not.toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object))
    })

    it('adds CSS classes for device types', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
      composable = useTouchGestures()
      
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('device-mobile')
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('touch-device')
    })

    it('optimizes scrolling for touch devices', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36'
      composable = useTouchGestures()
      
      expect(mockDocument.body.style.webkitOverflowScrolling).toBe('touch')
      expect(mockDocument.body.style.overscrollBehavior).toBe('none')
    })
  })

  describe('Resize Handling', () => {
    it('re-detects device type on resize', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      mockWindow.innerWidth = 1024
      composable = useTouchGestures()
      
      expect(composable.touchDevice.value).toBe('desktop')
      
      // Simulate resize to mobile width
      mockWindow.innerWidth = 400
      
      // Get the resize handler and call it
      const resizeHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'resize'
      )?.[1]
      
      if (resizeHandler) {
        resizeHandler()
        expect(composable.touchDevice.value).toBe('mobile')
      }
    })
  })
})