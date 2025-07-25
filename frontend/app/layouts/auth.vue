<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- 法律事務所ブランディング -->
      <div class="text-center mb-8">
        <div class="flex justify-center">
          <Icon name="lucide:scale" class="h-12 w-12 text-blue-600" />
        </div>
        <h1 class="mt-4 text-3xl font-bold text-gray-900">
          Astar Management
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          法律事務所業務管理システム
        </p>
        <div class="mt-4 flex justify-center space-x-6 text-xs text-gray-500">
          <div class="flex items-center space-x-1">
            <Icon name="lucide:shield-check" class="h-3 w-3" />
            <span>セキュア</span>
          </div>
          <div class="flex items-center space-x-1">
            <Icon name="lucide:lock" class="h-3 w-3" />
            <span>暗号化</span>
          </div>
          <div class="flex items-center space-x-1">
            <Icon name="lucide:users" class="h-3 w-3" />
            <span>多事務所対応</span>
          </div>
        </div>
      </div>

      <!-- メインコンテンツ -->
      <div class="relative z-10 bg-white shadow-2xl rounded-2xl p-8">
        <slot />
      </div>

      <!-- フッター -->
      <div class="mt-8 text-center">
        <div class="text-xs text-gray-500 space-y-1">
          <p>&copy; 2025 Astar Management. All rights reserved.</p>
          <p>弁護士・依頼者間の秘匿特権を保護します</p>
        </div>
        
        <!-- 言語切り替え -->
        <div class="mt-4 flex justify-center">
          <LanguageSwitcher variant="minimal" />
        </div>
      </div>
    </div>

    <!-- 背景装飾 -->
    <div class="absolute inset-0 z-0 pointer-events-none">
      <div class="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"/>
      <div class="absolute top-40 right-20 w-16 h-16 bg-indigo-200 rounded-full opacity-20 animate-pulse" style="animation-delay: 2s;"/>
      <div class="absolute bottom-40 left-20 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse" style="animation-delay: 4s;"/>
      <div class="absolute bottom-20 right-10 w-12 h-12 bg-pink-200 rounded-full opacity-20 animate-pulse" style="animation-delay: 6s;"/>
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO and meta setup for authentication pages
useHead({
  title: 'ログイン - Astar Management',
  meta: [
    { name: 'description', content: '法律事務所管理システムへのログイン' },
    { name: 'robots', content: 'noindex,nofollow' }, // Authentication pages should not be indexed
  ],
  bodyAttrs: {
    class: 'antialiased'
  }
})

// Layout files cannot use definePageMeta() - it's only for pages
</script>

<style scoped>
/* カスタムアニメーション */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-container {
  animation: fadeInUp 0.6s ease-out;
}

/* 背景グラデーションの改善 */
.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, 
    rgb(239 246 255), 
    rgb(238 242 255), 
    rgb(224 231 255)
  );
}

/* フォーカス状態の改善 */
:deep(.auth-form input:focus) {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-color: transparent;
}

:deep(.auth-form button:focus) {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ダークモード対応（将来の拡張） */
@media (prefers-color-scheme: dark) {
  .auth-layout {
    /* ダークモード用のスタイルは今後実装 */
  }
}
</style>