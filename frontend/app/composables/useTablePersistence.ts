import type { ColumnSizingState, SortingState, VisibilityState, ColumnPinningState } from '@tanstack/vue-table'
import { useLocalStorage } from '@vueuse/core'

export interface ITablePersistenceState {
  sorting?: SortingState
  columnVisibility?: VisibilityState
  columnSizing?: ColumnSizingState
  columnPinning?: ColumnPinningState
}

export function useTablePersistence(tableId: string) {
  const storageKey = `table-state-${tableId}`
  
  // Use VueUse's useLocalStorage for reactive persistence
  const persistedState = useLocalStorage<ITablePersistenceState>(storageKey, {})
  
  const saveState = (state: ITablePersistenceState) => {
    persistedState.value = {
      ...persistedState.value,
      ...state,
    }
  }
  
  const loadState = (): ITablePersistenceState => {
    return persistedState.value
  }
  
  const clearState = () => {
    persistedState.value = {}
  }
  
  return {
    saveState,
    loadState,
    clearState,
    persistedState: readonly(persistedState),
  }
}