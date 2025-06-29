// List view preference composable for saving view mode preferences
import { ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export function useListViewPreference(storageKey: string, defaultView: 'list' | 'grid' = 'list') {
  const viewMode = useLocalStorage(`${storageKey}-view`, defaultView)
  
  const setViewMode = (mode: 'list' | 'grid') => {
    viewMode.value = mode
  }
  
  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'list' ? 'grid' : 'list'
  }
  
  return {
    viewMode,
    setViewMode,
    toggleViewMode
  }
}