# T06_S14: Multi-Currency Support

## 📋 Task Overview

**Sprint**: S14_M01_Financial_Management  
**Type**: Feature Development  
**Complexity**: Medium  
**Status**: Todo  
**Estimated Hours**: 12-16

### Description
Implement comprehensive multi-currency support for the Aster Management financial system, including currency conversion, locale-based formatting, exchange rate management, and currency selection components. This enhancement will enable the system to handle international legal matters and expenses across different currencies while maintaining accuracy and compliance with financial reporting standards.

### Business Value
- Enables handling of international legal matters with appropriate currency support
- Provides accurate currency conversion for financial reporting and billing
- Improves user experience with locale-aware formatting and familiar currency displays
- Ensures compliance with international accounting standards for multi-currency transactions
- Supports expansion into international markets and client bases

### Requirements
- ✅ Extend database schema to support multiple currencies for all financial entities
- ✅ Implement currency conversion service with real-time exchange rates
- ✅ Create locale-based currency formatting utilities
- ✅ Build currency selection components with proper validation
- ✅ Add exchange rate management system with historical tracking
- ✅ Implement currency conversion in expense forms and financial reports
- ✅ Support multiple base currencies per organization/matter
- ✅ Add currency-aware financial calculations and aggregations
- ✅ Create audit trail for currency conversions and rate changes
- ✅ Implement fallback mechanisms for offline currency operations

## 🗄️ Database Schema Analysis

### Current Currency Implementation
Based on analysis of `/backend/src/main/resources/db/migration/V005__Create_supporting_tables.sql`:

```sql
-- Current expenses table has basic currency support
CREATE TABLE expenses (
    -- ...
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'JPY' NOT NULL,
    -- ...
);
```

### Required Schema Extensions

1. **Exchange Rates Table** (New)
```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15,8) NOT NULL,
    rate_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'manual', 'api', 'central_bank'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency, rate_date)
);
```

2. **Organization Currency Settings** (New)
```sql
CREATE TABLE organization_currency_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
    display_currencies VARCHAR(3)[] DEFAULT ARRAY['JPY', 'USD', 'EUR'],
    auto_conversion BOOLEAN DEFAULT true,
    rate_update_frequency VARCHAR(20) DEFAULT 'daily',
    fallback_rate_days INTEGER DEFAULT 7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

3. **Matter Currency Configuration** (Extension)
```sql
-- Add to existing matters table
ALTER TABLE matters ADD COLUMN primary_currency VARCHAR(3) DEFAULT 'JPY';
ALTER TABLE matters ADD COLUMN allowed_currencies VARCHAR(3)[] DEFAULT ARRAY['JPY'];
```

## 💻 Technical Guidance

### 1. Currency Conversion Service

**Backend Service** (`/backend/src/main/kotlin/dev/ryuzu/astermanagement/service/CurrencyService.kt`)

```kotlin
@Service
class CurrencyService(
    private val exchangeRateRepository: ExchangeRateRepository,
    private val currencyApiClient: CurrencyApiClient
) {
    suspend fun convertAmount(
        amount: BigDecimal,
        fromCurrency: String,
        toCurrency: String,
        conversionDate: LocalDate = LocalDate.now()
    ): CurrencyConversion {
        // Implementation with rate caching and fallback logic
    }
    
    suspend fun getExchangeRate(
        fromCurrency: String,
        toCurrency: String,
        date: LocalDate
    ): ExchangeRate {
        // Get rate with fallback to recent rates if needed
    }
    
    @Scheduled(fixedRate = 3600000) // Hourly updates
    suspend fun updateExchangeRates() {
        // Fetch latest rates from external API
    }
}
```

**Frontend Composable** (`/src/composables/useCurrency.ts`)

```typescript
export function useCurrency() {
  const { data: exchangeRates } = useQuery({
    queryKey: ['exchangeRates'],
    queryFn: () => $fetch('/api/exchange-rates'),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
  
  const convertAmount = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ) => {
    // Client-side conversion with cached rates
  }
  
  const formatCurrency = (
    amount: number,
    currency: string,
    locale?: string
  ) => {
    // Locale-aware formatting using Intl.NumberFormat
  }
  
  return {
    exchangeRates,
    convertAmount,
    formatCurrency,
    // ... other utilities
  }
}
```

### 2. Locale-Based Formatting

**Currency Formatter Utility** (`/src/utils/currencyFormatters.ts`)

```typescript
import { computed } from 'vue'

export interface CurrencyFormatOptions {
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  currencyDisplay?: 'symbol' | 'code' | 'name'
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact'
}

export function formatCurrency(
  amount: number,
  currency: string,
  options: CurrencyFormatOptions = {}
): string {
  const {
    locale = 'ja-JP',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    currencyDisplay = 'symbol',
    notation = 'standard'
  } = options

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
      currencyDisplay,
      notation
    }).format(amount)
  } catch (error) {
    console.warn(`Currency formatting error for ${currency}:`, error)
    return `${currency} ${amount.toFixed(2)}`
  }
}

