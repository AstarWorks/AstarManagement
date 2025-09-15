# 認証機能 - State Management

## Composables

### useAuth
メイン認証Composable

```typescript
// composables/useAuth.ts
export function useAuth() {
  const user = useState<User | null>('auth.user', () => null)
  const workspace = useState<Workspace | null>('auth.workspace', () => null)
  const token = useCookie('auth-token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
  
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => 
    user.value?.roles?.includes('ADMIN') ?? false
  )
  
  // ログイン
  async function login(credentials: LoginCredentials) {
    try {
      const response = await $fetch('/api/v1/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      user.value = response.user
      workspace.value = response.workspace
      token.value = response.accessToken
      
      // リフレッシュトークンをセキュアCookieに保存
      const refreshToken = useCookie('refresh-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
      refreshToken.value = response.refreshToken
      
      return response
    } catch (error) {
      throw new Error(error.data?.message || 'Login failed')
    }
  }
  
  // ログアウト
  async function logout() {
    try {
      await $fetch('/api/v1/auth/logout', {
        method: 'POST'
      })
    } finally {
      user.value = null
      workspace.value = null
      token.value = null
      
      await navigateTo('/auth/login')
    }
  }
  
  // トークンリフレッシュ
  async function refreshToken() {
    const refreshToken = useCookie('refresh-token')
    if (!refreshToken.value) {
      throw new Error('No refresh token')
    }
    
    try {
      const response = await $fetch('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken: refreshToken.value }
      })
      
      token.value = response.accessToken
      refreshToken.value = response.refreshToken
      
      return response
    } catch (error) {
      // リフレッシュ失敗時はログアウト
      await logout()
      throw error
    }
  }
  
  // 現在のユーザー取得
  async function fetchCurrentUser() {
    if (!token.value) return null
    
    try {
      const response = await $fetch('/api/v1/auth/me')
      user.value = response
      return response
    } catch (error) {
      if (error.statusCode === 401) {
        // トークン期限切れの場合はリフレッシュ
        await refreshToken()
        return fetchCurrentUser()
      }
      throw error
    }
  }
  
  // 権限チェック
  function hasPermission(permission: string): boolean {
    return user.value?.permissions?.includes(permission) ?? false
  }
  
  function hasRole(role: string): boolean {
    return user.value?.roles?.includes(role) ?? false
  }
  
  function hasAnyRole(roles: string[]): boolean {
    return roles.some(role => hasRole(role))
  }
  
  function hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => hasPermission(permission))
  }
  
  return {
    user: readonly(user),
    workspace: readonly(workspace),
    isAuthenticated: readonly(isAuthenticated),
    isAdmin: readonly(isAdmin),
    login,
    logout,
    refreshToken,
    fetchCurrentUser,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions
  }
}
```

### useSession
セッション管理Composable

