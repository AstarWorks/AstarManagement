/**
 * Locale Messages Type Definitions
 * Auto-generated based on actual locale files
 */

import type common from '~~/i18n/locales/ja/common.json'
import type auth from '~~/i18n/locales/ja/auth.json'
import type navigation from '~~/i18n/locales/ja/navigation.json'
import type expense from '~~/i18n/locales/ja/expense.json'
import type states from '~~/i18n/locales/ja/states.json'
import type matter from '~~/i18n/locales/ja/matter.json'
import type cases from '~~/i18n/locales/ja/cases.json'
import type client from '~~/i18n/locales/ja/client.json'
import type document from '~~/i18n/locales/ja/document.json'
import type finance from '~~/i18n/locales/ja/finance.json'
import type admin from '~~/i18n/locales/ja/admin.json'
import type notification from '~~/i18n/locales/ja/notification.json'
import type dashboard from '~~/i18n/locales/ja/dashboard.json'
import type settings from '~~/i18n/locales/ja/settings.json'
import type error from '~~/i18n/locales/ja/error.json'
import type header from '~~/i18n/locales/ja/header.json'
import type language from '~~/i18n/locales/ja/language.json'

/**
 * Complete locale messages structure
 */
export interface ILocaleMessages {
  common: typeof common
  auth: typeof auth
  navigation: typeof navigation
  expense: typeof expense
  states: typeof states
  matter: typeof matter
  cases: typeof cases
  client: typeof client
  document: typeof document
  finance: typeof finance
  admin: typeof admin
  notification: typeof notification
  dashboard: typeof dashboard
  settings: typeof settings
  error: typeof error
  header: typeof header
  language: typeof language
}

/**
 * Recursively extract all possible translation keys
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PathImpl<T, Key extends keyof T> =
  Key extends string
    ? T[Key] extends Record<string, unknown>
      ? T[Key] extends ArrayLike<unknown>
        ? never
        : | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof unknown[]>> & string}`
          | `${Key}.${Exclude<keyof T[Key], keyof unknown[]> & string}`
      : never
    : never

// type PathType<T> = PathImpl<T, keyof T> | keyof T // Currently unused

/**
 * Type-safe translation key
 * TODO: Once TypeScript properly infers JSON module types, 
 * we can re-enable strict typing with: Path<LocaleMessages> & string
 * For now, we use string to allow all keys while still providing IntelliSense
 */
export type LocaleKey = string