import { computed, ref, type Ref } from 'vue'
import { useOffsetPagination } from '@vueuse/core'
import { z } from 'zod'

/**
 * Pagination configuration schema
 */
export const paginationConfigSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).default(10),
  pageSizeOptions: z.array(z.number().int().min(1)).default([10, 20, 50, 100]),
  total: z.number().int().min(0).default(0),
  maxVisiblePages: z.number().int().min(3).default(7)
})

export type PaginationConfig = z.infer<typeof paginationConfigSchema>

/**
 * Pagination options with callbacks
 */
export interface IPaginationOptions extends Partial<PaginationConfig> {
  onPageChange?: (page: number) => void | Promise<void>
  onPageSizeChange?: (pageSize: number) => void | Promise<void>
}

/**
 * Enhanced pagination composable built on VueUse's useOffsetPagination
 * Follows Simple over Easy principle with clear, explicit behavior
 */
export function usePagination(options: IPaginationOptions = {}) {
  // Validate and merge options with defaults
  const config = paginationConfigSchema.parse(options)
  
  // Local state for jump-to-page functionality
  const jumpToPageInput = ref<number>(config.page)
  
  // Core VueUse pagination functionality
  const {
    currentPage,
    currentPageSize,
    pageCount,
    isFirstPage,
    isLastPage,
    prev,
    next
  } = useOffsetPagination({
    total: config.total,
    page: config.page,
    pageSize: config.pageSize,
    onPageChange: ({ currentPage }) => {
      jumpToPageInput.value = currentPage
      options.onPageChange?.(currentPage)
    },
    onPageSizeChange: ({ currentPageSize }) => {
      options.onPageSizeChange?.(currentPageSize)
    }
  })

  /**
   * Calculate visible page numbers with ellipsis
   * Simple algorithm that handles edge cases explicitly
   */
  const visiblePageNumbers = computed(() => {
    const pages: (number | string)[] = []
    const maxVisible = config.maxVisiblePages
    
    if (pageCount.value <= maxVisible) {
      // Show all pages when total is small
      for (let i = 1; i <= pageCount.value; i++) {
        pages.push(i)
      }
      return pages
    }
    
    // Calculate positions for ellipsis
    const halfMax = Math.floor(maxVisible / 2)
    const currentPageValue = currentPage.value
    
    if (currentPageValue <= halfMax + 1) {
      // Current page near start
      for (let i = 1; i <= maxVisible - 2; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(pageCount.value)
    } else if (currentPageValue >= pageCount.value - halfMax) {
      // Current page near end
      pages.push(1)
      pages.push('...')
      for (let i = pageCount.value - (maxVisible - 3); i <= pageCount.value; i++) {
        pages.push(i)
      }
    } else {
      // Current page in middle
      pages.push(1)
      pages.push('...')
      for (let i = currentPageValue - halfMax + 1; i <= currentPageValue + halfMax - 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(pageCount.value)
    }
    
    return pages
  })

  /**
   * Pagination summary information
   */
  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * currentPageSize.value + 1
    const end = Math.min(currentPage.value * currentPageSize.value, config.total)
    
    return {
      start,
      end,
      total: config.total,
      isEmpty: config.total === 0
    }
  })

  /**
   * Navigation methods with explicit bounds checking
   */
  const goToFirst = () => {
    if (currentPage.value > 1) {
      currentPage.value = 1
    }
  }

  const goToLast = () => {
    if (currentPage.value < pageCount.value) {
      currentPage.value = pageCount.value
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pageCount.value && page !== currentPage.value) {
      currentPage.value = page
    }
  }

  /**
   * Handle jump to page with validation
   */
  const handleJumpToPage = () => {
    const targetPage = Number(jumpToPageInput.value)
    
    if (targetPage >= 1 && targetPage <= pageCount.value) {
      goToPage(targetPage)
    } else {
      // Reset to current page on invalid input
      jumpToPageInput.value = currentPage.value
    }
  }

  /**
   * Update page size with validation
   */
  const updatePageSize = (newSize: number) => {
    const validatedSize = z.number().int().min(1).parse(newSize)
    currentPageSize.value = validatedSize
  }

  /**
   * Update total items count
   */
  const updateTotal = (newTotal: number) => {
    // Validate the new total
    z.number().int().min(0).parse(newTotal)
    // This will trigger reactive updates in useOffsetPagination
    // Note: You'll need to recreate the pagination instance or use a reactive ref
    console.warn('updateTotal: Dynamic total updates require reactive implementation')
  }

  return {
    // State
    currentPage: currentPage as Ref<number>,
    currentPageSize: currentPageSize as Ref<number>,
    pageCount,
    isFirstPage,
    isLastPage,
    jumpToPageInput,
    
    // Computed
    visiblePageNumbers,
    paginationInfo,
    
    // Navigation methods
    prev,
    next,
    goToFirst,
    goToLast,
    goToPage,
    handleJumpToPage,
    
    // Configuration methods
    updatePageSize,
    updateTotal,
    
    // Configuration
    pageSizeOptions: config.pageSizeOptions,
    maxVisiblePages: config.maxVisiblePages
  }
}

/**
 * Specialized composable for expense pagination
 * Adds expense-specific functionality
 */
export function useExpensePagination(
  options: IPaginationOptions & {
    showSummaryBar?: boolean
  } = {}
) {
  const pagination = usePagination(options)
  
  // Expense-specific enhancements
  const showSummaryBar = ref(options.showSummaryBar ?? false)
  
  // Additional expense-specific methods could be added here
  
  return {
    ...pagination,
    showSummaryBar
  }
}