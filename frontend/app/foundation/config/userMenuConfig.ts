/**
 * ユーザーメニューの設定
 * Simple over Easy: 設定ベースでメニューを動的生成
 */

export interface IMenuItemConfig {
    id: string
    labelKey: string
    icon: string
    path?: string
    action?: string
    external?: boolean
    requiredRoles?: string[]
}

export interface IMenuSectionConfig {
    id: string
    items: IMenuItemConfig[]
}

/**
 * ベースメニュー設定
 * 全ユーザー共通のメニュー項目
 */
export const BASE_MENU_SECTIONS: IMenuSectionConfig[] = [
    {
        id: 'account',
        items: [
            {
                id: 'profile',
                labelKey: 'modules.navigation.profile',
                icon: 'lucide:user',
                path: '/profile'
            },
            {
                id: 'settings',
                labelKey: 'modules.navigation.settings',
                icon: 'lucide:settings',
                path: '/settings'
            },
            {
                id: 'notifications',
                labelKey: 'notification.title',
                icon: 'lucide:bell',
                path: '/notifications'
            }
        ]
    },
    {
        id: 'quick-actions',
        items: [
            {
                id: 'new-case',
                labelKey: 'modules.matter.create.title',
                icon: 'lucide:plus-circle',
                path: '/cases/new'
            },
            {
                id: 'calendar',
                labelKey: 'modules.navigation.calendar',
                icon: 'lucide:calendar',
                path: '/calendar'
            }
        ]
    },
    {
        id: 'support',
        items: [
            {
                id: 'help',
                labelKey: 'modules.navigation.help',
                icon: 'lucide:help-circle',
                path: '/help'
            },
            {
                id: 'feedback',
                labelKey: 'modules.navigation.feedback',
                icon: 'lucide:message-square',
                path: '/feedback'
            }
        ]
    },
    {
        id: 'session',
        items: [
            {
                id: 'logout',
                labelKey: 'modules.navigation.logout',
                icon: 'lucide:log-out',
                action: 'logout'
            }
        ]
    }
]

/**
 * 管理者専用メニュー設定
 */
export const ADMIN_MENU_SECTION: IMenuSectionConfig = {
    id: 'admin',
    items: [
        {
            id: 'admin-panel',
            labelKey: 'modules.admin.title',
            icon: 'lucide:shield',
            path: '/admin',
            requiredRoles: ['admin']
        },
        {
            id: 'user-management',
            labelKey: 'modules.admin.users.title',
            icon: 'lucide:users',
            path: '/admin/users',
            requiredRoles: ['admin']
        }
    ]
}