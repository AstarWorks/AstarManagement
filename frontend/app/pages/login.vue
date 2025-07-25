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
  isLoading.value = true
  authError.value = ''

  try {
    await authStore.login(credentials)

    if (authStore.requiresTwoFactor) {
      // 2要素認証が必要な場合
      await router.push({
        path: '/auth/two-factor',
        query: {
          redirect: redirectTo.value
        }
      })
    } else if (authStore.isAuthenticated) {
      // ログイン成功
      await router.push(redirectTo.value)
    }
  } catch (error: any) {
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