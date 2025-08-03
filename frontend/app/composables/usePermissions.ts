/**
 * Unified Permissions Composable
 * Simple over Easy: 権限チェックロジックを一元化
 */

import type { IUser } from '~/types/auth'

export interface IPermissionCheckOptions {
  permissions?: string[]
  roles?: string[]
  requireAny?: boolean // true: OR条件, false: AND条件
}

/**
 * 権限管理のためのコンポーザブル
 */
export const usePermissions = () => {
  /**
   * ユーザーが指定された権限を持っているかチェック
   */
  const hasPermission = (user: IUser | null, permission: string): boolean => {
    if (!user) return false
    return user.permissions.includes(permission)
  }

  /**
   * ユーザーが指定されたロールを持っているかチェック
   */
  const hasRole = (user: IUser | null, role: string): boolean => {
    if (!user) return false
    return user.roles.some(r => r.name === role)
  }

  /**
   * 複合的な権限チェック（permissions + roles）
   */
  const hasAccess = (user: IUser | null, options: IPermissionCheckOptions): boolean => {
    if (!user) return false

    const { permissions = [], roles = [], requireAny = false } = options

    // 権限チェック
    const permissionResults = permissions.map(p => hasPermission(user, p))
    const roleResults = roles.map(r => hasRole(user, r))
    const allResults = [...permissionResults, ...roleResults]

    if (allResults.length === 0) return true // 制限なし

    return requireAny 
      ? allResults.some(result => result) // OR条件
      : allResults.every(result => result) // AND条件
  }

  /**
   * 権限に基づいて配列をフィルタリング
   */
  const filterByAccess = <T extends { requiredPermissions?: string[], requiredRoles?: string[], requireAny?: boolean }>(
    items: T[],
    user: IUser | null
  ): T[] => {
    if (!user) return []

    return items.filter(item => 
      hasAccess(user, {
        permissions: item.requiredPermissions,
        roles: item.requiredRoles,
        requireAny: item.requireAny
      })
    )
  }

  return {
    hasPermission,
    hasRole,
    hasAccess,
    filterByAccess
  }
}

export default usePermissions