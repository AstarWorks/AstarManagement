/**
 * useRecordSorting Composable
 * ソートロジックのみに責任を持つ
 */

import type { RecordResponse } from '../../types'

export const useRecordSorting = (
  records: Ref<RecordResponse[]>,
  sortBy: Ref<string | null>,
  sortOrder: Ref<'asc' | 'desc'>
) => {
  // ===== Computed Properties =====
  const sortedRecords = computed(() => {
    const sorted = [...records.value]
    const sortKey = sortBy.value
    const order = sortOrder.value

    if (!sortKey) return sorted

    sorted.sort((a, b) => {
      // アンダースコアで始まるカラムはメタデータ
      const isMetadata = sortKey.startsWith('_')
      const metadataKey = isMetadata ? sortKey.substring(1) : null
      
      const aVal = isMetadata && metadataKey
        ? a[metadataKey as keyof RecordResponse]
        : a.data?.[sortKey]
      const bVal = isMetadata && metadataKey
        ? b[metadataKey as keyof RecordResponse]
        : b.data?.[sortKey]

      return compareValues(aVal, bVal, order)
    })

    return sorted
  })

  // ===== Methods =====
  const compareValues = (aVal: unknown, bVal: unknown, order: 'asc' | 'desc'): number => {
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) return order === 'asc' ? -1 : 1
    if (bVal === null || bVal === undefined) return order === 'asc' ? 1 : -1

    // Compare based on type
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  }

  const setSortBy = (columnKey: string) => {
    if (sortBy.value === columnKey) {
      // Toggle sort order if same column
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = columnKey
      sortOrder.value = 'asc'
    }
  }

  const clearSort = () => {
    sortBy.value = null
    sortOrder.value = 'desc'
  }

  return {
    // Computed
    sortedRecords,
    
    // Methods
    setSortBy,
    clearSort
  }
}