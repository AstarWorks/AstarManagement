/**
 * Mock IDs - 固定UUID定義
 * 開発環境で一貫性のあるIDを保証
 */

/**
 * ワークスペースの固定UUID
 */
export const MOCK_WORKSPACE_IDS = {
  LEGAL_1: '550e8400-e29b-41d4-a716-446655440001',
  LEGAL_2: '550e8400-e29b-41d4-a716-446655440002',
} as const

/**
 * テーブルの固定UUID（プレフィックス）
 * 実際のIDは workspace + table名 のハッシュから生成
 */
export const MOCK_TABLE_ID_PREFIX = {
  TASKS: '660e8400-e29b-41d4-a716-',
  CUSTOMERS: '770e8400-e29b-41d4-a716-',
  EXPENSES: '880e8400-e29b-41d4-a716-',
  INVENTORY: '990e8400-e29b-41d4-a716-',
  PROJECTS: 'aa0e8400-e29b-41d4-a716-',
} as const

/**
 * ユーザーの固定UUID
 */
export const MOCK_USER_IDS = {
  ADMIN: 'bb0e8400-e29b-41d4-a716-446655440001',
  USER_1: 'bb0e8400-e29b-41d4-a716-446655440002',
  USER_2: 'bb0e8400-e29b-41d4-a716-446655440003',
  USER_3: 'bb0e8400-e29b-41d4-a716-446655440004',
  USER_4: 'bb0e8400-e29b-41d4-a716-446655440005',
} as const

/**
 * チームの固定UUID
 */
export const MOCK_TEAM_IDS = {
  LEGAL_TEAM: 'cc0e8400-e29b-41d4-a716-446655440001',
  TECH_TEAM: 'cc0e8400-e29b-41d4-a716-446655440002',
  CONSULTING_TEAM: 'cc0e8400-e29b-41d4-a716-446655440003',
} as const

/**
 * テナントの固定UUID
 */
export const MOCK_TENANT_IDS = {
  DEFAULT: 'dd0e8400-e29b-41d4-a716-446655440001',
} as const

/**
 * モック専用の固定テーブルUUID
 * クイックアクセスで使用する特定テーブル
 */
export const MOCK_TABLE_IDS = {
  EXPENSE_MANAGEMENT: '56687853-25cd-45cd-a463-4634e1c37000',
} as const

/**
 * ワークスペース名からIDを取得
 */
export function getWorkspaceIdByName(name: string): string {
  switch (name) {
    case 'legal-1':
      return MOCK_WORKSPACE_IDS.LEGAL_1
    case 'legal-2':
      return MOCK_WORKSPACE_IDS.LEGAL_2
    default:
      // フォールバック: 名前のハッシュから生成（決定論的）
      return generateDeterministicUUID(name)
  }
}

/**
 * テーブル名からIDを生成（決定論的）
 */
export function getTableId(workspaceId: string, tableName: string): string {
  const combined = `${workspaceId}-${tableName}`
  return generateDeterministicUUID(combined)
}

/**
 * レコードIDを生成（決定論的）
 */
export function getRecordId(tableId: string, index: number): string {
  const combined = `${tableId}-record-${index}`
  return generateDeterministicUUID(combined)
}

/**
 * 文字列から決定論的にUUIDを生成
 * 注意：これは真のUUIDではなく、UUID形式の決定論的な文字列
 */
function generateDeterministicUUID(input: string): string {
  // 簡易的なハッシュ関数（実際のプロダクションでは使用しないこと）
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // より長いハッシュを生成してUUID v4 形式に変換
  const absHash = Math.abs(hash)
  const hex1 = absHash.toString(16).padStart(8, '0')
  const hex2 = (absHash * 7).toString(16).padStart(8, '0')
  const hex3 = (absHash * 13).toString(16).padStart(8, '0')
  
  return `${hex1.substring(0, 8)}-${hex2.substring(0, 4)}-4${hex2.substring(1, 4)}-a${hex3.substring(0, 3)}-${hex3.padEnd(12, '0').substring(0, 12)}`
}