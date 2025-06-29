import { computed } from 'vue'
import type { CommunicationFilters, FilterPreset } from '~/types/communication'

export function useCommunicationFilters() {
  const route = useRoute()
  const router = useRouter()
  
  // Persist filters in URL
  const filters = computed<CommunicationFilters>({
    get: () => ({
      types: route.query.types ? String(route.query.types).split(',') : [],
      dateFrom: route.query.dateFrom ? String(route.query.dateFrom) : undefined,
      dateTo: route.query.dateTo ? String(route.query.dateTo) : undefined,
      matterId: route.query.matterId ? String(route.query.matterId) : undefined,
      participantId: route.query.participantId ? String(route.query.participantId) : undefined,
      search: route.query.search ? String(route.query.search) : undefined
    }),
    set: (value: CommunicationFilters) => {
      const query = { ...route.query }
      
      // Update query params
      if (value.types?.length) {
        query.types = value.types.join(',')
      } else {
        delete query.types
      }
      
      if (value.dateFrom) {
        query.dateFrom = value.dateFrom
      } else {
        delete query.dateFrom
      }
      
      if (value.dateTo) {
        query.dateTo = value.dateTo
      } else {
        delete query.dateTo
      }
      
      if (value.matterId) {
        query.matterId = value.matterId
      } else {
        delete query.matterId
      }
      
      if (value.participantId) {
        query.participantId = value.participantId
      } else {
        delete query.participantId
      }
      
      if (value.search) {
        query.search = value.search
      } else {
        delete query.search
      }
      
      router.push({ query })
    }
  })
  
  // Filter presets
  const applyPreset = (preset: FilterPreset) => {
    const dates = getPresetDates(preset)
    filters.value = { 
      ...filters.value, 
      ...dates 
    }
  }
  
  // Clear all filters
  const clearFilters = () => {
    filters.value = {}
  }
  
  // Check if any filters are active
  const hasActiveFilters = computed(() => {
    const current = filters.value
    return !!(
      current.types?.length ||
      current.dateFrom ||
      current.dateTo ||
      current.matterId ||
      current.participantId ||
      current.search
    )
  })
  
  // Get filter summary for display
  const filterSummary = computed(() => {
    const current = filters.value
    const parts: string[] = []
    
    if (current.types?.length) {
      parts.push(`Types: ${current.types.join(', ')}`)
    }
    
    if (current.dateFrom || current.dateTo) {
      if (current.dateFrom && current.dateTo) {
        parts.push(`Date: ${current.dateFrom} to ${current.dateTo}`)
      } else if (current.dateFrom) {
        parts.push(`From: ${current.dateFrom}`)
      } else if (current.dateTo) {
        parts.push(`Until: ${current.dateTo}`)
      }
    }
    
    if (current.search) {
      parts.push(`Search: "${current.search}"`)
    }
    
    return parts.join(' • ')
  })
  
  return {
    filters,
    applyPreset,
    clearFilters,
    hasActiveFilters,
    filterSummary
  }
}

function getPresetDates(preset: FilterPreset): Partial<CommunicationFilters> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (preset) {
    case 'today':
      return {
        dateFrom: today.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0]
      }
    
    case 'week': {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return {
        dateFrom: weekStart.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0]
      }
    }
    
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        dateFrom: monthStart.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0]
      }
    }
    
    case 'all':
    default:
      return {
        dateFrom: undefined,
        dateTo: undefined
      }
  }
}