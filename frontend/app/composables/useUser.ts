/**
 * ユーザー操作のComposable
 * Repository層を活用した実装
 */

import { useUserRepository } from '~/modules/user/repositories'
import type {
  UserCreateRequest,
  UserUpdateRequest,
  UserListParams,
  UserRoleAssignmentRequest,
  CurrentUser,
  RoleResponse,
  UserPermissionsResponse,
  UserProfile,
  UserPreferences
} from '~/modules/user/types'

export const useUser = () => {
  // Repository取得（Mock/Real自動切り替え）
  const repository = useUserRepository()
  
  // Current User Operations
  const getCurrentUser = () => repository.getCurrentUser()
  const getMyRoles = () => repository.getMyRoles()
  const getMyPermissions = () => repository.getMyPermissions()
  const updateMyProfile = (data: Partial<UserProfile>) => repository.updateMyProfile(data)
  const updateMyPreferences = (preferences: UserPreferences) => repository.updateMyPreferences(preferences)
  
  // User CRUD Operations
  const listUsers = (params?: UserListParams) => repository.listUsers(params)
  const getUser = (userId: string) => repository.getUser(userId)
  const createUser = (data: UserCreateRequest) => repository.createUser(data)
  const updateUser = (userId: string, data: UserUpdateRequest) => repository.updateUser(userId, data)
  const deleteUser = (userId: string) => repository.deleteUser(userId)
  
  // User Role Management
  const getUserRoles = (userId: string) => repository.getUserRoles(userId)
  const assignUserRoles = (userId: string, data: UserRoleAssignmentRequest) => repository.assignUserRoles(userId, data)
  const removeUserRole = (userId: string, roleId: string) => repository.removeUserRole(userId, roleId)
  
  // User Search & Filter
  const searchUsers = (query: string) => repository.searchUsers(query)
  const getUsersByRole = (roleId: string) => repository.getUsersByRole(roleId)
  const getUsersByStatus = (status: 'active' | 'inactive' | 'suspended') => repository.getUsersByStatus(status)
  
  return {
    // Current User
    getCurrentUser,
    getMyRoles,
    getMyPermissions,
    updateMyProfile,
    updateMyPreferences,
    
    // User CRUD
    listUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    
    // Role Management
    getUserRoles,
    assignUserRoles,
    removeUserRole,
    
    // Search & Filter
    searchUsers,
    getUsersByRole,
    getUsersByStatus
  }
}

/**
 * リアクティブな現在のユーザー管理
 * グローバルな状態管理とAuth連携
 */
