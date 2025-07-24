/**
 * Example: Composable Testing with TanStack Query
 * 
 * This example demonstrates testing patterns for composables that use
 * TanStack Query for data fetching and state management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { ref } from 'vue'

// Mock TanStack Query
vi.mock('@tanstack/vue-query')

// Mock $fetch
global.$fetch = vi.fn()

// Example composable
const useMatterQuery = (matterId: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['matter', matterId],
    queryFn: () => $fetch(`/api/matters/${matterId}`),
    enabled: !!matterId
  })

  return {
    matter: data,
    isLoading,
    error,
    refetch
  }
}

const useMatterMutations = () => {
  const queryClient = useQueryClient()

  const createMatter = useMutation({
    mutationFn: (data: any) => $fetch('/api/matters', {
      method: 'POST',
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })

  const updateMatter = useMutation({
    mutationFn: ({ id, data }: any) => $fetch(`/api/matters/${id}`, {
      method: 'PATCH',
      body: data
    }),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(['matter', id], data)
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })

  return {
    createMatter,
    updateMatter
  }
}

describe('useMatterQuery Composable - Query Testing Example', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // Basic query testing
  it('fetches matter data successfully', () => {
    const mockData = {
      id: '123',
      title: 'Test Matter',
      status: 'active'
    }

    vi.mocked(useQuery).mockReturnValue({
      data: ref(mockData),
      isLoading: ref(false),
      error: ref(null),
      refetch: vi.fn()
    } as any)

    const { matter, isLoading, error } = useMatterQuery('123')

    expect(matter.value).toEqual(mockData)
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  // Loading state testing
  it('handles loading state correctly', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: ref(null),
      isLoading: ref(true),
      error: ref(null),
      refetch: vi.fn()
    } as any)

    const { matter, isLoading } = useMatterQuery('123')

    expect(matter.value).toBeNull()
    expect(isLoading.value).toBe(true)
  })

  // Error handling testing
  it('handles errors properly', () => {
    const mockError = new Error('Failed to fetch')

    vi.mocked(useQuery).mockReturnValue({
      data: ref(null),
      isLoading: ref(false),
      error: ref(mockError),
      refetch: vi.fn()
    } as any)

    const { matter, isLoading, error } = useMatterQuery('123')

    expect(matter.value).toBeNull()
    expect(isLoading.value).toBe(false)
    expect(error.value).toBe(mockError)
  })

  // Refetch testing
  it('provides refetch functionality', () => {
    const mockRefetch = vi.fn()

    vi.mocked(useQuery).mockReturnValue({
      data: ref(null),
      isLoading: ref(false),
      error: ref(null),
      refetch: mockRefetch
    } as any)

    const { refetch } = useMatterQuery('123')
    
    refetch()
    
    expect(mockRefetch).toHaveBeenCalled()
  })

  // Query key testing
  it('uses correct query key', () => {
    useMatterQuery('123')

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['matter', '123'],
      queryFn: expect.any(Function),
      enabled: true
    })
  })

  // Disabled query testing
  it('disables query when no ID provided', () => {
    useMatterQuery('')

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['matter', ''],
      queryFn: expect.any(Function),
      enabled: false
    })
  })
})

describe('useMatterMutations Composable - Mutation Testing Example', () => {
  let mockQueryClient: any

  beforeEach(() => {
    mockQueryClient = {
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn()
    }
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient)
  })

  // Create mutation testing
  it('handles create mutation successfully', () => {
    const mockMutate = vi.fn()
    const mockMutateAsync = vi.fn()

    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isLoading: ref(false),
      isError: ref(false),
      error: ref(null)
    } as any)

    const { createMatter } = useMatterMutations()

    // Test mutation function was configured correctly
    expect(useMutation).toHaveBeenCalledWith({
      mutationFn: expect.any(Function),
      onSuccess: expect.any(Function)
    })

    // Test mutation can be called
    createMatter.mutate({ title: 'New Matter' })
    expect(mockMutate).toHaveBeenCalledWith({ title: 'New Matter' })
  })

  // Update mutation testing
  it('handles update mutation with optimistic updates', () => {
    let onSuccessCallback: any

    vi.mocked(useMutation).mockImplementation((config: any) => {
      if (config.onSuccess) {
        onSuccessCallback = config.onSuccess
      }
      return {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: ref(false),
        isError: ref(false),
        error: ref(null)
      } as any
    })

    useMatterMutations()

    // Simulate successful update
    const updatedData = { id: '123', title: 'Updated Matter' }
    onSuccessCallback(updatedData, { id: '123' })

    // Verify cache updates
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ['matter', '123'],
      updatedData
    )
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['matters']
    })
  })

  // Error state testing
  it('exposes error states', () => {
    const mockError = new Error('Mutation failed')

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: ref(false),
      isError: ref(true),
      error: ref(mockError)
    } as any)

    const { createMatter } = useMatterMutations()

    expect(createMatter.isError.value).toBe(true)
    expect(createMatter.error.value).toBe(mockError)
  })

  // Loading state testing
  it('exposes loading states', () => {
    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: ref(true),
      isError: ref(false),
      error: ref(null)
    } as any)

    const { createMatter } = useMatterMutations()

    expect(createMatter.isLoading.value).toBe(true)
  })
})