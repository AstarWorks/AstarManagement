/**
 * 認証初期化プラグイン
 * アプリケーション起動時に認証状態を復元する
 */
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  
  // クライアントサイドでのみ初期化
  if (import.meta.client) {
    authStore.initialize()
  }
})