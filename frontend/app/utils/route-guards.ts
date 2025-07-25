/**
 * ルートガード関連のユーティリティ関数
 */

import type { RouteLocationNormalized } from 'vue-router'
import type { IUser } from '~/types/auth'

/**
 * ページアクセス権限の設定
 */
export interface IPagePermissions {
  requiresAuth?: boolean
  allowedRoles?: string[]
  requiredPermissions?: string[]
  requireAll?: boolean // true: すべての権限が必要, false: いずれかの権限があればOK
  guestOnly?: boolean
  redirectTo?: string
}

/**
 * ページ別のアクセス権限設定
 */
export const PAGE_PERMISSIONS: Record<string, IPagePermissions> = {
  // 認証関連ページ
  '/login': {
    guestOnly: true,
    redirectTo: '/dashboard'
  },
  '/register': {
    guestOnly: true,
    redirectTo: '/dashboard'
  },
  '/auth/two-factor': {
    requiresAuth: true,
    redirectTo: '/login'
  },

  // ダッシュボード
  '/dashboard': {
    requiresAuth: true,
    redirectTo: '/login'
  },

  // 案件管理
  '/matters': {
    requiresAuth: true,
    requiredPermissions: ['MATTER_READ'],
    redirectTo: '/unauthorized'
  },
  '/matters/create': {
    requiresAuth: true,
    requiredPermissions: ['MATTER_WRITE'],
    redirectTo: '/unauthorized'
  },
  '/matters/[id]': {
    requiresAuth: true,
    requiredPermissions: ['MATTER_READ'],
    redirectTo: '/unauthorized'
  },
  '/matters/[id]/edit': {
    requiresAuth: true,
    requiredPermissions: ['MATTER_WRITE'],
    redirectTo: '/unauthorized'
  },

  // 顧客管理
  '/clients': {
    requiresAuth: true,
    requiredPermissions: ['CLIENT_READ'],
    redirectTo: '/unauthorized'
  },
  '/clients/create': {
    requiresAuth: true,
    requiredPermissions: ['CLIENT_WRITE'],
    redirectTo: '/unauthorized'
  },

  // 文書管理
  '/documents': {
    requiresAuth: true,
    requiredPermissions: ['DOCUMENT_READ'],
    redirectTo: '/unauthorized'
  },
  '/documents/create': {
    requiresAuth: true,
    requiredPermissions: ['DOCUMENT_WRITE'],
    redirectTo: '/unauthorized'
  },

  // 財務管理
  '/finance': {
    requiresAuth: true,
    allowedRoles: ['LAWYER', 'FINANCE_MANAGER'],
    redirectTo: '/unauthorized'
  },
  '/finance/expenses': {
    requiresAuth: true,
    requiredPermissions: ['EXPENSE_READ'],
    redirectTo: '/unauthorized'
  },
  '/finance/billing': {
    requiresAuth: true,
    allowedRoles: ['LAWYER'],
    redirectTo: '/unauthorized'
  },

  // システム管理
  '/admin': {
    requiresAuth: true,
    allowedRoles: ['ADMIN', 'SYSTEM_ADMIN'],
    redirectTo: '/unauthorized'
  },
  '/admin/users': {
    requiresAuth: true,
    allowedRoles: ['ADMIN'],
    redirectTo: '/unauthorized'
  },

  // 設定
  '/settings': {
    requiresAuth: true,
    redirectTo: '/login'
  },
  '/settings/profile': {
    requiresAuth: true,
    redirectTo: '/login'
  },
  '/settings/security': {
    requiresAuth: true,
    redirectTo: '/login'
  },
  '/settings/system': {
    requiresAuth: true,
    allowedRoles: ['LAWYER', 'ADMIN'],
    redirectTo: '/unauthorized'
  }
}

/**
 * 指定されたルートに対するアクセス権限をチェック
 */
