import { ref, readonly, onMounted, type Ref } from 'vue'
import { useLoadingState, type ILoadingState } from '~/foundation/composables/ui/useLoadingState'

export interface IAsyncDataOptions<T> {
  default?: () => T
  server?: boolean
  immediate?: boolean
  watch?: Ref<unknown> | Ref<unknown>[]
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface IAsyncDataState<T> extends ILoadingState {
  data: Readonly<Ref<T | null>>
  refresh: () => Promise<T | null>
  execute: () => Promise<T | null>
  clear: () => void
}

/**
 * Composable for handling async data fetching with loading states
 * 
 * @param key - Unique key for the async operation
 * @param fetcher - Function that returns a Promise with the data
 * @param options - Configuration options
 * @returns AsyncDataState with data, loading state, and control methods
 */
export function useAsyncDataCustom<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: IAsyncDataOptions<T> = {}
): IAsyncDataState<T> {
  const {
    default: defaultFactory,
    immediate = true,
    watch: watchSources,
    onSuccess,
    onError
  } = options

  const data = ref<T | null>(defaultFactory?.() ?? null)
  const loadingState = useLoadingState()

  const execute = async (): Promise<T | null> => {
    try {
      const result = await loadingState.withLoading(fetcher)
      if (result !== null) {
        data.value = result
        onSuccess?.(result)
      }
      return result
    } catch (error) {
      onError?.(error as Error)
      return null
    }
  }

  const refresh = execute

  const clear = () => {
    data.value = defaultFactory?.() ?? null
    loadingState.reset()
  }

  // Auto-execute on mount if immediate is true
  if (immediate) {
    onMounted(execute)
  }

  // Watch for changes in specified refs
  if (watchSources) {
    const sources = Array.isArray(watchSources) ? watchSources : [watchSources]
    watch(sources, execute, { deep: true })
  }

  return {
    data: data as Readonly<Ref<T | null>>,
    ...loadingState,
    refresh,
    execute,
    clear
  }
}

/**
 * Specialized hook for paginated data
 */
export interface IPaginatedDataOptions<T> extends IAsyncDataOptions<T[]> {
  pageSize?: number
  initialPage?: number
}

export interface IPaginatedDataState<T> extends IAsyncDataState<T[]> {
  page: Ref<number>
  pageSize: Ref<number>
  hasNextPage: Readonly<Ref<boolean>>
  hasPrevPage: Readonly<Ref<boolean>>
  totalItems: Readonly<Ref<number>>
  totalPages: Readonly<Ref<number>>
  nextPage: () => Promise<void>
  prevPage: () => Promise<void>
  goToPage: (page: number) => Promise<void>
}

export function usePaginatedData<T>(
  key: string,
  fetcher: (page: number, pageSize: number) => Promise<{ items: T[], total: number }>,
  options: IPaginatedDataOptions<T> = {}
): IPaginatedDataState<T> {
  const {
    pageSize: initialPageSize = 10,
    initialPage = 1,
    ...asyncOptions
  } = options

  const page = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const totalItems = ref(0)

  const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))
  const hasNextPage = computed(() => page.value < totalPages.value)
  const hasPrevPage = computed(() => page.value > 1)

  const paginatedFetcher = async () => {
    const result = await fetcher(page.value, pageSize.value)
    totalItems.value = result.total
    return result.items
  }

  const asyncData = useAsyncDataCustom<T[]>(
    key,
    paginatedFetcher,
    asyncOptions
  )

  const nextPage = async () => {
    if (hasNextPage.value) {
      page.value++
    }
  }

  const prevPage = async () => {
    if (hasPrevPage.value) {
      page.value--
    }
  }

  const goToPage = async (targetPage: number) => {
    if (targetPage >= 1 && targetPage <= totalPages.value) {
      page.value = targetPage
    }
  }

  return {
    data: asyncData.data,
    error: asyncData.error,
    isLoading: asyncData.isLoading,
    startLoading: asyncData.startLoading,
    stopLoading: asyncData.stopLoading,
    setError: asyncData.setError,
    clearError: asyncData.clearError,
    refresh: asyncData.refresh,
    execute: asyncData.execute,
    clear: asyncData.clear,
    withLoading: asyncData.withLoading,
    reset: asyncData.clear, // alias for compatibility
    page,
    pageSize,
    hasNextPage,
    hasPrevPage,
    totalItems: readonly(totalItems),
    totalPages,
    nextPage,
    prevPage,
    goToPage
  }
}