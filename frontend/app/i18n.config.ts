/**
 * Vue I18n Configuration
 * TypeScript-based internationalization configuration
 */

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'ja',
  fallbackLocale: 'ja',
  globalInjection: true,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  warnHtmlMessage: false,
  escapeParameter: true,
  pluralizationRules: {
    ja: () => 0, // Japanese doesn't have plural forms
    en: (choice: number) => {
      if (choice === 0) return 0
      if (choice === 1) return 1
      return 2
    }
  },
  numberFormats: {
    ja: {
      currency: {
        style: 'currency',
        currency: 'JPY',
        notation: 'standard'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    },
    en: {
      currency: {
        style: 'currency',
        currency: 'USD',
        notation: 'standard'
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
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    en: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric'
      }
    }
  }
}))