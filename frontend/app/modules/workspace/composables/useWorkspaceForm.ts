/**
 * Workspace Form Management Composable
 * ワークスペースフォームの状態管理とバリデーションを担当
 */

import { reactive, computed } from 'vue'
import type { WorkspaceResponse, WorkspaceCreateRequest, WorkspaceUpdateRequest } from '~/modules/workspace/types'
import { workspaceFormSchema, defaultWorkspaceForm, type WorkspaceFormData } from '~/modules/workspace/validators/workspace.schema'
import type { ZodError } from 'zod'

export const useWorkspaceForm = () => {
  // フォームデータ
  const formData = reactive<WorkspaceFormData>({ ...defaultWorkspaceForm })
  
  // バリデーションエラー
  const errors = reactive<Partial<Record<keyof WorkspaceFormData, string>>>({})
  
  // バリデーション状態
  const isValid = computed(() => {
    try {
      workspaceFormSchema.parse(formData)
      return Object.keys(errors).length === 0
    } catch {
      return false
    }
  })

  /**
   * フォームをリセット
   */
  const resetForm = () => {
    Object.assign(formData, defaultWorkspaceForm)
    Object.keys(errors).forEach(key => {
      errors[key as keyof WorkspaceFormData] = undefined
    })
  }

  /**
   * 既存のワークスペースデータでフォームを初期化
   */
  const initializeForm = (workspace: WorkspaceResponse) => {
    const settings = getWorkspaceSettings(workspace)
    
    formData.name = workspace.name || ''
    formData.description = workspace.description || ''
    formData.icon = settings.icon || '📁'
    formData.color = settings.color || '#3B82F6'
    
    // エラーをクリア
    Object.keys(errors).forEach(key => {
      errors[key as keyof WorkspaceFormData] = undefined
    })
  }

  /**
   * フォームバリデーション
   */
  const validateForm = (): boolean => {
    // エラーをクリア
    Object.keys(errors).forEach(key => {
      errors[key as keyof WorkspaceFormData] = undefined
    })

    try {
      workspaceFormSchema.parse(formData)
      return true
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as ZodError
        zodError.issues.forEach(issue => {
          if (issue.path.length > 0) {
            const field = issue.path[0] as keyof WorkspaceFormData
            errors[field] = issue.message
          }
        })
      }
      return false
    }
  }

  /**
   * 作成用リクエストデータを生成
   */
  const toCreateRequest = (): WorkspaceCreateRequest => {
    return {
      name: formData.name,
      description: formData.description || undefined,
      settings: {
        icon: formData.icon,
        color: formData.color
      }
    }
  }

  /**
   * 更新用リクエストデータを生成
   */
  const toUpdateRequest = (): WorkspaceUpdateRequest => {
    return {
      name: formData.name,
      description: formData.description || undefined,
      settings: {
        icon: formData.icon,
        color: formData.color
      }
    }
  }

  /**
   * 型安全なワークスペース設定の取得
   */
  const getWorkspaceSettings = (workspace: WorkspaceResponse): { icon?: string; color?: string } => {
    if (!workspace.settings || typeof workspace.settings !== 'object') {
      return {}
    }
    
    const settings = workspace.settings as Record<string, unknown>
    return {
      icon: typeof settings.icon === 'string' ? settings.icon : undefined,
      color: typeof settings.color === 'string' ? settings.color : undefined
    }
  }

  /**
   * 特定フィールドのエラーを取得
   */
  const getFieldError = (field: keyof WorkspaceFormData): string | undefined => {
    return errors[field]
  }

  /**
   * 特定フィールドにエラーが存在するかチェック
   */
  const hasFieldError = (field: keyof WorkspaceFormData): boolean => {
    return Boolean(errors[field])
  }

  return {
    // State
    formData: readonly(formData),
    errors: readonly(errors),
    isValid,

    // Actions
    resetForm,
    initializeForm,
    validateForm,
    toCreateRequest,
    toUpdateRequest,
    getWorkspaceSettings,
    getFieldError,
    hasFieldError
  }
}