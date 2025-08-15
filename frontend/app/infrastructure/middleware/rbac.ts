/**
 * RBAC（Role-Based Access Control）ミドルウェア
 * 
 * 特定の権限やロールが必要なページで使用
 */

interface IRBACOptions {
  permissions?: string[]
  roles?: string[]
  require?: 'all' | 'any' // 'all': すべての権限/ロールが必要, 'any': いずれかの権限/ロールがあればOK
  redirectTo?: string
}

/**
 * 権限チェック用のミドルウェアファクトリ
 */
export const createRBACMiddleware = (options: IRBACOptions) => {
  return defineNuxtRouteMiddleware((to, _from) => {
    const authStore = useAuthStore()
    const {
      permissions = [],
      roles = [],
      require = 'any',
      redirectTo = '/unauthorized'
    } = options

    // サーバーサイドでは権限チェックをスキップ
    if (import.meta.server) {
      return
    }

    // 認証チェック（認証されていない場合は auth ミドルウェアに委ねる）
    if (!authStore.isAuthenticated) {
      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath,
          reason: 'unauthenticated'
        }
      })
    }

    // 権限チェック
    const hasRequiredPermissions = checkPermissions(authStore, permissions, require)
    const hasRequiredRoles = checkRoles(authStore, roles, require)

    // 権限・ロールチェックの結果を評価
    let hasAccess = true

    if (permissions.length > 0 && roles.length > 0) {
      // 権限とロール両方が指定されている場合
      if (require === 'all') {
        hasAccess = hasRequiredPermissions && hasRequiredRoles
      } else {
        hasAccess = hasRequiredPermissions || hasRequiredRoles
      }
    } else if (permissions.length > 0) {
      // 権限のみ指定されている場合
      hasAccess = hasRequiredPermissions
    } else if (roles.length > 0) {
      // ロールのみ指定されている場合
      hasAccess = hasRequiredRoles
    }

    // アクセス拒否の場合
    if (!hasAccess) {
      // アクセス拒否をログに記録
      console.warn('Access denied:', {
        user: authStore.user?.email,
        requiredPermissions: permissions,
        requiredRoles: roles,
        userPermissions: authStore.permissions,
        userRoles: authStore.roles,
        path: to.fullPath
      })

      return navigateTo({
        path: redirectTo,
        query: {
          reason: 'insufficient_permissions',
          required: JSON.stringify({ permissions, roles }),
          path: to.fullPath
        }
      })
    }

    // アクセス許可
  })
}

/**
 * 権限チェック関数
 */
function checkPermissions(authStore: ReturnType<typeof useAuthStore>, permissions: string[], require: 'all' | 'any'): boolean {
  if (permissions.length === 0) return true

  if (require === 'all') {
    return permissions.every(permission => authStore.hasPermission(permission))
  } else {
    return permissions.some(permission => authStore.hasPermission(permission))
  }
}

/**
 * ロールチェック関数
 */
function checkRoles(authStore: ReturnType<typeof useAuthStore>, roles: string[], require: 'all' | 'any'): boolean {
  if (roles.length === 0) return true

  if (require === 'all') {
    return roles.every(role => authStore.hasRole(role))
  } else {
    return roles.some(role => authStore.hasRole(role))
  }
}

// 一般的な権限チェック用のプリセットミドルウェア

/**
 * 弁護士専用ミドルウェア
 */
export const lawyerOnly = createRBACMiddleware({
  roles: ['LAWYER'],
  redirectTo: '/unauthorized'
})

/**
 * 管理者専用ミドルウェア
 */
export const adminOnly = createRBACMiddleware({
  roles: ['ADMIN'],
  redirectTo: '/unauthorized'
})

/**
 * 案件読み取り権限チェック
 */
export const canReadMatters = createRBACMiddleware({
  permissions: ['MATTER_READ'],
  redirectTo: '/unauthorized'
})

/**
 * 案件編集権限チェック
 */
export const canWriteMatters = createRBACMiddleware({
  permissions: ['MATTER_WRITE'],
  redirectTo: '/unauthorized'
})

/**
 * 顧客管理権限チェック
 */
export const canManageClients = createRBACMiddleware({
  permissions: ['CLIENT_READ', 'CLIENT_WRITE'],
  require: 'any',
  redirectTo: '/unauthorized'
})

/**
 * 財務管理権限チェック
 */
export const canManageFinance = createRBACMiddleware({
  permissions: ['FINANCE_READ', 'FINANCE_WRITE'],
  require: 'any',
  redirectTo: '/unauthorized'
})

/**
 * システム管理権限チェック（弁護士または管理者）
 */
export const canManageSystem = createRBACMiddleware({
  roles: ['LAWYER', 'ADMIN'],
  require: 'any',
  redirectTo: '/unauthorized'
})