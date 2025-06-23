import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useTouchGestures, useMobileInteractions } from '../useTouchGestures'

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  useSwipe: vi.fn(() => ({
    direction: ref(null),
    lengthX: ref(0),
    lengthY: ref(0)
  })),
  usePointerSwipe: vi.fn(() => ({
    distanceX: ref(0),
    distanceY: ref(0)
  }))
}))

// Mock @vueuse/gesture
vi.mock('@vueuse/gesture', () => ({
  useGesture: vi.fn()
}))

// Mock DOM APIs
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  vibrate: vi.fn()
}

const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getComputedStyle: vi.fn(() => ({
    getPropertyValue: vi.fn(() => '0')
  }))
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

Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  },
  writable: true
})

describe('useTouchGestures', () => {
  let targetRef: Ref<HTMLElement | null>
  
  beforeEach(() => {
    vi.clearAllMocks()
    targetRef = ref(document.createElement('div'))
    
    // Reset mocks to default values
    mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    mockWindow.innerWidth = 1024
    mockDocument.body.style = {}
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Touch Gesture Detection', () => {
    it('initializes with default state', () => {
      const result = useTouchGestures(targetRef)
      
      expect(result.isPressed.value).toBe(false)
      expect(result.isPinching.value).toBe(false)
      expect(result.isLongPress.value).toBe(false)
      expect(result.swipeDirection.value).toBe(null)
      expect(result.pinchScale.value).toBe(1)
      expect(result.dragPosition.value).toEqual([0, 0])
      expect(result.dragOffset.value).toEqual([0, 0])
      expect(result.velocity.value).toBe(0)
    })

    it('detects drag gestures', () => {
      const { useGesture } = vi.mocked(await import('@vueuse/gesture'))
      const dragHandler = vi.fn()
      
      useGesture.mockImplementation((handlers: any) => {
        dragHandler.mockImplementation(handlers.onDrag)
      })
      
      const result = useTouchGestures(targetRef)
      
      // Simulate drag start
      dragHandler({
        first: true,
        last: false,
        xy: [100, 200],
        offset: [10, 20],
        velocity: [5, 10],
        event: { preventDefault: vi.fn() }
      })
      
      expect(result.isPressed.value).toBe(true)
      expect(result.dragPosition.value).toEqual([100, 200])
      expect(result.dragOffset.value).toEqual([10, 20])
      
      // Simulate drag end
      dragHandler({
        first: false,
        last: true,
        xy: [150, 250],
        offset: [50, 50],
        velocity: [0, 0],
        event: { preventDefault: vi.fn() }
      })
      
      expect(result.isPressed.value).toBe(false)
    })

    it('detects pinch gestures', () => {
      const { useGesture } = vi.mocked(await import('@vueuse/gesture'))
      const pinchHandler = vi.fn()
      
      useGesture.mockImplementation((handlers: any) => {
        pinchHandler.mockImplementation(handlers.onPinch)
      })
      
      const result = useTouchGestures(targetRef)
      
      // Simulate pinch start
      pinchHandler({
        first: true,
        last: false,
        da: [100],
        event: { preventDefault: vi.fn() }
      })
      
      expect(result.isPinching.value).toBe(true)
      
      // Simulate pinch scale change
      pinchHandler({
        first: false,
        last: false,
        da: [150],
        event: { preventDefault: vi.fn() }
      })
      
      expect(result.pinchScale.value).toBe(1.5)
      
      // Simulate pinch end
      pinchHandler({
        first: false,
        last: true,
        da: [150],
        event: { preventDefault: vi.fn() }
      })
      
      expect(result.isPinching.value).toBe(false)
      expect(result.pinchScale.value).toBe(1)
    })

    it('detects long press', async () => {
      vi.useFakeTimers()
      
      const result = useTouchGestures(targetRef, { longPressTime: 500 })
      
      // Mock drag handler to trigger long press timer
      const { useGesture } = vi.mocked(await import('@vueuse/gesture'))
      const dragHandler = vi.fn()
      
      useGesture.mockImplementation((handlers: any) => {
        dragHandler.mockImplementation(handlers.onDrag)
      })
      
      // Start press
      dragHandler({
        first: true,
        last: false,
        xy: [100, 200],
        offset: [0, 0],
        velocity: [0, 0]
      })
      
      expect(result.isLongPress.value).toBe(false)
      
      // Advance time past long press threshold
      await vi.advanceTimersByTime(600)
      
      expect(result.isLongPress.value).toBe(true)
      
      vi.useRealTimers()
    })

    it('calculates velocity correctly', () => {
      const { useGesture } = vi.mocked(await import('@vueuse/gesture'))
      const dragHandler = vi.fn()
      
      useGesture.mockImplementation((handlers: any) => {
        dragHandler.mockImplementation(handlers.onDrag)
      })
      
      const result = useTouchGestures(targetRef)
      
      // Set velocity
      dragHandler({
        first: false,
        last: false,
        xy: [100, 200],
        offset: [10, 20],
        velocity: [3, 4] // 3^2 + 4^2 = 25, sqrt(25) = 5
      })
      
      expect(result.velocity.value).toBe(5)
    })

    it('triggers haptic feedback when enabled', () => {
      const result = useTouchGestures(targetRef, { 
        enableHapticFeedback: true 
      })
      
      // Mock swipe to trigger haptic feedback
      const { useSwipe } = vi.mocked(await import('@vueuse/core'))
      const swipeConfig = useSwipe.mock.calls[0][1]
      
      mockNavigator.vibrate.mockClear()
      swipeConfig?.onSwipe?.()
      
      expect(mockNavigator.vibrate).toHaveBeenCalledWith(10) // light feedback
    })

    it('resets all values when reset is called', () => {
      const result = useTouchGestures(targetRef)
      
      // Set some values
      result.isPressed.value = true
      result.isPinching.value = true
      result.dragPosition.value = [100, 200]
      result.dragOffset.value = [50, 50]
      
      // Reset
      result.reset()
      
      expect(result.isPressed.value).toBe(false)
      expect(result.isPinching.value).toBe(false)
      expect(result.isLongPress.value).toBe(false)
      expect(result.swipeDirection.value).toBe(null)
      expect(result.pinchScale.value).toBe(1)
      expect(result.dragPosition.value).toEqual([0, 0])
      expect(result.dragOffset.value).toEqual([0, 0])
    })
  })

  describe('useMobileInteractions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('detects touch device correctly', () => {
      Object.defineProperty(window, 'ontouchstart', {
        value: true,
        writable: true
      })
      
      const result = useMobileInteractions()
      expect(result.isTouchDevice.value).toBe(true)
      
      delete (window as any).ontouchstart
      const result2 = useMobileInteractions()
      expect(result2.isTouchDevice.value).toBe(false)
    })

    it('detects orientation correctly', () => {
      mockWindow.innerHeight = 1024
      mockWindow.innerWidth = 768
      
      const result = useMobileInteractions()
      expect(result.orientation.value).toBe('portrait')
      
      mockWindow.innerHeight = 768
      mockWindow.innerWidth = 1024
      
      // Simulate resize event
      const resizeHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'resize'
      )?.[1]
      
      if (resizeHandler) {
        resizeHandler()
        expect(result.orientation.value).toBe('landscape')
      }
    })

    it('detects iOS devices', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      const result = useMobileInteractions()
      expect(result.isIOS.value).toBe(true)
      
      mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)'
      const result2 = useMobileInteractions()
      expect(result2.isIOS.value).toBe(true)
      
      mockNavigator.userAgent = 'Mozilla/5.0 (Android 10)'
      const result3 = useMobileInteractions()
      expect(result3.isIOS.value).toBe(false)
    })

    it('detects Android devices', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10)'
      const result = useMobileInteractions()
      expect(result.isAndroid.value).toBe(true)
      
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)'
      const result2 = useMobileInteractions()
      expect(result2.isAndroid.value).toBe(false)
    })

    it('calculates safe area insets for iOS', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      
      // Mock CSS env values
      mockWindow.getComputedStyle.mockReturnValue({
        getPropertyValue: vi.fn((prop) => {
          if (prop === '--sat') return '44'
          if (prop === '--sab') return '34'
          if (prop === '--sal') return '0'
          if (prop === '--sar') return '0'
          return '0'
        })
      })
      
      const result = useMobileInteractions()
      expect(result.safeAreaInsets.value).toEqual({
        top: 44,
        bottom: 34,
        left: 0,
        right: 0
      })
    })

    it('prevents double tap with useTouchClick', () => {
      vi.useFakeTimers()
      
      const result = useMobileInteractions()
      const handler = vi.fn()
      const touchClick = result.useTouchClick(handler, 300)
      
      // First click
      touchClick()
      expect(handler).toHaveBeenCalledTimes(1)
      
      // Second click too soon (should be prevented)
      vi.advanceTimersByTime(100)
      touchClick()
      expect(handler).toHaveBeenCalledTimes(1)
      
      // Third click after delay (should work)
      vi.advanceTimersByTime(250)
      touchClick()
      expect(handler).toHaveBeenCalledTimes(2)
      
      vi.useRealTimers()
    })
  })
})