import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useRealTimeUpdates } from '../useRealTimeUpdates'

// Mock $fetch
const mockFetch = vi.fn() as any
mockFetch.raw = vi.fn()
mockFetch.create = vi.fn(() => mockFetch)
global.$fetch = mockFetch

// Helper component for testing composables with lifecycle hooks
const createTestComponent = (composableOptions: Parameters<typeof useRealTimeUpdates>[0]) => {
  return defineComponent({
    setup() {
      const result = useRealTimeUpdates(composableOptions)
      return { result }
    },
    render() {
      return h('div')
    }
  })
}

describe('useRealTimeUpdates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })
  
  it('should fetch data on mount when enabled', async () => {
    const mockData = { data: 'test' }
    mockFetch.mockResolvedValue(mockData)
    
    const TestComponent = createTestComponent({
      endpoint: '/api/test',
      interval: 5000
    })
    
    const wrapper = mount(TestComponent)
    await flushPromises()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/test')
    expect(wrapper.vm.result.loading.value).toBe(false)
    expect(wrapper.vm.result.data.value).toEqual(mockData)
    
    wrapper.unmount()
  })
  
  it('should not start polling when disabled', async () => {
    const TestComponent = createTestComponent({
      endpoint: '/api/test',
      interval: 5000,
      enabled: false
    })
    
    const wrapper = mount(TestComponent)
    await flushPromises()
    
    expect(mockFetch).not.toHaveBeenCalled()
    
    wrapper.unmount()
  })
  
  it('should poll at specified interval', async () => {
    mockFetch.mockResolvedValue({ data: 'test' })
    
    const TestComponent = createTestComponent({
      endpoint: '/api/test',
      interval: 5000
    })
    
    const wrapper = mount(TestComponent)
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    
    // Advance time by interval
    vi.advanceTimersByTime(5000)
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    
    // Advance again
    vi.advanceTimersByTime(5000)
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(3)
    
    wrapper.unmount()
  })
  
  it('should handle errors gracefully', async () => {
    const mockError = new Error('Network error')
    mockFetch.mockRejectedValue(mockError)
    const onError = vi.fn()
    
    const TestComponent = createTestComponent({
      endpoint: '/api/test',
      onError
    })
    
    const wrapper = mount(TestComponent)
    await flushPromises()
    
    expect(wrapper.vm.result.error.value).toEqual(mockError)
    expect(wrapper.vm.result.loading.value).toBe(false)
    expect(onError).toHaveBeenCalledWith(mockError)
    
    wrapper.unmount()
  })
  
  it('should call onUpdate callback with data', async () => {
    const mockData = { data: 'test' }
    mockFetch.mockResolvedValue(mockData)
    const onUpdate = vi.fn()
    
    const TestComponent = createTestComponent({
      endpoint: '/api/test',
      onUpdate
    })
    
    const wrapper = mount(TestComponent)
    await flushPromises()
    
    expect(onUpdate).toHaveBeenCalledWith(mockData)
    
    wrapper.unmount()
  })
  
  it('should update lastUpdated timestamp', async () => {
    mockFetch.mockResolvedValue({ data: 'test' })
    
    const TestComponent = createTestComponent({
      endpoint: '/api/test'
    })
    
    const wrapper = mount(TestComponent)
    expect(wrapper.vm.result.lastUpdated.value).toBeNull()
    
    await flushPromises()
    
    expect(wrapper.vm.result.lastUpdated.value).toBeInstanceOf(Date)
    
    wrapper.unmount()
  })
  
  it('should stop polling when stop is called', async () => {
    mockFetch.mockResolvedValue({ data: 'test' })
    
    const TestComponent = createTestComponent({
      endpoint: '/api/test',
      interval: 5000
    })
    
    const wrapper = mount(TestComponent)
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    
    wrapper.vm.result.stop()
    
    // Advance time - should not fetch again
    vi.advanceTimersByTime(10000)
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    
    wrapper.unmount()
  })
  
  it('should allow manual refresh', async () => {
    mockFetch.mockResolvedValue({ data: 'test' })
    
    const TestComponent = createTestComponent({
      endpoint: '/api/test',
      interval: 5000
    })
    
    const wrapper = mount(TestComponent)
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    
    // Manual refresh
    wrapper.vm.result.refresh()
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    
    wrapper.unmount()
  })
  
  it('should use default interval of 30 seconds', async () => {
    mockFetch.mockResolvedValue({ data: 'test' })
    
    const TestComponent = createTestComponent({
      endpoint: '/api/test'
    })
    
    const wrapper = mount(TestComponent)
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    
    // Advance by default interval (30 seconds)
    vi.advanceTimersByTime(30000)
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    
    wrapper.unmount()
  })
})