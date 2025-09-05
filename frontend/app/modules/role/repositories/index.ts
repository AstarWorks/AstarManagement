/**
 * Role Repository Factory
 * Mock/Real切り替えを管理
 */

import type { IRoleRepository } from '../types'
import { RoleRepository } from './RoleRepository'
import { MockRoleRepository } from './MockRoleRepository'

// シングルトンインスタンス管理
let repositoryInstance: IRoleRepository | null = null

/**
 * RoleRepositoryを取得
 * 環境設定に応じてMock/Realを自動切り替え
 */
export const useRoleRepository = (): IRoleRepository => {
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
    : new RoleRepository()
  
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
export type { IRoleRepository }
export { RoleRepository, MockRoleRepository }