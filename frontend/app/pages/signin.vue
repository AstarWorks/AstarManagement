<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <SignInForm
      :is-loading="isLoading"
      :auth-error="authError"
      @submit="handleLogin"
      @forgot-password="handleForgotPassword"
  />
</template>

<script setup lang="ts">
import SignInForm from '~/modules/auth/components/SignInForm.vue'
import {useI18n} from "vue-i18n";

// ゲスト専用ページ（認証済みユーザーはリダイレクト）
definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/dashboard'
  },
  layout: 'auth'
})

// 状態管理 - 業界標準のuseAuth composableを使用
const {signIn} = useAuth()
const route = useRoute()
const router = useRouter()
const {t} = useI18n()

// リアクティブな状態
const isLoading = ref(false)
const authError = ref('')

// 計算プロパティ
const redirectTo = computed(() => {
  return (route.query.redirect as string) || '/dashboard'
})

// メソッド
const handleLogin = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
  console.log('🔐 Login attempt started', {email: credentials.email})
  isLoading.value = true
  authError.value = ''

  try {
    const config = useRuntimeConfig()
    const apiMode = config.public.apiMode
    let result

    if (apiMode === 'production') {
      // Auth0の場合 - OAuth フロー（credentials不要）
      result = await signIn('auth0', {
        callbackUrl: redirectTo.value
      })
    } else {
      // Credentials（mock）の場合 - credentials必要
      result = await signIn('mock', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
        callbackUrl: redirectTo.value
      })
    }

    if (result?.error) {
      console.error('🔐 Login error:', result.error)
      authError.value = t('foundation.messages.error.validation')
    } else if (result?.ok && apiMode !== 'production') {
      // 開発環境のみ手動リダイレクト
      await router.push(redirectTo.value)
    }
    // 本番環境（Auth0）は自動リダイレクト
  } catch (error) {
    console.error('🔐 Login error:', error)
    authError.value = t('foundation.messages.error.default')
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
    authError.value = t('modules.error.unauthorized.sessionExpired')
  } else if (reason === 'unauthenticated') {
    authError.value = t('modules.error.unauthorized.reasons.unauthenticated')
  }
})
</script>