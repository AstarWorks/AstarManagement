/**
 * Header Breadcrumb Composable
 * ヘッダーのブレッドクラムナビゲーション機能を提供
 */

import { computed } from 'vue'
import type { IBreadcrumbItem } from '~/foundation/types/navigation'

/**
 * UUIDかどうかを判定
 */
const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
}

/**
 * ヘッダーブレッドクラム機能のcomposable
 * ルートパスから自動的にブレッドクラムを生成
 */
export function useHeaderBreadcrumb() {
    const route = useRoute()
    
    // テーブル詳細ページ用のデータ取得
    const tableId = computed(() => {
        const pathSegments = route.path.split('/').filter(Boolean)
        const tablesIndex = pathSegments.indexOf('tables')
        if (tablesIndex !== -1 && pathSegments[tablesIndex + 1]) {
            const nextSegment = pathSegments[tablesIndex + 1]
            if (nextSegment && isUUID(nextSegment)) {
                return nextSegment
            }
        }
        return null
    })
    
    // ワークスペース詳細ページ用のデータ取得
    const workspaceId = computed(() => {
        const pathSegments = route.path.split('/').filter(Boolean)
        if (pathSegments[0] === 'workspaces' && pathSegments[1] && isUUID(pathSegments[1])) {
            return pathSegments[1]
        }
        return null
    })
    
    // テーブル情報の取得（非同期）
    const { data: tableData } = useAsyncData(
        `breadcrumb-table-${tableId.value}`,
        async () => {
            if (!tableId.value) return null
            const table = useTable()
            const tableInfo = await table.getTable(tableId.value)
            
            // ワークスペース情報も取得
            let workspaceName = 'Workspace'
            if (tableInfo.workspaceId) {
                try {
                    const workspace = useWorkspace()
                    const workspaceInfo = await workspace.getWorkspace(tableInfo.workspaceId)
                    workspaceName = workspaceInfo.name || 'Workspace'
                } catch (error) {
                    console.warn('Failed to fetch workspace info for breadcrumb:', error)
                }
            }
            
            return {
                ...tableInfo,
                workspaceName
            }
        },
        {
            watch: [tableId],
            server: false,
            lazy: true
        }
    )
    
    // ワークスペース情報の取得（非同期）
    const { data: workspaceData } = useAsyncData(
        `breadcrumb-workspace-${workspaceId.value}`,
        async () => {
            if (!workspaceId.value) return null
            try {
                const workspace = useWorkspace()
                return await workspace.getWorkspace(workspaceId.value)
            } catch (error) {
                console.warn('Failed to fetch workspace info for breadcrumb:', error)
                return null
            }
        },
        {
            watch: [workspaceId],
            server: false,
            lazy: true
        }
    )

    /**
     * 現在のルートからブレッドクラムアイテムを生成
     * Returns labelKey for component-side translation
     */
    const breadcrumbs = computed<(IBreadcrumbItem & { labelKey?: string })[]>(() => {
        const pathSegments = route.path.split('/').filter(Boolean)
        
        // パンくずを空から開始（ダッシュボードをルートにしない）
        const crumbs: (IBreadcrumbItem & { labelKey?: string })[] = []
        
        // ダッシュボードページは単独で表示
        if (pathSegments[0] === 'dashboard') {
            return [
                { label: 'Dashboard', labelKey: 'modules.navigation.dashboard', href: '' }
            ]
        }
        
        // ワークスペース一覧ページ
        if (pathSegments[0] === 'workspaces' && !pathSegments[1]) {
            return [
                { label: 'Workspaces', labelKey: 'modules.navigation.workspaces', href: '' }
            ]
        }
        
        // ワークスペース詳細ページの特別処理
        if (pathSegments[0] === 'workspaces' && pathSegments[1] && isUUID(pathSegments[1])) {
            // ワークスペースデータが取得できている場合
            if (workspaceData.value) {
                crumbs.push(
                    { 
                        label: 'Workspaces', 
                        labelKey: 'modules.navigation.workspaces', 
                        href: '/workspaces' 
                    },
                    { 
                        label: workspaceData.value.name || 'Workspace',
                        href: ''
                    }
                )
                return crumbs
            } else {
                // データ取得中はフォールバック表示
                return [
                    { 
                        label: 'Workspaces', 
                        labelKey: 'modules.navigation.workspaces', 
                        href: '/workspaces' 
                    },
                    { 
                        label: 'Loading...',
                        href: ''
                    }
                ]
            }
        }
        
        // テーブル詳細ページの特別処理
        if (pathSegments[0] === 'tables' && pathSegments[1] && isUUID(pathSegments[1])) {
            // テーブルデータが取得できている場合
            if (tableData.value) {
                // ワークスペース階層を構築
                crumbs.push(
                    { 
                        label: 'Workspaces', 
                        labelKey: 'modules.navigation.workspaces', 
                        href: '/workspaces' 
                    },
                    { 
                        label: tableData.value.workspaceName || 'Workspace',
                        href: tableData.value.workspaceId ? `/workspaces/${tableData.value.workspaceId}` : ''
                    },
                    { 
                        label: 'Tables', 
                        labelKey: 'modules.navigation.tables',
                        href: tableData.value.workspaceId 
                            ? `/workspaces/${tableData.value.workspaceId}?tab=tables`
                            : ''
                    },
                    { 
                        label: tableData.value.name || 'Table',
                        href: ''
                    }
                )
                return crumbs
            } else {
                // データ取得中はフォールバック表示（簡略版）
                return [
                    { 
                        label: 'Tables', 
                        labelKey: 'modules.navigation.tables',
                        href: '/tables'
                    },
                    { 
                        label: 'Loading...',
                        href: ''
                    }
                ]
            }
        }
        
        // 通常のパス処理
        let currentPath = ''
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`
            
            // UUID以外のセグメントのみ処理
            if (!isUUID(segment)) {
                const isLast = index === pathSegments.length - 1
                const { label, labelKey } = getBreadcrumbLabelAndKey(segment, currentPath)
                
                crumbs.push({
                    label,
                    labelKey,
                    href: isLast ? '' : currentPath
                })
            }
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
            cases: 'modules.navigation.matters',
            clients: 'modules.navigation.clients',
            documents: 'modules.navigation.documents',
            finance: 'modules.navigation.finance',
            settings: 'modules.navigation.settings',
            workspaces: 'modules.navigation.workspaces',
            tables: 'modules.navigation.tables',
            kanban: 'modules.navigation.menu.matters.kanban',
            create: 'foundation.common.create',
            upload: 'foundation.common.upload'
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