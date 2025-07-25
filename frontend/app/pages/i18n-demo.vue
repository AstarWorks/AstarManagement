<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          {{ $t('navigation.dashboard') }} - i18n Demo
        </h1>
        <p class="text-gray-600">
          現在の言語: {{ currentLocale.name }} ({{ currentLocale.code }})
        </p>
        <div class="mt-4">
          <LanguageSwitcher />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- 基本的な翻訳 -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">{{ $t('common.common') }}</h2>
          <div class="space-y-2 text-sm">
            <div><strong>保存:</strong> {{ $t('common.save') }}</div>
            <div><strong>削除:</strong> {{ $t('common.delete') }}</div>
            <div><strong>検索:</strong> {{ $t('common.search') }}</div>
            <div><strong>確認:</strong> {{ $t('common.confirm') }}</div>
            <div><strong>キャンセル:</strong> {{ $t('common.cancel') }}</div>
          </div>
        </Card>

        <!-- ナビゲーション -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">{{ $t('navigation.dashboard') }}</h2>
          <div class="space-y-2 text-sm">
            <div><strong>案件管理:</strong> {{ $t('navigation.matters') }}</div>
            <div><strong>顧客管理:</strong> {{ $t('navigation.clients') }}</div>
            <div><strong>文書管理:</strong> {{ $t('navigation.documents') }}</div>
            <div><strong>財務管理:</strong> {{ $t('navigation.finance') }}</div>
            <div><strong>システム管理:</strong> {{ $t('navigation.admin') }}</div>
          </div>
        </Card>

        <!-- 認証関連 -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">{{ $t('auth.login.title') }}</h2>
          <div class="space-y-2 text-sm">
            <div><strong>メールアドレス:</strong> {{ $t('auth.login.email.label') }}</div>
            <div><strong>パスワード:</strong> {{ $t('auth.login.password.label') }}</div>
            <div><strong>ログイン状態を保持:</strong> {{ $t('auth.login.rememberMe') }}</div>
            <div><strong>ログイン:</strong> {{ $t('auth.login.submit') }}</div>
          </div>
        </Card>

        <!-- ダッシュボード統計 -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">{{ $t('dashboard.title') }}</h2>
          <div class="space-y-2 text-sm">
            <div><strong>進行中の案件:</strong> {{ $t('dashboard.stats.activeMatter') }}</div>
            <div><strong>総顧客数:</strong> {{ $t('dashboard.stats.totalClients') }}</div>
            <div><strong>今月の文書数:</strong> {{ $t('dashboard.stats.documentsThisMonth') }}</div>
            <div><strong>今月の売上:</strong> {{ $t('dashboard.stats.revenueThisMonth') }}</div>
          </div>
        </Card>

        <!-- 通貨フォーマット -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">通貨フォーマット</h2>
          <div class="space-y-2 text-sm">
            <div><strong>1,000,000:</strong> {{ formatCurrency(1000000) }}</div>
            <div><strong>500,000:</strong> {{ formatCurrency(500000) }}</div>
            <div><strong>123,456:</strong> {{ formatCurrency(123456) }}</div>
          </div>
        </Card>

        <!-- 日付フォーマット -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">日付フォーマット</h2>
          <div class="space-y-2 text-sm">
            <div><strong>今日 (短):</strong> {{ formatShortDate(new Date()) }}</div>
            <div><strong>今日 (長):</strong> {{ formatLongDate(new Date()) }}</div>
            <div><strong>1時間前:</strong> {{ formatRelativeTime(oneHourAgo) }}</div>
            <div><strong>1日前:</strong> {{ formatRelativeTime(oneDayAgo) }}</div>
          </div>
        </Card>
      </div>

      <div class="mt-8 text-center">
        <Button variant="outline" @click="$router.push('/dashboard')">
          {{ $t('dashboard.title') }}に戻る
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ページメタデータ
definePageMeta({
  layout: false
})

// i18n
const { locale, locales } = useI18n()
const { formatCurrency } = useCurrencyFormat()
const { formatShortDate, formatLongDate } = useDateFormat()
const { formatRelativeTime } = useRelativeTime()

// 計算プロパティ
const currentLocale = computed(() => {
  return locales.value.find(l => l.code === locale.value) || locales.value[0]
})

// 時間の例
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

// SEO
useHead({
  title: 'i18n Demo - Astar Management',
  meta: [
    { name: 'description', content: 'Internationalization demonstration for Astar Management' }
  ]
})
</script>