/**
 * ナビゲーション用コンポーザブル
 * Simple over Easy: ナビゲーション関連のロジックを抽象化
 */

import { 
  MAIN_NAVIGATION_CONFIG, 
  ADMIN_NAVIGATION_CONFIG 
} from '@infrastructure/config/navigationConfig'
import { 
  createNavigationItems, 
  filterNavigationItems, 
  findActiveNavigationItem,
  generateBreadcrumbs
} from '@shared/utils/navigation'
import type { NavigationItem } from '~/types/navigation'

export function useNavigation() {
  const { t } = useI18n()
  const authStore = useAuthStore()
  const uiStore = useUIStore()
  const route = useRoute()

  /**
   * メインナビゲーション項目を取得
   */
  const mainNavigationItems = computed((): NavigationItem[] => {
    return createNavigationItems(MAIN_NAVIGATION_CONFIG, t)
  })

  /**
   * 管理者ナビゲーション項目を取得
   */
  const adminNavigationItems = computed((): NavigationItem[] => {
    return createNavigationItems(ADMIN_NAVIGATION_CONFIG, t)
  })

  /**
   * 権限でフィルタされたメインナビゲーション
   */
  const filteredMainNavigation = computed((): NavigationItem[] => {
    return filterNavigationItems(mainNavigationItems.value, authStore.user)
  })

  /**
   * 権限でフィルタされた管理ナビゲーション
   */
  const filteredAdminNavigation = computed((): NavigationItem[] => {
    return filterNavigationItems(adminNavigationItems.value, authStore.user)
  })

  /**
   * 全ナビゲーション項目（フィルタ済み）
   */
  const allNavigationItems = computed((): NavigationItem[] => {
    return [
      ...filteredMainNavigation.value,
      ...filteredAdminNavigation.value
    ]
  })

  /**
   * 現在のパスにマッチするアクティブなナビゲーション項目
   */
  const activeNavigationItem = computed((): NavigationItem | null => {
    const currentPath = route.path
    return findActiveNavigationItem(allNavigationItems.value, currentPath)
  })

  /**
   * 現在のパンくずリスト
   */
  const breadcrumbs = computed(() => {
    const currentPath = route.path
    return generateBreadcrumbs(allNavigationItems.value, currentPath, t)
  })

  /**
   * パンくずリストを更新
   */
  const updateBreadcrumbs = () => {
    uiStore.setBreadcrumbs(breadcrumbs.value)
  }

  /**
   * 現在のページを最近訪問したページに追加
   */
  const addCurrentPageToRecent = () => {
    const currentItem = activeNavigationItem.value
    if (currentItem && currentItem.path !== '/dashboard') {
      uiStore.addRecentlyVisited({
        label: currentItem.label,
        path: currentItem.path
      })
    }
  }

  /**
   * 現在のパスを更新し、関連する状態を同期
   */
  const updateCurrentPath = (path: string) => {
    uiStore.setCurrentPath(path)
    nextTick(() => {
      updateBreadcrumbs()
      addCurrentPageToRecent()
    })
  }

  // ルート変更を監視してパンくずリストを更新
  watch(
    () => route.path,
    (newPath) => {
      updateCurrentPath(newPath)
    },
    { immediate: true }
  )

  /**
   * 指定されたパスでセクションが現在アクティブかどうかを判定
   */
  const isCurrentSection = (path: string): boolean => {
    return route.path.startsWith(path)
  }

  return {
    // Navigation items
    mainNavigationItems: readonly(mainNavigationItems),
    adminNavigationItems: readonly(adminNavigationItems),
    filteredMainNavigation: readonly(filteredMainNavigation),
    filteredAdminNavigation: readonly(filteredAdminNavigation),
    allNavigationItems: readonly(allNavigationItems),
    activeNavigationItem: readonly(activeNavigationItem),
    
    // Breadcrumbs
    breadcrumbs: readonly(breadcrumbs),
    updateBreadcrumbs,
    
    // Recent pages
    addCurrentPageToRecent,
    
    // Path management
    updateCurrentPath,
    
    // Helper functions
    isCurrentSection
  }
}