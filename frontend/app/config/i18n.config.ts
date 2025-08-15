import ja from '~~/i18n/locales/ja'

export default defineI18nConfig(() => ({
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