export const useCurrentUser = () => {
  const user = useUser()
  const { data: session } = useAuth()
  
  // 現在のユーザー（リアクティブ）
  const currentUser = useState<CurrentUser | null>('currentUser', () => null)
  const roles = useState<RoleResponse[]>('currentUserRoles', () => [])
  const permissions = useState<UserPermissionsResponse | null>('currentUserPermissions', () => null)
  const loading = useState('currentUserLoading', () => false)
  const error = useState<Error | null>('currentUserError', () => null)
  
  // 初期化
  const initialize = async (force = false) => {
    if (currentUser.value && !force) return // 既に初期化済み
    
    loading.value = true
    error.value = null
    
    try {
      // セッションがある場合のみユーザー情報を取得
      if (session.value?.user) {
        const [userData, userRoles, userPermissions] = await Promise.all([
          user.getCurrentUser(),
          user.getMyRoles(),
          user.getMyPermissions()
        ])
        
        currentUser.value = userData
        roles.value = userRoles
        permissions.value = userPermissions
      }
    } catch (e) {
      error.value = e as Error
      console.error('[useCurrentUser] Failed to initialize:', e)
    } finally {
      loading.value = false
    }
  }
  
  // 権限チェック関数
  const hasRole = (roleName: string): boolean => {
    return roles.value.some(role => role.name === roleName)
  }
  
  const hasAllRoles = (roleNames: string[]): boolean => {
    if (roleNames.length === 0) return true
    return roleNames.every(name => hasRole(name))
  }
  
  const hasAnyRole = (roleNames: string[]): boolean => {
    if (roleNames.length === 0) return false
    return roleNames.some(name => hasRole(name))
  }
  
  const hasPermission = (permission: string): boolean => {
    if (!permissions.value) return false
    // Check for wildcard permission
    if (permissions.value.effectivePermissions.includes('*')) return true
    return permissions.value.effectivePermissions.includes(permission)
  }
  
  const hasAllPermissions = (perms: string[]): boolean => {
    if (perms.length === 0) return true
    return perms.every(perm => hasPermission(perm))
  }
  
  const hasAnyPermission = (perms: string[]): boolean => {
    if (perms.length === 0) return false
    return perms.some(perm => hasPermission(perm))
  }
  
  // プロフィール更新
  const updateProfile = async (data: Partial<UserProfile>) => {
    loading.value = true
    error.value = null
    
    try {
      const updated = await user.updateMyProfile(data)
      // 現在のユーザー情報を再取得
      await initialize()
      return updated
    } catch (e) {
      error.value = e as Error
      console.error('[useCurrentUser] Failed to update profile:', e)
      throw e
    } finally {
      loading.value = false
    }
  }
  
  // 設定更新
  const updatePreferences = async (prefs: UserPreferences) => {
    loading.value = true
    error.value = null
    
    try {
      const updated = await user.updateMyPreferences(prefs)
      // プロフィール内の設定を更新
      if (currentUser.value) {
        // Preferences would be part of the user profile
        await initialize()
      }
      return updated
    } catch (e) {
      error.value = e as Error
      console.error('[useCurrentUser] Failed to update preferences:', e)
      throw e
    } finally {
      loading.value = false
    }
  }
  
  // Auth状態変更の監視
  watch(session, (newSession) => {
    if (newSession?.user) {
      initialize()
    } else {
      // ログアウト時はクリア
      currentUser.value = null
      roles.value = []
      permissions.value = null
    }
  })
  
  // 自動初期化
  onMounted(() => {
    if (session.value?.user) {
      initialize()
    }
  })
  
  return {
    // State
    currentUser: readonly(currentUser),
    roles: readonly(roles),
    permissions: readonly(permissions),
    loading: readonly(loading),
    error: readonly(error),
    
    // Role checking
    hasRole,
    hasAllRoles,
    hasAnyRole,
    
    // Permission checking
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    
    // Actions
    updateProfile,
    updatePreferences,
    refresh: initialize
  }
}

/**
 * ユーザー一覧のリアクティブ管理
 * useFetchを使用したSSR対応実装
 */
export const useUserList = (params?: MaybeRef<UserListParams>) => {
  const queryParams = toRef(params)
  const userApi = useUser()
  
  const { 
    data: response, 
    pending,
    refresh,
    error 
  } = useAsyncData(
    'userList',
    async () => {
      return await userApi.listUsers(queryParams.value)
    },
    {
      watch: [queryParams]
    }
  )
  
  return {
    users: computed(() => response.value?.users || []),
    totalCount: computed(() => response.value?.totalCount || 0),
    pending,
    error,
    refresh
  }
}

/**
 * 特定ユーザーのリアクティブ管理
 */
export const useUserData = (userId: MaybeRef<string>) => {
  const id = toRef(userId)
  const userApi = useUser()
  
  // ユーザー情報の取得
  const { 
    data: user, 
    pending: userPending, 
    refresh: refreshUser,
    error: userError 
  } = useAsyncData(
    `user:${id.value}`,
    async () => {
      return await userApi.getUser(id.value)
    },
    {
      watch: [id]
    }
  )
  
  // ユーザーのロール取得
  const { 
    data: roles, 
    pending: rolesPending, 
    refresh: refreshRoles,
    error: rolesError
  } = useAsyncData(
    `user:${id.value}:roles`,
    async () => {
      return await userApi.getUserRoles(id.value)
    },
    {
      watch: [id]
    }
  )
  
  // データのリフレッシュ
  const refresh = async () => {
    await Promise.all([
      refreshUser(),
      refreshRoles()
    ])
  }
  
  return {
    user: readonly(user),
    roles: readonly(roles),
    pending: computed(() => userPending.value || rolesPending.value),
    error: computed(() => userError.value || rolesError.value),
    refresh
  }
}