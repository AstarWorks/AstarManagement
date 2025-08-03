/**
 * フィルター管理 Composable - Simple over Easy
 * VueUseライブラリを活用した最適化バージョン
 */

import { ref, computed, watch } from 'vue'
import { useDebounceFn, useRefHistory } from '@vueuse/core'
import type {  ICaseFilters  } from '~/types/case'
import { DEFAULT_CASE_FILTERS, LEGAL_PRACTICE_TAGS } from '~/config/filterConfig'

/**
 * フィルター管理の統一インターフェース（VueUse活用版）
 */
export function useFilters(
  initialFilters: ICaseFilters = DEFAULT_CASE_FILTERS,
  options: {
    enableHistory?: boolean
    debounceMs?: number
    onFiltersChange?: (filters: ICaseFilters) => void
  } = {}
) {
  const { enableHistory = false, debounceMs = 300, onFiltersChange } = options
  
  // リアクティブな状態
  const filters = ref<ICaseFilters>({ ...initialFilters })
  
  // VueUseの履歴管理（オプション）
  const {
    history,
    undo,
    redo,
    canUndo,
    canRedo,
    clear: clearHistory
  } = enableHistory 
    ? useRefHistory(filters, { capacity: 20 })
    : {
        history: ref([]),
        undo: () => {},
        redo: () => {},
        canUndo: ref(false),
        canRedo: ref(false),
        clear: () => {}
      }
  
  // 計算プロパティ
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
  
  const availableTags = computed(() => LEGAL_PRACTICE_TAGS)
  
  // 統一されたフィルタークリア関数
  const clearFilter = (filterKey: keyof ICaseFilters) => {
    switch (filterKey) {
      case 'search':
        filters.value.search = ''
        break
      case 'clientType':
      case 'priority': 
      case 'assignedLawyer':
        filters.value[filterKey] = 'all'
        break
      case 'tags':
        filters.value.tags = []
        break
      case 'dateRange':
        filters.value.dateRange = null
        break
      case 'sortBy':
        filters.value.sortBy = 'dueDate'
        break
      case 'sortOrder':
        filters.value.sortOrder = 'asc'
        break
      default:
        console.warn(`Unknown filter key: ${filterKey}`)
        break
    }
  }
  
  // 全フィルタークリア
  const clearAllFilters = () => {
    filters.value = { ...DEFAULT_CASE_FILTERS }
  }
  
  // 特定タグを削除
  const removeTag = (tag: string) => {
    const index = filters.value.tags.indexOf(tag)
    if (index > -1) {
      filters.value.tags.splice(index, 1)
    }
  }
  
  // VueUseのuseDebounceFnを使用したデバウンス処理
  const debouncedFiltersChange = useDebounceFn(() => {
    if (onFiltersChange) {
      onFiltersChange(filters.value)
    }
  }, debounceMs)
  
  // フィルター変更監視
  watch(filters, debouncedFiltersChange, { deep: true })
  
  // フィルター設定（外部からの同期用）
  const setFilters = (newFilters: Partial<ICaseFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }
  
  // フィルターリセット（特定キーのみ）
  const resetFilter = (filterKey: keyof ICaseFilters) => {
    const defaultValue = DEFAULT_CASE_FILTERS[filterKey]
    // @ts-expect-error - 型の互換性はランタイムで保証
    filters.value[filterKey] = defaultValue
  }
  
  // フィルター値の取得（読み取り専用）
  const getFilters = (): ICaseFilters => {
    return { ...filters.value }
  }
  
  return {
    // 状態
    filters: readonly(filters),
    
    // 計算プロパティ
    hasActiveFilters,
    availableTags,
    
    // メソッド
    clearFilter,
    clearAllFilters,
    resetFilter,
    removeTag,
    setFilters,
    getFilters,
    
    // VueUse機能（履歴管理）
    history: readonly(history),
    undo,
    redo,
    canUndo: readonly(canUndo),
    canRedo: readonly(canRedo),
    clearHistory,
  }
}