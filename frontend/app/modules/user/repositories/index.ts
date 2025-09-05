/**
 * User Repository Factory
 * Mock/Real切り替えを管理
 */

import type { IUserRepository } from '../types'
import { UserRepository } from './UserRepository'
import { MockUserRepository } from './MockUserRepository'

// シングルトンインスタンス管理
let repositoryInstance: IUserRepository | null = null

/**
 * UserRepositoryを取得
 * 環境設定に応じてMock/Realを自動切り替え
 */
export const useUserRepository = (): IUserRepository => {
  // 既存のインスタンスがあれば返す
  if (repositoryInstance) {
    return repositoryInstance
  }
  
  const config = useRuntimeConfig()
  const isMockMode = config.public.apiMode === 'mock'
  
  // 環境に応じてインスタンスを作成
  console.log(`[UserRepository] Creating ${isMockMode ? 'Mock' : 'Real'} repository`)
  repositoryInstance = isMockMode 
    ? new MockUserRepository()
    : new UserRepository()
  
  // HMRサポート
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      console.log('[UserRepository] HMR: Disposing repository instance')
      repositoryInstance = null
    })
  }
  
  return repositoryInstance
}

/**
 * リポジトリインスタンスをクリア（テスト用）
 */
export const clearUserRepository = (): void => {
  repositoryInstance = null
}

// 型のエクスポート
export type { IUserRepository }
export { UserRepository, MockUserRepository }