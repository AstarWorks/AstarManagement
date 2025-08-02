/**
 * Vue I18n Configuration
 * TypeScript-based internationalization configuration - Japanese Only
 */

import ja from './locales/ja'

export default defineI18nConfig(() => ({
    locale: 'ja',
    fallbackLocale: 'ja',
    globalInjection: true,
    silentTranslationWarn: false, // Enable warnings for missing keys
    silentFallbackWarn: false,
    warnHtmlMessage: false,
    escapeParameter: true,
    messages: {
        ja
    },
    pluralizationRules: {
        ja: () => 0 // Japanese doesn't have plural forms
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
        }
    }
}))