// Predefined formatters for common scenarios
export const currencyFormatters = {
  jpyStandard: (amount: number) => formatCurrency(amount, 'JPY', { 
    locale: 'ja-JP', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }),
  usdStandard: (amount: number) => formatCurrency(amount, 'USD', { 
    locale: 'en-US' 
  }),
  eurStandard: (amount: number) => formatCurrency(amount, 'EUR', { 
    locale: 'de-DE' 
  }),
  compactFormat: (amount: number, currency: string) => formatCurrency(amount, currency, {
    notation: 'compact'
  })
}

// Vue composable for reactive formatting
export function useCurrencyFormatter() {
  const { locale } = useI18n()
  
  const formatAmount = computed(() => (amount: number, currency: string) => {
    return formatCurrency(amount, currency, { locale: locale.value })
  })
  
  return { formatAmount }
}
```

### 3. Exchange Rate Management

**Exchange Rate Store** (`/src/stores/exchangeRates.ts`)

```typescript
export const useExchangeRateStore = defineStore('exchangeRates', () => {
  const rates = ref<Map<string, ExchangeRate>>(new Map())
  const lastUpdated = ref<Date | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Auto-update rates
  const { data: liveRates, isLoading } = useQuery({
    queryKey: ['exchange-rates', 'live'],
    queryFn: fetchExchangeRates,
    refetchInterval: 1000 * 60 * 30, // 30 minutes
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
  
  const getRateByPair = (fromCurrency: string, toCurrency: string) => {
    const key = `${fromCurrency}-${toCurrency}`
    return rates.value.get(key)
  }
  
  const getHistoricalRate = async (
    fromCurrency: string,
    toCurrency: string,
    date: Date
  ) => {
    const { data } = await $fetch('/api/exchange-rates/historical', {
      query: { from: fromCurrency, to: toCurrency, date: date.toISOString() }
    })
    return data
  }
  
  return {
    rates: readonly(rates),
    lastUpdated: readonly(lastUpdated),
    loading: readonly(loading),
    error: readonly(error),
    getRateByPair,
    getHistoricalRate
  }
})
```

### 4. Currency Selection Components

**Currency Select Component** (`/src/components/forms/FormCurrencySelect.vue`)

```vue
<template>
  <FormFieldWrapper
    :name="name"
    :label="label"
    :description="description"
    :required="required"
  >
    <template #default="{ field, fieldId, hasError, errorMessage }">
      <Select
        :id="fieldId"
        :model-value="field.value"
        @update:model-value="field.handleChange"
      >
        <SelectTrigger :class="{ 'border-destructive': hasError }">
          <SelectValue :placeholder="placeholder">
            <div v-if="field.value" class="flex items-center gap-2">
              <span class="text-lg">{{ getCurrencySymbol(field.value) }}</span>
              <span>{{ field.value }}</span>
              <span class="text-muted-foreground text-sm">
                {{ getCurrencyName(field.value) }}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup v-for="group in currencyGroups" :key="group.label">
            <SelectLabel>{{ group.label }}</SelectLabel>
            <SelectItem
              v-for="currency in group.currencies"
              :key="currency.code"
              :value="currency.code"
            >
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ currency.symbol }}</span>
                <span class="font-medium">{{ currency.code }}</span>
                <span class="text-muted-foreground text-sm">
                  {{ currency.name }}
                </span>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </template>
  </FormFieldWrapper>
