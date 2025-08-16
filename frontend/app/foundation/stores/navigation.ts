/**
 * リファクタリングされたナビゲーションストア
 * Simple over Easy: 設定とロジックを分離し、責任を限定
 * 
 * 移行された機能:
 * - ナビゲーション構造 → /config/navigationConfig.ts
 * - ユーティリティ関数 → /utils/navigation.ts  
 * - ナビゲーションロジック → /composables/useNavigation.ts
 * - UI状態管理 → /stores/ui.ts
 * - 型定義 → /types/navigation.ts
 */

import { defineStore } from 'pinia'
import type { NavigationState } from '~/foundation/types/navigation'

// 後方互換性のために型を再エクスポート
export type { NavigationItem, NavigationState } from '~/foundation/types/navigation'

export const useNavigationStore = defineStore('navigation', {
  state: (): NavigationState => ({
    currentNavigationId: null,
    isNavigationLoading: false
  }),

  getters: {
    /**
     * ナビゲーションがロード中かどうか
     */
    isLoading: (state): boolean => {
      return state.isNavigationLoading
    }
  },

  actions: {
    /**
     * 現在のナビゲーション項目IDを設定
     */
    setCurrentNavigationId(id: string | null) {
      this.currentNavigationId = id
    },

    /**
     * ナビゲーションのローディング状態を設定
     */
    setNavigationLoading(loading: boolean) {
      this.isNavigationLoading = loading
    },

    /**
     * ナビゲーションの初期化
     */
    async initializeNavigation() {
      this.setNavigationLoading(true)
      
      try {
        // ナビゲーション関連の初期化処理
        // 例: 動的メニューの読み込み、権限の確認など
        await new Promise(resolve => setTimeout(resolve, 100)) // 模擬的な非同期処理
        
      } catch (error) {
        console.error('Navigation initialization failed:', error)
      } finally {
        this.setNavigationLoading(false)
      }
    },

    // 後方互換性のための非推奨メソッド群（将来的に削除予定）
    // 新しいコードでは useNavigation() コンポーザブルを使用してください

    /**
     * @deprecated useNavigation() コンポーザブルを使用してください
     */
    getMainNavigationItems() {
      console.warn('getMainNavigationItems is deprecated. Use useNavigation() composable instead.')
      return []
    },

    /**
     * @deprecated useNavigation() コンポーザブルを使用してください
     */
    getAdminNavigationItems() {
      console.warn('getAdminNavigationItems is deprecated. Use useNavigation() composable instead.')
      return []
    }
  },

  // 永続化設定（最小限）
  persist: {
    key: 'navigation-store',
    pick: ['currentNavigationId']
  }
})