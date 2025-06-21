/**
 * Navigation Type Definitions
 * 
 * @description Core types for the navigation system including menu items,
 * route configuration, and navigation state management.
 */

export interface NavItem {
  id: string
  label: string
  icon?: string
  path?: string
  children?: NavItem[]
  permissions?: string[]
  badge?: {
    value: string | number
    variant: 'default' | 'danger' | 'warning'
  }
  external?: boolean
  exact?: boolean
  meta?: Record<string, any>
}

export interface BreadcrumbItem {
  label: string
  path?: string
  icon?: string
  current?: boolean
}

export interface NavigationState {
  expandedMenuIds: Set<string>
  mobileMenuOpen: boolean
  bottomSheetOpen: boolean
  navigationHistory: string[]
  breadcrumbs: BreadcrumbItem[]
}

export interface RouteMetaData {
  title?: string
  requiresAuth?: boolean
  permissions?: string[]
  breadcrumb?: string | ((route: any) => string)
  layout?: string
  transition?: string
}