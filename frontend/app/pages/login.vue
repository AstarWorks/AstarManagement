<template>
  <LoginForm 
    :is-loading="isLoading"
    :auth-error="authError"
    @submit="handleLogin"
    @forgot-password="handleForgotPassword"
  />
</template>

<script setup lang="ts">
import type { LoginCredentials } from '~/types/auth'

// ゲスト専用ページ（認証済みユーザーはリダイレクト）
definePageMeta({
  middleware: 'guest',
  layout: 'auth'
})

// 状態管理
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// リアクティブな状態
const isLoading = ref(false)
const authError = ref('')

// 計算プロパティ
const redirectTo = computed(() => {
  return (route.query.redirect as string) || '/dashboard'
})

// メソッド
const handleLogin = async (credentials: LoginCredentials) => {
  console.log('🔐 Login attempt started', { email: credentials.email, hasPassword: !!credentials.password })
  isLoading.value = true
  authError.value = ''

  try {
    console.log('🔐 Calling authStore.login...')
    const result = await authStore.login(credentials)
    console.log('🔐 Login result:', result)
    console.log('🔐 Auth store state after login:', {
      isAuthenticated: authStore.isAuthenticated,
      requiresTwoFactor: authStore.requiresTwoFactor,
      user: authStore.user
    })

    if (authStore.requiresTwoFactor) {
      // 2要素認証が必要な場合
      console.log('🔐 Redirecting to 2FA')
      await router.push({
        path: '/auth/two-factor',
        query: {
          redirect: redirectTo.value
        }
      })
    } else if (authStore.isAuthenticated) {
      // ログイン成功
      console.log('🔐 Login successful, redirecting to:', redirectTo.value)
      await router.push(redirectTo.value)
    } else {
      console.log('🔐 Login completed but user not authenticated')
    }
  } catch (error: any) {
    console.error('🔐 Login error:', error)
    authError.value = error.message || 'ログインに失敗しました'
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = () => {
  // パスワードリセットページへの遷移
  router.push('/auth/forgot-password')
}

// URL パラメータからのメッセージ表示
onMounted(() => {
  const reason = route.query.reason as string
  if (reason === 'session_expired') {
    authError.value = 'セッションの有効期限が切れました。再度ログインしてください。'
  } else if (reason === 'unauthenticated') {
    authError.value = 'このページにアクセスするにはログインが必要です。'
  }
})
</script>