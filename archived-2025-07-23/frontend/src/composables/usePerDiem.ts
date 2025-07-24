/**
 * Per-Diem Management Composable
 * 
 * @description Provides reactive state management and business logic for per-diem
 * recording, including date range processing, bulk entry creation, and integration
 * with the existing expense system.
 * 
 * @author Claude
 * @created 2025-07-03
 * @updated 2025-07-03 (T02_S14 - Per-Diem Recording Interface)
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/vue-query'
import { ref, computed, unref, type MaybeRef } from 'vue'
import type { 
  PerDiemEntryForm,
  CreatePerDiemForm,
  UpdatePerDiemForm,
  PerDiemSearchForm,
  BulkPerDiemForm,
  PerDiemTemplateForm,
  PerDiemPreset,
  DateRange,
  PerDiemCategory,
  TransportationMode,
  AccommodationType
} from '~/schemas/per-diem'
import { commonPerDiemPresets } from '~/schemas/per-diem'
import { useToast } from '~/composables/useToast'

// Per-diem related types
interface PerDiemEntry {
  id: string
  dateRange: DateRange
  location: string
  purpose: string
  category: PerDiemCategory
  dailyAmount: number
  currency: string
  matterId?: string
  transportationMode?: TransportationMode
  accommodationType: AccommodationType
  accommodationRequired: boolean
  totalAmount: number
  totalDays: number
  isBillable: boolean
  isReimbursable: boolean
  requiresApproval: boolean
  isApproved: boolean
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface PaginatedPerDiemResponse {
  data: PerDiemEntry[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

interface DailyExpenseEntry {
  date: string
  amount: number
  description: string
  expense_type: 'TRAVEL'
  matterId?: string
  location: string
  purpose: string
  notes?: string
  receipt_required: false
  isBillable: boolean
  isReimbursable: boolean
  category: string
  transportationMode?: TransportationMode
  accommodationType?: AccommodationType
}

// Query keys for per-diem related queries
export const perDiemQueryKeys = {
  all: ['per-diem'] as const,
  lists: () => [...perDiemQueryKeys.all, 'list'] as const,
  list: (filters?: PerDiemSearchForm) => [...perDiemQueryKeys.lists(), filters] as const,
  details: () => [...perDiemQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...perDiemQueryKeys.details(), id] as const,
  templates: () => [...perDiemQueryKeys.all, 'templates'] as const,
  presets: () => [...perDiemQueryKeys.all, 'presets'] as const
}

/**
 * Core per-diem management composable
 */
