/**
 * i18n Type Definitions
 * TypeScript型定義で型安全な国際化を実現
 */

// Define the full message structure - will be properly typed from i18n config
export interface ILocaleMessages {
  [key: string]: string | ILocaleMessages
}

// Type alias for backward compatibility
export type LocaleMessages = ILocaleMessages
export type ILocaleMessagesExtended = ILocaleMessages

// Export individual message types for specific use cases
export type SharedMessages = LocaleMessages['shared']
export type AuthMessages = LocaleMessages['auth']
export type NavigationMessages = LocaleMessages['navigation']
export type ExpenseMessages = LocaleMessages['expense']
export type StatesMessages = LocaleMessages['states']
export type MatterMessages = LocaleMessages['matter']
export type CasesMessages = LocaleMessages['cases']
export type ClientMessages = LocaleMessages['client']
export type DocumentMessages = LocaleMessages['document']
export type FinanceMessages = LocaleMessages['finance']
export type AdminMessages = LocaleMessages['admin']
export type NotificationMessages = LocaleMessages['notification']
export type DashboardMessages = LocaleMessages['dashboard']
export type SettingsMessages = LocaleMessages['settings']
export type ErrorMessages = LocaleMessages['error']
export type HeaderMessages = LocaleMessages['header']
export type LanguageMessages = LocaleMessages['language']