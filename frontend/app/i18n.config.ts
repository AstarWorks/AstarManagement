import ja from "~~/i18n/locales/ja";

export default defineI18nConfig(() => ({
    locale: 'ja',
    messages: {
        ja,
        // en
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
        },
        en: {
            currency: {
                style: 'currency',
                currency: 'USD',
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
        },
        en: {
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