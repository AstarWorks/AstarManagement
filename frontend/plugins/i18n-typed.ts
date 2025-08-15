/**
 * 型安全なi18n関数 $tt のNuxtプラグイン
 * Static locale keys用の型安全な翻訳関数を提供
 */
import { defineNuxtPlugin } from '#app'
import type { LocaleKey } from '~/types/locale-messages'

export default defineNuxtPlugin(() => {
  const { t } = useI18n()
  
  /**
   * 型安全な翻訳関数 - 静的キー専用
   * @param key - 翻訳キー（LocaleKey型で型チェックされる）
   * @param params - オプショナルなパラメーター
   * @returns 翻訳された文字列
   */
  const tt = (key: LocaleKey, params?: Record<string, unknown>) => {
    return t(key as string, params)
  }

  return {
    provide: {
      tt
    }
  }
})