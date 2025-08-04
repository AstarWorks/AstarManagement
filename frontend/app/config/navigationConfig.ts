/**
 * ナビゲーション設定
 * Simple over Easy: 設定ベースでナビゲーション構造を外部化
 */

import type { INavigationItemConfig } from '~/types/navigation'

// Re-export for backward compatibility
export type { INavigationItemConfig as NavigationItemConfig } from '~/types/navigation'

/*
  id: string
  labelKey: string // i18nキー
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
} */

/**
 * メインナビゲーション設定
 */
export const MAIN_NAVIGATION_CONFIG: INavigationItemConfig[] = [
  {
    id: 'dashboard',
    labelKey: 'navigation.dashboard',
    path: '/dashboard',
    icon: 'lucide:layout-dashboard',
    descriptionKey: 'dashboard.subtitle'
  },
  {
    id: 'matters',
    labelKey: 'navigation.menu.matters.title',
    path: '/cases',
    icon: 'lucide:file-text',
    descriptionKey: 'matter.title',
    requiredRoles: ['LAWYER', 'CLERK'],
    requireAny: true,
    children: [
      {
        id: 'matters-list',
        labelKey: 'navigation.menu.matters.list',
        path: '/cases',
        icon: 'lucide:list'
      },
      {
        id: 'matters-kanban',
        labelKey: 'navigation.menu.matters.kanban',
        path: '/cases/kanban',
        icon: 'lucide:kanban-square'
      },
      {
        id: 'matters-create',
        labelKey: 'navigation.menu.matters.create',
        path: '/cases/create',
        icon: 'lucide:plus'
      }
    ]
  },
  {
    id: 'clients',
    labelKey: 'navigation.menu.clients.title',
    path: '/clients',
    icon: 'lucide:users',
    descriptionKey: 'client.title',
    children: [
      {
        id: 'clients-list',
        labelKey: 'navigation.menu.clients.list',
        path: '/clients',
        icon: 'lucide:list'
      },
      {
        id: 'clients-create',
        labelKey: 'navigation.menu.clients.create',
        path: '/clients/create',
        icon: 'lucide:user-plus'
      }
    ]
  },
  {
    id: 'documents',
    labelKey: 'navigation.menu.documents.title',
    path: '/documents',
    icon: 'lucide:folder-open',
    descriptionKey: 'document.title',
    children: [
      {
        id: 'documents-list',
        labelKey: 'navigation.menu.documents.list',
        path: '/documents',
        icon: 'lucide:list'
      },
      {
        id: 'documents-upload',
        labelKey: 'navigation.menu.documents.upload',
        path: '/documents/upload',
        icon: 'lucide:upload'
      }
    ]
  },
  {
    id: 'finance',
    labelKey: 'navigation.menu.finance.title',
    path: '/finance',
    icon: 'lucide:calculator',
    descriptionKey: 'finance.title',
    requiredRoles: ['LAWYER', 'CLERK'],
    requireAny: true,
    children: [
      {
        id: 'finance-dashboard',
        labelKey: 'navigation.menu.finance.dashboard',
        path: '/finance',
        icon: 'lucide:bar-chart-3'
      },
      {
        id: 'finance-expenses',
        labelKey: 'navigation.menu.finance.expenses',
        path: '/expenses',
        icon: 'lucide:receipt-text'
      },
      {
        id: 'finance-billing',
        labelKey: 'navigation.menu.finance.billing',
        path: '/finance/billing',
        icon: 'lucide:receipt'
      }
    ]
  },
  {
    id: 'settings',
    labelKey: 'navigation.settings',
    path: '/settings',
    icon: 'lucide:settings',
    descriptionKey: 'settings.title'
  }
]

/**
 * 管理者ナビゲーション設定
 */
export const ADMIN_NAVIGATION_CONFIG: INavigationItemConfig[] = [
  {
    id: 'admin-dashboard',
    labelKey: 'navigation.menu.admin.dashboard',
    path: '/admin',
    icon: 'lucide:shield',
    descriptionKey: 'admin.dashboard.title',
    requiredRoles: ['admin']
  },
  {
    id: 'user-management',
    labelKey: 'navigation.menu.admin.users',
    path: '/admin/users',
    icon: 'lucide:users',
    descriptionKey: 'admin.users.title',
    requiredRoles: ['admin']
  },
  {
    id: 'firm-settings',
    labelKey: 'navigation.menu.admin.settings',
    path: '/admin/settings',
    icon: 'lucide:settings',
    descriptionKey: 'admin.settings.title',
    requiredRoles: ['admin']
  },
  {
    id: 'audit-logs',
    labelKey: 'navigation.menu.admin.audit',
    path: '/admin/audit',
    icon: 'lucide:file-search',
    descriptionKey: 'admin.audit.title',
    requiredRoles: ['admin']
  }
]