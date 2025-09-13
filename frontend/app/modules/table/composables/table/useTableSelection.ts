/**
 * useTableSelection Composable
 * テーブルの選択状態を管理するComposable
 */

import type { Ref } from 'vue'
import type { TableResponse } from '../../types'

export const useTableSelection = (tables: Ref<TableResponse[]> | Ref<readonly TableResponse[]>) => {
  const selectedTables = ref<string[]>([])
  
  const isAllSelected = computed(() => 
    tables.value.length > 0 && 
    selectedTables.value.length === tables.value.length
  )
  
  const toggleSelectAll = (checked: boolean) => {
    selectedTables.value = checked 
      ? tables.value.map(t => t.id).filter((id): id is string => Boolean(id))
      : []
  }
  
  const toggleSelect = (id: string, checked: boolean) => {
    const index = selectedTables.value.indexOf(id)
    if (checked && index === -1) {
      selectedTables.value.push(id)
    } else if (!checked && index > -1) {
      selectedTables.value.splice(index, 1)
    }
  }
  
  const clearSelection = () => {
    selectedTables.value = []
  }
  
  const getSelectedTables = () => {
    return tables.value.filter(t => t.id && selectedTables.value.includes(t.id))
  }
  
  return {
    selectedTables: readonly(selectedTables),
    isAllSelected: readonly(isAllSelected),
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    getSelectedTables
  }
}