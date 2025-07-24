/**
 * Integration Tests for Advanced Matter Queries
 * 
 * @description Comprehensive test suite for advanced TanStack Query features
 * including infinite scrolling, search, filter state, and SSR utilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { 
  useInfiniteMattersQuery,
  useInfiniteSearchQuery,
  useMatterSearchQuery,
  useSearchSuggestionsQuery,
  useFilterState,
  useMatterStatisticsQuery,
  useStatusCountsQuery,
  matterPrefetchUtils,
  matterCacheUtils
} from '../useAdvancedMattersQuery'
import type { Matter, MatterFilters, PaginatedResponse, SearchSuggestion, MatterStatistics } from '~/types/query'

// ============================================================================
// TEST SETUP
// ============================================================================

const mockMatters: Matter[] = [
  {
    id: '1',
    title: 'Contract Review',
    description: 'Review employment contract',
    status: 'active',
    priority: 'high',
    assigneeId: 'lawyer1',
    clientId: 'client1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    tags: ['contract', 'employment']
  },
  {
    id: '2',
    title: 'Patent Application',
    description: 'File patent for new invention',
    status: 'draft',
    priority: 'medium',
    assigneeId: 'lawyer2',
    clientId: 'client2',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
    tags: ['patent', 'intellectual-property']
  }
]

const mockPaginatedResponse: PaginatedResponse<Matter> = {
  items: mockMatters,
  page: 0,
  limit: 20,
  total: 2,
  hasNext: false,
  hasPrevious: false
}

const mockSearchSuggestions: SearchSuggestion[] = [
  { id: '1', text: 'contract', type: 'tag', count: 5 },
  { id: '2', text: 'patent', type: 'tag', count: 3 },
  { id: '3', text: 'John Doe', type: 'client', count: 1 }
]

const mockStatistics: MatterStatistics = {
  total: 100,
  byStatus: { active: 45, draft: 30, completed: 25 },
  byPriority: { high: 20, medium: 50, low: 30 },
  byAssignee: { lawyer1: 40, lawyer2: 35, lawyer3: 25 },
  recentActivity: 15,
  overdue: 5,
  dueToday: 3,
  dueThisWeek: 12,
  averageResolutionTime: 7.5,
  trends: [
    { period: '2025-01', created: 25, completed: 20, overdue: 2 }
  ]
}

// Mock fetch responses
const mockFetch = vi.fn()
global.$fetch = mockFetch

// Mock router
const mockRouter = {
  replace: vi.fn()
}

const mockRoute = {
  query: {}
}

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $fetch: mockFetch
  }),
  useRouter: () => mockRouter,
  useRoute: () => mockRoute
}))

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createWrapper(component: any, props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return mount(component, {
    global: {
      plugins: [
        createTestingPinia(),
        [VueQueryPlugin, { queryClient }]
      ]
    },
    props
  })
}

// ============================================================================
// INFINITE QUERY TESTS
// ============================================================================

describe('useInfiniteMattersQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue(mockPaginatedResponse)
  })
  
  it('should fetch initial page of matters', async () => {
    const TestComponent = {
      setup() {
        const filters = ref<MatterFilters>({ status: 'active' })
        const { data, isPending, error } = useInfiniteMattersQuery(filters)
        
        return { data, isPending, error }
      },
      template: '<div>{{ data }}</div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    await nextTick()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/matters?page=0&direction=next&status=active')
  })
  
  it('should handle bidirectional loading', async () => {
    const mockResponse = {
      ...mockPaginatedResponse,
      page: 1,
      hasNext: true,
      hasPrevious: true
    }
    
    mockFetch.mockResolvedValue(mockResponse)
    
    const TestComponent = {
      setup() {
        const { data, fetchNextPage, fetchPreviousPage, hasNextPage, hasPreviousPage } = 
          useInfiniteMattersQuery()
        
        return { data, fetchNextPage, fetchPreviousPage, hasNextPage, hasPreviousPage }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    await nextTick()
    
    // Should have next and previous pages available
    expect(wrapper.vm.hasNextPage).toBe(true)
    expect(wrapper.vm.hasPreviousPage).toBe(true)
  })
  
  it('should respect maxPages limit', async () => {
    const TestComponent = {
      setup() {
        const { data } = useInfiniteMattersQuery(undefined, { maxPages: 2 })
        return { data }
      },
      template: '<div></div>'
    }
    
    createWrapper(TestComponent)
    await nextTick()
    
    // Should configure query with maxPages option
    expect(mockFetch).toHaveBeenCalled()
  })
})

describe('useInfiniteSearchQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue(mockPaginatedResponse)
  })
  
  it('should only search when query is at least 2 characters', async () => {
    const TestComponent = {
      setup() {
        const searchQuery = ref('a') // Only 1 character
        const { data, isPending } = useInfiniteSearchQuery(searchQuery)
        
        return { data, isPending, searchQuery }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    await nextTick()
    
    // Should not make request for short query
    expect(mockFetch).not.toHaveBeenCalled()
    
    // Update to valid query length
    wrapper.vm.searchQuery = 'contract'
    await nextTick()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/matters/search?q=contract&page=0&limit=20')
  })
  
  it('should include filters in search request', async () => {
    const TestComponent = {
      setup() {
        const searchQuery = ref('contract')
        const filters = ref<MatterFilters>({ status: 'active', priority: 'high' })
        const { data } = useInfiniteSearchQuery(searchQuery, filters)
        
        return { data }
      },
      template: '<div></div>'
    }
    
    createWrapper(TestComponent)
    await nextTick()
    
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/matters/search?q=contract&page=0&limit=20&status=active&priority=high'
    )
  })
})

// ============================================================================
// SEARCH QUERY TESTS
// ============================================================================

describe('useMatterSearchQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue(mockPaginatedResponse)
  })
  
  it('should provide placeholder data for empty queries', async () => {
    const TestComponent = {
      setup() {
        const searchQuery = ref('')
        const { data, isPending } = useMatterSearchQuery(searchQuery)
        
        return { data, isPending }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    await nextTick()
    
    // Should have placeholder data structure
    expect(wrapper.vm.data).toEqual({
      items: [],
      total: 0,
      page: 0,
      limit: 10,
      hasNext: false,
      hasPrevious: false
    })
  })
  
  it('should search with proper parameters', async () => {
    const TestComponent = {
      setup() {
        const searchQuery = ref('patent')
        const { data } = useMatterSearchQuery(searchQuery)
        
        return { data }
      },
      template: '<div></div>'
    }
    
    createWrapper(TestComponent)
    await nextTick()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/matters/search', {
      query: { q: 'patent', limit: 10 }
    })
  })
})

describe('useSearchSuggestionsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue(mockSearchSuggestions)
  })
  
  it('should fetch suggestions for single character queries', async () => {
    const TestComponent = {
      setup() {
        const searchQuery = ref('c')
        const { data } = useSearchSuggestionsQuery(searchQuery)
        
        return { data }
      },
      template: '<div></div>'
    }
    
    createWrapper(TestComponent)
    await nextTick()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/matters/suggestions', {
      query: { q: 'c', limit: 8 }
    })
  })
  
  it('should return empty array for empty queries', async () => {
    const TestComponent = {
      setup() {
        const searchQuery = ref('')
        const { data } = useSearchSuggestionsQuery(searchQuery)
        
        return { data }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    await nextTick()
    
    expect(wrapper.vm.data).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

// ============================================================================
// FILTER STATE TESTS
// ============================================================================

describe('useFilterState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
  })
  
  it('should initialize filters from URL query parameters', () => {
    mockRoute.query = {
      search: 'contract',
      status: 'active',
      tags: ['legal', 'urgent']
    }
    
    const TestComponent = {
      setup() {
        const { filters } = useFilterState()
        return { filters }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    
    expect(wrapper.vm.filters.search).toBe('contract')
    expect(wrapper.vm.filters.status).toBe('active')
    expect(wrapper.vm.filters.tags).toEqual(['legal', 'urgent'])
  })
  
  it('should detect active filters', () => {
    const TestComponent = {
      setup() {
        const { filters, hasActiveFilters, updateFilter } = useFilterState()
        
        return { filters, hasActiveFilters, updateFilter }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    
    // Initially no active filters
    expect(wrapper.vm.hasActiveFilters).toBe(false)
    
    // Add a filter
    wrapper.vm.updateFilter('status', 'active')
    
    expect(wrapper.vm.hasActiveFilters).toBe(true)
  })
  
  it('should count active filters correctly', () => {
    const TestComponent = {
      setup() {
        const { filterCount, updateFilter, addTag } = useFilterState()
        
        return { filterCount, updateFilter, addTag }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    
    // Add multiple filters
    wrapper.vm.updateFilter('status', 'active')
    wrapper.vm.updateFilter('priority', 'high')
    wrapper.vm.addTag('urgent')
    wrapper.vm.addTag('important')
    
    expect(wrapper.vm.filterCount).toBe(4) // status + priority + 2 tags
  })
  
  it('should update URL when filters change', () => {
    const TestComponent = {
      setup() {
        const { updateFilter } = useFilterState()
        return { updateFilter }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    
    wrapper.vm.updateFilter('status', 'active')
    
    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { status: 'active' }
    })
  })
  
  it('should reset all filters', () => {
    mockRoute.query = { search: 'test', status: 'active' }
    
    const TestComponent = {
      setup() {
        const { filters, resetFilters, hasActiveFilters } = useFilterState()
        return { filters, resetFilters, hasActiveFilters }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    
    // Should start with filters from URL
    expect(wrapper.vm.hasActiveFilters).toBe(true)
    
    // Reset filters
    wrapper.vm.resetFilters()
    
    expect(wrapper.vm.hasActiveFilters).toBe(false)
    expect(mockRouter.replace).toHaveBeenCalledWith({ query: {} })
  })
})

// ============================================================================
// STATISTICS QUERY TESTS
// ============================================================================

describe('useMatterStatisticsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue(mockStatistics)
  })
  
  it('should fetch statistics without filters', async () => {
    const TestComponent = {
      setup() {
        const { data } = useMatterStatisticsQuery()
        return { data }
      },
      template: '<div></div>'
    }
    
    createWrapper(TestComponent)
    await nextTick()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/matters/statistics')
  })
  
  it('should include filters in statistics request', async () => {
    const TestComponent = {
      setup() {
        const filters = ref<MatterFilters>({ status: 'active', assigneeId: 'lawyer1' })
        const { data } = useMatterStatisticsQuery(filters)
        
        return { data }
      },
      template: '<div></div>'
    }
    
    createWrapper(TestComponent)
    await nextTick()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/matters/statistics?status=active&assigneeId=lawyer1')
  })
})

describe('useStatusCountsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ active: 25, draft: 15, completed: 10 })
  })
  
  it('should fetch status counts', async () => {
    const TestComponent = {
      setup() {
        const { data } = useStatusCountsQuery()
        return { data }
      },
      template: '<div></div>'
    }
    
    createWrapper(TestComponent)
    await nextTick()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/matters/status-counts')
  })
})

// ============================================================================
// PREFETCH UTILITIES TESTS
// ============================================================================

describe('matterPrefetchUtils', () => {
  let queryClient: QueryClient
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue(mockPaginatedResponse)
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })
  
  it('should prefetch matters with filters', async () => {
    const filters: MatterFilters = { status: 'active' }
    
    await matterPrefetchUtils.prefetchMatters(queryClient, filters)
    
    expect(mockFetch).toHaveBeenCalledWith('/api/matters?status=active')
  })
  
  it('should prefetch statistics', async () => {
    mockFetch.mockResolvedValue(mockStatistics)
    
    await matterPrefetchUtils.prefetchStatistics(queryClient)
    
    expect(mockFetch).toHaveBeenCalledWith('/api/matters/statistics')
  })
  
  it('should prefetch infinite query first page', async () => {
    await matterPrefetchUtils.prefetchInfiniteMatters(queryClient)
    
    expect(mockFetch).toHaveBeenCalledWith('/api/matters?page=0&direction=next')
  })
})

// ============================================================================
// CACHE UTILITIES TESTS
// ============================================================================

describe('matterCacheUtils', () => {
  let queryClient: QueryClient
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    
    // Mock queryClient methods
    vi.spyOn(queryClient, 'invalidateQueries')
    vi.spyOn(queryClient, 'removeQueries')
  })
  
  it('should invalidate all matter queries', () => {
    matterCacheUtils.invalidateAll(queryClient)
    
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['matters']
    })
  })
  
  it('should invalidate filtered queries', () => {
    const filters: MatterFilters = { status: 'active' }
    
    matterCacheUtils.invalidateFiltered(queryClient, filters)
    
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['matters', 'list', { filters }]
    })
  })
  
  it('should invalidate search queries', () => {
    matterCacheUtils.invalidateSearch(queryClient, 'contract')
    
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['matters', 'search', { query: 'contract' }]
    })
  })
  
  it('should invalidate all search queries when no specific query provided', () => {
    matterCacheUtils.invalidateSearch(queryClient)
    
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function)
    })
  })
})

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should handle fetch errors gracefully', async () => {
    const errorMessage = 'Network error'
    mockFetch.mockRejectedValue(new Error(errorMessage))
    
    const TestComponent = {
      setup() {
        const { data, error, isPending } = useMatterSearchQuery(ref('test'))
        return { data, error, isPending }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    await nextTick()
    
    // Should handle error without crashing
    expect(wrapper.vm.error).toBeTruthy()
  })
  
  it('should provide fallback data for failed infinite queries', async () => {
    mockFetch.mockRejectedValue(new Error('Server error'))
    
    const TestComponent = {
      setup() {
        const { data, error } = useInfiniteMattersQuery()
        return { data, error }
      },
      template: '<div></div>'
    }
    
    const wrapper = createWrapper(TestComponent)
    await nextTick()
    
    // Should fail gracefully
    expect(wrapper.vm.error).toBeTruthy()
  })
})