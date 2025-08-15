/**
 * Vue I18n TypeScript Type Definitions
 * Provides type-safe translation keys for compile-time validation
 */

import type { LocaleMessages, LocaleKey } from './locale-messages'

declare module 'vue-i18n' {
  /**
   * Define the locale message schema for type-safe translations
   */
  export interface DefineLocaleMessage extends LocaleMessages {}

  /**
   * Custom modifiers for translations
   */
  export interface CustomModifiers {
    capitalize: (str: string) => string
    lowercase: (str: string) => string
    uppercase: (str: string) => string
  }

  /**
   * Custom blocks for locale messages
   */
  export interface CustomBlocks {
    // Add custom blocks if needed
  }
}

/**
 * Type-safe translation key type
 * Use this type for variables that hold translation keys
 */
export type TranslationKey = LocaleKey

/**
 * Type helper for getting the parameters of a translation message
 * Extracts placeholder parameters from translation strings
 */
export type TranslationParams<Key extends TranslationKey> = Record<string, string | number>

/**
 * Type for the global $t function
 */
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /**
     * Type-safe translation function
     * @param key - The translation key
     * @param params - Optional parameters for interpolation
     * @returns The translated string
     */
    $t(key: string, params?: Record<string, any>): string
    
    /**
     * Type-safe translation function for static keys
     * @param key - The translation key (typed as LocaleKey)
     * @param params - Optional parameters for interpolation
     * @returns The translated string
     */
    $tt(key: LocaleKey, params?: Record<string, unknown>): string
    
    /**
     * Type-safe plural translation function
     * @param key - The translation key
     * @param count - The count for pluralization
     * @param params - Optional parameters for interpolation
     * @returns The translated string
     */
    $tc(key: TranslationKey, count: number, params?: TranslationParams<typeof key>): string
    
    /**
     * Type-safe translation existence check
     * @param key - The translation key to check
     * @returns Whether the key exists
     */
    $te(key: TranslationKey): boolean
    
    /**
     * Type-safe date formatting
     * @param date - The date to format
     * @param format - The format key
     * @returns The formatted date string
     */
    $d(date: Date | number, format?: 'short' | 'long'): string
    
    /**
     * Type-safe number formatting
     * @param num - The number to format
     * @param format - The format key
     * @returns The formatted number string
     */
    $n(num: number, format?: 'currency' | 'decimal'): string
  }
}

/**
 * Composable helper types
 */
export interface UseI18nReturn {
  t: (key: TranslationKey, params?: TranslationParams<typeof key>) => string
  tc: (key: TranslationKey, count: number, params?: TranslationParams<typeof key>) => string
  te: (key: TranslationKey) => boolean
  d: (date: Date | number, format?: 'short' | 'long') => string
  n: (num: number, format?: 'currency' | 'decimal') => string
  locale: Ref<'ja'>
  locales: Ref<Array<'ja'>>
}

declare global {
  /**
   * Helper type for using translation keys in component props
   */
  export type I18nKey = TranslationKey
  
  /**
   * Helper type for translation parameters
   */
  export type I18nParams<T extends TranslationKey = TranslationKey> = TranslationParams<T>
}

export {}