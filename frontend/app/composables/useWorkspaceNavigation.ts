/**
 * 現在のワークスペース状態を管理するVueUse Global State
 * テーブル詳細ページとナビゲーション間での情報共有に使用
 */

import { createGlobalState, useStorage } from '@vueuse/core'

export const useWorkspaceNavigation = createGlobalState(() => {
  // localStorage に永続化されるワークスペースID
  const workspaceId = useStorage('astar-current-workspace-id', '')
  
  // テーブル情報（オプション、デバッグ用）
  const tableInfo = ref<{
    id?: string
    name?: string
    workspaceId?: string
  }>({})
  
  /**
   * 現在のワークスペースIDを設定
   */
  const setWorkspaceId = (id: string) => {
    workspaceId.value = id
  }
  
  /**
   * テーブル情報を設定（workspaceIdも更新）
   */
  const setTableInfo = (info: { id: string; name?: string; workspaceId: string }) => {
    tableInfo.value = info
    if (info.workspaceId) {
      setWorkspaceId(info.workspaceId)
    }
  }
  
  /**
   * 状態をクリア
   */
  const clear = () => {
    workspaceId.value = ''
    tableInfo.value = {}
  }
  
  return {
    // State
    workspaceId: readonly(workspaceId),
    tableInfo: readonly(tableInfo),
    
    // Actions
    setWorkspaceId,
    setTableInfo,
    clear
  }
})