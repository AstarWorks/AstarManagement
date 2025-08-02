/**
 * ユーザーメニューの設定
 * Simple over Easy: 設定ベースでメニューを動的生成
 */

export interface MenuItemConfig {
  id: string
  labelKey: string // i18nキー
  icon: string
  path?: string
  action?: string
  external?: boolean
  requiredRoles?: string[]
}

export interface MenuSectionConfig {
  id: string
  items: MenuItemConfig[]
}

/**
 * ベースメニュー設定
 * 全ユーザー共通のメニュー項目
 */
export const BASE_MENU_SECTIONS: MenuSectionConfig[] = [
  {
    id: 'account',
    items: [
      {
        id: 'profile',
        labelKey: 'navigation.profile',
        icon: 'lucide:user',
        path: '/profile'
      },
      {
        id: 'settings',
        labelKey: 'navigation.settings',
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
        labelKey: 'matter.create.title',
        icon: 'lucide:plus-circle',
        path: '/cases/new'
      },
      {
        id: 'calendar',
        labelKey: 'navigation.calendar',
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
        labelKey: 'navigation.help',
        icon: 'lucide:help-circle',
        path: '/help'
      },
      {
        id: 'feedback',
        labelKey: 'navigation.feedback',
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
        labelKey: 'navigation.logout',
        icon: 'lucide:log-out',
        action: 'logout'
      }
    ]
  }
]

/**
 * 管理者専用メニュー設定
 */
export const ADMIN_MENU_SECTION: MenuSectionConfig = {
  id: 'admin',
  items: [
    {
      id: 'admin-panel',
      labelKey: 'admin.title',
      icon: 'lucide:shield',
      path: '/admin',
      requiredRoles: ['admin']
    },
    {
      id: 'user-management',
      labelKey: 'admin.users.title',
      icon: 'lucide:users',
      path: '/admin/users',
      requiredRoles: ['admin']
    }
  ]
}