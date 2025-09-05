/**
 * ワークスペース操作のComposable
 * Repository層を活用した実装
 */

import { useWorkspaceRepository } from '~/modules/workspace/repositories'
import type {
  WorkspaceResponse,
  WorkspaceCreateRequest,
  WorkspaceUpdateRequest,
  WorkspaceListParams,
  WorkspaceInviteRequest
} from '~/modules/workspace/types'

export const useWorkspace = () => {
  // Repository取得（Mock/Real自動切り替え）
  const repository = useWorkspaceRepository()
  
  // ワークスペース操作
  const listWorkspaces = (params?: WorkspaceListParams) => repository.listWorkspaces(params)
  const getWorkspace = (id: string) => repository.getWorkspace(id)
  const createWorkspace = (data: WorkspaceCreateRequest) => repository.createWorkspace(data)
  const updateWorkspace = (id: string, data: WorkspaceUpdateRequest) => repository.updateWorkspace(id, data)
  const deleteWorkspace = (id: string) => repository.deleteWorkspace(id)
  
  // メンバー管理
  const listMembers = (workspaceId: string) => repository.listMembers(workspaceId)
  const inviteMember = (workspaceId: string, data: WorkspaceInviteRequest) => repository.inviteMember(workspaceId, data)
  const removeMember = (workspaceId: string, memberId: string) => repository.removeMember(workspaceId, memberId)
  const updateMemberRole = (workspaceId: string, memberId: string, role: string) => repository.updateMemberRole(workspaceId, memberId, role)
  
  // 現在のワークスペース管理
  const getCurrentWorkspace = () => repository.getCurrentWorkspace()
  const setCurrentWorkspace = (id: string) => repository.setCurrentWorkspace(id)
  
  return {
    // ワークスペース操作
    listWorkspaces,
    getWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    
    // メンバー管理
    listMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
    
    // 現在のワークスペース
    getCurrentWorkspace,
    setCurrentWorkspace
  }
}

/**
 * リアクティブな現在のワークスペース管理
 * グローバルな状態管理
 */
export const useCurrentWorkspace = () => {
  const workspace = useWorkspace()
  
  // 現在のワークスペース（リアクティブ）
  const currentWorkspace = useState<WorkspaceResponse | null>('currentWorkspace', () => null)
  const loading = useState('currentWorkspaceLoading', () => false)
  const error = useState<Error | null>('currentWorkspaceError', () => null)
  
  // 初期化
  const initialize = async () => {
    if (currentWorkspace.value) return // 既に初期化済み
    
    loading.value = true
    error.value = null
    
    try {
      const ws = await workspace.getCurrentWorkspace()
      currentWorkspace.value = ws
    } catch (e) {
      error.value = e as Error
      console.error('[useCurrentWorkspace] Failed to initialize:', e)
    } finally {
      loading.value = false
    }
  }
  
  // ワークスペース切り替え
  const switchWorkspace = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      await workspace.setCurrentWorkspace(id)
      const ws = await workspace.getWorkspace(id)
      currentWorkspace.value = ws
      
      // ページをリロードして新しいワークスペースのコンテキストで開始
      await navigateTo('/')
    } catch (e) {
      error.value = e as Error
      console.error('[useCurrentWorkspace] Failed to switch workspace:', e)
      throw e
    } finally {
      loading.value = false
    }
  }
  
  // 現在のワークスペース更新
  const updateCurrentWorkspace = async (data: WorkspaceUpdateRequest) => {
    if (!currentWorkspace.value) {
      throw new Error('No current workspace')
    }
    
    loading.value = true
    error.value = null
    
    try {
      const updated = await workspace.updateWorkspace(currentWorkspace.value.id, data)
      currentWorkspace.value = updated
      return updated
    } catch (e) {
      error.value = e as Error
      console.error('[useCurrentWorkspace] Failed to update:', e)
      throw e
    } finally {
      loading.value = false
    }
  }
  
  // 自動初期化
  onMounted(() => {
    initialize()
  })
  
  return {
    currentWorkspace: readonly(currentWorkspace),
    loading: readonly(loading),
    error: readonly(error),
    initialize,
    switchWorkspace,
    updateCurrentWorkspace
  }
}

/**
 * ワークスペース一覧のリアクティブ管理
 * useFetchを使用したSSR対応実装
 */
export const useWorkspaceList = (params?: MaybeRef<WorkspaceListParams>) => {
  const queryParams = toRef(params)
  
  const { 
    data: workspaces, 
    pending,
    refresh,
    error 
  } = useAsyncData(
    'workspaceList',
    async () => {
      const workspace = useWorkspace()
      const response = await workspace.listWorkspaces(queryParams.value)
      return response
    },
    {
      watch: [queryParams]
    }
  )
  
  return {
    workspaces: computed(() => workspaces.value?.workspaces || []),
    totalCount: computed(() => workspaces.value?.totalCount || 0),
    pending,
    error,
    refresh
  }
}