```typescript
// composables/useSession.ts
export function useSession() {
  const { user, refreshToken, logout } = useAuth()
  const lastActivity = ref(Date.now())
  const sessionTimeout = ref(30 * 60 * 1000) // 30分
  const warningTime = ref(5 * 60 * 1000) // 5分前に警告
  
  let activityTimer: NodeJS.Timeout | null = null
  let warningTimer: NodeJS.Timeout | null = null
  
  // アクティビティ追跡
  function trackActivity() {
    lastActivity.value = Date.now()
    resetTimers()
  }
  
  // タイマーリセット
  function resetTimers() {
    if (activityTimer) clearTimeout(activityTimer)
    if (warningTimer) clearTimeout(warningTimer)
    
    // 警告タイマー設定
    warningTimer = setTimeout(() => {
      showSessionWarning()
    }, sessionTimeout.value - warningTime.value)
    
    // セッションタイムアウトタイマー設定
    activityTimer = setTimeout(() => {
      handleSessionTimeout()
    }, sessionTimeout.value)
  }
  
  // セッション警告表示
  function showSessionWarning() {
    const { open } = useDialog()
    
    open({
      title: 'セッションタイムアウト警告',
      description: 'まもなくセッションがタイムアウトします。続行しますか？',
      actions: [
        {
          label: '続行',
          action: async () => {
            await extendSession()
          }
        },
        {
          label: 'ログアウト',
          variant: 'destructive',
          action: async () => {
            await logout()
          }
        }
      ]
    })
  }
  
  // セッションタイムアウト処理
  async function handleSessionTimeout() {
    await logout()
    const { toast } = useToast()
    toast({
      title: 'セッションタイムアウト',
      description: 'セッションがタイムアウトしました。再度ログインしてください。',
      variant: 'warning'
    })
  }
  
  // セッション延長
  async function extendSession() {
    try {
      await refreshToken()
      trackActivity()
      
      const { toast } = useToast()
      toast({
        title: 'セッション延長',
        description: 'セッションが延長されました。',
        variant: 'success'
      })
    } catch (error) {
      await logout()
    }
  }
  
  // イベントリスナー設定
  onMounted(() => {
    if (user.value) {
      resetTimers()
      
      // アクティビティイベント監視
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
      events.forEach(event => {
        window.addEventListener(event, trackActivity)
      })
    }
  })
  
  onUnmounted(() => {
    if (activityTimer) clearTimeout(activityTimer)
    if (warningTimer) clearTimeout(warningTimer)
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.removeEventListener(event, trackActivity)
    })
  })
  
  return {
    lastActivity: readonly(lastActivity),
    sessionTimeout: readonly(sessionTimeout),
    trackActivity,
    extendSession
  }
}
```

### usePermissions
権限管理Composable

```typescript
// composables/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth()
  
  // 権限定義
  const permissions = {
    // ワークスペース権限
    WORKSPACE_READ: 'workspace:read',
    WORKSPACE_WRITE: 'workspace:write',
    WORKSPACE_DELETE: 'workspace:delete',
    
    // ユーザー管理権限
    USER_READ: 'user:read',
    USER_WRITE: 'user:write',
    USER_DELETE: 'user:delete',
    
    // ロール管理権限
    ROLE_READ: 'role:read',
    ROLE_WRITE: 'role:write',
    ROLE_DELETE: 'role:delete',
    
    // テーブル権限
    TABLE_READ: 'table:read',
    TABLE_WRITE: 'table:write',
    TABLE_DELETE: 'table:delete',
    
    // ドキュメント権限
    DOCUMENT_READ: 'document:read',
    DOCUMENT_WRITE: 'document:write',
    DOCUMENT_DELETE: 'document:delete'
  }
  
  // 権限チェック関数
  function can(permission: string): boolean {
    return user.value?.permissions?.includes(permission) ?? false
  }
  
  function cannot(permission: string): boolean {
    return !can(permission)
  }
  
  function canAny(permissions: string[]): boolean {
    return permissions.some(p => can(p))
  }
  
  function canAll(permissions: string[]): boolean {
    return permissions.every(p => can(p))
  }
  
  // リソース別権限チェック
  function canManageWorkspace(): boolean {
    return can(permissions.WORKSPACE_WRITE)
  }
  
  function canManageUsers(): boolean {
    return can(permissions.USER_WRITE)
  }
  
  function canManageRoles(): boolean {
    return can(permissions.ROLE_WRITE)
  }
  
  function canManageTables(): boolean {
    return can(permissions.TABLE_WRITE)
  }
  
  function canManageDocuments(): boolean {
    return can(permissions.DOCUMENT_WRITE)
  }
  
  return {
    permissions: readonly(permissions),
    can,
    cannot,
    canAny,
    canAll,
    canManageWorkspace,
    canManageUsers,
    canManageRoles,
    canManageTables,
    canManageDocuments
  }
}
```

## 型定義

```typescript
// types/auth.d.ts
export interface User {
  id: string
  email: string
  name: string
  roles: string[]
  permissions: string[]
  avatar?: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  description?: string
  industry?: string
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  name: string
  workspaceName?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
  workspace: Workspace
}

export interface SetupData {
  admin: {
    email: string
    password: string
    name: string
  }
  workspace: {
    name: string
    description?: string
    industry?: string
  }
}
```