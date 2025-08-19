/**
 * リダイレクト処理ミドルウェア
 * 
 * ログイン後のリダイレクト処理や、条件によるページリダイレクトを管理
 */
import { useUserProfile } from '@modules/auth/composables/auth/useUserProfile'

export default defineNuxtRouteMiddleware((to, _from) => {
  const { status } = useAuth()
  const { hasRole } = useUserProfile()

  // サーバーサイドではリダイレクトをスキップ
  if (import.meta.server) {
    return
  }

  // @pinia-plugin-persistedstate が自動で状態を復元

  // ルートページへのアクセス処理
  if (to.path === '/') {
    // 認証状態をチェックして適切にリダイレクト
    if (status.value === 'authenticated') {
      // 認証済みの場合はダッシュボードへ
      return navigateTo('/dashboard')
    } else {
      // 未認証または不明な場合はログインページへ
      return navigateTo('/login')
    }
  }

  // ログインページからのリダイレクト処理
  if (to.path === '/login' && status.value === 'authenticated') {
    const redirectTo = (to.query.redirect as string) || '/dashboard'
    return navigateTo(redirectTo)
  }

  // アクセス禁止ページの検出
  const restrictedPaths = ['/admin', '/system']
  const isRestrictedPath = restrictedPaths.some(path => to.path.startsWith(path))
  
  if (isRestrictedPath && status.value === 'authenticated') {
    const hasAdminAccess = hasRole('ADMIN') || hasRole('LAWYER')
    
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
})


/**
 * ログイン成功後のリダイレクト先を決定
 */
export function getPostLoginRedirect(query: Record<string, string | string[]>): string {
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
export function handleErrorRedirect(error: { status?: number; statusCode?: number }, currentPath: string): string | null {
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