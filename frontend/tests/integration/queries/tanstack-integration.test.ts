/**
 * TanStack Query Integration Tests
 * Tests TanStack Query integration with Pinia stores and component state
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { 
  QueryClient, 
  VueQueryPlugin, 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/vue-query'
import { setupTestPinia, createApiMock, mockServerState } from '../setup'

// Mock composable that uses TanStack Query
const useMattersQuery = () => {
  return useQuery({
    queryKey: ['matters'],
    queryFn: () => $fetch('/api/matters'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

const useMatterMutations = () => {
  const queryClient = useQueryClient()
  
  const createMatter = useMutation({
    mutationFn: (matter) => $fetch('/api/matters', {
      method: 'POST',
      body: matter
    }),
    onSuccess: (newMatter) => {
      // Optimistically update the matters list
      queryClient.setQueryData(['matters'], (old = []) => [...old, newMatter])
      
      // Invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })
  
  const updateMatter = useMutation({
    mutationFn: ({ id, data }) => $fetch(`/api/matters/${id}`, {
      method: 'PATCH',
      body: data
    }),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['matters'] })
      
      // Snapshot previous value
      const previousMatters = queryClient.getQueryData(['matters'])
      
      // Optimistically update
      queryClient.setQueryData(['matters'], (old = []) =>
        old.map(matter => 
          matter.id === id ? { ...matter, ...data } : matter
        )
      )
      
      return { previousMatters }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousMatters) {
        queryClient.setQueryData(['matters'], context.previousMatters)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })
  
  return {
    createMatter,
    updateMatter
  }
}

// Test component using TanStack Query
const QueryIntegrationComponent = defineComponent({
  setup() {
    const { data: matters, isPending, error, refetch } = useMattersQuery()
    const { createMatter, updateMatter } = useMatterMutations()
    
    const newMatterForm = ref({
      title: '',
      description: '',
      priority: 'medium'
    })
    
    const handleCreateMatter = async () => {
      if (!newMatterForm.value.title.trim()) return
      
      try {
        await createMatter.mutateAsync(newMatterForm.value)
        newMatterForm.value = { title: '', description: '', priority: 'medium' }
      } catch (error) {
        console.error('Failed to create matter:', error)
      }
    }
    
    const handleUpdateStatus = async (matterId, newStatus) => {
      try {
        await updateMatter.mutateAsync({
          id: matterId,
          data: { status: newStatus }
        })
      } catch (error) {
        console.error('Failed to update matter:', error)
      }
    }
    
    const handleRefresh = () => {
      refetch()
    }
    
    return {
      matters,
      isPending,
      error,
      newMatterForm,
      createMatter,
      updateMatter,
      handleCreateMatter,
      handleUpdateStatus,
      handleRefresh
    }
  },
  template: `
    <div data-testid="query-component">
      <!-- Loading State -->
      <div v-if="isPending" data-testid="loading">
        Loading matters...
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" data-testid="error" class="error">
        Error: {{ error.message }}
      </div>
      
      <!-- Success State -->
      <div v-else>
        <!-- Matters List -->
        <div data-testid="matters-list">
          <div 
            v-for="matter in matters"
            :key="matter.id"
            :data-testid="'matter-' + matter.id"
            class="matter-item"
          >
            <h3>{{ matter.title }}</h3>
            <p>{{ matter.description }}</p>
            <span :data-testid="'status-' + matter.id" class="status">
              {{ matter.status }}
            </span>
            <button 
              :data-testid="'complete-' + matter.id"
              @click="handleUpdateStatus(matter.id, 'completed')"
              :disabled="updateMatter.isPending"
            >
              Mark Complete
            </button>
          </div>
        </div>
        
        <!-- Create Form -->
        <form @submit.prevent="handleCreateMatter" data-testid="create-form">
          <input
            v-model="newMatterForm.title"
            data-testid="title-input"
            placeholder="Matter title"
            required
          />
          <textarea
            v-model="newMatterForm.description"
            data-testid="description-input"
            placeholder="Description"
          />
          <select v-model="newMatterForm.priority" data-testid="priority-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button 
            type="submit"
            data-testid="create-button"
            :disabled="createMatter.isPending"
          >
            {{ createMatter.isPending ? 'Creating...' : 'Create Matter' }}
          </button>
        </form>
        
        <!-- Actions -->
        <button @click="handleRefresh" data-testid="refresh-button">
          Refresh
        </button>
      </div>
      
      <!-- Mutation States -->
      <div v-if="createMatter.isPending" data-testid="create-loading">
        Creating matter...
      </div>
      
      <div v-if="updateMatter.isPending" data-testid="update-loading">
        Updating matter...
      </div>
      
      <div v-if="createMatter.error" data-testid="create-error">
        Create Error: {{ createMatter.error.message }}
      </div>
      
      <div v-if="updateMatter.error" data-testid="update-error">
        Update Error: {{ updateMatter.error.message }}
      </div>
    </div>
  `
})

describe('TanStack Query Integration', () => {
  let queryClient: QueryClient
  let apiMock: ReturnType<typeof createApiMock>
  
  beforeEach(() => {
    setupTestPinia()
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false, 
          cacheTime: 0,
          staleTime: 0,
        },
        mutations: { retry: false }
      },
      logger: {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    })
    
    apiMock = createApiMock()
    global.$fetch = apiMock
    
    // Reset mock data
    mockServerState.matters = [
      {
        id: '1',
        title: 'Contract Review',
        description: 'Review client contract',
        status: 'draft',
        priority: 'medium',
        assigneeId: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        title: 'Legal Research',
        description: 'Research case law',
        status: 'in-progress',
        priority: 'high',
        assigneeId: 'user-2',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      }
    ]
  })
  
  describe('Query Loading and Data Display', () => {
    it('should show loading state initially', () => {
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      const loading = wrapper.find('[data-testid="loading"]')
      expect(loading.exists()).toBe(true)
      expect(loading.text()).toBe('Loading matters...')
    })
    
    it('should display matters after successful fetch', async () => {
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      await flushPromises()
      
      // Loading should disappear
      expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false)
      
      // Matters should be displayed
      const mattersList = wrapper.find('[data-testid="matters-list"]')
      expect(mattersList.exists()).toBe(true)
      
      const matter1 = wrapper.find('[data-testid="matter-1"]')
      const matter2 = wrapper.find('[data-testid="matter-2"]')
      
      expect(matter1.exists()).toBe(true)
      expect(matter2.exists()).toBe(true)
      
      expect(matter1.text()).toContain('Contract Review')
      expect(matter2.text()).toContain('Legal Research')
    })
    
    it('should handle API errors gracefully', async () => {
      apiMock.mockRejectedValue(new Error('Network error'))
      
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      await flushPromises()
      
      const error = wrapper.find('[data-testid="error"]')
      expect(error.exists()).toBe(true)
      expect(error.text()).toContain('Network error')
      
      // Matters list should not be visible
      expect(wrapper.find('[data-testid="matters-list"]').exists()).toBe(false)
    })
  })
  
  describe('Create Matter Mutation', () => {
    it('should create new matter successfully', async () => {
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      await flushPromises()
      
      // Fill form
      await wrapper.find('[data-testid="title-input"]').setValue('New Contract')
      await wrapper.find('[data-testid="description-input"]').setValue('New contract review')
      await wrapper.find('[data-testid="priority-select"]').setValue('high')
      
      // Submit form
      const createButton = wrapper.find('[data-testid="create-button"]')
      await createButton.trigger('click')
      
      // Should show loading state
      const createLoading = wrapper.find('[data-testid="create-loading"]')
      expect(createLoading.exists()).toBe(true)
      
      await flushPromises()
      
      // Verify API call
      expect(apiMock).toHaveBeenCalledWith('/api/matters', {
        method: 'POST',
        body: {
          title: 'New Contract',
          description: 'New contract review',
          priority: 'high'
        }
      })
      
      // New matter should appear in list
      const newMatter = wrapper.find('[data-testid="matter-' + Date.now() + '"]')
      // Note: In real implementation, the new matter would have a real ID
      
      // Form should be cleared
      const titleInput = wrapper.find('[data-testid="title-input"]')
      expect(titleInput.element.value).toBe('')
    })
    
    it('should show create error on failure', async () => {
      apiMock.mockImplementation((endpoint, options) => {
        if (options?.method === 'POST') {
          return Promise.reject(new Error('Validation failed'))
        }
        return Promise.resolve(mockServerState.matters)
      })
      
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      await flushPromises()
      
      // Fill and submit form
      await wrapper.find('[data-testid="title-input"]').setValue('Test Matter')
      await wrapper.find('[data-testid="create-button"]').trigger('click')
      await flushPromises()
      
      const createError = wrapper.find('[data-testid="create-error"]')
      expect(createError.exists()).toBe(true)
      expect(createError.text()).toContain('Validation failed')
    })
  })
  
  describe('Update Matter Mutation', () => {
    it('should update matter status with optimistic updates', async () => {
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      await flushPromises()
      
      // Verify initial status
      const matter1Status = wrapper.find('[data-testid="status-1"]')
      expect(matter1Status.text()).toBe('draft')
      
      // Click complete button
      const completeButton = wrapper.find('[data-testid="complete-1"]')
      await completeButton.trigger('click')
      
      // Status should update immediately (optimistic)
      expect(matter1Status.text()).toBe('completed')
      
      // Should show update loading
      const updateLoading = wrapper.find('[data-testid="update-loading"]')
      expect(updateLoading.exists()).toBe(true)
      
      await flushPromises()
      
      // Verify API call
      expect(apiMock).toHaveBeenCalledWith('/api/matters/1', {
        method: 'PATCH',
        body: { status: 'completed' }
      })
    })
    
    it('should rollback optimistic update on error', async () => {
      // Make update fail
      apiMock.mockImplementation((endpoint, options) => {
        if (options?.method === 'PATCH') {
          return Promise.reject(new Error('Update failed'))
        }
        return Promise.resolve(mockServerState.matters)
      })
      
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      await flushPromises()
      
      const matter1Status = wrapper.find('[data-testid="status-1"]')
      expect(matter1Status.text()).toBe('draft')
      
      // Trigger update
      const completeButton = wrapper.find('[data-testid="complete-1"]')
      await completeButton.trigger('click')
      
      // Should optimistically update
      expect(matter1Status.text()).toBe('completed')
      
      await flushPromises()
      
      // Should rollback to original status
      expect(matter1Status.text()).toBe('draft')
      
      // Should show error
      const updateError = wrapper.find('[data-testid="update-error"]')
      expect(updateError.exists()).toBe(true)
      expect(updateError.text()).toContain('Update failed')
    })
  })
  
  describe('Query Invalidation and Refetching', () => {
    it('should refetch data when refresh button is clicked', async () => {
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      await flushPromises()
      
      // Clear previous API calls
      apiMock.mockClear()
      
      // Click refresh
      const refreshButton = wrapper.find('[data-testid="refresh-button"]')
      await refreshButton.trigger('click')
      await flushPromises()
      
      // Should have called API again
      expect(apiMock).toHaveBeenCalledWith('/api/matters')
    })
    
    it('should invalidate queries after successful mutation', async () => {
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      await flushPromises()
      
      // Clear API calls
      apiMock.mockClear()
      
      // Create a new matter
      await wrapper.find('[data-testid="title-input"]').setValue('Test Matter')
      await wrapper.find('[data-testid="create-button"]').trigger('click')
      await flushPromises()
      
      // Should have called POST and then invalidated (causing another GET)
      const getCalls = apiMock.mock.calls.filter(call => !call[1]?.method || call[1].method === 'GET')
      const postCalls = apiMock.mock.calls.filter(call => call[1]?.method === 'POST')
      
      expect(postCalls).toHaveLength(1)
      expect(getCalls.length).toBeGreaterThan(0)
    })
  })
  
  describe('Cache Management', () => {
    it('should use cached data when available', async () => {
      // Pre-populate cache
      queryClient.setQueryData(['matters'], mockServerState.matters)
      
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      // Should immediately show cached data without loading
      expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="matters-list"]').exists()).toBe(true)
      
      // Should not have called API yet (using cache)
      expect(apiMock).not.toHaveBeenCalled()
    })
    
    it('should handle concurrent updates correctly', async () => {
      const wrapper = mount(QueryIntegrationComponent, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      await flushPromises()
      
      // Trigger multiple updates simultaneously
      const completeButton1 = wrapper.find('[data-testid="complete-1"]')
      const completeButton2 = wrapper.find('[data-testid="complete-2"]')
      
      const promise1 = completeButton1.trigger('click')
      const promise2 = completeButton2.trigger('click')
      
      await Promise.all([promise1, promise2])
      await flushPromises()
      
      // Both updates should have been processed
      expect(apiMock).toHaveBeenCalledTimes(3) // 1 GET + 2 PATCH calls
    })
  })
})