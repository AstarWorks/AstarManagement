/**
 * ナビゲーション関連のユーティリティ関数
 * Simple over Easy: 権限チェックロジックを分離
 */

import type { NavigationItemConfig as INavigationItemConfig } from '~/config/navigationConfig'
import type { INavigationItem, IBreadcrumbItem } from '~/types/navigation'
import type { IUser } from '~/types/auth'
import { usePermissions } from '~/composables/usePermissions'

/**
 * 設定からナビゲーション項目を生成（i18n適用）
 */
export function createNavigationItems(
  config: INavigationItemConfig[], 
  t: (key: string) => string
): INavigationItem[] {
  return config.map(item => ({
    id: item.id,
    label: t(item.labelKey),
    path: item.path,
    icon: item.icon,
    description: item.descriptionKey ? t(item.descriptionKey) : undefined,
    requiredPermissions: item.requiredPermissions,
    requiredRoles: item.requiredRoles,
    requireAny: item.requireAny,
    children: item.children ? createNavigationItems(item.children, t) : undefined,
    badge: item.badge ? {
      text: t(item.badge.textKey),
      variant: item.badge.variant
    } : undefined,
    isExternal: item.isExternal,
    target: item.target
  }))
}

/**
 * ユーザーの権限に基づいてナビゲーション項目をフィルタリング
 * Simple over Easy: usePermissions composableに権限チェックを委譲
 */
export function filterNavigationItems(
  items: INavigationItem[], 
  user: IUser | null
): INavigationItem[] {
  const { filterByAccess } = usePermissions()
  
  // 再帰的に子要素もフィルタリング
  const filteredItems = filterByAccess(items, user)
  return filteredItems.map(item => ({
    ...item,
    children: item.children ? filterNavigationItems(item.children, user) : undefined
  }))
}

/**
 * パスに基づいてアクティブなナビゲーション項目を見つける
 */
export function findActiveNavigationItem(
  items: INavigationItem[], 
  currentPath: string
): INavigationItem | null {
  for (const item of items) {
    if (item.path === currentPath) {
      return item
    }
    
    if (item.children) {
      const activeChild = findActiveNavigationItem(item.children, currentPath)
      if (activeChild) return activeChild
    }
    
    // 部分一致チェック（子パスの場合）
    if (item.path !== '/' && currentPath.startsWith(item.path)) {
      return item
    }
  }
  
  return null
}

/**
 * パンくずリストを生成
 */
export function generateBreadcrumbs(
  items: INavigationItem[], 
  currentPath: string,
  t: (key: string) => string
): IBreadcrumbItem[] {
  const breadcrumbs: IBreadcrumbItem[] = []
  
  // ホームを追加
  breadcrumbs.push({ label: t('navigation.home'), path: '/dashboard' })
  
  const activeItem = findActiveNavigationItem(items, currentPath)
  if (activeItem && activeItem.path !== '/dashboard') {
    // 親項目があれば追加
    const parentItem = findParentNavigationItem(items, activeItem.id)
    if (parentItem) {
      breadcrumbs.push({ label: parentItem.label, path: parentItem.path })
    }
    
    // 現在のページを追加
    breadcrumbs.push({ label: activeItem.label })
  }
  
  return breadcrumbs
}

/**
 * 親ナビゲーション項目を見つける
 */
function findParentNavigationItem(
  items: INavigationItem[], 
  childId: string
): INavigationItem | null {
  for (const item of items) {
    if (item.children?.some(child => child.id === childId)) {
      return item
    }
    
    if (item.children) {
      const parent = findParentNavigationItem(item.children, childId)
      if (parent) return parent
    }
  }
  
  return null
}