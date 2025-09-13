/**
 * useTableViewMode Composable
 * テーブルリストの表示モードを管理するComposable
 */

import { useLocalStorage } from '@vueuse/core'

export type ViewMode = 'card' | 'list'

export const useTableViewMode = () => {
  const viewMode = useLocalStorage<ViewMode>('table-view-mode', 'card')
  
  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'card' ? 'list' : 'card'
  }
  
  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
  }
  
  const isCardView = computed(() => viewMode.value === 'card')
  const isListView = computed(() => viewMode.value === 'list')
  
  return {
    viewMode,
    toggleViewMode,
    setViewMode,
    isCardView: readonly(isCardView),
    isListView: readonly(isListView)
  }
}