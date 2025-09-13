/**
 * ナビゲーション設定
 * 注意: この設定は新しいuseNavigation composableにより廃止予定
 * 現在は後方互換性のためのクイックアクション設定のみ保持
 */

/**
 * クイックアクション設定（まだ使用中）
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

// @deprecated - 以下は廃止予定。useNavigation composableを使用してください
// MAIN_NAVIGATION_CONFIG, ADMIN_NAVIGATION_CONFIG は削除されました