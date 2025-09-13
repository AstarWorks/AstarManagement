/**
 * Pinning Types
 * テーブルの固定（ピン留め）機能に関するTypeScript型定義
 */

import type { z } from 'zod'
import type { Column, Row, ColumnDef } from '@tanstack/vue-table'
import type { Ref } from 'vue'
import type { 
  PinningSettingsSchema,
  PinningStateSchema,
  PinPositionSchema,
  RowPinPositionSchema,
  PinColumnEventSchema,
  PinRowEventSchema,
  UserPinningPreferencesSchema
} from '../ui-types/pinning'

/**
 * Zod推論型
 */
export type PinningSettings = z.infer<typeof PinningSettingsSchema>
export type PinningState = z.infer<typeof PinningStateSchema>
export type PinPosition = z.infer<typeof PinPositionSchema>
export type RowPinPosition = z.infer<typeof RowPinPositionSchema>
export type PinColumnEvent = z.infer<typeof PinColumnEventSchema>
export type PinRowEvent = z.infer<typeof PinRowEventSchema>
export type UserPinningPreferences = z.infer<typeof UserPinningPreferencesSchema>

/**
 * 拡張カラム定義
 */
 
export interface PinnableColumnDef<TData = unknown> {
  // 固定可能かどうか
  enablePinning?: boolean
  // 固定時の優先度（大きいほど優先）
  pinPriority?: number
  // 固定時の最小幅
  minPinnedWidth?: number
  // 固定時の最大幅
  maxPinnedWidth?: number
  // デフォルトの固定位置
  defaultPin?: 'left' | 'right'
}

/**
 * 拡張カラムインスタンス
 */
export interface PinnableColumn<TData = unknown> extends Column<TData> {
  canPin: () => boolean
  getPinPriority: () => number
  getMinPinnedWidth: () => number | undefined
  getMaxPinnedWidth: () => number | undefined
}

/**
 * 拡張行インスタンス
 */
export interface PinnableRow<TData = unknown> extends Row<TData> {
  canPin: () => boolean
  getPinReason: () => PinReason | undefined
  getPinExpiry: () => Date | undefined
  isPinned: () => RowPinPosition | false
}

/**
 * 固定理由
 */
export type PinReason = 'user' | 'system' | 'highlight' | 'comparison' | 'total'

/**
 * スタイル計算結果
 */
export interface PinningStyles {
  position: 'sticky' | 'relative' | 'absolute'
  left?: string
  right?: string
  top?: string
  bottom?: string
  zIndex: number
  backgroundColor?: string
  boxShadow?: string
  transform?: string
  transition?: string
  opacity?: number
}

/**
 * スタイル計算オプション
 */
export interface PinningStyleOptions {
  // 影を表示するか
  showShadow?: boolean
  // 背景色をカスタマイズ
  backgroundColor?: string
  // アニメーションを有効にするか
  animate?: boolean
  // アニメーション時間（ms）
  animationDuration?: number
  // z-indexのベース値
  baseZIndex?: number
}

/**
 * イベントハンドラー
 */
export interface PinningEvents {
  // カラム固定/解除
  onColumnPin?: (columnId: string, position: PinPosition) => void | Promise<void>
  onColumnUnpin?: (columnId: string) => void | Promise<void>
  
  // 行固定/解除
  onRowPin?: (rowId: string, position: RowPinPosition, reason?: PinReason) => void | Promise<void>
  onRowUnpin?: (rowId: string) => void | Promise<void>
  
  // 状態変更
  onPinningChange?: (state: PinningState) => void | Promise<void>
  
  // バリデーション
  beforeColumnPin?: (columnId: string, position: PinPosition) => boolean | Promise<boolean>
  beforeRowPin?: (rowId: string, position: RowPinPosition) => boolean | Promise<boolean>
}

/**
 * Composable戻り値型
 */
export interface UsePinningReturn {
  // 状態
  pinningState: Ref<PinningState>
  pinnedColumns: Ref<{ left: string[], right: string[] }>
  pinnedRows: Ref<{ top: string[], bottom: string[] }>
  
  // カラム操作
  pinColumn: (columnId: string, position: 'left' | 'right' | false) => Promise<boolean>
  unpinColumn: (columnId: string) => Promise<boolean>
  toggleColumnPin: (columnId: string, position?: 'left' | 'right') => Promise<boolean>
  isPinnedColumn: (columnId: string) => PinPosition
  canPinColumn: (columnId: string, position: 'left' | 'right') => boolean
  
  // 行操作
  pinRow: (rowId: string, position: 'top' | 'bottom', reason?: PinReason) => Promise<boolean>
  unpinRow: (rowId: string) => Promise<boolean>
  toggleRowPin: (rowId: string, position?: 'top' | 'bottom') => Promise<boolean>
  isPinnedRow: (rowId: string) => RowPinPosition
  canPinRow: (rowId: string, position: 'top' | 'bottom') => boolean
  
  // 一括操作
  clearAllPins: () => Promise<void>
  clearColumnPins: (position?: 'left' | 'right') => Promise<void>
  clearRowPins: (position?: 'top' | 'bottom') => Promise<void>
  
  // 設定
  updateSettings: (settings: Partial<PinningSettings>) => Promise<void>
  resetSettings: () => Promise<void>
  
  // 永続化
  savePreferences: () => Promise<void>
  loadPreferences: () => Promise<void>
  clearPreferences: () => Promise<void>
}

/**
 * スタイルComposable戻り値型
 */
export interface UsePinningStylesReturn {
  // スタイル計算
  getColumnStyles: (column: Column<unknown>, options?: PinningStyleOptions) => PinningStyles
  getRowStyles: (row: Row<unknown>, index: number, options?: PinningStyleOptions) => PinningStyles
  getIntersectionStyles: (column: Column<unknown>, row: Row<unknown>, options?: PinningStyleOptions) => PinningStyles
  getHeaderStyles: (column: Column<unknown>, options?: PinningStyleOptions) => PinningStyles
  
  // クラス名生成
  getColumnClasses: (column: Column<unknown>) => string[]
  getRowClasses: (row: Row<unknown>) => string[]
  getCellClasses: (column: Column<unknown>, row: Row<unknown>) => string[]
  
  // ユーティリティ
  calculateOffset: (columns: Column<unknown>[], position: 'left' | 'right') => number
  calculateRowOffset: (rows: Row<unknown>[], position: 'top' | 'bottom') => number
}

/**
 * コンテキストメニュー項目
 */
export interface PinningMenuItem {
  id: string
  label: string
  icon?: string
  action: () => void | Promise<void>
  disabled?: boolean
  visible?: boolean
  separator?: boolean
}

/**
 * コンテキストメニューオプション
 */
export interface PinningContextMenuOptions {
  x: number
  y: number
  column?: Column<unknown>
  row?: Row<unknown>
  items: PinningMenuItem[]
}