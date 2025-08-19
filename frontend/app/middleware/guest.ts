/**
 * ゲスト専用ミドルウェア - 業界標準実装
 * 認証済みユーザーをダッシュボードにリダイレクト
 */
// useAuth is auto-imported by sidebase/nuxt-auth

export default defineNuxtRouteMiddleware((_to, from) => {
  const { status } = useAuth()

  // サーバーサイドでは認証チェックをスキップ（SPAモード）
  if (import.meta.server) {
    return
  }

  // 認証済みの場合の処理
  if (status.value === 'authenticated') {
    // リダイレクト先を決定
    const redirectTo = from?.query?.redirect as string || '/dashboard'
    
    return navigateTo({
      path: redirectTo,
      query: {
        message: 'already_authenticated'
      }
    })
  }

  // 未認証の場合は続行（ログインページなど表示）
})