<!-- Currency Selection Component -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Currency, CurrencyInputProps } from '~/types/currency'
import { SUPPORTED_CURRENCIES, CURRENCY_GROUPS, DEFAULT_CURRENCY_SETTINGS } from '~/types/currency'
import { getCurrencySymbol, getCurrencyName } from '~/utils/currencyFormatters'

/**
 * Currency Selection Component
 * 
 * Provides a dropdown for selecting currencies with organized groupings,
 * symbols, and currency names for better user experience.
 */

interface Props {
  /** Current selected currency code */
  modelValue?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Whether the field is required */
  required?: boolean
  /** List of available currencies (defaults to organization settings) */
  availableCurrencies?: string[]
  /** Show full currency names */
  showNames?: boolean
  /** Compact display mode */
  compact?: boolean
  /** Field name for form integration */
  name?: string
  /** Field label */
  label?: string
  /** Field description */
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Select currency',
  disabled: false,
  required: false,
  availableCurrencies: () => DEFAULT_CURRENCY_SETTINGS.availableCurrencies,
  showNames: true,
  compact: false,
  name: 'currency',
  label: 'Currency'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [currency: Currency]
}>()

// Computed properties
const availableCurrenciesData = computed(() => {
  return props.availableCurrencies.map(code => ({
    ...SUPPORTED_CURRENCIES[code as keyof typeof SUPPORTED_CURRENCIES],
    code
  })).filter(Boolean) as Currency[]
})

const currencyGroups = computed(() => {
  return CURRENCY_GROUPS.map(group => ({
    ...group,
    currencies: group.currencies
      .filter(code => props.availableCurrencies.includes(code))
      .map(code => SUPPORTED_CURRENCIES[code as keyof typeof SUPPORTED_CURRENCIES])
      .filter(Boolean)
  })).filter(group => group.currencies.length > 0)
})

const selectedCurrency = computed(() => {
  return props.modelValue 
    ? SUPPORTED_CURRENCIES[props.modelValue as keyof typeof SUPPORTED_CURRENCIES]
    : null
})

// Methods
const handleSelectionChange = (currencyCode: string) => {
  emit('update:modelValue', currencyCode)
  
  const currency = SUPPORTED_CURRENCIES[currencyCode as keyof typeof SUPPORTED_CURRENCIES]
  if (currency) {
    emit('change', currency)
  }
}

const formatCurrencyOption = (currency: Currency) => {
  if (props.compact) {
    return `${currency.symbol} ${currency.code}`
  }
  
  return props.showNames 
    ? `${currency.symbol} ${currency.code} - ${currency.name}`
    : `${currency.symbol} ${currency.code}`
}
</script>

<template>
  <FormField :name="name" :label="label" :description="description" :required="required">
    <template #default="{ field }">
      <Select
        :model-value="field.value || modelValue"
        :disabled="disabled"
        @update:model-value="(value: string) => {
          field.handleChange(value)
          handleSelectionChange(value)
        }"
      >
        <SelectTrigger>
          <SelectValue :placeholder="placeholder">
            <div v-if="selectedCurrency" class="flex items-center gap-2">
              <span class="text-lg font-medium">{{ selectedCurrency.symbol }}</span>
              <span class="font-medium">{{ selectedCurrency.code }}</span>
              <span v-if="showNames && !compact" class="text-muted-foreground text-sm">
                {{ selectedCurrency.name }}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          <!-- Grouped currency options -->
          <template v-if="currencyGroups.length > 0">
            <SelectGroup v-for="group in currencyGroups" :key="group.label">
              <SelectLabel>{{ group.label }}</SelectLabel>
              <SelectItem
                v-for="currency in group.currencies"
                :key="currency.code"
                :value="currency.code"
              >
                <div class="flex items-center gap-2">
                  <span class="text-lg font-medium">{{ currency.symbol }}</span>
                  <span class="font-medium">{{ currency.code }}</span>
                  <span v-if="showNames" class="text-muted-foreground text-sm">
                    {{ currency.name }}
                  </span>
                </div>
              </SelectItem>
            </SelectGroup>
          </template>
          
          <!-- Fallback: ungrouped options -->
          <template v-else>
            <SelectItem
              v-for="currency in availableCurrenciesData"
              :key="currency.code"
              :value="currency.code"
            >
              <div class="flex items-center gap-2">
                <span class="text-lg font-medium">{{ currency.symbol }}</span>
                <span class="font-medium">{{ currency.code }}</span>
                <span v-if="showNames" class="text-muted-foreground text-sm">
                  {{ currency.name }}
                </span>
              </div>
            </SelectItem>
          </template>
        </SelectContent>
      </Select>
    </template>
  </FormField>
</template>

<style scoped>
.currency-select {
  --select-min-width: 120px;
}

.currency-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
}

.currency-symbol {
  font-size: 1.125rem;
  font-weight: 500;
  min-width: 1.5rem;
  text-align: center;
}

.currency-code {
  font-weight: 500;
  color: hsl(var(--foreground));
}

.currency-name {
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
}

/* Compact mode adjustments */
.compact .currency-name {
  display: none;
}

.compact .currency-option {
  padding: 0.25rem 0.5rem;
}

/* Responsive design */
@media (max-width: 640px) {
  .currency-name {
    display: none;
  }
  
  .currency-option {
    padding: 0.375rem 0.5rem;
  }
}
</style>