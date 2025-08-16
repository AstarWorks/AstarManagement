/**
import { useAuthStore } from "~/modules/auth/stores/auth"
 * ゲスト専用ミドルウェア
 * 
 * ログインページなど、認証済みユーザーがアクセスしてはいけないページで使用
 * 認証済みの場合はダッシュボードにリダイレクトする
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // サーバーサイドでは認証チェックをスキップ
  if (import.meta.server) {
    return
  }

  // @pinia-plugin-persistedstate が自動で状態を復元

  // 認証済みの場合の処理
  if (authStore.isAuthenticated && !authStore.requiresTwoFactor) {
    // リダイレクト先を決定
    const redirectTo = from?.query?.redirect as string || '/dashboard'
    
    return navigateTo({
      path: redirectTo,
      query: {
        message: 'already_authenticated'
      }
    })
  }

  // トークンが存在する場合、有効性をチェック
  if (authStore.tokens && !authStore.isTokenExpired) {
    // 有効なトークンがある場合はユーザー情報を取得してリダイレクト
    return authStore.fetchUser().then(async () => {
      if (authStore.isAuthenticated && !authStore.requiresTwoFactor) {
        const redirectTo = from?.query?.redirect as string || '/dashboard'
        return await navigateTo(redirectTo)
      }
    }).catch(() => {
      // ユーザー情報取得に失敗した場合は続行（ログインページ表示）
    })
  }

  // 未認証の場合は続行（ログインページなど表示）
})