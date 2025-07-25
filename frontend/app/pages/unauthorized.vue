<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <Icon name="lucide:shield-x" class="mx-auto h-16 w-16 text-red-600" />
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          アクセス拒否
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ errorMessage }}
        </p>
      </div>

      <Card class="p-6 text-left">
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900">詳細情報</h3>
          
          <div v-if="reason" class="text-sm">
            <span class="font-medium text-gray-700">理由:</span>
            <span class="ml-2 text-gray-600">{{ reasonText }}</span>
          </div>

          <div v-if="requiredInfo" class="text-sm">
            <span class="font-medium text-gray-700">必要な権限:</span>
            <div class="ml-2 mt-1">
              <div v-if="requiredInfo.permissions?.length" class="text-gray-600">
                <strong>権限:</strong> {{ requiredInfo.permissions.join(', ') }}
              </div>
              <div v-if="requiredInfo.roles?.length" class="text-gray-600">
                <strong>ロール:</strong> {{ requiredInfo.roles.join(', ') }}
              </div>
            </div>
          </div>

          <div v-if="originalPath" class="text-sm">
            <span class="font-medium text-gray-700">アクセス先:</span>
            <span class="ml-2 text-gray-600 font-mono">{{ originalPath }}</span>
          </div>

          <div v-if="user" class="text-sm">
            <span class="font-medium text-gray-700">現在のユーザー:</span>
            <div class="ml-2 mt-1 space-y-1">
              <div class="text-gray-600">{{ user.name }} ({{ user.email }})</div>
              <div class="text-gray-600">
                <strong>ロール:</strong> {{ userRoles.join(', ') || 'なし' }}
              </div>
              <div class="text-gray-600">
                <strong>権限:</strong> {{ userPermissions.join(', ') || 'なし' }}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div class="space-y-3">
        <Button class="w-full" @click="goBack">
          前のページに戻る
        </Button>
        
        <Button variant="outline" class="w-full" @click="goToDashboard">
          ダッシュボードに戻る
        </Button>

        <Button 
          v-if="!user" 
          variant="outline" 
          class="w-full" 
          @click="goToLogin"
        >
          ログインページに移動
        </Button>
      </div>

      <!-- 管理者への連絡リンク -->
      <div class="text-xs text-gray-500">
        <p>
          この画面が間違って表示されている場合は、
          <a href="mailto:admin@example.com" class="text-blue-600 hover:text-blue-500">
            システム管理者
          </a>
          にお問い合わせください。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getAccessDeniedMessage } from '~/utils/route-guards'

// レイアウトを使用しない
definePageMeta({
  layout: false
})

// 状態管理
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// URLパラメータから情報を取得
const reason = route.query.reason as string
const originalPath = route.query.path as string
const requiredString = route.query.required as string

// 計算プロパティ
const user = computed(() => authStore.user)
const userRoles = computed(() => authStore.roles)
const userPermissions = computed(() => authStore.permissions)

const errorMessage = computed(() => getAccessDeniedMessage(reason))

const reasonText = computed(() => {
  const reasonMap: Record<string, string> = {
    'insufficient_permissions': '必要な権限がありません',
    'insufficient_role': '必要なロールがありません',
    'insufficient_roles_all': 'すべての必要なロールがありません',
    'already_authenticated': '既にログイン済みです',
    'unauthenticated': '認証が必要です',
    'session_expired': 'セッションが期限切れです',
    'two_factor_required': '2要素認証が必要です',
    'account_disabled': 'アカウントが無効です',
    'maintenance_mode': 'メンテナンス中です'
  }
  return reasonMap[reason] || '不明なエラー'
})

const requiredInfo = computed(() => {
  if (!requiredString) return null
  
  try {
    return JSON.parse(requiredString)
  } catch {
    // JSONパースに失敗した場合は文字列として扱う
    if (reason === 'insufficient_role' || reason === 'insufficient_roles_all') {
      return { roles: requiredString.split(',') }
    }
    return null
  }
})

// メソッド
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}

const goToDashboard = () => {
  router.push('/dashboard')
}

const goToLogin = () => {
  router.push({
    path: '/login',
    query: originalPath ? { redirect: originalPath } : {}
  })
}

// ページタイトル設定
useHead({
  title: 'アクセス拒否 - Astar Management',
  meta: [
    { name: 'description', content: 'このページにアクセスする権限がありません' }
  ]
})

// アクセスログの記録（セキュリティ監査用）
onMounted(() => {
  console.warn('Unauthorized access attempt:', {
    user: user.value?.email || 'anonymous',
    reason,
    originalPath,
    required: requiredInfo.value,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  })
})
</script>