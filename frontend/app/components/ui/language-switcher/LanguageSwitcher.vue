<!--
  言語切り替えコンポーネント
  Language Switcher Component
-->
<template>
  <div class="relative">
    <Button 
      variant="ghost" 
      size="sm" 
      class="w-9 px-0"
      @click="toggleMenu"
    >
      <Icon name="lucide:globe" class="h-4 w-4" />
      <span class="sr-only">{{ currentLocale.name }}</span>
    </Button>
    
    <!-- ドロップダウンメニュー -->
    <div
      v-if="isMenuOpen"
      class="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
    >
      <div class="py-1">
        <div class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          言語 / Language
        </div>
        <button
          v-for="locale in availableLocales"
          :key="locale.code"
          class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
:class="[
            currentLocale.code === locale.code ? 'bg-gray-50 font-medium' : ''
          ]"
          @click="switchLanguage(locale.code)"
        >
          <span class="text-base mr-2">{{ getFlag(locale.code) }}</span>
          <span>{{ locale.name }}</span>
          <Icon
            v-if="currentLocale.code === locale.code"
            name="lucide:check"
            class="h-4 w-4 ml-auto text-blue-600"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// i18n
const { locale, locales, setLocale } = useI18n()

// 状態
const isMenuOpen = ref(false)

// 計算プロパティ
const currentLocale = computed(() => {
  return locales.value.find(l => l.code === locale.value) || locales.value[0]
})

const availableLocales = computed(() => locales.value)

// メソッド
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const switchLanguage = async (localeCode: string) => {
  await setLocale(localeCode)
  isMenuOpen.value = false
  
  // メタタグも更新
  useHead({
    htmlAttrs: {
      lang: localeCode
    }
  })
}

const getFlag = (localeCode: string): string => {
  const flags: Record<string, string> = {
    'ja': '🇯🇵',
    'en': '🇺🇸'
  }
  return flags[localeCode] || '🌐'
}

// 外部クリックでメニューを閉じる
onClickOutside(templateRef('languageSwitcher'), () => {
  isMenuOpen.value = false
})
</script>