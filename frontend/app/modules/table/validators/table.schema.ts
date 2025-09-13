/**
 * Table Module Zod Schemas
 * テーブル関連のバリデーションスキーマ定義
 */

import { z } from 'zod'

// プロパティ型定義（OpenAPI定義に準拠）
export const propertyTypeEnum = z.enum([
  'TEXT',
  'LONG_TEXT',
  'NUMBER',
  'CHECKBOX',
  'DATE',
  'DATETIME',
  'SELECT',
  'MULTI_SELECT',
  'EMAIL',
  'URL',
  'FILE',
  'RELATION'
])

// プロパティ定義スキーマ
export const propertyDefinitionSchema = z.object({
  key: z.string()
    .min(1, 'プロパティキーは必須です')
    .max(50, 'プロパティキーは50文字以内で入力してください')
    .regex(/^[a-z][a-z0-9_]*$/, 'プロパティキーは英小文字で始まり、英数字とアンダースコアのみ使用可能です'),
  type: propertyTypeEnum,
  displayName: z.string()
    .min(1, '表示名は必須です')
    .max(100, '表示名は100文字以内で入力してください'),
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  config: z.object({
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
      color: z.string().optional()
    })).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    precision: z.number().optional(),
    format: z.string().optional()
  }).optional()
})

// テーブル作成スキーマ
export const createTableSchema = z.object({
  workspaceId: z.string().uuid('有効なワークスペースIDを指定してください'),
  name: z.string()
    .min(1, 'テーブル名は必須です')
    .max(255, 'テーブル名は255文字以内で入力してください'),
  description: z.string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional()
    .nullable(),
  properties: z.array(propertyDefinitionSchema)
    .max(100, 'プロパティは100個まで設定可能です')
    .optional()
    .default([]),
  templateName: z.string().optional()
})

// テーブル更新スキーマ
export const updateTableSchema = z.object({
  name: z.string()
    .min(1, 'テーブル名は必須です')
    .max(255, 'テーブル名は255文字以内で入力してください')
    .optional(),
  description: z.string()
    .max(1000, '説明は1000文字以内で入力してください')
    .nullable()
    .optional()
})

// プロパティ追加スキーマ
export const propertyAddSchema = propertyDefinitionSchema

// プロパティ更新スキーマ  
export const propertyUpdateSchema = z.object({
  typeId: propertyTypeEnum.optional(),
  displayName: z.string()
    .min(1, '表示名は必須です')
    .max(100, '表示名は100文字以内で入力してください')
    .optional(),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
  config: z.object({
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
      color: z.string().optional()
    })).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    precision: z.number().optional(),
    format: z.string().optional()
  }).optional()
})

// フォーム用の型定義
export type CreateTableFormData = z.infer<typeof createTableSchema>
export type UpdateTableFormData = z.infer<typeof updateTableSchema>
export type PropertyDefinitionFormData = z.infer<typeof propertyDefinitionSchema>
export type PropertyUpdateFormData = z.infer<typeof propertyUpdateSchema>