</template>

<script setup lang="ts">
interface Currency {
  code: string
  symbol: string
  name: string
  decimals: number
}

interface CurrencyGroup {
  label: string
  currencies: Currency[]
}

const currencyGroups: CurrencyGroup[] = [
  {
    label: 'Common Currencies',
    currencies: [
      { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
      { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
      { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
      { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 }
    ]
  },
  {
    label: 'Asian Currencies',
    currencies: [
      { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0 },
      { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
      { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 }
    ]
  }
]
</script>
```

**Currency Amount Input** (`/src/components/forms/FormCurrencyInput.vue`)

```vue
<template>
  <FormFieldWrapper
    :name="name"
    :label="label"
    :description="description"
    :required="required"
  >
    <template #default="{ field, fieldId, hasError }">
      <div class="flex gap-2">
        <div class="flex-1">
          <div class="relative">
            <Input
              :id="fieldId"
              v-model="displayAmount"
              type="text"
              :placeholder="amountPlaceholder"
              :class="{ 'border-destructive': hasError, 'pl-8': showCurrencySymbol }"
              @blur="handleAmountBlur"
              @input="handleAmountInput"
            />
            <span
              v-if="showCurrencySymbol"
              class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {{ currencySymbol }}
            </span>
          </div>
        </div>
        
        <FormCurrencySelect
          :name="`${name}Currency`"
          :model-value="selectedCurrency"
          @update:model-value="handleCurrencyChange"
          class="w-32"
        />
      </div>
      
      <!-- Conversion display -->
      <div
        v-if="showConversion && convertedAmount"
        class="mt-2 text-sm text-muted-foreground"
      >
        ≈ {{ formatCurrency(convertedAmount.amount, convertedAmount.currency) }}
        <span class="text-xs ml-1">
          (Rate: {{ convertedAmount.rate }} as of {{ formatDate(convertedAmount.date) }})
        </span>
      </div>
    </template>
  </FormFieldWrapper>
</template>

<script setup lang="ts">
const { convertAmount, formatCurrency } = useCurrency()

// Real-time conversion logic
const convertedAmount = computed(() => {
  if (!showConversion.value || !numericAmount.value || selectedCurrency.value === baseCurrency.value) {
    return null
  }
  
  return convertAmount(
    numericAmount.value,
    selectedCurrency.value,
    baseCurrency.value
  )
})
</script>
```

## 📝 Implementation Notes

### Key Considerations

1. **Precision Handling**:
   - Use `BigDecimal` in backend for precise financial calculations
   - Handle decimal places correctly per currency (JPY: 0, USD/EUR: 2)
   - Implement proper rounding strategies for conversions

2. **Exchange Rate Sources**:
   - Primary: Bank of Japan (BOJ) for JPY rates
   - Fallback: European Central Bank (ECB) API
   - Manual override capability for specific rates
   - Cache rates locally with TTL

3. **Offline Support**:
   - Cache recent exchange rates in IndexedDB
   - Implement stale-while-revalidate pattern
   - Show "using cached rates" indicators
   - Queue conversions when offline

4. **Audit and Compliance**:
   - Log all currency conversions with rates used
   - Track rate source and timestamp
   - Maintain historical conversion records
   - Support rate audit trails for accounting

5. **Performance Optimization**:
   - Cache formatted currency strings
   - Debounce real-time conversion updates
   - Use Web Workers for bulk conversions
   - Implement rate lookup optimization

### Locale-Specific Features

1. **Japanese (ja-JP)**:
   - Use ¥ symbol for JPY
   - No decimal places for JPY amounts
   - Support for man (万) notation for large amounts

2. **English (en-US)**:
   - Standard USD formatting with $ symbol
   - Comma thousands separators
   - Two decimal places

3. **Multi-locale Support**:
   - Detect user locale from browser/settings
   - Allow manual locale override
   - Support currency format preferences

### API Integration Patterns

1. **Exchange Rate APIs**:
```typescript
// External rate provider interface
interface ExchangeRateProvider {
  getRates(baseCurrency: string): Promise<Record<string, number>>
  getHistoricalRates(date: Date, baseCurrency: string): Promise<Record<string, number>>
  getSupportedCurrencies(): Promise<Currency[]>
}

// Implementation for multiple providers
export class ExchangeRateService {
  private providers: ExchangeRateProvider[] = [
    new BOJProvider(),
    new ECBProvider(),
    new FallbackProvider()
  ]
  
  async getRatesWithFallback(baseCurrency: string): Promise<Record<string, number>> {
    for (const provider of this.providers) {
      try {
        return await provider.getRates(baseCurrency)
      } catch (error) {
        console.warn(`Provider ${provider.constructor.name} failed:`, error)
      }
    }
    throw new Error('All exchange rate providers failed')
  }
}
```

2. **Backend API Endpoints**:
```
GET /api/exchange-rates
GET /api/exchange-rates/historical?date=2024-01-01&from=USD&to=JPY
POST /api/exchange-rates/manual (Admin only)
GET /api/currencies/supported
GET /api/currencies/settings
PUT /api/currencies/settings
```

## 🔗 Dependencies

- **Frontend Components**:
  - Intl.NumberFormat for locale-aware formatting
  - TanStack Query for rate caching and updates
  - VueUse for browser locale detection
  - date-fns for date formatting

- **Backend Integration**:
  - Spring Boot WebClient for external API calls
  - PostgreSQL DECIMAL type for precision
  - Spring Cache for rate caching
  - Spring Scheduler for automatic updates

- **External Services**:
  - Bank of Japan API for JPY rates
  - European Central Bank API for EUR rates
  - Free currency API as fallback

- **Related Tasks**:
  - T01_S14: Expense Entry Form (Integration target)
  - T04_S14: Financial Dashboard (Display target)
  - T05_S14: Reporting Export (Conversion target)

## ✅ Acceptance Criteria

1. **Currency Conversion**:
   - [ ] Real-time conversion between supported currencies
   - [ ] Historical rate lookup for past transactions
   - [ ] Accurate precision handling for all currency types
   - [ ] Fallback mechanism when rates unavailable

2. **Formatting and Display**:
   - [ ] Locale-aware currency formatting
   - [ ] Proper decimal handling per currency
   - [ ] Currency symbol display
   - [ ] Compact notation for large amounts

3. **User Interface**:
   - [ ] Intuitive currency selection component
   - [ ] Real-time conversion display
   - [ ] Responsive design for mobile
   - [ ] Loading states for rate updates

4. **Data Management**:
   - [ ] Exchange rate storage and retrieval
   - [ ] Automatic rate updates
   - [ ] Manual rate override capability
   - [ ] Rate audit trail

5. **Integration**:
   - [ ] Seamless integration with expense forms
   - [ ] Financial report currency conversion
   - [ ] API error handling
   - [ ] Offline functionality

6. **Performance**:
   - [ ] Sub-second conversion calculations
   - [ ] Efficient rate caching
   - [ ] Minimal API calls
   - [ ] No blocking UI operations

## 📌 Resources

- [Intl.NumberFormat MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [Bank of Japan Exchange Rate API](https://www.boj.or.jp/en/statistics/market/forex/index.htm)
- [European Central Bank API](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml)
- [ISO 4217 Currency Codes](https://en.wikipedia.org/wiki/ISO_4217)
- [BigDecimal Java Documentation](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/math/BigDecimal.html)
- [Vue I18n Currency Formatting](https://vue-i18n.intlify.dev/guide/essentials/number.html)