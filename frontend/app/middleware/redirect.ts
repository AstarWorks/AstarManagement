/**
 * リダイレクト処理ミドルウェア
 *
 * ルートページ (/) のリダイレクト処理のみを管理
 * その他の認証処理はglobalAppMiddlewareとページ設定に委譲
 */

export default defineNuxtRouteMiddleware((to, _from) => {
    // ルートページへのアクセス時のみリダイレクト
    if (to.path === '/') {
        const {status} = useAuth()
        
        // 認証状態に応じて適切なページへリダイレクト
        if (status.value === 'authenticated') {
            return navigateTo('/dashboard')
        } else {
            return navigateTo('/signin')
        }
    }
})