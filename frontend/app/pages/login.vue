<template>
  <LoginForm 
    :is-loading="isLoading"
    :auth-error="authError"
    @submit="handleLogin"
    @forgot-password="handleForgotPassword"
  />
</template>

<script setup lang="ts">
import LoginForm from '~/modules/auth/components/LoginForm.vue'
import {useI18n} from "vue-i18n";

// ゲスト専用ページ（認証済みユーザーはリダイレクト）
definePageMeta({
  middleware: 'guest',
  layout: 'auth'
})

// 状態管理 - 業界標準のuseAuth composableを使用
const { signIn } = useAuth()
const { fetchProfile } = useUserProfile()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// リアクティブな状態
const isLoading = ref(false)
const authError = ref('')

// 計算プロパティ
const redirectTo = computed(() => {
  return (route.query.redirect as string) || '/dashboard'
})

// メソッド
const handleLogin = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
  console.log('🔐 Login attempt started', { email: credentials.email })
  isLoading.value = true
  authError.value = ''

  try {
    // Use @sidebase/nuxt-auth signIn
    const result = await signIn(credentials)

    console.log('🔐 Login result:', result)

    if (result?.error) {
      authError.value = t('foundation.messages.error.validation')
    } else if (result?.ok) {
      // Fetch user profile after successful authentication
      await fetchProfile()
      
      // 2FA check should be handled by security middleware
      // This is now separated from business profile
      console.log('✅ Login successful, checking for 2FA via security middleware')
      
      // 2FA check is now handled by security middleware
      // Direct 2FA check removed - middleware handles this flow
      
      // Login successful
      console.log('🔐 Login successful, redirecting to:', redirectTo.value)
      await router.push(redirectTo.value)
    }
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