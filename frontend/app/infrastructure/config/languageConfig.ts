/**
 * 言語設定 - Simple over Easy
 * Language Configuration - Centralized and extensible
 * 
 * 法律事務所特有の言語設定を一元管理
 */

export interface ILanguageOption {
  code: string
  name: string
  flag: string
  isRTL?: boolean
}

/**
 * 利用可能な言語設定
 * 法律事務所の国際化要件に基づく
 * 
 * 現在は日本語のみ - Simple over Easy原則により
 * 多言語対応が必要になったときのための拡張可能な設計
 */
export const AVAILABLE_LANGUAGES: ILanguageOption[] = [
  {
    code: 'ja',
    name: '日本語',
    flag: '🇯🇵',
    isRTL: false
  }
  // NOTE: 将来の拡張用 - 現在はコメントアウト
  // {
  //   code: 'en',
  //   name: 'English', 
  //   flag: '🇺🇸',
  //   isRTL: false
  // }
]

/**
 * 多言語対応が有効かどうか
 * Simple over Easy: 1言語の場合は言語スイッチャーを表示しない
 */
export const IS_MULTILINGUAL = AVAILABLE_LANGUAGES.length > 1

/**
 * デフォルト言語
 */
export const DEFAULT_LANGUAGE = 'ja'

/**
 * 言語コードから言語オプションを取得
 */
export function getLanguageOption(code: string): ILanguageOption {
  return AVAILABLE_LANGUAGES.find(lang => lang.code === code) 
    || AVAILABLE_LANGUAGES.find(lang => lang.code === DEFAULT_LANGUAGE)!
}

/**
 * 法律事務所特有の言語切り替え設定
 */
export const LANGUAGE_SWITCHER_CONFIG = {
  /**
   * アクセシビリティ対応
   */
  accessibility: {
    ariaLabel: 'language.switcher.ariaLabel', // i18n key
    toggleLabel: 'language.switcher.toggleLabel' // i18n key
  },
  
  /**
   * UI設定
   */
  ui: {
    showFlag: true,
    showName: true,
    placement: 'bottom-end' as const,
    maxWidth: '160px'
  }
}