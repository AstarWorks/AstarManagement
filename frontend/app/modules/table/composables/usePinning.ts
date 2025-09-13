/**
 * usePinning Composable
 * テーブルの固定（ピン留め）機能を提供するコンポーザブル
 */

import { computed, watch, type Ref } from 'vue'
import type { Table } from '@tanstack/vue-table'
import { useLocalStorage } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { 
  PinningStateSchema, 
  DEFAULT_PINNING_STATE
} from '../ui-types/pinning'
import type { PinningSettings } from '../ui-types/pinning'
import type { 
  PinningState, 
  PinPosition, 
  RowPinPosition,
  PinReason,
  PinningEvents,
  UsePinningReturn 
} from '../types/pinning'

/**
 * usePinning - テーブル固定機能
 */
export function usePinning<TData = unknown>(
  table: Ref<Table<TData>>,
  tableId: string,
  options?: {
    settings?: Partial<PinningSettings>
    events?: PinningEvents
    persistKey?: string
    initialPinning?: {
      columns?: { left?: string[], right?: string[] }
      rows?: { top?: string[], bottom?: string[] }
    }
  }
): UsePinningReturn {
  const { t } = useI18n()
  
  // 永続化キー
  const persistKey = options?.persistKey || `table-pinning-${tableId}`
  
  // 永続化された状態
  const savedState = useLocalStorage<PinningState>(
    persistKey,
    {
      ...DEFAULT_PINNING_STATE,
      settings: {
        ...DEFAULT_PINNING_STATE.settings,
        ...options?.settings
      }
    }
  )
  
  // バリデーション済み状態
  const pinningState = computed<PinningState>(() => {
    try {
      return PinningStateSchema.parse(savedState.value)
    } catch (error) {
      console.warn('Invalid pinning state, using defaults:', error)
      return DEFAULT_PINNING_STATE
    }
  })
  
  // 現在の固定カラム
  const pinnedColumns = computed(() => ({
    left: table.value.getState().columnPinning?.left || [],
    right: table.value.getState().columnPinning?.right || []
  }))
  
  // 現在の固定行
  const pinnedRows = computed(() => ({
    top: table.value.getState().rowPinning?.top || [],
    bottom: table.value.getState().rowPinning?.bottom || []
  }))
  
  /**
   * 状態を保存
   */
  const updateSavedState = () => {
    savedState.value = {
      ...savedState.value,
      userPreferences: {
        pinnedColumns: [...pinnedColumns.value.left, ...pinnedColumns.value.right],
        pinnedRows: [...pinnedRows.value.top, ...pinnedRows.value.bottom],
        lastUpdated: new Date().toISOString()
      }
    }
  }
  
  /**
   * カラムを固定
   */
  const pinColumn = async (
    columnId: string, 
    position: 'left' | 'right' | false
  ): Promise<boolean> => {
    try {
      const column = table.value.getColumn(columnId)
      if (!column) {
        console.warn(`Column ${columnId} not found`)
        return false
      }
      
      // バリデーション
      if (position && options?.events?.beforeColumnPin) {
        const canPin = await options.events.beforeColumnPin(columnId, position)
        if (!canPin) return false
      }
      
      // 最大数チェック
      if (position) {
        const currentPinned = pinnedColumns.value[position]
        const maxPinned = pinningState.value.settings.maxPinnedColumns
        
        if (currentPinned.length >= maxPinned) {
          toast.warning(t('modules.table.pinning.maxColumnsReached', { max: maxPinned }))
          return false
        }
        
        // 最小スクロール可能カラム数チェック
        const totalColumns = table.value.getAllColumns().length
        const totalPinned = pinnedColumns.value.left.length + 
                           pinnedColumns.value.right.length + 
                           (currentPinned.includes(columnId) ? 0 : 1)
        const minScrollable = pinningState.value.settings.minScrollableColumns
        
        if (totalColumns - totalPinned < minScrollable) {
          toast.warning(t('modules.table.pinning.minScrollableRequired', { min: minScrollable }))
          return false
        }
      }
      
      // 固定実行
      column.pin(position)
      
      // イベント発火
      if (options?.events?.onColumnPin) {
        await options.events.onColumnPin(columnId, position)
      }
      
      // 状態保存
      updateSavedState()
      
      // 成功通知
      if (position) {
        toast.success(t('modules.table.pinning.columnPinned', { 
          column: column.columnDef.header, 
          position: t(`modules.table.pinning.${position}`) 
        }))
      } else {
        toast.success(t('modules.table.pinning.columnUnpinned', { 
          column: column.columnDef.header 
        }))
      }
      
      return true
    } catch (error) {
      console.error('Failed to pin column:', error)
      toast.error(t('modules.table.pinning.error'))
      return false
    }
  }
  
  /**
   * カラムの固定を解除
   */
  const unpinColumn = async (columnId: string): Promise<boolean> => {
    return pinColumn(columnId, false)
  }
  
  /**
   * カラムの固定をトグル
   */
  const toggleColumnPin = async (
    columnId: string, 
    preferredPosition: 'left' | 'right' = 'left'
  ): Promise<boolean> => {
    const currentPosition = isPinnedColumn(columnId)
    if (currentPosition) {
      return unpinColumn(columnId)
    } else {
      return pinColumn(columnId, preferredPosition)
    }
  }
  
  /**
   * カラムが固定されているか確認
   */
  const isPinnedColumn = (columnId: string): PinPosition => {
    const column = table.value.getColumn(columnId)
    return column?.getIsPinned() || false
  }
  
  /**
   * カラムを固定可能か確認
   */
  const canPinColumn = (columnId: string, position: 'left' | 'right'): boolean => {
    const column = table.value.getColumn(columnId)
    if (!column) return false
    
    // 機能が無効
    if (!pinningState.value.settings.enableColumnPinning) return false
    
    // カラム定義で無効
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columnDef = column.columnDef as any
    if (columnDef.enablePinning === false) return false
    
    // 既に同じ位置に固定済み
    if (column.getIsPinned() === position) return false
    
    // 最大数チェック
    const currentPinned = pinnedColumns.value[position]
    if (currentPinned.length >= pinningState.value.settings.maxPinnedColumns) return false
    
    return true
  }
  
  /**
   * 行を固定
   */
  const pinRow = async (
    rowId: string, 
    position: 'top' | 'bottom',
    reason: PinReason = 'user'
  ): Promise<boolean> => {
    try {
      // バリデーション
      if (options?.events?.beforeRowPin) {
        const canPin = await options.events.beforeRowPin(rowId, position)
        if (!canPin) return false
      }
      
      const currentPinning = table.value.getState().rowPinning || { top: [], bottom: [] }
      
      // 最大数チェック
      const maxPinned = pinningState.value.settings.maxPinnedRows
      const positionRows = currentPinning[position] || []
      if (positionRows.length >= maxPinned) {
        toast.warning(t('modules.table.pinning.maxRowsReached', { max: maxPinned }))
        return false
      }
      
      // 既に固定済みチェック
      const currentPositionRows = currentPinning[position] || []
      if (currentPositionRows.includes(rowId)) {
        return true
      }
      
      // 反対側から削除
      const oppositePosition = position === 'top' ? 'bottom' : 'top'
      const newPinning = {
        ...currentPinning,
        [position]: [...(currentPinning[position] || []), rowId],
        [oppositePosition]: (currentPinning[oppositePosition] || []).filter((id: string) => id !== rowId)
      }
      
      // 固定実行
      table.value.setRowPinning(newPinning)
      
      // イベント発火
      if (options?.events?.onRowPin) {
        await options.events.onRowPin(rowId, position, reason)
      }
      
      // 状態保存
      updateSavedState()
      
      // 成功通知
      toast.success(t('modules.table.pinning.rowPinned', { 
        position: t(`modules.table.pinning.${position}`) 
      }))
      
      return true
    } catch (error) {
      console.error('Failed to pin row:', error)
      toast.error(t('modules.table.pinning.error'))
      return false
    }
  }
  
  /**
   * 行の固定を解除
   */
  const unpinRow = async (rowId: string): Promise<boolean> => {
    try {
      const currentPinning = table.value.getState().rowPinning || { top: [], bottom: [] }
      
      const newPinning = {
        top: (currentPinning.top || []).filter((id: string) => id !== rowId),
        bottom: (currentPinning.bottom || []).filter((id: string) => id !== rowId)
      }
      
      // 固定解除実行
      table.value.setRowPinning(newPinning)
      
      // イベント発火
      if (options?.events?.onRowUnpin) {
        await options.events.onRowUnpin(rowId)
      }
      
      // 状態保存
      updateSavedState()
      
      // 成功通知
      toast.success(t('modules.table.pinning.rowUnpinned'))
      
      return true
    } catch (error) {
      console.error('Failed to unpin row:', error)
      toast.error(t('modules.table.pinning.error'))
      return false
    }
  }
  
  /**
   * 行の固定をトグル
   */
  const toggleRowPin = async (
    rowId: string, 
    preferredPosition: 'top' | 'bottom' = 'top'
  ): Promise<boolean> => {
    const currentPosition = isPinnedRow(rowId)
    if (currentPosition) {
      return unpinRow(rowId)
    } else {
      return pinRow(rowId, preferredPosition)
    }
  }
  
  /**
   * 行が固定されているか確認
   */
  const isPinnedRow = (rowId: string): RowPinPosition => {
    const currentPinning = table.value.getState().rowPinning || { top: [], bottom: [] }
    
    if ((currentPinning.top || []).includes(rowId)) return 'top'
    if ((currentPinning.bottom || []).includes(rowId)) return 'bottom'
    return false
  }
  
  /**
   * 行を固定可能か確認
   */
  const canPinRow = (rowId: string, position: 'top' | 'bottom'): boolean => {
    // 機能が無効
    if (!pinningState.value.settings.enableRowPinning) return false
    
    // 既に同じ位置に固定済み
    const currentPosition = isPinnedRow(rowId)
    if (currentPosition === position) return false
    
    // 最大数チェック
    const currentPinning = table.value.getState().rowPinning || { top: [], bottom: [] }
    const positionRows = currentPinning[position] || []
    if (positionRows.length >= pinningState.value.settings.maxPinnedRows) return false
    
    return true
  }
  
  /**
   * すべての固定を解除
   */
  const clearAllPins = async (): Promise<void> => {
    // カラムの固定解除
    table.value.setColumnPinning({ left: [], right: [] })
    
    // 行の固定解除
    table.value.setRowPinning({ top: [], bottom: [] })
    
    // 状態保存
    updateSavedState()
    
    // 成功通知
    toast.success(t('modules.table.pinning.allCleared'))
  }
  
  /**
   * カラムの固定を解除
   */
  const clearColumnPins = async (position?: 'left' | 'right'): Promise<void> => {
    const currentPinning = table.value.getState().columnPinning || { left: [], right: [] }
    
    if (position) {
      table.value.setColumnPinning({
        ...currentPinning,
        [position]: []
      })
    } else {
      table.value.setColumnPinning({ left: [], right: [] })
    }
    
    updateSavedState()
    toast.success(t('modules.table.pinning.columnsCleared'))
  }
  
  /**
   * 行の固定を解除
   */
  const clearRowPins = async (position?: 'top' | 'bottom'): Promise<void> => {
    const currentPinning = table.value.getState().rowPinning || { top: [], bottom: [] }
    
    if (position) {
      table.value.setRowPinning({
        ...currentPinning,
        [position]: []
      })
    } else {
      table.value.setRowPinning({ top: [], bottom: [] })
    }
    
    updateSavedState()
    toast.success(t('modules.table.pinning.rowsCleared'))
  }
  
  /**
   * 設定を更新
   */
  const updateSettings = async (settings: Partial<PinningSettings>): Promise<void> => {
    savedState.value = {
      ...savedState.value,
      settings: {
        ...savedState.value.settings,
        ...settings
      }
    }
  }
  
  /**
   * 設定をリセット
   */
  const resetSettings = async (): Promise<void> => {
    savedState.value = DEFAULT_PINNING_STATE
    await clearAllPins()
  }
  
  /**
   * 設定を保存
   */
  const savePreferences = async (): Promise<void> => {
    updateSavedState()
    toast.success(t('modules.table.pinning.preferencesSaved'))
  }
  
  /**
   * 設定を読み込み
   */
  const loadPreferences = async (): Promise<void> => {
    const preferences = savedState.value.userPreferences
    if (!preferences) return
    
    // TODO: 保存された設定を適用
    toast.success(t('modules.table.pinning.preferencesLoaded'))
  }
  
  /**
   * 設定をクリア
   */
  const clearPreferences = async (): Promise<void> => {
    savedState.value = {
      ...savedState.value,
      userPreferences: undefined
    }
    toast.success(t('modules.table.pinning.preferencesCleared'))
  }

  /**
   * 初期ピン設定を適用
   */
  const applyInitialPinning = () => {
    if (!options?.initialPinning) return

    const { columns, rows } = options.initialPinning

    // カラムの初期ピン設定を適用
    if (columns) {
      table.value.setColumnPinning({
        left: columns.left || [],
        right: columns.right || []
      })
    }

    // 行の初期ピン設定を適用（現在は未実装、将来の拡張用）
    if (rows) {
      table.value.setRowPinning({
        top: rows.top || [],
        bottom: rows.bottom || []
      })
    }

    // Initial pinning applied successfully
  }
  
  // テーブルの状態変更を監視
  watch(
    () => table.value.getState().columnPinning,
    () => {
      if (options?.events?.onPinningChange) {
        options.events.onPinningChange(pinningState.value)
      }
    },
    { deep: true }
  )

  // 初期ピン設定を適用（テーブルが準備できてから）
  watch(
    () => table.value.getRowModel().rows.length >= 0,
    () => {
      applyInitialPinning()
    },
    { immediate: true }
  )
  
  return {
    // 状態
    pinningState,
    pinnedColumns,
    pinnedRows,
    
    // カラム操作
    pinColumn,
    unpinColumn,
    toggleColumnPin,
    isPinnedColumn,
    canPinColumn,
    
    // 行操作
    pinRow,
    unpinRow,
    toggleRowPin,
    isPinnedRow,
    canPinRow,
    
    // 一括操作
    clearAllPins,
    clearColumnPins,
    clearRowPins,
    
    // 設定
    updateSettings,
    resetSettings,
    
    // 永続化
    savePreferences,
    loadPreferences,
    clearPreferences
  }
}