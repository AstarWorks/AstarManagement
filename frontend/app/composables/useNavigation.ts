/**
 * useNavigation Composable
 * 業界標準パターンでシンプルなナビゲーション管理
 */

import { useWorkspaceNavigation } from '~/composables/useWorkspaceNavigation'

interface NavigationItem {
  id: string
  name: string
  href: string
  icon: string
  badge?: string
  requiredRoles?: string[]
}

export const useNavigation = () => {
  const { t } = useI18n()
  const { workspaceId } = useWorkspaceNavigation()
  const { profile, hasRole } = useUserProfile()

  // メインナビゲーション（リアクティブに生成）
  const navigation = computed((): NavigationItem[] => [
    {
      id: 'dashboard',
      name: t('modules.navigation.dashboard'),
      href: '/dashboard',
      icon: 'lucide:layout-dashboard'
    },
    {
      id: 'workspaces',
      name: t('modules.navigation.workspaces'),
      href: '/workspaces',
      icon: 'lucide:folder'
    },
    {
      id: 'tables',
      name: t('modules.navigation.tables'),
      href: workspaceId.value 
        ? `/workspaces/${workspaceId.value}?tab=tables` 
        : '/workspaces',
      icon: 'lucide:table'
    },
    {
      id: 'matters',
      name: t('modules.navigation.menu.matters.title'),
      href: '/cases',
      icon: 'lucide:file-text',
      requiredRoles: ['LAWYER', 'CLERK']
    },
    {
      id: 'clients',
      name: t('modules.navigation.menu.clients.title'),
      href: '/clients',
      icon: 'lucide:users'
    },
    {
      id: 'documents',
      name: t('modules.navigation.menu.documents.title'),
      href: '/documents',
      icon: 'lucide:folder-open'
    },
    {
      id: 'finance',
      name: t('modules.navigation.menu.finance.title'),
      href: '/finance',
      icon: 'lucide:calculator',
      requiredRoles: ['LAWYER', 'CLERK']
    },
    {
      id: 'settings',
      name: t('modules.navigation.settings'),
      href: '/settings',
      icon: 'lucide:settings'
    }
  ])

  // 権限フィルタリング
  const filteredNavigation = computed(() => {
    if (!profile.value) {
      // ログインしていない場合は権限不要なもののみ
      return navigation.value.filter(item => !item.requiredRoles?.length)
    }

    // 権限チェック
    return navigation.value.filter(item => {
      if (!item.requiredRoles?.length) return true
      return item.requiredRoles.some(role => hasRole(role))
    })
  })

  // 管理者ナビゲーション
  const adminNavigation = computed((): NavigationItem[] => {
    if (!hasRole('admin')) return []
    
    return [
      {
        id: 'admin-dashboard',
        name: t('modules.navigation.menu.admin.dashboard'),
        href: '/admin',
        icon: 'lucide:shield'
      },
      {
        id: 'user-management',
        name: t('modules.navigation.menu.admin.users'),
        href: '/admin/users',
        icon: 'lucide:users'
      },
      {
        id: 'firm-settings',
        name: t('modules.navigation.menu.admin.settings'),
        href: '/admin/settings',
        icon: 'lucide:settings'
      }
    ]
  })

  return {
    navigation: filteredNavigation,
    adminNavigation,
    allNavigation: navigation
  }
}