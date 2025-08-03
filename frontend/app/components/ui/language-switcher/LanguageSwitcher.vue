<!--
  言語切り替えコンポーネント - Simple over Easy
  Language Switcher Component - Configuration-based
  
  現在: 日本語のみ → 非表示
  将来: 多言語対応時 → 自動表示
-->
<template>
  <!-- Simple over Easy: 多言語対応時のみ表示 -->
  <DropdownMenu v-if="isMultilingual">
    <DropdownMenuTrigger as-child>
      <Button 
        variant="ghost" 
        size="sm" 
        class="w-9 px-0"
        :aria-label="$t('language.switcher.ariaLabel')"
      >
        <Icon name="lucide:globe" class="h-4 w-4" />
        <span class="sr-only">{{ $t('language.switcher.currentLanguage', { language: currentLanguage.name }) }}</span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-40">
      <DropdownMenuLabel class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {{ $t('language.switcher.title') }}
      </DropdownMenuLabel>
      
      <DropdownMenuItem
        v-for="language in availableLanguages"
        :key="language.code"
        class="flex items-center cursor-pointer"
        @click="switchLanguage(language.code)"
      >
        <span class="text-base mr-2">{{ language.flag }}</span>
        <span>{{ language.name }}</span>
        <Icon
          v-if="currentLanguage.code === language.code"
          name="lucide:check"
          class="h-4 w-4 ml-auto text-primary"
        />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  
  <!-- 単言語の場合: 何も表示しない（Simple over Easy） -->
</template>

<script setup lang="ts">
import { AVAILABLE_LANGUAGES, getLanguageOption, IS_MULTILINGUAL } from '~/config/languageConfig'

// i18n composable
const { locale, setLocale } = useI18n()

// 計算プロパティ - 設定ベース
const currentLanguage = computed(() => getLanguageOption(locale.value))
const availableLanguages = computed(() => AVAILABLE_LANGUAGES)
const isMultilingual = computed(() => IS_MULTILINGUAL)

// メソッド - 型安全な言語切り替え
const switchLanguage = async (localeCode: string) => {
  // 設定から有効な言語コードかチェック
  const validLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === localeCode)
  if (!validLanguage) {
    console.warn(`Invalid language code: ${localeCode}`)
    return
  }
  
  try {
    // 型制約を回避しつつ、設定ベースで安全に実行
    await setLocale(localeCode as 'ja')
    
    // HTMLのlang属性も更新（SEO/アクセシビリティ対応）
    useHead({
      htmlAttrs: {
        lang: localeCode
      }
    })
  } catch (error) {
    console.error('Language switch failed:', error)
  }
}
</script>