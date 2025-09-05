/**
 * Table Repository Factory
 * Mock/Real切り替えを管理
 */

import type { ITableRepository } from '../types'
import { TableRepository } from './TableRepository'
import { MockTableRepository } from './MockTableRepository'

// シングルトンインスタンス管理
let repositoryInstance: ITableRepository | null = null

/**
 * TableRepositoryを取得
 * 環境設定に応じてMock/Realを自動切り替え
 */
export const useTableRepository = (): ITableRepository => {
  // 既存のインスタンスがあれば返す
  if (repositoryInstance) {
    return repositoryInstance
  }
  
  const config = useRuntimeConfig()
  const isMockMode = config.public.apiMode === 'mock'
  
  // 環境に応じてインスタンスを作成
  console.log(`[TableRepository] Creating ${isMockMode ? 'Mock' : 'Real'} repository`)
  repositoryInstance = isMockMode 
    ? new MockTableRepository()
    : new TableRepository()
  
  // HMRサポート
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      console.log('[TableRepository] HMR: Disposing repository instance')
      repositoryInstance = null
    })
  }
  
  return repositoryInstance
}

/**
 * リポジトリインスタンスをクリア（テスト用）
 */
export const clearTableRepository = (): void => {
  repositoryInstance = null
}

// 型のエクスポート
export type { ITableRepository }
export { TableRepository, MockTableRepository }