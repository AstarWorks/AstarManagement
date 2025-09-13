/**
 * Mock専用のラベル定義
 * プロジェクトはドメイン非依存を保つため、モック固有のラベルは分離
 */
export const MOCK_LABELS = {
  navigation: {
    expenseManagement: '経費管理（モック）'
  },
  dashboard: {
    quickActions: {
      expenseTable: '経費管理テーブル（モック）',
      tableList: 'テーブル一覧'
    }
  }
} as const

export type MockLabels = typeof MOCK_LABELS