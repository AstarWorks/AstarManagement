<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-blue-600" />
      <p class="mt-4 text-sm text-gray-600">リダイレクト中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// リダイレクトミドルウェアを使用
definePageMeta({
  middleware: 'redirect',
  layout: false
})

// このページは通常表示されることはなく、
// ミドルウェアによって適切なページにリダイレクトされる

// ページタイトル設定
const { t } = useI18n()
useHead({
  title: t('app.title'),
  meta: [
    { name: 'description', content: t('app.description') }
  ]
})
</script>