export function usePerDiem() {
  const { $fetch } = useNuxtApp()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Local state for form management
  const isSubmitting = ref(false)
  const errors = ref<Record<string, string>>({})
  const currentPreset = ref<PerDiemPreset | null>(null)

  /**
   * Calculate the number of days between two dates (inclusive)
   */
  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 for inclusive
  }

  /**
   * Calculate total amount for a date range
   */
  const calculateTotalAmount = (dateRange: DateRange, dailyAmount: number): number => {
    const days = calculateDays(dateRange.startDate, dateRange.endDate)
    return days * dailyAmount
  }

  /**
   * Generate individual daily expense entries from per-diem data
   */
  const generateDailyEntries = (perDiemData: PerDiemEntryForm): DailyExpenseEntry[] => {
    const entries: DailyExpenseEntry[] = []
    const startDate = new Date(perDiemData.dateRange.startDate)
    const endDate = new Date(perDiemData.dateRange.endDate)

    // Generate entry for each day in the range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0]
      
      entries.push({
        date: dateString,
        amount: perDiemData.dailyAmount,
        description: `${perDiemData.purpose} - ${perDiemData.location}`,
        expense_type: 'TRAVEL',
        matterId: perDiemData.matterId,
        location: perDiemData.location,
        purpose: perDiemData.purpose,
        notes: perDiemData.notes,
        receipt_required: false,
        isBillable: perDiemData.isBillable,
        isReimbursable: perDiemData.isReimbursable,
        category: perDiemData.category,
        transportationMode: perDiemData.transportationMode,
        accommodationType: perDiemData.accommodationType
      })
    }

    return entries
  }

  /**
   * Apply a preset to form data
   */
  const applyPreset = (preset: PerDiemPreset): Partial<PerDiemEntryForm> => {
    currentPreset.value = preset
    
    return {
      category: preset.category,
      location: preset.location,
      purpose: preset.purpose,
      dailyAmount: preset.dailyAmount,
      transportationMode: preset.transportationMode,
      accommodationType: preset.accommodationType,
      accommodationRequired: preset.accommodationRequired,
      isBillable: true,
      isReimbursable: false,
      currency: 'JPY'
    }
  }

  /**
   * Get common locations based on category
   */
  const getCommonLocations = (category?: PerDiemCategory): string[] => {
    const locationMap: Record<PerDiemCategory, string[]> = {
      COURT_VISIT: [
        'Tokyo District Court',
        'Osaka District Court', 
        'Nagoya District Court',
        'Fukuoka District Court',
        'Sendai District Court',
        'Sapporo District Court',
        'Tokyo High Court',
        'Osaka High Court',
        'Supreme Court of Japan'
      ],
      CLIENT_MEETING: [
        'Tokyo Station Area',
        'Shinjuku Business District',
        'Shibuya Office Complex',
        'Osaka Business Park',
        'Marunouchi District',
        'Ginza Area',
        'Client Office'
      ],
      BUSINESS_TRAVEL: [
        'Tokyo',
        'Osaka',
        'Nagoya',
        'Fukuoka',
        'Sendai',
        'Sapporo',
        'Hiroshima',
        'Yokohama'
      ],
      CONFERENCE: [
        'Tokyo International Forum',
        'Makuhari Messe',
        'Tokyo Big Sight',
        'Pacifico Yokohama',
        'Kyoto International Conference Center',
        'Convention Center'
      ],
      SITE_INSPECTION: [
        'Property Site',
        'Construction Site',
        'Factory Location',
        'Commercial Property',
        'Residential Property'
      ],
      DOCUMENT_FILING: [
        'Tokyo Legal Affairs Bureau',
        'Osaka Legal Affairs Bureau',
        'District Court',
        'Family Court',
        'Government Office'
      ],
      OTHER: [
        'Business Location',
        'Meeting Venue',
        'Office Location'
      ]
    }

    return category ? locationMap[category] : []
  }

  /**
   * Get suggested daily amounts based on category and location
   */
  const getSuggestedAmounts = (category?: PerDiemCategory, location?: string): number[] => {
    const baseAmounts = {
      COURT_VISIT: [6000, 8000, 10000],
      CLIENT_MEETING: [8000, 10000, 12000],
      BUSINESS_TRAVEL: [10000, 12000, 15000],
      CONFERENCE: [12000, 15000, 18000],
      SITE_INSPECTION: [8000, 10000, 12000],
      DOCUMENT_FILING: [5000, 6000, 8000],
      OTHER: [8000, 10000, 12000]
    }

    let amounts = category ? baseAmounts[category] : [8000, 10000, 12000]

    // Adjust for major metropolitan areas
    if (location?.toLowerCase().includes('tokyo') || location?.toLowerCase().includes('東京')) {
      amounts = amounts.map(amount => amount + 2000)
    } else if (location?.toLowerCase().includes('osaka') || location?.toLowerCase().includes('大阪')) {
      amounts = amounts.map(amount => amount + 1000)
    }

    return amounts
  }

  return {
    // State
    isSubmitting: readonly(isSubmitting),
    errors: readonly(errors),
    currentPreset: readonly(currentPreset),

    // Static data
    presets: commonPerDiemPresets,

    // Utility functions
    calculateDays,
    calculateTotalAmount,
    generateDailyEntries,
    applyPreset,
    getCommonLocations,
    getSuggestedAmounts,

    // Query keys
    queryKeys: perDiemQueryKeys
  }
}

/**
 * Per-diem queries composable
 */
