/**
 * 型安全なi18nコンポーザブル
 * コンパイル時に翻訳キーの存在をチェック
 */

import ja from '../locales/ja'

// ネストされたオブジェクトのキーをドット記法で取得する型
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & string]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`
}[keyof ObjectType & string]

// 翻訳キーの型（日本語localeから自動生成）
export type TranslationKey = NestedKeyOf<typeof ja>


/**
 * 型安全な翻訳関数を提供するコンポーザブル
 * 
 * @example
 * ```vue
 * const { t } = useTypedI18n()
 * 
 * // OK: 存在するキー
 * t('expense.navigation.title')
 * t('auth.login.title')
 * 
 * // エラー: 存在しないキー（コンパイル時に検出）
 * t('expense.invalid.key') // TypeScript Error!
 * ```
 */
export function useTypedI18n() {
  const { t: originalT } = useI18n()

  // 型安全なラッパー関数
  const t = (key: TranslationKey, params?: Record<string, unknown>): string => {
    return originalT(key, params || {})
  }

  // キーの存在チェック（開発時のみ）
  const hasKey = (key: string): key is TranslationKey => {
    if (import.meta.dev) {
      try {
        const keys = key.split('.')
        let current: unknown = ja
        
        for (const k of keys) {
          if (typeof current !== 'object' || current === null || !(k in current)) {
            console.warn(`[i18n] Key not found: ${key}`)
            return false
          }
          current = (current as Record<string, unknown>)[k]
        }
        return true
      } catch {
        return false
      }
    }
    return true
  }

  return {
    t,
    hasKey
  }
}

/**
 * 特定のスコープに限定した型安全な翻訳関数
 * 
 * @example
 * ```vue
 * const { t } = useScopedI18n('expense')
 * 
 * // 'expense.'プレフィックスなしで使用可能
 * t('navigation.title') // = 'expense.navigation.title'
 * t('list.description') // = 'expense.list.description'
 * ```
 */
export function useScopedI18n<Scope extends keyof typeof ja>(scope: Scope) {
  const { t: originalT } = useI18n()
  
  type ScopedKey = typeof ja[Scope] extends object
    ? NestedKeyOf<typeof ja[Scope]>
    : never

  const t = (key: ScopedKey, params?: Record<string, unknown>): string => {
    return originalT(`${scope}.${key}`, params || {})
  }

  return { t }
}