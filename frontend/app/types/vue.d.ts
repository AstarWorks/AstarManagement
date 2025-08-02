/**
 * Vue Runtime Core Type Extensions
 * Fixes IDE type recognition for i18n $t function
 */

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /**
     * Translation function from @nuxtjs/i18n
     * @param key - Translation key
     * @param values - Interpolation values
     * @returns Translated string
     */
    $t: (key: string, values?: Record<string, any>) => string
    
    /**
     * Number formatting function
     * @param value - Number to format
     * @param format - Format name
     * @param locale - Locale override
     * @returns Formatted number string
     */
    $n: (value: number, format?: string, locale?: string) => string
    
    /**
     * Date formatting function
     * @param value - Date to format
     * @param format - Format name
     * @param locale - Locale override
     * @returns Formatted date string
     */
    $d: (value: Date | number, format?: string, locale?: string) => string
  }
}

export {}