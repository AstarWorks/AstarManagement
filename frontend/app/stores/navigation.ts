import { defineStore } from 'pinia'

export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: string
  description?: string
  requiredPermissions?: string[]
  requiredRoles?: string[]
  requireAny?: boolean // true: いずれかの権限があればOK, false: すべての権限が必要
  children?: NavigationItem[]
  badge?: {
    text: string
    variant: 'default' | 'destructive' | 'outline' | 'secondary'
  }
  isExternal?: boolean
  target?: '_blank' | '_self'
}

export interface NavigationState {
  isSidebarOpen: boolean
  isMobileMenuOpen: boolean
  currentPath: string
  breadcrumbs: Array<{ label: string; path?: string }>
  recentlyVisited: Array<{ label: string; path: string; timestamp: number }>
}

export const useNavigationStore = defineStore('navigation', {
  state: (): NavigationState => ({
    isSidebarOpen: true,
    isMobileMenuOpen: false,
    currentPath: '',
    breadcrumbs: [],
    recentlyVisited: [],
  }),

  getters: {
    /**
     * メインナビゲーションメニュー
     */
    mainNavigationItems: (state): NavigationItem[] => {
      const { $t } = useNuxtApp()
      
      return [
        {
          id: 'dashboard',
          label: $t('navigation.dashboard'),
          path: '/dashboard',
          icon: 'lucide:layout-dashboard',
          description: $t('dashboard.subtitle')
        },
        {
          id: 'matters',
          label: $t('navigation.matters'),
          path: '/matters',
          icon: 'lucide:briefcase',
          description: $t('matter.title'),
          requiredPermissions: ['MATTER_READ'],
          children: [
            {
              id: 'matters-list',
              label: $t('navigation.menu.matters.list'),
              path: '/matters',
              icon: 'lucide:list',
              requiredPermissions: ['MATTER_READ']
            },
            {
              id: 'matters-create',
              label: $t('navigation.menu.matters.create'),
              path: '/matters/create',
              icon: 'lucide:plus',
              requiredPermissions: ['MATTER_WRITE']
            },
            {
              id: 'matters-kanban',
              label: $t('navigation.menu.matters.kanban'),
              path: '/matters/kanban',
              icon: 'lucide:kanban-square',
              requiredPermissions: ['MATTER_READ']
            }
          ]
        },
        {
          id: 'clients',
          label: $t('navigation.clients'),
          path: '/clients',
          icon: 'lucide:users',
          description: $t('client.title'),
          requiredPermissions: ['CLIENT_READ'],
          children: [
            {
              id: 'clients-list',
              label: $t('navigation.menu.clients.list'),
              path: '/clients',
              icon: 'lucide:list',
              requiredPermissions: ['CLIENT_READ']
            },
            {
              id: 'clients-create',
              label: $t('navigation.menu.clients.create'),
              path: '/clients/create',
              icon: 'lucide:user-plus',
              requiredPermissions: ['CLIENT_WRITE']
            }
          ]
        },
        {
          id: 'documents',
          label: $t('navigation.documents'),
          path: '/documents',
          icon: 'lucide:file-text',
          description: $t('document.title'),
          requiredPermissions: ['DOCUMENT_READ'],
          children: [
            {
              id: 'documents-list',
              label: $t('navigation.menu.documents.list'),
              path: '/documents',
              icon: 'lucide:list',
              requiredPermissions: ['DOCUMENT_READ']
            },
            {
              id: 'documents-create',
              label: $t('navigation.menu.documents.create'),
              path: '/documents/create',
              icon: 'lucide:file-plus',
              requiredPermissions: ['DOCUMENT_WRITE']
            },
            {
              id: 'documents-templates',
              label: $t('navigation.menu.documents.templates'),
              path: '/documents/templates',
              icon: 'lucide:layout-template',
              requiredPermissions: ['DOCUMENT_READ']
            }
          ]
        },
        {
          id: 'finance',
          label: $t('navigation.finance'),
          path: '/finance',
          icon: 'lucide:calculator',
          description: $t('finance.title'),
          requiredRoles: ['LAWYER', 'FINANCE_MANAGER'],
          requireAny: true,
          children: [
            {
              id: 'finance-dashboard',
              label: $t('navigation.menu.finance.dashboard'),
              path: '/finance',
              icon: 'lucide:bar-chart-3',
              requiredRoles: ['LAWYER', 'FINANCE_MANAGER'],
              requireAny: true
            },
            {
              id: 'finance-expenses',
              label: $t('navigation.menu.finance.expenses'),
              path: '/finance/expenses',
              icon: 'lucide:receipt',
              requiredPermissions: ['EXPENSE_READ']
            },
            {
              id: 'finance-billing',
              label: $t('navigation.menu.finance.billing'),
              path: '/finance/billing',
              icon: 'lucide:credit-card',
              requiredRoles: ['LAWYER']
            },
            {
              id: 'finance-reports',
              label: $t('navigation.menu.finance.reports'),
              path: '/finance/reports',
              icon: 'lucide:file-bar-chart',
              requiredRoles: ['LAWYER', 'FINANCE_MANAGER'],
              requireAny: true
            }
          ]
        }
      ]
    },

    /**
     * システム管理メニュー
     */
    adminNavigationItems: (state): NavigationItem[] => {
      const { $t } = useNuxtApp()
      
      return [
        {
          id: 'admin',
          label: $t('navigation.admin'),
          path: '/admin',
          icon: 'lucide:settings',
          description: $t('admin.title'),
          requiredRoles: ['ADMIN', 'SYSTEM_ADMIN'],
          requireAny: true,
          children: [
            {
              id: 'admin-users',
              label: $t('navigation.menu.admin.users'),
              path: '/admin/users',
              icon: 'lucide:user-cog',
              requiredRoles: ['ADMIN']
            },
            {
              id: 'admin-roles',
              label: $t('navigation.menu.admin.roles'),
              path: '/admin/roles',
              icon: 'lucide:shield',
              requiredRoles: ['ADMIN']
            },
            {
              id: 'admin-audit',
              label: $t('navigation.menu.admin.audit'),
              path: '/admin/audit',
              icon: 'lucide:file-search',
              requiredRoles: ['ADMIN', 'SYSTEM_ADMIN'],
              requireAny: true
            },
            {
              id: 'admin-system',
              label: $t('navigation.menu.admin.system'),
              path: '/admin/system',
              icon: 'lucide:server',
              requiredRoles: ['SYSTEM_ADMIN']
            }
          ]
        }
      ]
    },

    /**
     * ユーザーメニュー
     */
    userMenuItems: (state): NavigationItem[] => {
      const { $t } = useNuxtApp()
      
      return [
        {
          id: 'profile',
          label: $t('navigation.profile'),
          path: '/settings/profile',
          icon: 'lucide:user'
        },
        {
          id: 'settings',
          label: $t('navigation.settings'),
          path: '/settings',
          icon: 'lucide:settings'
        },
        {
          id: 'help',
          label: $t('navigation.help'),
          path: '/help',
          icon: 'lucide:help-circle'
        },
        {
          id: 'logout',
          label: $t('navigation.logout'),
          path: '/logout',
          icon: 'lucide:log-out'
        }
      ]
    },

    /**
     * 権限でフィルタされたメインナビゲーション
     */
    filteredMainNavigation: (state) => {
      const authStore = useAuthStore()
      return filterNavigationItems(state.mainNavigationItems, authStore)
    },

    /**
     * 権限でフィルタされた管理ナビゲーション
     */
    filteredAdminNavigation: (state) => {
      const authStore = useAuthStore()
      return filterNavigationItems(state.adminNavigationItems, authStore)
    },

    /**
     * 現在のパスにマッチするナビゲーション項目
     */
    activeNavigationItem: (state) => {
      const findActiveItem = (items: NavigationItem[]): NavigationItem | null => {
        for (const item of items) {
          if (item.path === state.currentPath) {
            return item
          }
          if (item.children) {
            const activeChild = findActiveItem(item.children)
            if (activeChild) return activeChild
          }
        }
        return null
      }

      return findActiveItem([
        ...state.filteredMainNavigation,
        ...state.filteredAdminNavigation
      ])
    },

    /**
     * 最近訪問したページ（最大5件）
     */
    recentPages: (state) => {
      return state.recentlyVisited
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
    }
  },

  actions: {
    /**
     * サイドバーの開閉
     */
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen
      
      // 設定を永続化
      if (import.meta.client) {
        localStorage.setItem('sidebar-open', this.isSidebarOpen.toString())
      }
    },

    /**
     * サイドバーの開閉状態を設定
     */
    setSidebarOpen(open: boolean) {
      this.isSidebarOpen = open
      
      if (import.meta.client) {
        localStorage.setItem('sidebar-open', open.toString())
      }
    },

    /**
     * モバイルメニューの開閉
     */
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen
    },

    /**
     * モバイルメニューを閉じる
     */
    closeMobileMenu() {
      this.isMobileMenuOpen = false
    },

    /**
     * 現在のパスを更新
     */
    setCurrentPath(path: string) {
      this.currentPath = path
    },

    /**
     * パンくずリストを設定
     */
    setBreadcrumbs(breadcrumbs: Array<{ label: string; path?: string }>) {
      this.breadcrumbs = breadcrumbs
    },

    /**
     * 最近訪問したページを追加
     */
    addRecentlyVisited(label: string, path: string) {
      // 既存の項目を削除
      this.recentlyVisited = this.recentlyVisited.filter(item => item.path !== path)
      
      // 新しい項目を追加
      this.recentlyVisited.unshift({
        label,
        path,
        timestamp: Date.now()
      })

      // 最大10件まで保持
      if (this.recentlyVisited.length > 10) {
        this.recentlyVisited = this.recentlyVisited.slice(0, 10)
      }
    },

    /**
     * パスに基づいてパンくずリストを自動生成
     */
    generateBreadcrumbs(path: string) {
      const pathSegments = path.split('/').filter(segment => segment)
      const breadcrumbs: Array<{ label: string; path?: string }> = []

      // ホームを追加
      breadcrumbs.push({ label: 'ホーム', path: '/dashboard' })

      // パスセグメントからパンくずを生成
      let currentPath = ''
      for (let i = 0; i < pathSegments.length; i++) {
        currentPath += '/' + pathSegments[i]
        
        // ナビゲーション項目から適切なラベルを見つける
        const item = this.findNavigationItemByPath(currentPath)
        const label = item?.label || pathSegments[i]
        
        if (i === pathSegments.length - 1) {
          // 最後の項目はリンクなし
          breadcrumbs.push({ label })
        } else {
          breadcrumbs.push({ label, path: currentPath })
        }
      }

      this.setBreadcrumbs(breadcrumbs)
    },

    /**
     * パスでナビゲーション項目を検索
     */
    findNavigationItemByPath(path: string): NavigationItem | null {
      const searchItems = (items: NavigationItem[]): NavigationItem | null => {
        for (const item of items) {
          if (item.path === path) return item
          if (item.children) {
            const found = searchItems(item.children)
            if (found) return found
          }
        }
        return null
      }

      return searchItems([
        ...this.mainNavigationItems,
        ...this.adminNavigationItems
      ])
    },

    /**
     * 設定を復元
     */
    restoreSettings() {
      if (import.meta.client) {
        const sidebarOpen = localStorage.getItem('sidebar-open')
        if (sidebarOpen !== null) {
          this.isSidebarOpen = sidebarOpen === 'true'
        }
      }
    }
  },

  // 永続化設定
  persist: {
    key: 'navigation-store',
    paths: ['recentlyVisited']
  }
})

/**
 * ナビゲーション項目を権限に基づいてフィルタリング
 */
function filterNavigationItems(items: NavigationItem[], authStore: any): NavigationItem[] {
  return items.filter(item => {
    // 権限チェック
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      const hasPermission = item.requireAny
        ? item.requiredPermissions.some(p => authStore.hasPermission(p))
        : item.requiredPermissions.every(p => authStore.hasPermission(p))
      
      if (!hasPermission) return false
    }

    // ロールチェック
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      const hasRole = item.requireAny
        ? item.requiredRoles.some(r => authStore.hasRole(r))
        : item.requiredRoles.every(r => authStore.hasRole(r))
      
      if (!hasRole) return false
    }

    // 子要素のフィルタリング
    if (item.children) {
      item.children = filterNavigationItems(item.children, authStore)
    }

    return true
  }).map(item => ({
    ...item,
    children: item.children ? filterNavigationItems(item.children, authStore) : undefined
  }))
}