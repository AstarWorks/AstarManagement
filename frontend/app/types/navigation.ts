/**
 * ナビゲーション関連の型定義
 * Single Source of Truth: 全ナビゲーション型をここに集約
 */

/**
 * ナビゲーション項目（表示用）
 */
export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: string
  description?: string
  requiredPermissions?: string[]
  requiredRoles?: string[]
  requireAny?: boolean
  children?: NavigationItem[]
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
export interface NavigationItemConfig {
  id: string
  labelKey: string
  path: string
  icon: string
  descriptionKey?: string
  requiredPermissions?: string[]
  requiredRoles?: string[]
  requireAny?: boolean
  children?: NavigationItemConfig[]
  badge?: {
    textKey: string
    variant: 'default' | 'destructive' | 'outline' | 'secondary'
  }
  isExternal?: boolean
  target?: '_blank' | '_self'
}

/**
 * パンくずリスト項目
 */
export interface BreadcrumbItem {
  label: string
  path?: string
}

/**
 * 最近訪問したページ
 */
export interface RecentlyVisitedItem {
  label: string
  path: string
  visitedAt?: Date
}

/**
 * ナビゲーション状態
 */
export interface NavigationState {
  currentNavigationId: string | null
  isNavigationLoading: boolean
}