/**
 * Role Repository Factory
 * Mock/Real切り替えを管理
 */

import type { RoleRepository } from '../types'
import { RoleRepositoryImpl } from './RoleRepository'
import { MockRoleRepository } from './MockRoleRepository'

// シングルトンインスタンス管理
let repositoryInstance: RoleRepository | null = null

/**
 * RoleRepositoryを取得
 * 環境設定に応じてMock/Realを自動切り替え
 */
export const useRoleRepository = (): RoleRepository => {
  // 既存のインスタンスがあれば返す
  if (repositoryInstance) {
    return repositoryInstance
  }
  
  const config = useRuntimeConfig()
  const isMockMode = config.public.apiMode === 'mock'
  
  // 環境に応じてインスタンスを作成
  console.log(`[RoleRepository] Creating ${isMockMode ? 'Mock' : 'Real'} repository`)
  repositoryInstance = isMockMode 
    ? new MockRoleRepository()
    : new RoleRepositoryImpl()
  
  // HMRサポート
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      console.log('[RoleRepository] HMR: Disposing repository instance')
      repositoryInstance = null
    })
  }
  
  return repositoryInstance
}

/**
 * リポジトリインスタンスをクリア（テスト用）
 */
export const clearRoleRepository = (): void => {
  repositoryInstance = null
}

// 型のエクスポート
export type { RoleRepository }
export { RoleRepositoryImpl, MockRoleRepository }