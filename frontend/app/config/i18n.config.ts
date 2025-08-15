/**
 * i18n Configuration
 */

import ja from '../locales/ja'

export default defineI18nConfig(() => ({
  locale: 'ja',
  fallbackLocale: 'ja',
  messages: {
    ja
  },
  numberFormats: {
    ja: {
      currency: {
        style: 'currency',
        currency: 'JPY',
        currencyDisplay: 'symbol'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    }
  },
  datetimeFormats: {
    ja: {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }
    }
  }
}))