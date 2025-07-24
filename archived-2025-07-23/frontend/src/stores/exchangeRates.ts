/**
 * Exchange Rate Store - Pinia State Management
 * 
 * @description Comprehensive exchange rate management store using Pinia with
 * TanStack Query integration for automatic updates, caching, and fallback
 * mechanisms. Supports real-time rate monitoring and historical data.
 * 
 * @author Claude
 * @created 2025-07-04
 * @task T06_S14 - Multi-Currency Support
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { 
  ExchangeRate, 
  Currency, 
  ExchangeRateHistory,
  RateUpdateRequest,
  CurrencyConversion
} from '~/types/currency'

export const useExchangeRateStore = defineStore('exchangeRates', () => {
  const queryClient = useQueryClient()

  // Core State
  const rates = ref<Map<string, ExchangeRate>>(new Map())
  const rateHistory = ref<Map<string, ExchangeRateHistory[]>>(new Map())
  const lastUpdated = ref<Date | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const updateInProgress = ref(false)

  // Configuration
  const baseCurrency = ref('JPY')
  const supportedCurrencies = ref<Currency[]>([])
  const autoUpdateEnabled = ref(true)
  const updateInterval = ref(30 * 60 * 1000) // 30 minutes

  // Real-time exchange rates query
  const { 
    data: liveRates, 
    isLoading: liveRatesLoading,
    error: liveRatesError,
    refetch: refetchLiveRates 
  } = useQuery({
    queryKey: ['exchange-rates', 'live'],
    queryFn: async () => {
      try {
        loading.value = true
        error.value = null
        
        const response = await $fetch<{
          data: ExchangeRate[]
          lastUpdated: string
          source: string
        }>('/api/exchange-rates')
        
        // Update local state
        const rateMap = new Map<string, ExchangeRate>()
        response.data.forEach(rate => {
          const key = `${rate.fromCurrency}-${rate.toCurrency}`
          rateMap.set(key, rate)
        })
        
        rates.value = rateMap
        lastUpdated.value = new Date(response.lastUpdated)
        
        return response
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch exchange rates'
        
        // Try to load from cache
        const cached = await loadCachedRates()
        if (cached.length > 0) {
          console.warn('Using cached exchange rates due to API failure')
          const rateMap = new Map<string, ExchangeRate>()
          cached.forEach(rate => {
            const key = `${rate.fromCurrency}-${rate.toCurrency}`
            rateMap.set(key, rate)
          })
          rates.value = rateMap
          return { data: cached, lastUpdated: new Date().toISOString(), source: 'cache' }
        }
        
        throw err
      } finally {
        loading.value = false
      }
    },
    refetchInterval: computed(() => autoUpdateEnabled.value ? updateInterval.value : false),
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  // Supported currencies query
  const { data: currenciesData } = useQuery({
    queryKey: ['currencies', 'supported'],
    queryFn: async () => {
      const response = await $fetch<Currency[]>('/api/currencies/supported')
      supportedCurrencies.value = response
      return response
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })

  // Manual rate update mutation
  const updateRateMutation = useMutation({
    mutationFn: async (request: RateUpdateRequest) => {
      updateInProgress.value = true
      
      const response = await $fetch<ExchangeRate>('/api/exchange-rates/manual', {
        method: 'POST',
        body: {
          fromCurrency: request.fromCurrency,
          toCurrency: request.toCurrency,
          rate: request.rate,
          source: request.source || 'manual',
          effectiveDate: request.effectiveDate || new Date().toISOString()
        }
      })
      
      // Update local state immediately
      const key = `${response.fromCurrency}-${response.toCurrency}`
      const newRates = new Map(rates.value)
      newRates.set(key, response)
      rates.value = newRates
      
      return response
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] })
    },
    onError: (error) => {
      console.error('Failed to update exchange rate:', error)
    },
    onSettled: () => {
      updateInProgress.value = false
    }
  })

  // Bulk rate update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (requests: RateUpdateRequest[]) => {
      updateInProgress.value = true
      
      const response = await $fetch<ExchangeRate[]>('/api/exchange-rates/bulk', {
        method: 'POST',
        body: { rates: requests }
      })
      
      // Update local state
      const newRates = new Map(rates.value)
      response.forEach(rate => {
        const key = `${rate.fromCurrency}-${rate.toCurrency}`
        newRates.set(key, rate)
      })
      rates.value = newRates
      
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] })
    },
    onSettled: () => {
      updateInProgress.value = false
    }
  })

  // Getters
  const getRateByPair = (fromCurrency: string, toCurrency: string): ExchangeRate | null => {
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
    
    const key = `${fromCurrency}-${toCurrency}`
    return rates.value.get(key) || null
  }

  const getAvailablePairs = computed(() => {
    return Array.from(rates.value.keys()).map(key => {
      const [from, to] = key.split('-')
      return { from, to }
    })
  })

  // Historical rates management
  const getHistoricalRates = async (
    fromCurrency: string,
    toCurrency: string,
    days: number = 30
  ): Promise<ExchangeRateHistory[]> => {
    const key = `${fromCurrency}-${toCurrency}`
    
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)
      
      const response = await $fetch<ExchangeRateHistory[]>('/api/exchange-rates/history', {
        query: {
          from: fromCurrency,
          to: toCurrency,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      })
      
      // Cache the historical data
      rateHistory.value.set(key, response)
      
      return response
    } catch (error) {
      console.error('Failed to fetch historical rates:', error)
      return rateHistory.value.get(key) || []
    }
  }

  // Rate statistics
  const getRateStatistics = (fromCurrency: string, toCurrency: string) => {
    const key = `${fromCurrency}-${toCurrency}`
    const history = rateHistory.value.get(key) || []
    
    if (history.length === 0) return null
    
    const rates = history.map(h => h.rate)
    const min = Math.min(...rates)
    const max = Math.max(...rates)
    const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
    
    const current = getRateByPair(fromCurrency, toCurrency)
    const change = current && history.length > 1 
      ? ((current.rate - history[history.length - 2].rate) / history[history.length - 2].rate) * 100
      : 0
    
    return {
      current: current?.rate || 0,
      min,
      max,
      average: avg,
      change,
      dataPoints: history.length
    }
  }

  // Cache management
  const loadCachedRates = async (): Promise<ExchangeRate[]> => {
    if (typeof window === 'undefined') return []
    
    try {
      const cached = localStorage.getItem('exchange-rates-cache')
      if (!cached) return []
      
      const { data, timestamp } = JSON.parse(cached)
      const cacheAge = Date.now() - timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      if (cacheAge > maxAge) {
        localStorage.removeItem('exchange-rates-cache')
        return []
      }
      
      return data
    } catch {
      return []
    }
  }

  const saveCachedRates = (ratesToCache: ExchangeRate[]) => {
    if (typeof window === 'undefined') return
    
    try {
      const cache = {
        data: ratesToCache,
        timestamp: Date.now()
      }
      localStorage.setItem('exchange-rates-cache', JSON.stringify(cache))
    } catch (error) {
      console.warn('Failed to cache exchange rates:', error)
    }
  }

  // Watch for rate updates to cache them
  watch(rates, (newRates) => {
    if (newRates.size > 0) {
      const rateArray = Array.from(newRates.values())
      saveCachedRates(rateArray)
    }
  }, { deep: true })

  // Currency conversion helper
  const convertAmount = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): CurrencyConversion | null => {
    const rate = getRateByPair(fromCurrency, toCurrency)
    
    if (!rate) return null
    
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount * rate.rate,
      convertedCurrency: toCurrency,
      exchangeRate: rate.rate,
      conversionDate: rate.rateDate,
      source: rate.source
    }
  }

  // Configuration methods
  const updateConfiguration = (config: {
    baseCurrency?: string
    autoUpdateEnabled?: boolean
    updateInterval?: number
  }) => {
    if (config.baseCurrency) baseCurrency.value = config.baseCurrency
    if (config.autoUpdateEnabled !== undefined) autoUpdateEnabled.value = config.autoUpdateEnabled
    if (config.updateInterval) updateInterval.value = config.updateInterval
  }

  // Status computed properties
  const isLoading = computed(() => loading.value || liveRatesLoading.value || updateInProgress.value)
  const hasError = computed(() => !!error.value || !!liveRatesError.value)
  const isOnline = computed(() => !liveRatesError.value)
  const rateCount = computed(() => rates.value.size)
  const lastUpdateFormatted = computed(() => {
    if (!lastUpdated.value) return 'Never'
    return lastUpdated.value.toLocaleString()
  })

  // Actions
  const actions = {
    // Manual refresh
    refreshRates: () => refetchLiveRates(),
    
    // Update single rate
    updateRate: (request: RateUpdateRequest) => updateRateMutation.mutate(request),
    
    // Bulk update
    bulkUpdateRates: (requests: RateUpdateRequest[]) => bulkUpdateMutation.mutate(requests),
    
    // Clear cache
    clearCache: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('exchange-rates-cache')
      }
      rates.value.clear()
      rateHistory.value.clear()
    },
    
    // Configuration
    updateConfiguration
  }

  return {
    // State
    rates: readonly(rates),
    rateHistory: readonly(rateHistory),
    lastUpdated: readonly(lastUpdated),
    baseCurrency: readonly(baseCurrency),
    supportedCurrencies: readonly(supportedCurrencies),
    
    // Status
    loading: readonly(loading),
    error: readonly(error),
    isLoading,
    hasError,
    isOnline,
    rateCount,
    lastUpdateFormatted,
    updateInProgress: readonly(updateInProgress),
    
    // Configuration
    autoUpdateEnabled: readonly(autoUpdateEnabled),
    updateInterval: readonly(updateInterval),
    
    // Getters
    getRateByPair,
    getAvailablePairs,
    getHistoricalRates,
    getRateStatistics,
    convertAmount,
    
    // Actions
    ...actions
  }
})

export type ExchangeRateStore = ReturnType<typeof useExchangeRateStore>