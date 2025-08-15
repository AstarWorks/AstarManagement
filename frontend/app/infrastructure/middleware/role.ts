/**
 * ロール専用ミドルウェア
 * 
 * 特定のロールを持つユーザーのみアクセス可能なページで使用
 * より単純なロールベースアクセス制御を提供
 */

/**
 * ロールチェック用のミドルウェアファクトリ
 */
export const requireRole = (allowedRoles: string | string[], redirectTo = '/unauthorized') => {
  return defineNuxtRouteMiddleware((to, _from) => {
    const authStore = useAuthStore()

    // サーバーサイドではロールチェックをスキップ
    if (import.meta.server) {
      return
    }

    // 認証チェック
    if (!authStore.isAuthenticated) {
      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath,
          reason: 'unauthenticated'
        }
      })
    }

    // 許可されたロールの配列化
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

    // ロールチェック
    const hasRequiredRole = roles.some(role => authStore.hasRole(role))

    if (!hasRequiredRole) {
      // アクセス拒否をログに記録
      console.warn('Role-based access denied:', {
        user: authStore.user?.email,
        requiredRoles: roles,
        userRoles: authStore.roles,
        path: to.fullPath
      })

      return navigateTo({
        path: redirectTo,
        query: {
          reason: 'insufficient_role',
          required: roles.join(','),
          path: to.fullPath
        }
      })
    }

    // アクセス許可
  })
}

// 一般的なロール用のプリセットミドルウェア

/**
 * 弁護士専用アクセス
 */
export const lawyerOnly = requireRole('LAWYER')

/**
 * 事務員専用アクセス
 */
export const clerkOnly = requireRole('CLERK')

/**
 * 管理者専用アクセス
 */
export const adminOnly = requireRole('ADMIN')

/**
 * スタッフアクセス（弁護士または事務員）
 */
export const staffOnly = requireRole(['LAWYER', 'CLERK'])

/**
 * 高権限アクセス（弁護士または管理者）
 */
export const highPrivilegeOnly = requireRole(['LAWYER', 'ADMIN'])

/**
 * システム管理者専用アクセス
 */
export const systemAdminOnly = requireRole('SYSTEM_ADMIN')

/**
 * 財務担当専用アクセス
 */
export const financeOnly = requireRole(['LAWYER', 'FINANCE_MANAGER'])

/**
 * パートナー弁護士専用アクセス
 */
export const partnerOnly = requireRole('PARTNER_LAWYER')

/**
 * 複数ロールチェック用のヘルパー関数
 */
export const requireAnyRole = (roles: string[]) => requireRole(roles)
export const requireAllRoles = (roles: string[]) => {
  return defineNuxtRouteMiddleware((to, _from) => {
    const authStore = useAuthStore()

    // サーバーサイドではロールチェックをスキップ
    if (import.meta.server) {
      return
    }

    // 認証チェック
    if (!authStore.isAuthenticated) {
      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath,
          reason: 'unauthenticated'
        }
      })
    }

    // すべてのロールが必要
    const hasAllRoles = roles.every(role => authStore.hasRole(role))

    if (!hasAllRoles) {
      console.warn('All roles required access denied:', {
        user: authStore.user?.email,
        requiredRoles: roles,
        userRoles: authStore.roles,
        path: to.fullPath
      })

      return navigateTo({
        path: '/unauthorized',
        query: {
          reason: 'insufficient_roles_all',
          required: roles.join(','),
          path: to.fullPath
        }
      })
    }
  })
}

/**
 * 条件付きロールチェック
 */
export const requireRoleIf = (
  condition: () => boolean,
  roles: string | string[],
  redirectTo = '/unauthorized'
) => {
  return defineNuxtRouteMiddleware((to, from) => {
    // 条件が満たされない場合はスキップ
    if (!condition()) {
      return
    }

    // 条件が満たされる場合は通常のロールチェック
    return requireRole(roles, redirectTo)(to, from)
  })
}

/**
 * 時間ベースのロールチェック（営業時間内のみアクセス可能など）
 */
export const requireRoleDuringBusinessHours = (
  roles: string | string[],
  businessHours = { start: 9, end: 18 }
) => {
  return defineNuxtRouteMiddleware((to, from) => {
    const currentHour = new Date().getHours()
    const isDuringBusinessHours = currentHour >= businessHours.start && currentHour < businessHours.end

    if (!isDuringBusinessHours) {
      return navigateTo({
        path: '/after-hours',
        query: {
          path: to.fullPath,
          reason: 'outside_business_hours'
        }
      })
    }

    return requireRole(roles)(to, from)
  })
}