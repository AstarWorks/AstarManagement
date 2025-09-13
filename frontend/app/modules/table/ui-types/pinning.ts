/**
 * Pinning Schemas
 * テーブルの固定（ピン留め）機能に関するZodスキーマ定義
 */

import { z } from 'zod'

/**
 * カラム固定位置
 */
export const PinPositionSchema = z.union([
  z.literal('left'),
  z.literal('right'),
  z.literal(false)
])

/**
 * 行固定位置
 */
export const RowPinPositionSchema = z.union([
  z.literal('top'),
  z.literal('bottom'),
  z.literal(false)
])

/**
 * カラム固定設定
 */
export const ColumnPinningSchema = z.object({
  left: z.array(z.string()).default([]),
  right: z.array(z.string()).default([])
})

/**
 * 行固定設定
 */
export const RowPinningSchema = z.object({
  top: z.array(z.string()).default([]),
  bottom: z.array(z.string()).default([])
})

/**
 * 固定設定全体
 */
export const PinningSettingsSchema = z.object({
  // 固定状態
  columns: ColumnPinningSchema,
  rows: RowPinningSchema,
  
  // 機能設定
  enableColumnPinning: z.boolean().default(true),
  enableRowPinning: z.boolean().default(true),
  enableMultiColumnPinning: z.boolean().default(true),
  enableMultiRowPinning: z.boolean().default(true),
  
  // 制限設定
  maxPinnedColumns: z.number().min(0).max(10).default(5),
  maxPinnedRows: z.number().min(0).max(10).default(3),
  minScrollableColumns: z.number().min(1).default(2), // 最低限スクロール可能なカラム数
  
  // スタイル設定
  pinnedColumnShadow: z.boolean().default(true),
  pinnedRowBackground: z.string().optional(),
  stickyHeader: z.boolean().default(true),
  pinnedZIndex: z.object({
    column: z.number().default(10),
    row: z.number().default(20),
    intersection: z.number().default(30),
    header: z.number().default(40)
  }).default({
    column: 10,
    row: 20,
    intersection: 30,
    header: 40
  }),
  
  // アニメーション設定
  animatePinning: z.boolean().default(true),
  animationDuration: z.number().min(0).max(1000).default(200)
})

/**
 * ユーザーの固定設定（永続化用）
 */
export const UserPinningPreferencesSchema = z.object({
  pinnedColumns: z.array(z.string()).default([]),
  pinnedRows: z.array(z.string()).default([]),
  customOrder: z.array(z.string()).optional(),
  lastUpdated: z.string().datetime().optional()
})

/**
 * 固定状態全体（永続化用）
 */
export const PinningStateSchema = z.object({
  version: z.literal(1),
  settings: PinningSettingsSchema,
  userPreferences: UserPinningPreferencesSchema.optional()
})

/**
 * 固定操作のイベントペイロード
 */
export const PinColumnEventSchema = z.object({
  columnId: z.string(),
  position: PinPositionSchema,
  timestamp: z.string().datetime()
})

export const PinRowEventSchema = z.object({
  rowId: z.string(),
  position: RowPinPositionSchema,
  reason: z.enum(['user', 'system', 'highlight']).optional(),
  timestamp: z.string().datetime()
})

/**
 * 型エクスポート
 */
export type PinningSettings = z.infer<typeof PinningSettingsSchema>

/**
 * デフォルト値
 */
export const DEFAULT_PINNING_SETTINGS: PinningSettings = {
  columns: { left: [], right: [] },
  rows: { top: [], bottom: [] },
  enableColumnPinning: true,
  enableRowPinning: true,
  enableMultiColumnPinning: true,
  enableMultiRowPinning: true,
  maxPinnedColumns: 5,
  maxPinnedRows: 3,
  minScrollableColumns: 2,
  pinnedColumnShadow: true,
  stickyHeader: true,
  pinnedZIndex: {
    column: 10,
    row: 20,
    intersection: 30,
    header: 40
  },
  animatePinning: true,
  animationDuration: 200
}

export const DEFAULT_PINNING_STATE: z.infer<typeof PinningStateSchema> = {
  version: 1,
  settings: DEFAULT_PINNING_SETTINGS,
  userPreferences: undefined
}