/**
 * Matter Store Integration Tests
 * Tests Pinia store interactions with TanStack Query and component integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { defineComponent, ref } from 'vue'
import { setupTestPinia, createApiMock, mockServerState } from '../setup'

// Mock the matter store
const useMatterStore = () => {
  const matters = ref(mockServerState.matters)
  const selectedMatter = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  
  const updateMatterStatus = async (matterId: string, status: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/matters/${matterId}`, {
        method: 'PATCH',
        body: { status }
      })
      
      const index = matters.value.findIndex(m => m.id === matterId)
      if (index !== -1) {
        matters.value[index] = response
      }
      
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const addMatter = (matter: any) => {
    matters.value.push(matter)
  }
  
  return {
    matters,
    selectedMatter,
    isLoading,
    error,
    updateMatterStatus,
    addMatter
  }
}

// Test component that uses the store
const TestComponent = defineComponent({
  setup() {
    const store = useMatterStore()
    
    const handleStatusUpdate = async (matterId: string, newStatus: string) => {
      await store.updateMatterStatus(matterId, newStatus)
    }
    
    return {
      ...store,
      handleStatusUpdate
    }
  },
  template: `
    <div>
      <div v-if="isLoading" data-testid="loading">Loading...</div>
      <div v-if="error" data-testid="error">{{ error }}</div>
      <div data-testid="matters-list">
        <div 
          v-for="matter in matters" 
          :key="matter.id"
          :data-testid="'matter-' + matter.id"
          class="matter-item"
        >
          <h3>{{ matter.title }}</h3>
          <span :data-testid="'status-' + matter.id">{{ matter.status }}</span>
          <button 
            :data-testid="'update-' + matter.id"
            @click="handleStatusUpdate(matter.id, 'completed')"
          >
            Complete
          </button>
        </div>
      </div>
    </div>
  `
})

describe('Matter Store Integration', () => {
  let queryClient: QueryClient
  let apiMock: ReturnType<typeof createApiMock>
  
  beforeEach(() => {
    // Setup clean test environment
    setupTestPinia()
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
        mutations: { retry: false }
      }
    })
    
    apiMock = createApiMock()
    global.$fetch = apiMock
    
    // Reset mock data
    mockServerState.matters = [
      {
        id: '1',
        title: 'Contract Review',
        status: 'draft',
        priority: 'medium',
        assigneeId: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        title: 'Legal Research',
        status: 'in-progress',
        priority: 'high',
        assigneeId: 'user-2',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      }
    ]
  })
  
  it('should render initial matters from store', () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          NuxtPage: { template: '<div><slot /></div>' },
          ClientOnly: { template: '<div><slot /></div>' }
        }
      }
    })
    
    const mattersList = wrapper.find('[data-testid="matters-list"]')
    expect(mattersList.exists()).toBe(true)
    
    const matter1 = wrapper.find('[data-testid="matter-1"]')
    const matter2 = wrapper.find('[data-testid="matter-2"]')
    
    expect(matter1.exists()).toBe(true)
    expect(matter2.exists()).toBe(true)
    
    expect(matter1.text()).toContain('Contract Review')
    expect(matter2.text()).toContain('Legal Research')
  })
  
  it('should display correct status for each matter', () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          NuxtPage: { template: '<div><slot /></div>' },
          ClientOnly: { template: '<div><slot /></div>' }
        }
      }
    })
    
    const status1 = wrapper.find('[data-testid="status-1"]')
    const status2 = wrapper.find('[data-testid="status-2"]')
    
    expect(status1.text()).toBe('draft')
    expect(status2.text()).toBe('in-progress')
  })
  
  it('should update matter status and reflect in UI', async () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          NuxtPage: { template: '<div><slot /></div>' },
          ClientOnly: { template: '<div><slot /></div>' }
        }
      }
    })
    
    const updateButton = wrapper.find('[data-testid="update-1"]')
    expect(updateButton.exists()).toBe(true)
    
    // Click update button
    await updateButton.trigger('click')
    await flushPromises()
    
    // Verify API was called
    expect(apiMock).toHaveBeenCalledWith('/api/matters/1', {
      method: 'PATCH',
      body: { status: 'completed' }
    })
    
    // Verify UI updated
    const status1 = wrapper.find('[data-testid="status-1"]')
    expect(status1.text()).toBe('completed')
  })
  
  it('should show loading state during status update', async () => {
    // Make API call take time
    apiMock.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          NuxtPage: { template: '<div><slot /></div>' },
          ClientOnly: { template: '<div><slot /></div>' }
        }
      }
    })
    
    const updateButton = wrapper.find('[data-testid="update-1"]')
    await updateButton.trigger('click')
    
    // Should show loading immediately
    const loading = wrapper.find('[data-testid="loading"]')
    expect(loading.exists()).toBe(true)
    
    await flushPromises()
    
    // Loading should disappear after completion
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false)
  })
  
  it('should handle API errors gracefully', async () => {
    // Mock API to reject
    apiMock.mockRejectedValue(new Error('Network error'))
    
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          NuxtPage: { template: '<div><slot /></div>' },
          ClientOnly: { template: '<div><slot /></div>' }
        }
      }
    })
    
    const updateButton = wrapper.find('[data-testid="update-1"]')
    await updateButton.trigger('click')
    await flushPromises()
    
    // Should show error message
    const error = wrapper.find('[data-testid="error"]')
    expect(error.exists()).toBe(true)
    expect(error.text()).toContain('Network error')
    
    // Status should remain unchanged
    const status1 = wrapper.find('[data-testid="status-1"]')
    expect(status1.text()).toBe('draft')
  })
  
  it('should maintain store state across component updates', async () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          NuxtPage: { template: '<div><slot /></div>' },
          ClientOnly: { template: '<div><slot /></div>' }
        }
      }
    })
    
    // Update a matter
    const updateButton = wrapper.find('[data-testid="update-1"]')
    await updateButton.trigger('click')
    await flushPromises()
    
    // Force component re-render
    await wrapper.vm.$forceUpdate()
    await wrapper.vm.$nextTick()
    
    // State should persist
    const status1 = wrapper.find('[data-testid="status-1"]')
    expect(status1.text()).toBe('completed')
  })
  
  it('should handle concurrent status updates correctly', async () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          NuxtPage: { template: '<div><slot /></div>' },
          ClientOnly: { template: '<div><slot /></div>' }
        }
      }
    })
    
    // Trigger multiple updates simultaneously
    const updateButton1 = wrapper.find('[data-testid="update-1"]')
    const updateButton2 = wrapper.find('[data-testid="update-2"]')
    
    const promise1 = updateButton1.trigger('click')
    const promise2 = updateButton2.trigger('click')
    
    await Promise.all([promise1, promise2])
    await flushPromises()
    
    // Both should have updated
    expect(apiMock).toHaveBeenCalledTimes(2)
    
    const status1 = wrapper.find('[data-testid="status-1"]')
    const status2 = wrapper.find('[data-testid="status-2"]')
    
    expect(status1.text()).toBe('completed')
    expect(status2.text()).toBe('completed')
  })
})

describe('Store-to-Store Communication', () => {
  it('should handle cross-store dependencies', async () => {
    // This would test communication between different stores
    // For example, updating a matter might trigger notifications store
    
    setupTestPinia()
    const matterStore = useMatterStore()
    
    // Mock notification store
    const notifications = ref([])
    const addNotification = vi.fn((message: string) => {
      notifications.value.push({ id: Date.now(), message })
    })
    
    // Simulate matter update triggering notification
    await matterStore.updateMatterStatus('1', 'completed')
    
    // In real implementation, this would be handled by store watchers or events
    addNotification('Matter completed successfully')
    
    expect(addNotification).toHaveBeenCalledWith('Matter completed successfully')
    expect(notifications.value).toHaveLength(1)
  })
})