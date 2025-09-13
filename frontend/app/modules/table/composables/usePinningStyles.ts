/**
 * usePinningStyles Composable
 * テーブルの固定（ピン留め）スタイルを計算するコンポーザブル
 */

// No Vue imports needed for this composable
import type { Column, Row } from '@tanstack/vue-table'
import type { 
  PinningStyles, 
  PinningStyleOptions,
  UsePinningStylesReturn,
  PinningSettings 
} from '../types/pinning'

/**
 * usePinningStyles - 固定スタイル計算
 */
export function usePinningStyles(
  settings?: Partial<PinningSettings>
): UsePinningStylesReturn {
  
  // デフォルトオプション
  const defaultOptions: PinningStyleOptions = {
    showShadow: settings?.pinnedColumnShadow ?? true,
    animate: settings?.animatePinning ?? true,
    animationDuration: settings?.animationDuration ?? 200,
    baseZIndex: 10
  }
  
  /**
   * カラムの固定スタイルを計算
   */
  const getColumnStyles = (
    column: Column<unknown>, 
    options: PinningStyleOptions = {}
  ): PinningStyles => {
    const opts = { ...defaultOptions, ...options }
    const isPinned = column.getIsPinned()
    
    // 固定されていない場合
    if (!isPinned) {
      return {
        position: 'relative',
        zIndex: 0,
        transition: opts.animate 
          ? `all ${opts.animationDuration}ms ease-in-out` 
          : undefined
      }
    }
    
    const isLeft = isPinned === 'left'
    const isLastLeft = isLeft && column.getIsLastColumn('left')
    const isFirstRight = !isLeft && column.getIsFirstColumn('right')
    
    // 固定カラムのスタイル
    const styles: PinningStyles = {
      position: 'sticky',
      left: isLeft ? `${column.getStart('left')}px` : undefined,
      right: !isLeft ? `${column.getAfter('right')}px` : undefined,
      zIndex: (settings?.pinnedZIndex?.column ?? 10) + (opts.baseZIndex || 0),
      backgroundColor: opts.backgroundColor || 'var(--background)',
      transition: opts.animate 
        ? `all ${opts.animationDuration}ms ease-in-out` 
        : undefined
    }
    
    // 影の追加
    if (opts.showShadow) {
      if (isLastLeft) {
        styles.boxShadow = '2px 0 5px -2px rgba(0, 0, 0, 0.1), 4px 0 10px -4px rgba(0, 0, 0, 0.05)'
      } else if (isFirstRight) {
        styles.boxShadow = '-2px 0 5px -2px rgba(0, 0, 0, 0.1), -4px 0 10px -4px rgba(0, 0, 0, 0.05)'
      }
    }
    
    return styles
  }
  
  /**
   * 行の固定スタイルを計算
   */
  const getRowStyles = (
    row: Row<unknown>, 
    pinnedIndex: number = 0,
    options: PinningStyleOptions = {}
  ): PinningStyles => {
    const opts = { ...defaultOptions, ...options }
    const isPinned = row.getIsPinned ? row.getIsPinned() : false
    
    // 固定されていない場合
    if (!isPinned) {
      return {
        position: 'relative',
        zIndex: 0,
        transition: opts.animate 
          ? `all ${opts.animationDuration}ms ease-in-out` 
          : undefined
      }
    }
    
    // ヘッダーの高さを考慮（実際の実装では動的に取得）
    const headerHeight = 48
    const rowHeight = 48 // 標準的な行の高さ（density=normalの場合）
    
    const styles: PinningStyles = {
      position: 'sticky',
      zIndex: (settings?.pinnedZIndex?.row ?? 20) + (opts.baseZIndex || 0),
      backgroundColor: settings?.pinnedRowBackground || 'var(--muted)',
      transition: opts.animate 
        ? `all ${opts.animationDuration}ms ease-in-out` 
        : undefined
    }
    
    // 位置の計算
    if (isPinned === 'top') {
      // topに固定された行は、ヘッダーの下から順番に配置
      styles.top = `${headerHeight + (pinnedIndex * rowHeight)}px`
      if (opts.showShadow) {
        styles.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03)'
      }
    } else if (isPinned === 'bottom') {
      // bottomに固定された行は、下から順番に配置
      styles.bottom = `${pinnedIndex * rowHeight}px`
      if (opts.showShadow) {
        styles.boxShadow = '0 -2px 4px -1px rgba(0, 0, 0, 0.06), 0 -4px 6px -2px rgba(0, 0, 0, 0.03)'
      }
    }
    
    return styles
  }
  
  /**
   * 交差セルのスタイルを計算（固定行×固定列）
   */
  const getIntersectionStyles = (
    column: Column<unknown>, 
    row: Row<unknown>,
    options: PinningStyleOptions = {}
  ): PinningStyles => {
    const opts = { ...defaultOptions, ...options }
    const columnStyles = getColumnStyles(column, opts)
    // 行のインデックスを計算（同じ位置の固定行の中での順番）
    const rowIndex = row.index ?? 0
    const rowStyles = getRowStyles(row, rowIndex, opts)
    
    const isColumnPinned = column.getIsPinned()
    const isRowPinned = row.getIsPinned ? row.getIsPinned() : false
    
    // 両方固定されている場合
    if (isColumnPinned && isRowPinned) {
      return {
        ...columnStyles,
        ...rowStyles,
        position: 'sticky',
        zIndex: (settings?.pinnedZIndex?.intersection ?? 30) + (opts.baseZIndex || 0),
        backgroundColor: 'var(--accent)',
        boxShadow: [
          columnStyles.boxShadow,
          rowStyles.boxShadow
        ].filter(Boolean).join(', ') || undefined
      }
    }
    
    // どちらか一方のみ固定
    if (columnStyles.zIndex > rowStyles.zIndex) {
      return columnStyles
    } else {
      return rowStyles
    }
  }
  
  /**
   * ヘッダーの固定スタイルを計算
   */
  const getHeaderStyles = (
    column: Column<unknown>,
    options: PinningStyleOptions = {}
  ): PinningStyles => {
    const opts = { ...defaultOptions, ...options }
    const columnStyles = getColumnStyles(column, opts)
    
    // ヘッダーは常に上部固定
    const headerStyles: PinningStyles = {
      ...columnStyles,
      position: 'sticky',
      top: '0',
      zIndex: (settings?.pinnedZIndex?.header ?? 40) + (opts.baseZIndex || 0)
    }
    
    // 固定カラムのヘッダーはさらに高いz-index
    if (column.getIsPinned()) {
      headerStyles.zIndex = (headerStyles.zIndex || 0) + 10
    }
    
    return headerStyles
  }
  
  /**
   * カラムのクラス名を生成
   */
  const getColumnClasses = (column: Column<unknown>): string[] => {
    const classes: string[] = []
    const isPinned = column.getIsPinned()
    
    if (isPinned) {
      classes.push('pinned-column')
      classes.push(`pinned-${isPinned}`)
      
      if (isPinned === 'left' && column.getIsLastColumn('left')) {
        classes.push('pinned-left-last')
      }
      if (isPinned === 'right' && column.getIsFirstColumn('right')) {
        classes.push('pinned-right-first')
      }
    }
    
    return classes
  }
  
  /**
   * 行のクラス名を生成
   */
  const getRowClasses = (row: Row<unknown>): string[] => {
    const classes: string[] = []
    const isPinned = row.getIsPinned ? row.getIsPinned() : false
    
    if (isPinned) {
      classes.push('pinned-row')
      classes.push(`pinned-${isPinned}`)
    }
    
    if (row.getIsSelected?.()) {
      classes.push('selected')
    }
    
    return classes
  }
  
  /**
   * セルのクラス名を生成
   */
  const getCellClasses = (column: Column<unknown>, row: Row<unknown>): string[] => {
    const classes: string[] = []
    const isColumnPinned = column.getIsPinned()
    const isRowPinned = row.getIsPinned ? row.getIsPinned() : false
    
    if (isColumnPinned) {
      classes.push('pinned-cell-column')
    }
    
    if (isRowPinned) {
      classes.push('pinned-cell-row')
    }
    
    if (isColumnPinned && isRowPinned) {
      classes.push('pinned-cell-intersection')
    }
    
    return classes
  }
  
  /**
   * カラムのオフセットを計算
   */
  const calculateOffset = (
    columns: Column<unknown>[], 
    position: 'left' | 'right'
  ): number => {
    let offset = 0
    
    for (const column of columns) {
      if (column.getIsPinned() === position) {
        if (position === 'left') {
          offset += column.getSize()
        }
      }
    }
    
    return offset
  }
  
  /**
   * 行のオフセットを計算
   */
  const calculateRowOffset = (
    rows: Row<unknown>[], 
    position: 'top' | 'bottom'
  ): number => {
    const rowHeight = 36 // 実際の実装では動的に取得
    let offset = 0
    
    for (const row of rows) {
      const isPinned = row.getIsPinned ? row.getIsPinned() : false
      if (isPinned === position) {
        offset += rowHeight
      }
    }
    
    return offset
  }
  
  return {
    // スタイル計算
    getColumnStyles,
    getRowStyles,
    getIntersectionStyles,
    getHeaderStyles,
    
    // クラス名生成
    getColumnClasses,
    getRowClasses,
    getCellClasses,
    
    // ユーティリティ
    calculateOffset,
    calculateRowOffset
  }
}