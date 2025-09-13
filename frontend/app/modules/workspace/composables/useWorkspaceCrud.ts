/**
 * Workspace CRUD Operations Composable
 * ワークスペースのCRUD操作とエラーハンドリングを担当
 */

import { ref } from 'vue'
import { toast } from 'vue-sonner'
import type { WorkspaceResponse, WorkspaceCreateRequest, WorkspaceUpdateRequest } from '~/modules/workspace/types'

export const useWorkspaceCrud = () => {
  const { t } = useI18n()
  const workspace = useWorkspace()

  // Loading states
  const creating = ref(false)
  const updating = ref(false)
  const deleting = ref(false)
  const duplicating = ref(false)

  /**
   * ワークスペースを作成
   */
  const createWorkspace = async (data: WorkspaceCreateRequest): Promise<WorkspaceResponse> => {
    creating.value = true
    
    try {
      const result = await workspace.createWorkspace(data)
      toast.success(t('foundation.messages.success.created'))
      return result
    } catch (error) {
      console.error('Failed to create workspace:', error)
      toast.error(t('foundation.messages.error.default'))
      throw error
    } finally {
      creating.value = false
    }
  }

  /**
   * ワークスペースを更新
   */
  const updateWorkspace = async (id: string, data: WorkspaceUpdateRequest): Promise<WorkspaceResponse> => {
    updating.value = true
    
    try {
      const result = await workspace.updateWorkspace(id, data)
      toast.success(t('foundation.messages.success.updated'))
      return result
    } catch (error) {
      console.error('Failed to update workspace:', error)
      toast.error(t('foundation.messages.error.default'))
      throw error
    } finally {
      updating.value = false
    }
  }

  /**
   * ワークスペースを削除
   */
  const deleteWorkspace = async (id: string): Promise<void> => {
    deleting.value = true
    
    try {
      await workspace.deleteWorkspace(id)
      toast.success(t('foundation.messages.success.deleted'))
    } catch (error) {
      console.error('Failed to delete workspace:', error)
      toast.error(t('foundation.messages.error.default'))
      throw error
    } finally {
      deleting.value = false
    }
  }

  /**
   * ワークスペースを複製
   */
  const duplicateWorkspace = async (sourceWorkspace: WorkspaceResponse): Promise<WorkspaceResponse> => {
    duplicating.value = true
    
    try {
      const data: WorkspaceCreateRequest = {
        name: `${sourceWorkspace.name || 'Workspace'} (Copy)`,
        description: sourceWorkspace.description,
        settings: sourceWorkspace.settings
      }
      
      const result = await workspace.createWorkspace(data)
      toast.success(t('foundation.messages.success.copied'))
      return result
    } catch (error) {
      console.error('Failed to duplicate workspace:', error)
      toast.error(t('foundation.messages.error.copyFailed'))
      throw error
    } finally {
      duplicating.value = false
    }
  }

  /**
   * エラーハンドリング付きの安全な実行
   */
  const safeExecute = async <T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      return await operation()
    } catch (error) {
      console.error('Workspace operation failed:', error)
      toast.error(errorMessage || t('foundation.messages.error.default'))
      return null
    }
  }

  /**
   * バリデーション付きの作成
   */
  const createWithValidation = async (
    data: WorkspaceCreateRequest,
    onSuccess?: (workspace: WorkspaceResponse) => void,
    onError?: (error: unknown) => void
  ): Promise<WorkspaceResponse | null> => {
    try {
      // 基本バリデーション
      if (!data.name?.trim()) {
        toast.error(t('foundation.messages.validation.required', { field: t('foundation.common.fields.name') }))
        return null
      }

      const result = await createWorkspace(data)
      onSuccess?.(result)
      return result
    } catch (error) {
      onError?.(error)
      return null
    }
  }

  /**
   * バリデーション付きの更新
   */
  const updateWithValidation = async (
    id: string,
    data: WorkspaceUpdateRequest,
    onSuccess?: (workspace: WorkspaceResponse) => void,
    onError?: (error: unknown) => void
  ): Promise<WorkspaceResponse | null> => {
    try {
      // 基本バリデーション
      if (!data.name?.trim()) {
        toast.error(t('foundation.messages.validation.required', { field: t('foundation.common.fields.name') }))
        return null
      }

      const result = await updateWorkspace(id, data)
      onSuccess?.(result)
      return result
    } catch (error) {
      onError?.(error)
      return null
    }
  }

  /**
   * 確認付きの削除
   */
  const deleteWithConfirmation = async (
    id: string,
    workspaceName: string,
    onSuccess?: () => void,
    onError?: (error: unknown) => void
  ): Promise<boolean> => {
    try {
      await deleteWorkspace(id)
      onSuccess?.()
      return true
    } catch (error) {
      onError?.(error)
      return false
    }
  }

  return {
    // Loading states
    creating: readonly(creating),
    updating: readonly(updating),
    deleting: readonly(deleting),
    duplicating: readonly(duplicating),

    // Basic operations
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    duplicateWorkspace,

    // Enhanced operations with validation
    createWithValidation,
    updateWithValidation,
    deleteWithConfirmation,
    safeExecute
  }
}