/**
 * Header Breadcrumb Composable
 * ヘッダーのブレッドクラムナビゲーション機能を提供
 */

import { computed } from 'vue'

import type { IBreadcrumbItem } from '~/foundation/types/navigation'

/**
 * ヘッダーブレッドクラム機能のcomposable
 * ルートパスから自動的にブレッドクラムを生成
 */
export function useHeaderBreadcrumb() {
  const route = useRoute()
  const { t } = useI18n()

  /**
   * 現在のルートからブレッドクラムアイテムを生成
   */
  const breadcrumbs = computed<IBreadcrumbItem[]>(() => {
    const pathSegments = route.path.split('/').filter(Boolean)
    const crumbs: IBreadcrumbItem[] = [
      { label: t('navigation.dashboard'), href: '/dashboard' }
    ]
    
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      const isLast = index === pathSegments.length - 1
      const label = getBreadcrumbLabel(segment, currentPath)
      
      crumbs.push({
        label,
        href: isLast ? '' : currentPath
      })
    })
    
    return crumbs
  })

  /**
   * パスセグメントから適切なラベルを生成
   * i18n対応でハードコーディングを排除
   */
  const getBreadcrumbLabel = (segment: string, _path: string): string => {
    // i18n対応のラベルマッピング
    const labelKeys: Record<string, string> = {
      cases: 'navigation.matters',
      clients: 'navigation.clients', 
      documents: 'navigation.documents',
      finance: 'navigation.finance',
      settings: 'navigation.settings',
      kanban: 'navigation.menu.matters.kanban',
      create: 'common.create',
      upload: 'common.upload'
    }
    
    const labelKey = labelKeys[segment]
    return labelKey ? t(labelKey) : segment
  }

  return {
    breadcrumbs
  }
}