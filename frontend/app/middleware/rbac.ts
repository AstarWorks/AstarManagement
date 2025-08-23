/**
 * RBAC（Role-Based Access Control）ミドルウェア
 * 
 * 特定の権限やロールが必要なページで使用
 * nuxt-authの認証機能を使用
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
    // 認証状態の確認は不要（globalAppMiddlewareが処理）
    const userProfile = typeof useUserProfile !== 'undefined' ? useUserProfile() : { profile: ref(null), hasPermission: () => false, hasRole: () => false }
    const { profile, hasPermission, hasRole } = userProfile
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

    // 権限チェック（認証チェックはglobalAppMiddlewareが処理）
    const hasRequiredPermissions = checkPermissions({ hasPermission }, permissions, require)
    const hasRequiredRoles = checkRoles({ hasRole }, roles, require)

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
        user: profile.value?.email,
        requiredPermissions: permissions,
        requiredRoles: roles,
        userPermissions: profile.value?.permissions,
        userRoles: profile.value?.roles?.map((r) => r.name),
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
function checkPermissions(auth: { hasPermission: (p: string) => boolean }, permissions: string[], require: 'all' | 'any'): boolean {
  if (permissions.length === 0) return true

  if (require === 'all') {
    return permissions.every(permission => auth.hasPermission(permission))
  } else {
    return permissions.some(permission => auth.hasPermission(permission))
  }
}

/**
 * ロールチェック関数
 */
function checkRoles(auth: { hasRole: (r: string) => boolean }, roles: string[], require: 'all' | 'any'): boolean {
  if (roles.length === 0) return true

  if (require === 'all') {
    return roles.every(role => auth.hasRole(role))
  } else {
    return roles.some(role => auth.hasRole(role))
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
 * システム管理権限チェック（プロフェッショナルまたは管理者）
 */
export const canManageSystem = createRBACMiddleware({
  roles: ['PROFESSIONAL', 'ADMIN'],
  require: 'any',
  redirectTo: '/unauthorized'
})