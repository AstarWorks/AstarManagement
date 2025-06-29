import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useMobilePerformance, useKanbanPerformance } from '../useMobilePerformance'

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: vi.fn((target: any, callback: any, options: any) => ({
    stop: vi.fn()
  })),
  useThrottleFn: vi.fn((fn: any, ms: any) => fn),
  useDebounce: vi.fn((fn: any, ms: any) => fn),
  useRafFn: vi.fn((fn: any) => ({
    pause: vi.fn(),
    resume: vi.fn()
  }))
}))

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => [{ duration: 16.7 }]),
  memory: {
    usedJSHeapSize: 50 * 1048576 // 50MB
  }
}

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
})

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  setTimeout(cb, 0)
  return 1
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

describe('useMobilePerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Performance Metrics', () => {
    it('tracks FPS correctly', async () => {
      const { fps, resumeFpsTracking } = useMobilePerformance()
      
      resumeFpsTracking()
      
      // Simulate 60 frames in 1 second
      for (let i = 0; i < 60; i++) {
        mockPerformance.now.mockReturnValue(i * 16.67) // ~60fps
        await vi.advanceTimersByTime(16.67)
      }
      
      // After 1 second, FPS should be calculated
      mockPerformance.now.mockReturnValue(1000)
      await vi.advanceTimersByTime(16.67)
      
      expect(fps.value).toBeCloseTo(60, 0)
    })

    it('tracks memory usage when available', () => {
      const { trackMemory, memoryUsage } = useMobilePerformance()
      
      trackMemory()
      
      expect(memoryUsage.value).toBe(50) // 50MB
    })

    it('measures render time correctly', () => {
      const { startPerformanceMeasure, endPerformanceMeasure, renderTime } = useMobilePerformance()
      
      startPerformanceMeasure('test-render')
      endPerformanceMeasure('test-render')
      
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-render-start')
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-render-end')
      expect(mockPerformance.measure).toHaveBeenCalledWith('test-render', 'test-render-start', 'test-render-end')
      expect(renderTime.value).toBe(16.7)
    })
  })

  describe('GPU Acceleration', () => {
    it('enables GPU acceleration on element', () => {
      const { enableGpuAcceleration } = useMobilePerformance()
      const element = document.createElement('div')
      
      enableGpuAcceleration(element)
      
      expect(element.style.transform).toBe('translateZ(0)')
      expect(element.style.willChange).toBe('transform')
      expect(element.style.backfaceVisibility).toBe('hidden')
      expect(element.style.perspective).toBe('1000px')
    })

    it('skips GPU acceleration when disabled', () => {
      const { enableGpuAcceleration } = useMobilePerformance({ enableGpuAcceleration: false })
      const element = document.createElement('div')
      
      enableGpuAcceleration(element)
      
      expect(element.style.transform).toBe('')
    })
  })

  describe('Virtual Scrolling', () => {
    it('calculates visible range correctly', () => {
      const containerRef = ref(document.createElement('div'))
      Object.defineProperty(containerRef.value, 'clientHeight', {
        value: 600,
        writable: true,
        configurable: true
      }) // Container height
      
      const items = ref(Array(100).fill(null).map((_, i) => ({ id: i })))
      const itemHeight = 50
      
      const { useVirtualScroll } = useMobilePerformance()
      const { visibleItems, totalHeight, offsetY, visibleRange } = useVirtualScroll(
        containerRef,
        items,
        itemHeight,
        2 // buffer
      )
      
      expect(totalHeight.value).toBe(5000) // 100 items * 50px
      expect(visibleRange.value.start).toBe(0)
      expect(visibleRange.value.end).toBe(14) // 600px / 50px + 2 buffer = 14
      expect(visibleItems.value.length).toBe(14)
      expect(offsetY.value).toBe(0)
    })

    it('updates visible range on scroll', async () => {
      const containerRef = ref(document.createElement('div'))
      Object.defineProperty(containerRef.value, 'clientHeight', {
        value: 600,
        writable: true,
        configurable: true
      })
      
      const items = ref(Array(100).fill(null).map((_, i) => ({ id: i })))
      const itemHeight = 50
      
      const { useVirtualScroll } = useMobilePerformance()
      const { visibleRange } = useVirtualScroll(containerRef, items, itemHeight)
      
      // Simulate scroll
      const scrollHandler = (containerRef.value!.addEventListener as any).mock.calls.find(
        (call: any) => call[0] === 'scroll'
      )?.[1]
      
      containerRef.value!.scrollTop = 500
      scrollHandler?.({ target: containerRef.value })
      
      expect(visibleRange.value.start).toBeGreaterThan(0)
    })
  })

  describe('Lazy Loading', () => {
    it('observes elements and marks them as loaded', async () => {
      const { useLazyLoad } = useMobilePerformance()
      const { observe, isLoaded } = useLazyLoad()
      
      const element = document.createElement('div')
      const itemId = 'item-1'
      const onVisible = vi.fn()
      
      observe(element, itemId, onVisible)
      
      // Simulate intersection
      const { useIntersectionObserver } = vi.mocked(await import('@vueuse/core'))
      const callback = useIntersectionObserver.mock.calls[0][1]
      
      callback([{ isIntersecting: true }], null)
      
      expect(onVisible).toHaveBeenCalled()
      expect(isLoaded(itemId)).toBe(true)
    })

    it('calls onVisible immediately for already loaded items', () => {
      const { useLazyLoad } = useMobilePerformance()
      const lazyLoad = useLazyLoad()
      const { observe } = lazyLoad
      const loadedItems = (lazyLoad as any).loadedItems
      
      // Mock as already loaded
      vi.mocked(lazyLoad.isLoaded).mockReturnValue(true)
      
      const element = document.createElement('div')
      const onVisible = vi.fn()
      
      observe(element, 'item-1', onVisible)
      
      expect(onVisible).toHaveBeenCalled()
    })
  })

  describe('Scroll Optimization', () => {
    it('optimizes scrolling for touch devices', () => {
      const { optimizeScrolling } = useMobilePerformance()
      const element = document.createElement('div')
      
      optimizeScrolling(element)
      
      expect((element.style as any).webkitOverflowScrolling).toBe('touch')
      expect(element.style.overscrollBehavior).toBe('contain')
      expect(element.style.scrollSnapType).toBe('y proximity')
      expect(element.style.scrollbarWidth).toBe('thin')
    })
  })

  describe('Batch Updates', () => {
    it('batches DOM updates in requestAnimationFrame', async () => {
      const { batchUpdates } = useMobilePerformance()
      
      const update1 = vi.fn(() => 'result1')
      const update2 = vi.fn(() => 'result2')
      const update3 = vi.fn(() => 'result3')
      
      const resultsPromise = batchUpdates([update1, update2, update3])
      
      expect(update1).not.toHaveBeenCalled()
      expect(update2).not.toHaveBeenCalled()
      expect(update3).not.toHaveBeenCalled()
      
      // Wait for requestAnimationFrame
      await vi.runAllTimers()
      
      const results = await resultsPromise
      
      expect(update1).toHaveBeenCalled()
      expect(update2).toHaveBeenCalled()
      expect(update3).toHaveBeenCalled()
      expect(results).toEqual(['result1', 'result2', 'result3'])
    })
  })
})