export function usePerDiemQueries() {
  const { $fetch } = useNuxtApp()

  /**
   * Fetch paginated list of per-diem entries
   */
  const usePerDiemList = (
    filters?: MaybeRef<PerDiemSearchForm>,
    options?: Partial<UseQueryOptions<PaginatedPerDiemResponse, Error>>
  ) => {
    return useQuery<PaginatedPerDiemResponse, Error>({
      queryKey: perDiemQueryKeys.list(unref(filters)),
      queryFn: async (): Promise<PaginatedPerDiemResponse> => {
        const params = unref(filters)
        return await $fetch('/api/per-diem', {
          query: params
        })
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options
    })
  }

  /**
   * Fetch single per-diem entry details
   */
  const usePerDiemDetail = (
    id: MaybeRef<string>,
    options?: Partial<UseQueryOptions<PerDiemEntry, Error>>
  ) => {
    return useQuery<PerDiemEntry, Error>({
      queryKey: perDiemQueryKeys.detail(unref(id)),
      queryFn: async (): Promise<PerDiemEntry> => {
        return await $fetch(`/api/per-diem/${unref(id)}`)
      },
      enabled: computed(() => !!unref(id)),
      staleTime: 5 * 60 * 1000,
      ...options
    })
  }

  /**
   * Fetch per-diem templates
   */
  const usePerDiemTemplates = (
    options?: Partial<UseQueryOptions<PerDiemTemplateForm[], Error>>
  ) => {
    return useQuery<PerDiemTemplateForm[], Error>({
      queryKey: perDiemQueryKeys.templates(),
      queryFn: async (): Promise<PerDiemTemplateForm[]> => {
        return await $fetch('/api/per-diem/templates')
      },
      staleTime: 10 * 60 * 1000, // 10 minutes (templates change infrequently)
      ...options
    })
  }

  return {
    usePerDiemList,
    usePerDiemDetail,
    usePerDiemTemplates
  }
}

/**
 * Per-diem mutations composable
 */
export function usePerDiemMutations() {
  const { $fetch } = useNuxtApp()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  /**
   * Create new per-diem entry (converts to individual expense entries)
   */
  const createPerDiem = useMutation({
    mutationFn: async (data: CreatePerDiemForm): Promise<PerDiemEntry> => {
      return await $fetch('/api/per-diem', {
        method: 'POST',
        body: data
      })
    },
    onSuccess: (newEntry) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: perDiemQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['expenses'] }) // Also invalidate expense queries
      
      showToast('Per-diem entry created successfully', 'success')
    },
    onError: (error) => {
      console.error('Per-diem creation error:', error)
      showToast('Failed to create per-diem entry', 'error')
    }
  })

  /**
   * Create multiple per-diem entries in batch
   */
  const createBulkPerDiem = useMutation({
    mutationFn: async (data: BulkPerDiemForm): Promise<PerDiemEntry[]> => {
      return await $fetch('/api/per-diem/bulk', {
        method: 'POST',
        body: data
      })
    },
    onSuccess: (entries) => {
      queryClient.invalidateQueries({ queryKey: perDiemQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      
      showToast(`Created ${entries.length} per-diem entries successfully`, 'success')
    },
    onError: (error) => {
      console.error('Bulk per-diem creation error:', error)
      showToast('Failed to create per-diem entries', 'error')
    }
  })

  /**
   * Update existing per-diem entry
   */
  const updatePerDiem = useMutation({
    mutationFn: async (data: UpdatePerDiemForm): Promise<PerDiemEntry> => {
      return await $fetch(`/api/per-diem/${data.id}`, {
        method: 'PUT',
        body: data
      })
    },
    onMutate: async (data) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: perDiemQueryKeys.detail(data.id!) })
      
      const previousEntry = queryClient.getQueryData(perDiemQueryKeys.detail(data.id!))
      
      queryClient.setQueryData(perDiemQueryKeys.detail(data.id!), (old: PerDiemEntry) => ({
        ...old,
        ...data
      }))
      
      return { previousEntry }
    },
    onError: (err, data, context) => {
      // Rollback on error
      if (context?.previousEntry) {
        queryClient.setQueryData(perDiemQueryKeys.detail(data.id!), context.previousEntry)
      }
      showToast('Failed to update per-diem entry', 'error')
    },
    onSuccess: (updatedEntry) => {
      queryClient.invalidateQueries({ queryKey: perDiemQueryKeys.lists() })
      showToast('Per-diem entry updated successfully', 'success')
    }
  })

  /**
   * Delete per-diem entry
   */
  const deletePerDiem = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await $fetch(`/api/per-diem/${id}`, {
        method: 'DELETE'
      })
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: perDiemQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: perDiemQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      
      showToast('Per-diem entry deleted successfully', 'success')
    },
    onError: (error) => {
      console.error('Per-diem deletion error:', error)
      showToast('Failed to delete per-diem entry', 'error')
    }
  })

  /**
   * Save per-diem template
   */
  const saveTemplate = useMutation({
    mutationFn: async (data: PerDiemTemplateForm): Promise<PerDiemTemplateForm> => {
      return await $fetch('/api/per-diem/templates', {
        method: 'POST',
        body: data
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: perDiemQueryKeys.templates() })
      showToast('Template saved successfully', 'success')
    },
    onError: (error) => {
      console.error('Template save error:', error)
      showToast('Failed to save template', 'error')
    }
  })

  return {
    createPerDiem,
    createBulkPerDiem,
    updatePerDiem,
    deletePerDiem,
    saveTemplate
  }
}

/**
 * Combined per-diem management hook
 */
export function usePerDiemManagement() {
  const core = usePerDiem()
  const queries = usePerDiemQueries()
  const mutations = usePerDiemMutations()

  return {
    ...core,
    ...queries,
    ...mutations
  }
}