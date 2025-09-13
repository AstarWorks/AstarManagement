/**
 * Workspace Repository Factory
 * Mock/Real切り替えを管理
 */

import type { WorkspaceRepository } from '../types'
import { WorkspaceRepositoryImpl } from './WorkspaceRepository'
import { MockWorkspaceRepository } from './MockWorkspaceRepository'

// シングルトンインスタンス管理
let repositoryInstance: WorkspaceRepository | null = null

/**
 * WorkspaceRepositoryを取得
 * 環境設定に応じてMock/Realを自動切り替え
 */
export const useWorkspaceRepository = (): WorkspaceRepository => {
  // 既存のインスタンスがあれば返す
  if (repositoryInstance) {
    return repositoryInstance
  }
  
  const config = useRuntimeConfig()
  const isMockMode = config.public.apiMode === 'mock'
  
  // 環境に応じてインスタンスを作成
  console.log(`[WorkspaceRepository] Creating ${isMockMode ? 'Mock' : 'Real'} repository`)
  repositoryInstance = isMockMode 
    ? new MockWorkspaceRepository()
    : new WorkspaceRepositoryImpl()
  
  // HMRサポート
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      console.log('[WorkspaceRepository] HMR: Disposing repository instance')
      repositoryInstance = null
    })
  }
  
  return repositoryInstance
}

/**
 * リポジトリインスタンスをクリア（テスト用）
 */
export const clearWorkspaceRepository = (): void => {
  repositoryInstance = null
}

// 型のエクスポート
export type { WorkspaceRepository }
export { WorkspaceRepositoryImpl, MockWorkspaceRepository }