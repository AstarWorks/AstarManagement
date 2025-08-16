/**
 * Case Filter Store - フィルター状態管理
 * Manages filter states, presets, and persistence
 */

import { defineStore } from 'pinia'
import type { ICaseFilters } from '~/modules/case/types/case'

// Default filter state
export const DEFAULT_CASE_FILTERS: ICaseFilters = {
  search: '',
  clientType: 'all',
  priority: 'all',
  assignedLawyer: 'all',
  tags: [],
  dateRange: null,
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

// Filter preset type
export interface IFilterPreset {
  id: string
  name: string
  filters: ICaseFilters
  createdAt: string
  isDefault?: boolean
}

export const useCaseFilterStore = defineStore('caseFilter', () => {
  const { t } = useI18n()
  
  // Filter state with localStorage persistence
  const filters = useLocalStorage<ICaseFilters>('case-filters', { ...DEFAULT_CASE_FILTERS })
  
  // Filter presets
  const presets = useLocalStorage<IFilterPreset[]>('case-filter-presets', [
    {
      id: 'high-priority',
      name: 'High Priority Cases',
      filters: {
        ...DEFAULT_CASE_FILTERS,
        priority: 'high'
      },
      createdAt: new Date().toISOString(),
      isDefault: false
    },
    {
      id: 'my-cases',
      name: 'My Cases',
      filters: {
        ...DEFAULT_CASE_FILTERS,
        assignedLawyer: '佐藤弁護士' // In real app, would use current user
      },
      createdAt: new Date().toISOString(),
      isDefault: false
    }
  ])
  
  // Currently active preset
  const activePresetId = ref<string | null>(null)
  
  // Computed properties
  const hasActiveFilters = computed(() => {
    return (
      filters.value.search !== '' ||
      filters.value.clientType !== 'all' ||
      filters.value.priority !== 'all' ||
      filters.value.assignedLawyer !== 'all' ||
      filters.value.tags.length > 0 ||
      filters.value.dateRange !== null
    )
  })
  
  const activeFilters = computed(() => {
    const active: Array<{key: keyof ICaseFilters, label: string, value: string}> = []
    
    if (filters.value.search) {
      active.push({
        key: 'search',
        label: t('matter.filters.activeFilters.search'),
        value: filters.value.search
      })
    }
    
    if (filters.value.clientType !== 'all') {
      active.push({
        key: 'clientType',
        label: t('matter.filters.activeFilters.clientType'),
        value: filters.value.clientType
      })
    }
    
    if (filters.value.priority !== 'all') {
      active.push({
        key: 'priority',
        label: t('matter.filters.activeFilters.priority'),
        value: filters.value.priority
      })
    }
    
    if (filters.value.assignedLawyer !== 'all') {
      active.push({
        key: 'assignedLawyer',
        label: t('matter.filters.activeFilters.assignedLawyer'),
        value: filters.value.assignedLawyer
      })
    }
    
    if (filters.value.tags.length > 0) {
      active.push({
        key: 'tags',
        label: t('matter.filters.activeFilters.tags'),
        value: filters.value.tags.join(', ')
      })
    }
    
    if (filters.value.dateRange) {
      active.push({
        key: 'dateRange',
        label: t('matter.filters.activeFilters.dateRange'),
        value: `${filters.value.dateRange.start} - ${filters.value.dateRange.end}`
      })
    }
    
    return active
  })
  
  // Actions for filter management
  const updateFilter = <K extends keyof ICaseFilters>(key: K, value: ICaseFilters[K]) => {
    filters.value = {
      ...filters.value,
      [key]: value
    }
    activePresetId.value = null // Clear active preset when manually changing filters
  }
  
  const updateFilters = (updates: Partial<ICaseFilters>) => {
    filters.value = {
      ...filters.value,
      ...updates
    }
    activePresetId.value = null
  }
  
  const clearFilter = (key: keyof ICaseFilters) => {
    switch (key) {
      case 'search':
        filters.value.search = ''
        break
      case 'clientType':
        filters.value.clientType = 'all'
        break
      case 'priority':
        filters.value.priority = 'all'
        break
      case 'assignedLawyer':
        filters.value.assignedLawyer = 'all'
        break
      case 'tags':
        filters.value.tags = []
        break
      case 'dateRange':
        filters.value.dateRange = null
        break
      case 'sortBy':
        filters.value.sortBy = 'createdAt'
        break
      case 'sortOrder':
        filters.value.sortOrder = 'desc'
        break
      default:
        console.warn(`Unknown filter key: ${key}`)
    }
    activePresetId.value = null
  }
  
  const removeTag = (tag: string) => {
    const index = filters.value.tags.indexOf(tag)
    if (index > -1) {
      filters.value.tags.splice(index, 1)
      activePresetId.value = null
    }
  }
  
  const resetAllFilters = () => {
    filters.value = { ...DEFAULT_CASE_FILTERS }
    activePresetId.value = null
  }
  
  // Preset management
  const savePreset = (name: string) => {
    const newPreset: IFilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters: { ...filters.value },
      createdAt: new Date().toISOString(),
      isDefault: false
    }
    
    presets.value.push(newPreset)
    return newPreset
  }
  
  const loadPreset = (presetId: string) => {
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      filters.value = { ...preset.filters }
      activePresetId.value = presetId
      return true
    }
    return false
  }
  
  const deletePreset = (presetId: string) => {
    const index = presets.value.findIndex(p => p.id === presetId)
    if (index > -1) {
      presets.value.splice(index, 1)
      if (activePresetId.value === presetId) {
        activePresetId.value = null
      }
      return true
    }
    return false
  }
  
  const updatePreset = (presetId: string, updates: Partial<IFilterPreset>) => {
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      Object.assign(preset, updates)
      return true
    }
    return false
  }
  
  return {
    // State
    filters,
    presets: readonly(presets),
    activePresetId: readonly(activePresetId),
    
    // Computed
    hasActiveFilters,
    activeFilters,
    
    // Filter actions
    updateFilter,
    updateFilters,
    clearFilter,
    removeTag,
    resetAllFilters,
    
    // Preset actions
    savePreset,
    loadPreset,
    deletePreset,
    updatePreset
  }
})