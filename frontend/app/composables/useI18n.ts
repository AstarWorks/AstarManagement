/**
 * 型安全なi18nコンポーザブル
 * Type-safe i18n composable
 */

import type { LocaleMessages } from '~/types/i18n'

/**
 * 型安全なi18n翻訳関数
 * Type-safe i18n translation function
 */
export function useTypedI18n() {
  const { t, locale, locales, setLocale } = useI18n<LocaleMessages>()

  return {
    t,
    locale,
    locales,
    setLocale,
    // 型安全な翻訳ヘルパー
    tt: t as (key: keyof LocaleMessages | string, params?: Record<string, unknown>) => string
  }
}

/**
 * 通貨フォーマット用のコンポーザブル
 */
export function useCurrencyFormat() {
  const { n } = useI18n()
  
  const formatCurrency = (amount: number) => {
    return n(amount, 'currency')
  }
  
  const formatDecimal = (amount: number) => {
    return n(amount, 'decimal')
  }
  
  return {
    formatCurrency,
    formatDecimal
  }
}

/**
 * 日付フォーマット用のコンポーザブル
 */
export function useDateFormat() {
  const { d } = useI18n()
  
  const formatShortDate = (date: Date | string | number) => {
    return d(new Date(date), 'short')
  }
  
  const formatLongDate = (date: Date | string | number) => {
    return d(new Date(date), 'long')
  }
  
  return {
    formatShortDate,
    formatLongDate
  }
}

/**
 * 相対時間フォーマット用のコンポーザブル
 */
export function useRelativeTime() {
  const { t } = useTypedI18n()
  
  const formatRelativeTime = (date: Date | string | number): string => {
    const now = new Date()
    const targetDate = new Date(date)
    const diffMs = now.getTime() - targetDate.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return t('notification.time.now')
    if (diffMins < 60) return t('notification.time.minutesAgo', { minutes: diffMins })
    if (diffHours < 24) return t('notification.time.hoursAgo', { hours: diffHours })
    if (diffDays < 7) return t('notification.time.daysAgo', { days: diffDays })
    
    // 1週間以上の場合は通常の日付フォーマット
    const { formatShortDate } = useDateFormat()
    return formatShortDate(targetDate)
  }
  
  return {
    formatRelativeTime
  }
}

/**
 * バリデーションメッセージ用のコンポーザブル
 */
export function useValidationMessages() {
  const { t } = useTypedI18n()
  
  const getRequiredMessage = () => t('error.validation.required')
  
  const getEmailMessage = () => t('error.validation.email')
  
  const getMinLengthMessage = (min: number) => 
    t('error.validation.minLength', { min })
  
  const getMaxLengthMessage = (max: number) => 
    t('error.validation.maxLength', { max })
  
  const getNumericMessage = () => t('error.validation.numeric')
  
  const getAlphaNumericMessage = () => t('error.validation.alphaNumeric')
  
  return {
    getRequiredMessage,
    getEmailMessage,
    getMinLengthMessage,
    getMaxLengthMessage,
    getNumericMessage,
    getAlphaNumericMessage
  }
}

/**
 * エラーメッセージ用のコンポーザブル
 */
export function useErrorMessages() {
  const { t } = useTypedI18n()
  
  const getNetworkErrorMessage = (errorType: string) => {
    const errorMessages: Record<string, string> = {
      'offline': t('error.network.offline'),
      'timeout': t('error.network.timeout'),
      'server-error': t('error.network.serverError'),
      'not-found': t('error.network.notFound'),
      'unauthorized': t('error.network.unauthorized'),
      'forbidden': t('error.network.forbidden')
    }
    
    return errorMessages[errorType] || t('error.generic.somethingWentWrong')
  }
  
  const getGenericErrorMessage = () => t('error.generic.somethingWentWrong')
  
  const getTryAgainMessage = () => t('error.generic.tryAgain')
  
  const getContactSupportMessage = () => t('error.generic.contactSupport')
  
  return {
    getNetworkErrorMessage,
    getGenericErrorMessage,
    getTryAgainMessage,
    getContactSupportMessage
  }
}

/**
 * ナビゲーション用のコンポーザブル
 */
export function useNavigationMessages() {
  const { t } = useTypedI18n()
  
  const getNavigationLabel = (key: string) => {
    try {
      return t(`navigation.${key}`)
    } catch {
      return key
    }
  }
  
  const getMenuLabel = (section: string, key: string) => {
    try {
      return t(`navigation.menu.${section}.${key}`)
    } catch {
      return key
    }
  }
  
  return {
    getNavigationLabel,
    getMenuLabel
  }
}

/**
 * 通知メッセージ用のコンポーザブル
 */
export function useNotificationMessages() {
  const { t } = useTypedI18n()
  
  const getNotificationTypeLabel = (type: string) => {
    try {
      return t(`notification.types.${type}`)
    } catch {
      return type
    }
  }
  
  const getNotificationPriorityLabel = (priority: string) => {
    try {
      return t(`notification.priority.${priority}`)
    } catch {
      return priority
    }
  }
  
  return {
    getNotificationTypeLabel,
    getNotificationPriorityLabel
  }
}