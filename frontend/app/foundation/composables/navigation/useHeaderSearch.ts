/**
 * Header Search Composable
 * ヘッダーのグローバル検索機能を提供
 */

import { ref } from 'vue'

/**
 * ヘッダー検索機能のcomposable
 * グローバル検索の状態管理とハンドリング
 */
export function useHeaderSearch() {
  const router = useRouter()
  
  // 検索クエリの状態管理
  const searchQuery = ref('')

  /**
   * 検索実行ハンドラー
   * 入力された検索クエリで検索ページに遷移
   */
  const handleSearch = () => {
    if (searchQuery.value.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
    }
  }

  /**
   * 検索クエリをクリア
   */
  const clearSearch = () => {
    searchQuery.value = ''
  }

  return {
    searchQuery,
    handleSearch,
    clearSearch
  }
}