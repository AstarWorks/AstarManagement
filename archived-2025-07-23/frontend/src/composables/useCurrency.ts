/**
 * Currency Composable - Multi-Currency Support
 * 
 * @description Comprehensive currency management composable with conversion,
 * formatting, and exchange rate management. Integrates with TanStack Query
 * for rate caching and automatic updates.
 * 
 * @author Claude
 * @created 2025-07-04
 * @task T06_S14 - Multi-Currency Support
 */

import { ref, computed, readonly, unref, watch, type Ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useLocalStorage } from '@vueuse/core'
import { formatCurrency as utilFormatCurrency } from '~/utils/currencyFormatters'
import type { 
  Currency, 
  ExchangeRate, 
  CurrencyConversion,
  CurrencyFormatOptions 
} from '~/types/currency'

export interface UseCurrencyOptions {
  /** Auto-refresh exchange rates interval in milliseconds */
  refreshInterval?: number
  /** Stale time for cached rates in milliseconds */
  staleTime?: number
  /** Enable offline rate caching */
  enableOfflineCache?: boolean
  /** Default base currency for conversions */
  baseCurrency?: string
}

/**
 * Currency management composable
 */
export function useCurrency(options: UseCurrencyOptions = {}) {
  const {
    refreshInterval = 1000 * 60 * 30, // 30 minutes
    staleTime = 1000 * 60 * 15, // 15 minutes
    enableOfflineCache = true,
    baseCurrency = 'JPY'
  } = options

  const queryClient = useQueryClient()

  // Reactive state
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastRateUpdate = ref<Date | null>(null)

  // Exchange rates query with automatic refresh
  const { 
    data: exchangeRates, 
    isLoading: ratesLoading, 
    error: ratesError,
    refetch: refetchRates 
  } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      try {
        const response = await $fetch<{ data: ExchangeRate[], lastUpdated: string }>('/api/exchange-rates')
        lastRateUpdate.value = new Date(response.lastUpdated)
        return response.data
      } catch (err) {
        // Fallback to cached rates if available
        if (enableOfflineCache) {
          const cached = await getCachedRates()
          if (cached.length > 0) {
            console.warn('Using cached exchange rates due to API failure')
            return cached
          }
        }
        throw err
      }
    },
    staleTime,
    refetchInterval: refreshInterval,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  // Supported currencies query
  const { data: supportedCurrencies } = useQuery({
    queryKey: ['currencies', 'supported'],
    queryFn: () => $fetch<Currency[]>('/api/currencies/supported'),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })

  // Historical rates query function
  const getHistoricalRates = async (date: Date, fromCurrency: string, toCurrency: string) => {
    return useQuery({
      queryKey: ['exchange-rates', 'historical', date.toISOString(), fromCurrency, toCurrency],
      queryFn: () => $fetch<ExchangeRate>('/api/exchange-rates/historical', {
        query: {
          date: date.toISOString().split('T')[0],
          from: fromCurrency,
          to: toCurrency
        }
      }),
      staleTime: 1000 * 60 * 60 * 24 * 30, // 30 days for historical data
    })
  }

  // Exchange rate lookup with caching
  const getExchangeRate = (fromCurrency: string, toCurrency: string): ExchangeRate | null => {
    if (fromCurrency === toCurrency) {
      return {
        id: 'same-currency',
        fromCurrency,
        toCurrency,
        rate: 1,
        rateDate: new Date(),
        source: 'internal',
        isActive: true,
        createdAt: new Date()
      }
    }

    if (!exchangeRates.value) return null

    return exchangeRates.value.find(rate => 
      rate.fromCurrency === fromCurrency && 
      rate.toCurrency === toCurrency &&
      rate.isActive
    ) || null
  }

  // Currency conversion with rate lookup
  const convertAmount = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date
  ): CurrencyConversion | null => {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: toCurrency,
        exchangeRate: 1,
        conversionDate: date || new Date(),
        source: 'internal'
      }
    }

    const rate = getExchangeRate(fromCurrency, toCurrency)
    if (!rate) {
      console.warn(`Exchange rate not found: ${fromCurrency} -> ${toCurrency}`)
      return null
    }

    const convertedAmount = amount * rate.rate

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount,
      convertedCurrency: toCurrency,
      exchangeRate: rate.rate,
      conversionDate: rate.rateDate,
      source: rate.source
    }
  }

  // Batch currency conversion
  const convertAmounts = (
    conversions: Array<{
      amount: number
      fromCurrency: string
      toCurrency: string
    }>
  ): CurrencyConversion[] => {
    return conversions.map(({ amount, fromCurrency, toCurrency }) => 
      convertAmount(amount, fromCurrency, toCurrency)
    ).filter(Boolean) as CurrencyConversion[]
  }

  // Currency formatting with locale support
  const formatCurrency = (
    amount: number,
    currency: string,
    options: CurrencyFormatOptions = {}
  ): string => {
    return utilFormatCurrency(amount, currency, options)
  }

  // Reactive conversion helper
  const useConversion = (
    amount: Ref<number> | number,
    fromCurrency: Ref<string> | string,
    toCurrency: Ref<string> | string = baseCurrency
  ) => {
    return computed(() => {
      const amt = unref(amount)
      const from = unref(fromCurrency)
      const to = unref(toCurrency)
      
      if (!amt || !from || !to) return null
      
      return convertAmount(amt, from, to)
    })
  }

  // Format with automatic conversion
  const formatWithConversion = (
    amount: number,
    fromCurrency: string,
    toCurrency: string = baseCurrency,
    options: CurrencyFormatOptions = {}
  ): string => {
    const conversion = convertAmount(amount, fromCurrency, toCurrency)
    if (!conversion) {
      return formatCurrency(amount, fromCurrency, options)
    }
    
    if (fromCurrency === toCurrency) {
      return formatCurrency(amount, fromCurrency, options)
    }

    const originalFormatted = formatCurrency(amount, fromCurrency, options)
    const convertedFormatted = formatCurrency(conversion.convertedAmount, toCurrency, options)
    
    return `${originalFormatted} (≈ ${convertedFormatted})`
  }

  // Manual rate update mutation
  const updateExchangeRate = useMutation({
    mutationFn: async (rateData: {
      fromCurrency: string
      toCurrency: string
      rate: number
      source?: string
    }) => {
      return $fetch('/api/exchange-rates/manual', {
        method: 'POST',
        body: rateData
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] })
    }
  })

  // Cache management for offline support
  const getCachedRates = async (): Promise<ExchangeRate[]> => {
    if (!enableOfflineCache || typeof window === 'undefined') return []
    
    try {
      const cached = localStorage.getItem('exchange-rates-cache')
      if (!cached) return []
      
      const { data, timestamp } = JSON.parse(cached)
      const cacheAge = Date.now() - timestamp
      const maxAge = 1000 * 60 * 60 * 24 // 24 hours
      
      if (cacheAge > maxAge) {
        localStorage.removeItem('exchange-rates-cache')
        return []
      }
      
      return data
    } catch {
      return []
    }
  }

  const setCachedRates = (rates: ExchangeRate[]) => {
    if (!enableOfflineCache || typeof window === 'undefined') return
    
    try {
      const cache = {
        data: rates,
        timestamp: Date.now()
      }
      localStorage.setItem('exchange-rates-cache', JSON.stringify(cache))
    } catch (error) {
      console.warn('Failed to cache exchange rates:', error)
    }
  }

  // Watch for rate updates to cache them
  watch(exchangeRates, (newRates) => {
    if (newRates && enableOfflineCache) {
      setCachedRates(newRates)
    }
  }, { immediate: true })

  // Currency preference management
  const currencyPreferences = useLocalStorage('currency-preferences', {
    baseCurrency,
    displayCurrencies: ['JPY', 'USD', 'EUR'],
    autoConvert: true,
    showConversionRate: true
  })

  // Error handling
  const isOnline = computed(() => !ratesError.value)
  const hasValidRates = computed(() => exchangeRates.value && exchangeRates.value.length > 0)

  return {
    // Data
    exchangeRates: readonly(exchangeRates),
    supportedCurrencies: readonly(supportedCurrencies),
    lastRateUpdate: readonly(lastRateUpdate),
    currencyPreferences,
    
    // Status
    loading: readonly(loading),
    error: readonly(error),
    ratesLoading: readonly(ratesLoading),
    ratesError: readonly(ratesError),
    isOnline,
    hasValidRates,
    
    // Methods
    getExchangeRate,
    convertAmount,
    convertAmounts,
    formatCurrency,
    formatWithConversion,
    useConversion,
    getHistoricalRates,
    refetchRates,
    
    // Mutations
    updateExchangeRate,
    
    // Cache management
    getCachedRates,
    setCachedRates
  }
}

/**
 * Global currency instance for app-wide use
 */
export const globalCurrency = useCurrency()

/**
 * Currency formatting shorthand
 */
export const { formatCurrency } = globalCurrency