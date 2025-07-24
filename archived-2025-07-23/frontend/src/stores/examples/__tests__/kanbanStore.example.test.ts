/**
 * Example: Pinia Store Testing
 * 
 * This example demonstrates testing patterns for Pinia stores including
 * state management, getters, actions, and store composition.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Mock $fetch
global.$fetch = vi.fn()

// Example Kanban store
const useKanbanStore = defineStore('kanban', () => {
  // State
  const matters = ref<Matter[]>([])
  const selectedMatterId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref({
    status: null as string | null,
    priority: null as string | null,
    search: ''
  })

  // Getters
  const selectedMatter = computed(() =>
    matters.value.find(m => m.id === selectedMatterId.value)
  )

  const filteredMatters = computed(() => {
    return matters.value.filter(matter => {
      if (filters.value.status && matter.status !== filters.value.status) {
        return false
      }
      if (filters.value.priority && matter.priority !== filters.value.priority) {
        return false
      }
      if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase()
        return matter.title.toLowerCase().includes(searchLower) ||
               matter.description?.toLowerCase().includes(searchLower)
      }
      return true
    })
  })

  const mattersByStatus = computed(() => {
    return matters.value.reduce((acc, matter) => {
      if (!acc[matter.status]) {
        acc[matter.status] = []
      }
      acc[matter.status].push(matter)
      return acc
    }, {} as Record<string, Matter[]>)
  })

  // Actions
  const fetchMatters = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const data = await $fetch<Matter[]>('/api/matters')
      matters.value = data
    } catch (err) {
      error.value = 'Failed to fetch matters'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  const updateMatterStatus = async (matterId: string, newStatus: string) => {
    const matter = matters.value.find(m => m.id === matterId)
    if (!matter) return

    const oldStatus = matter.status
    matter.status = newStatus // Optimistic update

    try {
      await $fetch(`/api/matters/${matterId}`, {
        method: 'PATCH',
        body: { status: newStatus }
      })
    } catch (err) {
      // Rollback on error
      matter.status = oldStatus
      error.value = 'Failed to update matter status'
      throw err
    }
  }

  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    Object.assign(filters.value, newFilters)
  }

  const clearFilters = () => {
    filters.value = {
      status: null,
      priority: null,
      search: ''
    }
  }

  const selectMatter = (matterId: string | null) => {
    selectedMatterId.value = matterId
  }

  return {
    // State
    matters,
    selectedMatterId,
    isLoading,
    error,
    filters,
    // Getters
    selectedMatter,
    filteredMatters,
    mattersByStatus,
    // Actions
    fetchMatters,
    updateMatterStatus,
    setFilters,
    clearFilters,
    selectMatter
  }
})

// Mock types
interface Matter {
  id: string
  title: string
  description?: string
  status: string
  priority: string
}

describe('Kanban Store - Pinia Store Testing Example', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // State initialization testing
  it('initializes with default state', () => {
    const store = useKanbanStore()

    expect(store.matters).toEqual([])
    expect(store.selectedMatterId).toBeNull()
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.filters).toEqual({
      status: null,
      priority: null,
      search: ''
    })
  })

  // Action testing - fetch matters
  it('fetches matters successfully', async () => {
    const mockMatters = [
      { id: '1', title: 'Matter 1', status: 'active', priority: 'high' },
      { id: '2', title: 'Matter 2', status: 'draft', priority: 'low' }
    ]

    vi.mocked($fetch).mockResolvedValueOnce(mockMatters)

    const store = useKanbanStore()
    await store.fetchMatters()

    expect(store.matters).toEqual(mockMatters)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  // Error handling testing
  it('handles fetch errors', async () => {
    vi.mocked($fetch).mockRejectedValueOnce(new Error('Network error'))

    const store = useKanbanStore()
    await store.fetchMatters()

    expect(store.matters).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('Failed to fetch matters')
  })

  // Loading state testing
  it('manages loading state during fetch', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked($fetch).mockReturnValueOnce(promise)

    const store = useKanbanStore()
    const fetchPromise = store.fetchMatters()

    // Check loading state is true
    expect(store.isLoading).toBe(true)

    // Resolve the promise
    resolvePromise!([])
    await fetchPromise

    // Check loading state is false
    expect(store.isLoading).toBe(false)
  })

  // Getter testing - filtered matters
  it('filters matters correctly', () => {
    const store = useKanbanStore()
    store.matters = [
      { id: '1', title: 'High Priority', status: 'active', priority: 'high' },
      { id: '2', title: 'Low Priority', status: 'draft', priority: 'low' },
      { id: '3', title: 'Another High', status: 'active', priority: 'high' }
    ]

    // Test status filter
    store.setFilters({ status: 'active' })
    expect(store.filteredMatters).toHaveLength(2)
    expect(store.filteredMatters.every(m => m.status === 'active')).toBe(true)

    // Test priority filter
    store.setFilters({ status: null, priority: 'high' })
    expect(store.filteredMatters).toHaveLength(2)
    expect(store.filteredMatters.every(m => m.priority === 'high')).toBe(true)

    // Test search filter
    store.setFilters({ priority: null, search: 'low' })
    expect(store.filteredMatters).toHaveLength(1)
    expect(store.filteredMatters[0].title).toBe('Low Priority')
  })

  // Getter testing - matters by status
  it('groups matters by status', () => {
    const store = useKanbanStore()
    store.matters = [
      { id: '1', title: 'Matter 1', status: 'active', priority: 'high' },
      { id: '2', title: 'Matter 2', status: 'draft', priority: 'low' },
      { id: '3', title: 'Matter 3', status: 'active', priority: 'medium' }
    ]

    const grouped = store.mattersByStatus

    expect(grouped.active).toHaveLength(2)
    expect(grouped.draft).toHaveLength(1)
    expect(grouped.active.map(m => m.id)).toEqual(['1', '3'])
  })

  // Action testing - update matter status
  it('updates matter status optimistically', async () => {
    vi.mocked($fetch).mockResolvedValueOnce({ success: true })

    const store = useKanbanStore()
    store.matters = [
      { id: '1', title: 'Matter 1', status: 'draft', priority: 'high' }
    ]

    await store.updateMatterStatus('1', 'active')

    expect(store.matters[0].status).toBe('active')
    expect($fetch).toHaveBeenCalledWith('/api/matters/1', {
      method: 'PATCH',
      body: { status: 'active' }
    })
  })

  // Rollback testing
  it('rolls back status on update failure', async () => {
    vi.mocked($fetch).mockRejectedValueOnce(new Error('Update failed'))

    const store = useKanbanStore()
    store.matters = [
      { id: '1', title: 'Matter 1', status: 'draft', priority: 'high' }
    ]

    await expect(store.updateMatterStatus('1', 'active')).rejects.toThrow()

    // Status should be rolled back
    expect(store.matters[0].status).toBe('draft')
    expect(store.error).toBe('Failed to update matter status')
  })

  // Selection testing
  it('manages matter selection', () => {
    const store = useKanbanStore()
    store.matters = [
      { id: '1', title: 'Matter 1', status: 'active', priority: 'high' },
      { id: '2', title: 'Matter 2', status: 'draft', priority: 'low' }
    ]

    store.selectMatter('1')
    expect(store.selectedMatterId).toBe('1')
    expect(store.selectedMatter?.title).toBe('Matter 1')

    store.selectMatter(null)
    expect(store.selectedMatterId).toBeNull()
    expect(store.selectedMatter).toBeUndefined()
  })

  // Filter management testing
  it('manages filters correctly', () => {
    const store = useKanbanStore()

    store.setFilters({ status: 'active', search: 'test' })
    expect(store.filters.status).toBe('active')
    expect(store.filters.search).toBe('test')
    expect(store.filters.priority).toBeNull()

    store.clearFilters()
    expect(store.filters).toEqual({
      status: null,
      priority: null,
      search: ''
    })
  })
})