export function checkRouteAccess(
  route: RouteLocationNormalized | string,
  user: IUser | null,
  permissions: string[] = [],
  roles: string[] = []
): {
  hasAccess: boolean
  reason?: string
  redirectTo?: string
} {
  const path = typeof route === 'string' ? route : route.path
  const pagePermissions = getPagePermissions(path)

  // ページに特別な権限設定がない場合はアクセス許可
  if (!pagePermissions) {
    return { hasAccess: true }
  }

  // ゲスト専用ページのチェック
  if (pagePermissions.guestOnly && user) {
    return {
      hasAccess: false,
      reason: 'already_authenticated',
      redirectTo: pagePermissions.redirectTo || '/dashboard'
    }
  }

  // 認証必須ページのチェック
  if (pagePermissions.requiresAuth && !user) {
    return {
      hasAccess: false,
      reason: 'unauthenticated',
      redirectTo: pagePermissions.redirectTo || '/login'
    }
  }

  // 認証されていない場合はここで終了
  if (!user) {
    return { hasAccess: true }
  }

  // ロールベースのアクセス制御
  if (pagePermissions.allowedRoles && pagePermissions.allowedRoles.length > 0) {
    const hasRequiredRole = pagePermissions.allowedRoles.some(role => roles.includes(role))
    if (!hasRequiredRole) {
      return {
        hasAccess: false,
        reason: 'insufficient_role',
        redirectTo: pagePermissions.redirectTo || '/unauthorized'
      }
    }
  }

  // 権限ベースのアクセス制御
  if (pagePermissions.requiredPermissions && pagePermissions.requiredPermissions.length > 0) {
    const hasRequiredPermissions = pagePermissions.requireAll
      ? pagePermissions.requiredPermissions.every(permission => permissions.includes(permission))
      : pagePermissions.requiredPermissions.some(permission => permissions.includes(permission))

    if (!hasRequiredPermissions) {
      return {
        hasAccess: false,
        reason: 'insufficient_permissions',
        redirectTo: pagePermissions.redirectTo || '/unauthorized'
      }
    }
  }

  return { hasAccess: true }
}

/**
 * パスにマッチするページ権限設定を取得
 */
function getPagePermissions(path: string): IPagePermissions | null {
  // 完全一致
  if (PAGE_PERMISSIONS[path]) {
    return PAGE_PERMISSIONS[path]
  }

  // パターンマッチング（動的ルート対応）
  for (const [pattern, permissions] of Object.entries(PAGE_PERMISSIONS)) {
    if (pattern.includes('[') && matchDynamicRoute(pattern, path)) {
      return permissions
    }
  }

  return null
}

/**
 * 動的ルートパターンとパスのマッチング
 */
function matchDynamicRoute(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/')
  const pathParts = path.split('/')

  if (patternParts.length !== pathParts.length) {
    return false
  }

  return patternParts.every((patternPart, index) => {
    if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
      // 動的セグメント
      return pathParts[index] !== undefined && pathParts[index] !== ''
    } else {
      // 静的セグメント
      return patternPart === pathParts[index]
    }
  })
}

/**
 * ナビゲーション可能かチェック
 */
export function canNavigateToRoute(
  path: string,
  authStore: unknown
): boolean {
  const { hasAccess } = checkRouteAccess(
    path,
    authStore.user,
    authStore.permissions,
    authStore.roles
  )
  return hasAccess
}

/**
 * メニュー項目のフィルタリング
 */
export function filterMenuItems(
  menuItems: Array<{ path: string; [key: string]: unknown }>,
  authStore: unknown
): Array<{ path: string; [key: string]: unknown }> {
  return menuItems.filter(item => canNavigateToRoute(item.path, authStore))
}

/**
 * 権限に基づくリダイレクト先の決定
 */
export function getRedirectPath(
  user: IUser | null,
  roles: string[] = []
): string {
  if (!user) {
    return '/login'
  }

  // ロールに基づくデフォルトページの決定
  if (roles.includes('ADMIN') || roles.includes('SYSTEM_ADMIN')) {
    return '/admin/dashboard'
  } else if (roles.includes('LAWYER')) {
    return '/dashboard'
  } else if (roles.includes('CLERK')) {
    return '/matters'
  } else if (roles.includes('FINANCE_MANAGER')) {
    return '/finance'
  }

  // デフォルト
  return '/dashboard'
}

/**
 * エラーメッセージの取得
 */
export function getAccessDeniedMessage(reason: string): string {
  const messages: Record<string, string> = {
    unauthenticated: 'このページにアクセスするにはログインが必要です。',
    insufficient_role: 'このページにアクセスする権限がありません。',
    insufficient_permissions: 'この操作を実行する権限がありません。',
    already_authenticated: '既にログインしています。',
    session_expired: 'セッションの有効期限が切れました。再度ログインしてください。',
    two_factor_required: '2要素認証が必要です。',
    account_disabled: 'アカウントが無効になっています。管理者にお問い合わせください。',
    maintenance_mode: 'システムメンテナンス中です。しばらくお待ちください。'
  }

  return messages[reason] || 'アクセスが拒否されました。'
}