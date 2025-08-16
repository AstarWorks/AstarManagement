import {useAuthStore} from "~/modules/auth/stores/auth";

/**
 * 認証チェックミドルウェア
 *
 * 認証が必要なページで使用し、未認証の場合はログインページにリダイレクトする
 */
export default defineNuxtRouteMiddleware((to, _from) => {
    const authStore = useAuthStore()

    // サーバーサイドでは認証チェックをスキップ
    if (import.meta.server) {
        return
    }

    // @pinia-plugin-persistedstate が自動で状態を復元

    // 認証済みでない場合の処理
    if (!authStore.isAuthenticated) {
        // トークンが存在するが期限切れの場合、リフレッシュを試行
        if (authStore.tokens && authStore.isTokenExpired) {
            return authStore.refreshTokens().then(async (success) => {
                if (!success) {
                    // リフレッシュ失敗の場合、ログインページへリダイレクト
                    return navigateTo({
                        path: '/login',
                        query: {
                            redirect: to.fullPath,
                            reason: 'session_expired'
                        }
                    });
                }
                // リフレッシュ成功の場合、続行
            })
        }

        // 未認証の場合、ログインページへリダイレクト
        return navigateTo({
            path: '/login',
            query: {
                redirect: to.fullPath,
                reason: 'unauthenticated'
            }
        })
    }

    // 2要素認証が必要な場合の処理
    if (authStore.requiresTwoFactor) {
        return navigateTo({
            path: '/auth/two-factor',
            query: {
                redirect: to.fullPath
            }
        })
    }

    // 認証済みの場合は続行
})