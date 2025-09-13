/**
 * ID Generator Utility
 * 一貫性のあるID生成ルール（UUID形式）
 */

import { faker } from '@faker-js/faker'
import { 
  getWorkspaceIdByName,
  getTableId as getMockTableId,
  getRecordId as getMockRecordId
} from '~/modules/mock/constants/mockIds'

/**
 * ID生成ユーティリティ
 * モックモードでは固定UUID、実環境では動的UUID生成
 */

// デバッグ用に固定のシードマップを使用（一貫性のあるUUIDを生成）
const seedMap = new Map<string, string>()

// モックモードかどうかを判定
function isMockMode(): boolean {
  // Nuxtのランタイム設定から判定（クライアントサイドでも動作）
  if (typeof window !== 'undefined' && window.$nuxt) {
    return window.$nuxt.$config.public.apiMode === 'mock'
  }
  return true // デフォルトはモックモード
}

export const IdGenerator = {

  /**
   * テーブルIDを生成（UUID形式）
   * @param workspaceId ワークスペースID
   * @param tableName テーブル名
   * @returns テーブルID（UUID）
   */
  tableId(workspaceId: string, tableName: string): string {
    // モックモードでは固定UUIDを使用
    if (isMockMode()) {
      return getMockTableId(workspaceId, tableName)
    }
    
    // 実環境では動的生成
    const key = `table-${workspaceId}-${tableName}`
    
    if (seedMap.has(key)) {
      return seedMap.get(key)!
    }
    
    const uuid = faker.string.uuid()
    seedMap.set(key, uuid)
    return uuid
  },

  /**
   * レコードIDを生成（UUID形式）
   * @param tableId テーブルID
   * @param index インデックス
   * @returns レコードID（UUID）
   */
  recordId(tableId: string, index: number): string {
    // モックモードでは固定UUIDを使用
    if (isMockMode()) {
      return getMockRecordId(tableId, index)
    }
    
    // 実環境では動的生成
    const key = `record-${tableId}-${index}`
    
    if (seedMap.has(key)) {
      return seedMap.get(key)!
    }
    
    const uuid = faker.string.uuid()
    seedMap.set(key, uuid)
    return uuid
  },

  /**
   * ワークスペースIDを生成（UUID形式）
   * @param name ワークスペース名
   * @returns ワークスペースID（UUID）
   */
  workspaceId(name: string): string {
    // モックモードでは固定UUIDを使用
    if (isMockMode()) {
      return getWorkspaceIdByName(name)
    }
    
    // 実環境では動的生成
    const key = `workspace-${name}`
    
    if (seedMap.has(key)) {
      return seedMap.get(key)!
    }
    
    const uuid = faker.string.uuid()
    seedMap.set(key, uuid)
    return uuid
  },

  /**
   * プロパティキーを生成（正規化）
   * @param displayName 表示名
   * @returns プロパティキー
   */
  propertyKey(displayName: string): string {
    return displayName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
  },

  /**
   * ワークスペースIDからシナリオタイプを推定
   * @param workspaceId ワークスペースID
   * @returns シナリオタイプ
   */
  getScenarioType(workspaceId: string): 'legal' | 'tech' | 'consulting' | 'general' {
    // UUIDになったため、seedMapのキーから判定
    for (const [key, id] of seedMap.entries()) {
      if (id === workspaceId) {
        if (key.includes('legal')) return 'legal'
        if (key.includes('tech')) return 'tech'
        if (key.includes('consulting')) return 'consulting'
      }
    }
    return 'general'
  },

  /**
   * シードマップをリセット（テスト用）
   */
  reset(): void {
    seedMap.clear()
  }
}