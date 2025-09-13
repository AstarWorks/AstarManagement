/**
 * useRecordSelection Composable
 * 選択管理のみに責任を持つ
 */

import type { RecordResponse } from '../../types'

export const useRecordSelection = (records: Ref<RecordResponse[]>) => {
  // ===== State Management =====
  const selectedRecordIds = ref<Set<string>>(new Set())

  // ===== Computed Properties =====
  const isAllSelected = computed(() => 
    records.value.length > 0 && 
    records.value.every(r => !r.id || selectedRecordIds.value.has(r.id))
  )

  const selectedCount = computed(() => selectedRecordIds.value.size)

  const selectedRecords = computed(() => 
    records.value.filter(r => r.id && selectedRecordIds.value.has(r.id))
  )

  // ===== Methods =====
  const toggleRecordSelection = (recordId: string) => {
    if (selectedRecordIds.value.has(recordId)) {
      selectedRecordIds.value.delete(recordId)
    } else {
      selectedRecordIds.value.add(recordId)
    }
  }

  const toggleAllSelection = () => {
    if (isAllSelected.value) {
      selectedRecordIds.value.clear()
    } else {
      records.value.forEach(r => {
        if (r.id) selectedRecordIds.value.add(r.id)
      })
    }
  }

  const selectRecord = (recordId: string) => {
    selectedRecordIds.value.add(recordId)
  }

  const deselectRecord = (recordId: string) => {
    selectedRecordIds.value.delete(recordId)
  }

  const selectRecords = (recordIds: string[]) => {
    recordIds.forEach(id => selectedRecordIds.value.add(id))
  }

  const deselectRecords = (recordIds: string[]) => {
    recordIds.forEach(id => selectedRecordIds.value.delete(id))
  }

  const clearSelection = () => {
    selectedRecordIds.value.clear()
  }

  const selectAll = () => {
    records.value.forEach(r => {
      if (r.id) selectedRecordIds.value.add(r.id)
    })
  }

  const isRecordSelected = (recordId: string) => {
    return selectedRecordIds.value.has(recordId)
  }

  const getSelectedIds = () => {
    return Array.from(selectedRecordIds.value)
  }

  return {
    // State
    selectedRecordIds,
    
    // Computed
    isAllSelected,
    selectedCount,
    selectedRecords,
    
    // Methods
    toggleRecordSelection,
    toggleAllSelection,
    selectRecord,
    deselectRecord,
    selectRecords,
    deselectRecords,
    clearSelection,
    selectAll,
    isRecordSelected,
    getSelectedIds
  }
}