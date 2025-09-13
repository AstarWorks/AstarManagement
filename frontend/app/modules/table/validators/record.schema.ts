/**
 * Record Module Zod Schemas
 * レコード関連のバリデーションスキーマ定義
 */

import { z } from 'zod'
import type { PropertyDefinitionDto } from '../types'

/**
 * プロパティ設定の型定義
 */
interface PropertyConfig {
  min?: number
  max?: number
  precision?: number
  currency?: string
  options?: Array<{ value: string; label: string; color?: string }>
  defaultValue?: unknown
  placeholder?: string
  format?: string
  relationshipType?: string
  targetTableId?: string
  displayField?: string
}

/**
 * プロパティ型に応じたZodスキーマを返す
 */
export const getPropertyZodType = (property: PropertyDefinitionDto): z.ZodTypeAny => {
  const config = (property.config || {}) as PropertyConfig
  
  switch (property.type) {
    case 'text':
      return z.string().max(255, '255文字以内で入力してください')
    
    case 'long_text':
      return z.string().max(5000, '5000文字以内で入力してください')
    
    case 'number': {
      const baseSchema = z.preprocess(
        (val) => {
          if (val === '' || val === null || val === undefined) return undefined
          if (typeof val === 'number') return val
          return Number(val)
        },
        z.number()
      )
      
      // Check for specific number formats based on property key or config
      if (property.key?.includes('percent') || property.key?.includes('progress')) {
        return baseSchema.pipe(
          z.number().min(0, '0以上の値を入力してください').max(100, '100以下の値を入力してください')
        )
      } else if (property.key?.includes('price') || property.key?.includes('amount') || config.currency) {
        return baseSchema.pipe(z.number().nonnegative('0以上の値を入力してください'))
      } else if (config.min !== undefined && config.max !== undefined) {
        return baseSchema.pipe(
          z.number().min(config.min, `${config.min}以上の値を入力してください`)
            .max(config.max, `${config.max}以下の値を入力してください`)
        )
      } else if (config.min !== undefined) {
        return baseSchema.pipe(z.number().min(config.min, `${config.min}以上の値を入力してください`))
      } else if (config.max !== undefined) {
        return baseSchema.pipe(z.number().max(config.max, `${config.max}以下の値を入力してください`))
      }
      return baseSchema
    }
    
    case 'email':
      return z.string().email('有効なメールアドレスを入力してください')
    
    case 'url':
      return z.string().url('有効なURLを入力してください')
    
    case 'date':
      return z.string().regex(
        /^\d{4}-\d{2}-\d{2}$/,
        '日付形式が正しくありません (YYYY-MM-DD)'
      )
    
    case 'datetime': {
      // Check if this is time-only based on property key
      if (property.key?.includes('time') && !property.key?.includes('datetime')) {
        return z.string().regex(
          /^\d{2}:\d{2}/,
          '時刻形式が正しくありません (HH:MM)'
        )
      }
      return z.string().regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
        '日時形式が正しくありません'
      )
    }
    
    case 'checkbox':
      return z.boolean()
    
    case 'select': {
      if (config.options && Array.isArray(config.options)) {
        const values = config.options.map(opt => opt.value)
        if (values.length > 0) {
          return z.enum(values as [string, ...string[]]).describe('選択肢から選んでください')
        }
      }
      return z.string()
    }
    
    case 'multi_select': {
      if (config.options && Array.isArray(config.options)) {
        const values = config.options.map(opt => opt.value)
        if (values.length > 0) {
          return z.array(z.enum(values as [string, ...string[]]))
            .min(1, '少なくとも1つ選択してください')
        }
      }
      return z.array(z.string())
    }
    
    case 'relation':
      // リレーション型は文字列（関連レコードのID）または文字列の配列（複数の関連レコード）
      // configのrelationshipTypeによって変わる
      if (config.relationshipType === 'many-to-many') {
        return z.array(z.string().uuid('有効なレコードIDを指定してください'))
      }
      return z.string().uuid('有効なレコードIDを指定してください').nullable()
    
    case 'file':
      return z.array(z.string()).default([])
    
    default:
      return z.unknown()
  }
}

/**
 * レコード作成用の動的スキーマを生成
 */
export const createRecordSchema = (properties: Record<string, PropertyDefinitionDto>) => {
  const shape: Record<string, z.ZodTypeAny> = {}
  
  Object.entries(properties).forEach(([key, property]) => {
    let schema = getPropertyZodType(property)
    
    // 必須フィールドの処理
    if (!property.required) {
      // オプショナルな場合は null/undefined を許可
      schema = schema.optional().nullable()
    }
    
    // デフォルト値がある場合
    const config = (property.config || {}) as PropertyConfig
    if (config.defaultValue !== undefined) {
      schema = schema.default(config.defaultValue)
    }
    
    shape[key] = schema
  })
  
  return z.object({
    tableId: z.string().uuid('有効なテーブルIDを指定してください'),
    data: z.object(shape)
  })
}

/**
 * レコード更新用の動的スキーマを生成
 * 部分更新を許可するため、すべてのフィールドをオプショナルにする
 */
export const updateRecordSchema = (properties: Record<string, PropertyDefinitionDto>) => {
  const shape: Record<string, z.ZodTypeAny> = {}
  
  Object.entries(properties).forEach(([key, property]) => {
    const schema = getPropertyZodType(property)
    // 更新時はすべてオプショナル
    shape[key] = schema.optional().nullable()
  })
  
  return z.object({
    data: z.object(shape).partial()
  })
}

/**
 * フィルター用スキーマ
 */
export const recordFilterSchema = z.object({
  searchQuery: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional()
})

/**
 * バッチ操作用スキーマ
 */
export const batchOperationSchema = z.object({
  recordIds: z.array(z.string().uuid()).min(1, '少なくとも1つのレコードを選択してください'),
  operation: z.enum(['delete', 'duplicate', 'export'])
})

// 型定義のエクスポート
export type CreateRecordFormData = z.infer<ReturnType<typeof createRecordSchema>>
export type UpdateRecordFormData = z.infer<ReturnType<typeof updateRecordSchema>>
export type RecordFilterFormData = z.infer<typeof recordFilterSchema>
export type BatchOperationFormData = z.infer<typeof batchOperationSchema>