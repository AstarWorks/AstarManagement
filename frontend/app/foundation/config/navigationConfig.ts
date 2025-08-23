/**
 * ナビゲーション設定
 * Simple over Easy: 設定ベースでナビゲーション構造を外部化
 */

import type {INavigationItemConfig} from '~/foundation/types/navigation'

// Re-export for backward compatibility
export type {INavigationItemConfig as NavigationItemConfig} from '~/foundation/types/navigation'

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
        labelKey: 'modules.navigation.dashboard',
        path: '/dashboard',
        icon: 'lucide:layout-dashboard',
        descriptionKey: 'dashboard.subtitle'
    },
    {
        id: 'matters',
        labelKey: 'modules.navigation.menu.matters.title',
        path: '/cases',
        icon: 'lucide:file-text',
        descriptionKey: 'modules.matter.title',
        requiredRoles: ['LAWYER', 'CLERK'],
        requireAny: true,
        children: [
            {
                id: 'matters-list',
                labelKey: 'modules.navigation.menu.matters.list',
                path: '/cases',
                icon: 'lucide:list'
            },
            {
                id: 'matters-kanban',
                labelKey: 'modules.navigation.menu.matters.kanban',
                path: '/cases/kanban',
                icon: 'lucide:kanban-square'
            },
            {
                id: 'matters-create',
                labelKey: 'modules.navigation.menu.matters.create',
                path: '/cases/create',
                icon: 'lucide:plus'
            }
        ]
    },
    {
        id: 'clients',
        labelKey: 'modules.navigation.menu.clients.title',
        path: '/clients',
        icon: 'lucide:users',
        descriptionKey: 'client.title',
        children: [
            {
                id: 'clients-list',
                labelKey: 'modules.navigation.menu.clients.list',
                path: '/clients',
                icon: 'lucide:list'
            },
            {
                id: 'clients-create',
                labelKey: 'modules.navigation.menu.clients.create',
                path: '/clients/create',
                icon: 'lucide:user-plus'
            }
        ]
    },
    {
        id: 'documents',
        labelKey: 'modules.navigation.menu.documents.title',
        path: '/documents',
        icon: 'lucide:folder-open',
        descriptionKey: 'document.title',
        children: [
            {
                id: 'documents-list',
                labelKey: 'modules.navigation.menu.documents.list',
                path: '/documents',
                icon: 'lucide:list'
            },
            {
                id: 'documents-upload',
                labelKey: 'modules.navigation.menu.documents.upload',
                path: '/documents/upload',
                icon: 'lucide:upload'
            }
        ]
    },
    {
        id: 'finance',
        labelKey: 'modules.navigation.menu.finance.title',
        path: '/finance',
        icon: 'lucide:calculator',
        descriptionKey: 'finance.title',
        requiredRoles: ['LAWYER', 'CLERK'],
        requireAny: true,
        children: [
            {
                id: 'finance-dashboard',
                labelKey: 'modules.navigation.menu.finance.dashboard',
                path: '/finance',
                icon: 'lucide:bar-chart-3'
            },
            {
                id: 'finance-expenses',
                labelKey: 'modules.navigation.menu.finance.expenses',
                path: '/expenses',
                icon: 'lucide:receipt-text',
                badge: {
                    textKey: 'expense.domain.navigation.badge',
                    variant: 'default'
                }
            },
            {
                id: 'finance-billing',
                labelKey: 'modules.navigation.menu.finance.billing',
                path: '/finance/billing',
                icon: 'lucide:receipt'
            }
        ]
    },
    {
        id: 'settings',
        labelKey: 'modules.navigation.settings',
        path: '/settings',
        icon: 'lucide:settings',
        descriptionKey: 'settings.title'
    }
]

/**
 * クイックアクション設定
 */
export interface IQuickActionConfig {
    id: string
    labelKey: string
    path: string
    icon: string
    variant: 'default' | 'outline' | 'secondary' | 'destructive'
    permission?: string
}

export const QUICK_ACTIONS_CONFIG: IQuickActionConfig[] = [
    {
        id: 'new-expense',
        labelKey: 'expense.domain.actions.create',
        path: '/expenses/new',
        icon: 'lucide:plus-circle',
        variant: 'default',
        permission: 'expense:create'
    },
    {
        id: 'import-expenses',
        labelKey: 'expense.domain.actions.import',
        path: '/expenses/import',
        icon: 'lucide:upload',
        variant: 'outline',
        permission: 'expense:import'
    }
]

/**
 * 管理者ナビゲーション設定
 */
export const ADMIN_NAVIGATION_CONFIG: INavigationItemConfig[] = [
    {
        id: 'admin-dashboard',
        labelKey: 'modules.navigation.menu.admin.dashboard',
        path: '/admin',
        icon: 'lucide:shield',
        descriptionKey: 'admin.dashboard.title',
        requiredRoles: ['admin']
    },
    {
        id: 'user-management',
        labelKey: 'modules.navigation.menu.admin.users',
        path: '/admin/users',
        icon: 'lucide:users',
        descriptionKey: 'admin.users.title',
        requiredRoles: ['admin']
    },
    {
        id: 'firm-settings',
        labelKey: 'modules.navigation.menu.admin.settings',
        path: '/admin/settings',
        icon: 'lucide:settings',
        descriptionKey: 'admin.settings.title',
        requiredRoles: ['admin']
    },
    {
        id: 'audit-logs',
        labelKey: 'modules.navigation.menu.admin.audit',
        path: '/admin/audit',
        icon: 'lucide:file-search',
        descriptionKey: 'admin.audit.title',
        requiredRoles: ['admin']
    }
]