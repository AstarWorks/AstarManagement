/**
 * useRecordFilters Composable
 * フィルタリングロジックのみに責任を持つ
 */

import type { RecordResponse, PropertyDefinitionDto } from '../../types'

export const useRecordFilters = (
  records: Ref<RecordResponse[]>,
  properties: MaybeRef<Record<string, PropertyDefinitionDto>>,
  visibleColumns: Ref<string[]>
) => {
  const { t } = useI18n()
  const props = toRef(properties)

  // ===== Filter State =====
  const filters = ref<Record<string, unknown>>({})
  const searchQuery = ref('')

  // ===== Computed Properties =====
  const filteredRecords = computed(() => {
    let result = [...records.value]

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(record => {
        if (!record.data) return false
        return Object.entries(record.data).some(([key, value]) => {
          if (!visibleColumns.value.includes(key)) return false
          return String(value).toLowerCase().includes(query)
        })
      })
    }

    // Apply column filters
    Object.entries(filters.value).forEach(([key, filterValue]) => {
      if (filterValue === null || filterValue === undefined) return
      
      result = result.filter(record => {
        if (!record.data) return false
        const recordValue = record.data[key]
        
        // Handle different filter types based on property type
        const propertyDef = props.value[key]
        if (!propertyDef) return true

        return applyFilterByType(recordValue, filterValue, propertyDef)
      })
    })

    return result
  })

  const activeFilterCount = computed(() => {
    // Count only non-empty filters
    return Object.entries(filters.value).filter(([, value]) => {
      return value !== null && value !== undefined && value !== '' && 
             !(typeof value === 'string' && value.trim() === '')
    }).length
  })
  
  // Check if any filters are active (including search)
  const hasActiveFilters = computed(() => {
    return activeFilterCount.value > 0 || searchQuery.value.length > 0
  })

  const filterableColumns = computed(() => {
    if (!props.value) return []
    return Object.entries(props.value)
      .filter(([, prop]) => {
        // Only show filterable types
        const filterableTypes = ['text', 'long_text', 'email', 'url', 'number', 'select', 'checkbox', 'date', 'datetime']
        return filterableTypes.includes(prop.type)
      })
      .map(([key, prop]) => ({
        ...prop,
        key
      }))
  })

  // ===== Methods =====
  const applyFilterByType = (
    recordValue: unknown, 
    filterValue: unknown, 
    propertyDef: PropertyDefinitionDto
  ): boolean => {
    switch (propertyDef.type) {
      case 'text':
      case 'long_text':
      case 'email':
      case 'url':
        return String(recordValue || '').toLowerCase()
          .includes(String(filterValue).toLowerCase())
      
      case 'number':
        return Number(recordValue) === Number(filterValue)
      
      case 'date':
      case 'datetime':
        // Enhanced date comparison: extract date part from ISO strings
        if (!recordValue || !filterValue) return false
        
        try {
          const recordDate = String(recordValue).split('T')[0] // Extract YYYY-MM-DD
          const filterDate = String(filterValue).split('T')[0] // Extract YYYY-MM-DD
          return recordDate === filterDate
        } catch (error) {
          // Fallback to original comparison if parsing fails
          return new Date(recordValue as string).toDateString() === 
                 new Date(filterValue as string).toDateString()
        }
      
      case 'checkbox':
        return Boolean(recordValue) === Boolean(filterValue)
      
      case 'select':
      case 'multi_select':
        // Enhanced SELECT comparison with multiple selection support
        if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true
        if (!recordValue) return false
        
        // Always treat filter value as array for consistency
        const filterArray = Array.isArray(filterValue) ? filterValue : [filterValue]
        
        // Check if record value is included in filter array
        return filterArray.includes(String(recordValue))
      
      default:
        return true
    }
  }

  const setFilter = (columnKey: string, value: unknown) => {
    // Enhanced empty value check including empty strings
    if (value === null || value === undefined || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
      Reflect.deleteProperty(filters.value, columnKey)
    } else {
      filters.value[columnKey] = value
    }
  }

  const removeFilter = (columnKey: string) => {
    Reflect.deleteProperty(filters.value, columnKey)
  }

  const clearFilters = () => {
    filters.value = {}
    searchQuery.value = ''
  }

  const getColumnDisplayName = (columnKey: string) => {
    return props.value[columnKey]?.displayName || columnKey
  }

  const formatFilterValue = (columnKey: string, value: unknown): string => {
    const property = props.value[columnKey]
    if (!property) return String(value)
    
    // Handle different property types
    if (property.type === 'checkbox') {
      return value ? t('foundation.common.labels.yes') : t('foundation.common.labels.no')
    }
    
    if (property.type === 'date' && value) {
      return new Date(String(value)).toLocaleDateString('ja-JP')
    }
    
    if (property.type === 'select') {
      const config = property.config as { options?: Array<{ value: string; label: string }> }
      
      // Handle multiple selection display
      if (Array.isArray(value)) {
        if (value.length === 0) return ''
        if (value.length === 1) {
          const option = config?.options?.find(opt => opt.value === value[0])
          return option?.label || String(value[0])
        }
        return t('foundation.table.filtering.selectedCount', { count: value.length })
      }
      
      // Handle single selection
      const option = config?.options?.find(opt => opt.value === value)
      return option?.label || String(value)
    }
    
    return String(value)
  }

  return {
    // State
    filters,
    searchQuery,
    
    // Computed
    filteredRecords,
    activeFilterCount,
    hasActiveFilters,
    filterableColumns,
    
    // Methods
    setFilter,
    removeFilter,
    clearFilters,
    getColumnDisplayName,
    formatFilterValue
  }
}