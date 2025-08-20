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

  /**
   * 現在のルートからブレッドクラムアイテムを生成
   * Returns labelKey for component-side translation
   */
  const breadcrumbs = computed<(IBreadcrumbItem & { labelKey?: string })[]>(() => {
    const pathSegments = route.path.split('/').filter(Boolean)
    const crumbs: (IBreadcrumbItem & { labelKey?: string })[] = [
      { label: 'Dashboard', labelKey: 'navigation.dashboard', href: '/dashboard' }
    ]
    
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      const isLast = index === pathSegments.length - 1
      const { label, labelKey } = getBreadcrumbLabelAndKey(segment, currentPath)
      
      crumbs.push({
        label,
        labelKey,
        href: isLast ? '' : currentPath
      })
    })
    
    return crumbs
  })

  /**
   * パスセグメントから適切なラベルとキーを生成
   * Returns both label (fallback) and labelKey for component-side translation
   */
  const getBreadcrumbLabelAndKey = (segment: string, _path: string): { label: string; labelKey?: string } => {
    // Label key mapping for i18n
    const labelKeyMap: Record<string, string> = {
      cases: 'navigation.matters',
      clients: 'navigation.clients', 
      documents: 'navigation.documents',
      finance: 'navigation.finance',
      settings: 'navigation.settings',
      kanban: 'navigation.menu.matters.kanban',
      create: 'common.create',
      upload: 'common.upload'
    }
    
    const labelKey = labelKeyMap[segment]
    // Return segment as fallback label if no key found
    return {
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      labelKey
    }
  }

  return {
    breadcrumbs
  }
}