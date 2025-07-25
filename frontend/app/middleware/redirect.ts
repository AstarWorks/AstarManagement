/**
 * リダイレクト処理ミドルウェア
 * 
 * ログイン後のリダイレクト処理や、条件によるページリダイレクトを管理
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // サーバーサイドではリダイレクトをスキップ
  if (import.meta.server) {
    return
  }

  // 認証ストアが初期化されていない場合は初期化
  if (authStore.status === 'idle') {
    authStore.initialize()
  }

  // ルートページへのアクセス処理
  if (to.path === '/') {
    // 認証状態をチェックして適切にリダイレクト
    if (authStore.status === 'authenticated' && authStore.isAuthenticated) {
      // 認証済みの場合はダッシュボードへ
      return navigateTo('/dashboard')
    } else {
      // 未認証または不明な場合はログインページへ
      return navigateTo('/login')
    }
  }

  // ログインページからのリダイレクト処理
  if (to.path === '/login' && authStore.isAuthenticated) {
    const redirectTo = (to.query.redirect as string) || '/dashboard'
    return navigateTo(redirectTo)
  }

  // 2要素認証完了後のリダイレクト処理
  if (to.path === '/auth/two-factor' && authStore.isAuthenticated && !authStore.requiresTwoFactor) {
    const redirectTo = (to.query.redirect as string) || '/dashboard'
    return navigateTo(redirectTo)
  }

  // 認証状態に基づく自動リダイレクト
  handleAuthStateRedirect(to, authStore)
})

/**
 * 認証状態に基づく自動リダイレクト処理
 */
function handleAuthStateRedirect(to: any, authStore: any) {
  // セッション期限切れの検出とリダイレクト
  if (authStore.tokens && authStore.isTokenExpired && to.path !== '/login') {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath,
        reason: 'session_expired',
        message: 'セッションの有効期限が切れました。再度ログインしてください。'
      }
    })
  }

  // アクセス禁止ページの検出
  const restrictedPaths = ['/admin', '/system']
  const isRestrictedPath = restrictedPaths.some(path => to.path.startsWith(path))
  
  if (isRestrictedPath && authStore.isAuthenticated) {
    const hasAdminAccess = authStore.hasRole('ADMIN') || authStore.hasRole('LAWYER')
    
    if (!hasAdminAccess) {
      return navigateTo({
        path: '/unauthorized',
        query: {
          reason: 'insufficient_permissions',
          path: to.fullPath
        }
      })
    }
  }
}

/**
 * ログイン成功後のリダイレクト先を決定
 */
export function getPostLoginRedirect(query: any): string {
  // URLパラメータからリダイレクト先を取得
  const redirectTo = query.redirect as string

  // 許可されたリダイレクト先のパターン
  const allowedRedirectPatterns = [
    /^\/dashboard/,
    /^\/matters/,
    /^\/clients/,
    /^\/documents/,
    /^\/finance/,
    /^\/settings/,
    /^\/profile/
  ]

  // リダイレクト先が指定されており、許可されたパターンにマッチする場合
  if (redirectTo && allowedRedirectPatterns.some(pattern => pattern.test(redirectTo))) {
    return redirectTo
  }

  // デフォルトはダッシュボード
  return '/dashboard'
}

/**
 * エラー状態に基づくリダイレクト処理
 */
export function handleErrorRedirect(error: any, currentPath: string): string | null {
  switch (error.status || error.statusCode) {
    case 401:
      // 認証エラー
      return `/login?redirect=${encodeURIComponent(currentPath)}&reason=unauthenticated`
    
    case 403:
      // 権限エラー
      return `/unauthorized?reason=insufficient_permissions&path=${encodeURIComponent(currentPath)}`
    
    case 404:
      // ページが見つからない
      return `/404?path=${encodeURIComponent(currentPath)}`
    
    case 500:
      // サーバーエラー
      return `/error?code=500&path=${encodeURIComponent(currentPath)}`
    
    default:
      // その他のエラー
      return `/error?code=${error.status}&path=${encodeURIComponent(currentPath)}`
  }
}