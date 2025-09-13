/**
 * Workspace Validation Schemas
 * ワークスペース関連のZodバリデーションスキーマ
 */

import { z } from 'zod'

// ワークスペース設定型の定義
export const workspaceSettingsSchema = z.object({
  icon: z.string().max(2).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  defaultTableView: z.enum(['board', 'table', 'calendar']).optional(),
  allowGuestAccess: z.boolean().optional(),
  features: z.object({
    tables: z.boolean().optional(),
    documents: z.boolean().optional(),
    expenses: z.boolean().optional(),
    projects: z.boolean().optional(),
  }).optional(),
}).passthrough() // 追加のプロパティを許可

// ワークスペースフォームのスキーマ
export const workspaceFormSchema = z.object({
  name: z.string()
    .min(1, 'ワークスペース名は必須です')
    .max(100, 'ワークスペース名は100文字以内で入力してください'),
  description: z.string()
    .max(500, '説明は500文字以内で入力してください')
    .optional(),
  icon: z.string()
    .max(2, 'アイコンは2文字以内で入力してください')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, '有効なカラーコードを入力してください')
    .optional(),
})

// 型推論用のエクスポート
export type WorkspaceFormData = z.infer<typeof workspaceFormSchema>
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>

// バリデーション関数
export const validateWorkspaceForm = (data: unknown): WorkspaceFormData => {
  return workspaceFormSchema.parse(data)
}

export const validateWorkspaceSettings = (data: unknown): WorkspaceSettings => {
  return workspaceSettingsSchema.parse(data)
}

// デフォルト値
export const defaultWorkspaceForm: WorkspaceFormData = {
  name: '',
  description: '',
  icon: '📁',
  color: '#3B82F6'
}