describe('useKanbanPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('optimizes card rendering', () => {
    const { optimizeCard } = useKanbanPerformance()
    
    const card = document.createElement('div')
    const img1 = document.createElement('img')
    const img2 = document.createElement('img')
    card.appendChild(img1)
    card.appendChild(img2)
    
    optimizeCard(card)
    
    // Check GPU acceleration
    expect(card.style.transform).toBe('translateZ(0)')
    expect(card.style.willChange).toBe('transform')
    
    // Check image optimization
    expect(img1.loading).toBe('lazy')
    expect(img1.decoding).toBe('async')
    expect(img2.loading).toBe('lazy')
    expect(img2.decoding).toBe('async')
  })

  it('optimizes column scrolling', () => {
    const { optimizeColumn } = useKanbanPerformance()
    
    const column = document.createElement('div')
    
    optimizeColumn(column)
    
    expect((column.style as any).webkitOverflowScrolling).toBe('touch')
    expect(column.style.contain).toBe('layout style paint')
    expect(column.style.scrollbarGutter).toBe('stable')
  })

  it('batches card movements', async () => {
    const { batchCardMovements } = useKanbanPerformance()
    
    // Create mock DOM structure
    document.body.innerHTML = `
      <div id="column-col1">
        <div class="matters-container">
          <div id="card-1"></div>
          <div id="card-2"></div>
        </div>
      </div>
      <div id="column-col2">
        <div class="matters-container"></div>
      </div>
    `
    
    const movements = [
      { cardId: '1', fromColumn: 'col1', toColumn: 'col2', position: 0 },
      { cardId: '2', fromColumn: 'col1', toColumn: 'col2', position: 1 }
    ]
    
    const results = await batchCardMovements(movements)
    
    expect(results).toEqual(movements)
    
    // Clean up
    document.body.innerHTML = ''
  })
})