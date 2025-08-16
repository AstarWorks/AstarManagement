/**
 * ナビゲーション関連の型定義
 * Single Source of Truth: 全ナビゲーション型をここに集約
 */

// LocaleKey type - should be a union of all i18n keys
type LocaleKey = string

/**
 * ナビゲーション項目（表示用）
 */
export interface INavigationItem {
  id: string
  label: string
  path: string
  icon: string
  description?: string
  requiredPermissions?: string[]
  requiredRoles?: string[]
  requireAny?: boolean
  children?: INavigationItem[]
  badge?: {
    text: string
    variant: 'default' | 'destructive' | 'outline' | 'secondary'
  }
  isExternal?: boolean
  target?: '_blank' | '_self'
}

/**
 * ナビゲーション設定（config用）
 */
export interface INavigationItemConfig {
  id: string
  labelKey: LocaleKey
  path: string
  icon: string
  descriptionKey?: LocaleKey
  requiredPermissions?: string[]
  requiredRoles?: string[]
  requireAny?: boolean
  children?: INavigationItemConfig[]
  badge?: {
    textKey: LocaleKey
    variant: 'default' | 'destructive' | 'outline' | 'secondary'
  }
  isExternal?: boolean
  target?: '_blank' | '_self'
}

/**
 * パンくずリスト項目
 */
export interface IBreadcrumbItem {
  label: string
  to?: string
  href?: string
  path?: string
}

/**
 * 最近訪問したページ
 */
export interface IRecentlyVisitedItem {
  label: string
  path: string
  visitedAt?: Date
}

/**
 * ナビゲーション状態
 */
export interface INavigationState {
  currentNavigationId: string | null
  isNavigationLoading: boolean
}

// Type aliases for backward compatibility
export type NavigationItem = INavigationItem
export type NavigationItemConfig = INavigationItemConfig
export type BreadcrumbItem = IBreadcrumbItem
export type RecentlyVisitedItem = IRecentlyVisitedItem
export type NavigationState = INavigationState