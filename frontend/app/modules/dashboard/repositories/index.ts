/**
 * Dashboard Repository Factory
 * Mock/Real切り替えを管理
 */

import type { DashboardRepository } from './DashboardRepository'
import { DashboardApiRepository } from './DashboardApiRepository'
import { DashboardMockRepository } from './DashboardMockRepository'

// シングルトンインスタンス管理
let repositoryInstance: DashboardRepository | null = null

/**
 * DashboardRepositoryを取得
 * 環境設定に応じてMock/Realを自動切り替え
 */
export const useDashboardRepository = (): DashboardRepository => {
  // 既存のインスタンスがあれば返す
  if (repositoryInstance) {
    return repositoryInstance
  }
  
  const config = useRuntimeConfig()
  const isMockMode = config.public.apiMode === 'mock'
  
  // 環境に応じてインスタンスを作成
  console.log(`[DashboardRepository] Creating ${isMockMode ? 'Mock' : 'Real'} repository`)
  repositoryInstance = isMockMode 
    ? new DashboardMockRepository()
    : new DashboardApiRepository()
  
  // HMRサポート
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      console.log('[DashboardRepository] HMR: Disposing repository instance')
      repositoryInstance = null
    })
  }
  
  return repositoryInstance
}

/**
 * リポジトリインスタンスをクリア（テスト用）
 */
export const clearDashboardRepository = (): void => {
  repositoryInstance = null
}

// 型のエクスポート
export type { DashboardRepository }
export { DashboardApiRepository, DashboardMockRepository }