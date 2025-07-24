<!-- Currency Amount Input Component -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CurrencyFormValue, CurrencyChangeEvent } from '~/types/currency'
import { DEFAULT_CURRENCY_SETTINGS } from '~/types/currency'
import { 
  formatCurrencyForInput, 
  parseCurrencyAmount, 
  getCurrencySymbol, 
  getCurrencyDecimals,
  isValidCurrencyAmountString 
} from '~/utils/currencyFormatters'

/**
 * Currency Amount Input Component
 * 
 * Provides a combined input for currency amount and currency selection.
 * Includes validation, formatting, and optional conversion display.
 */

interface Props {
  /** Current value as amount and currency object */
  modelValue?: CurrencyFormValue
  /** Placeholder for amount input */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Whether the field is required */
  required?: boolean
  /** Available currencies for selection */
  availableCurrencies?: string[]
  /** Show currency symbol inside input */
  showSymbol?: boolean
  /** Show conversion to base currency (MVP: disabled) */
  showConversion?: boolean
  /** Base currency for conversion */
  baseCurrency?: string
  /** Field name for form integration */
  name?: string
  /** Field label */
  label?: string
  /** Field description */
  description?: string
  /** Minimum allowed amount */
  min?: number
  /** Maximum allowed amount */
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ amount: '', currency: DEFAULT_CURRENCY_SETTINGS.baseCurrency }),
  placeholder: 'Enter amount',
  disabled: false,
  required: false,
  availableCurrencies: () => DEFAULT_CURRENCY_SETTINGS.availableCurrencies,
  showSymbol: true,
  showConversion: false, // Disabled for MVP
  baseCurrency: DEFAULT_CURRENCY_SETTINGS.baseCurrency,
  name: 'amount',
  label: 'Amount',
  min: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: CurrencyFormValue]
  'change': [event: CurrencyChangeEvent]
  'blur': []
  'focus': []
}>()

// Local state
const displayAmount = ref('')
const selectedCurrency = ref(props.modelValue?.currency || props.baseCurrency)
const isFocused = ref(false)

// Computed properties
const currencySymbol = computed(() => getCurrencySymbol(selectedCurrency.value))
const currencyDecimals = computed(() => getCurrencyDecimals(selectedCurrency.value))

const numericAmount = computed(() => {
  const parsed = parseCurrencyAmount(displayAmount.value, selectedCurrency.value)
  return parsed !== null ? parsed : 0
})

const isValidAmount = computed(() => {
  if (!displayAmount.value.trim()) {
    return !props.required
  }
  
  return isValidCurrencyAmountString(displayAmount.value, selectedCurrency.value)
})

const amountPlaceholder = computed(() => {
  if (props.showSymbol) {
    return `0.${'0'.repeat(currencyDecimals.value)}`
  }
  return props.placeholder
})

const formattedValue = computed((): CurrencyFormValue => ({
  amount: numericAmount.value,
  currency: selectedCurrency.value
}))

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    displayAmount.value = String(newValue.amount || '')
    selectedCurrency.value = newValue.currency || props.baseCurrency
  }
}, { immediate: true })

watch(formattedValue, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

// Methods
const handleAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  displayAmount.value = target.value
}

const handleAmountBlur = () => {
  isFocused.value = false
  emit('blur')
  
  // Format the amount on blur if it's valid
  if (isValidAmount.value && numericAmount.value > 0) {
    displayAmount.value = formatCurrencyForInput(numericAmount.value, selectedCurrency.value)
  }
  
  // Emit change event
  emitChangeEvent()
}

const handleAmountFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleCurrencyChange = (currency: string) => {
  selectedCurrency.value = currency
  
  // Reformat amount for new currency's decimal places
  if (numericAmount.value > 0) {
    displayAmount.value = formatCurrencyForInput(numericAmount.value, currency)
  }
  
  emitChangeEvent()
}

const emitChangeEvent = () => {
  const changeEvent: CurrencyChangeEvent = {
    amount: numericAmount.value,
    currency: selectedCurrency.value,
    formatted: formatCurrencyForInput(numericAmount.value, selectedCurrency.value)
  }
  
  emit('change', changeEvent)
}

// Validation helpers
const getValidationError = () => {
  if (props.required && !displayAmount.value.trim()) {
    return 'Amount is required'
  }
  
  if (displayAmount.value && !isValidAmount.value) {
    return 'Invalid amount format'
  }
  
  if (props.min !== undefined && numericAmount.value < props.min) {
    return `Amount must be at least ${props.min}`
  }
  
  if (props.max !== undefined && numericAmount.value > props.max) {
    return `Amount must not exceed ${props.max}`
  }
  
  return null
}
</script>

<template>
  <FormField 
    :name="name" 
    :label="label" 
    :description="description" 
    :required="required"
  >
    <template #default="{ field, fieldId, hasError }">
      <div class="currency-input-container">
        <!-- Amount Input -->
        <div class="flex-1 relative">
          <Input
            :id="fieldId"
            v-model="displayAmount"
            type="text"
            inputmode="decimal"
            :placeholder="amountPlaceholder"
            :disabled="disabled"
            :class="{ 
              'border-destructive': hasError || !isValidAmount,
              'pl-8': showSymbol,
              'pr-16': !showSymbol 
            }"
            @input="handleAmountInput"
            @blur="handleAmountBlur"
            @focus="handleAmountFocus"
          />
          
          <!-- Currency Symbol -->
          <span
            v-if="showSymbol"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          >
            {{ currencySymbol }}
          </span>
          
          <!-- Validation Error -->
          <div v-if="getValidationError()" class="text-sm text-destructive mt-1">
            {{ getValidationError() }}
          </div>
        </div>
        
        <!-- Currency Selection -->
        <div class="currency-select-wrapper">
          <FormCurrencySelect
            :model-value="selectedCurrency"
            :available-currencies="availableCurrencies"
            :disabled="disabled"
            :show-names="false"
            compact
            @update:model-value="handleCurrencyChange"
          />
        </div>
      </div>
      
      <!-- Future: Conversion Display (MVP: Disabled) -->
      <!--
      <div
        v-if="showConversion && numericAmount > 0 && selectedCurrency !== baseCurrency"
        class="conversion-display"
      >
        <div class="text-sm text-muted-foreground">
          ≈ {{ formatCurrency(convertedAmount, baseCurrency) }}
          <span class="text-xs ml-1">
            (Base: {{ baseCurrency }})
          </span>
        </div>
      </div>
      -->
    </template>
  </FormField>
</template>

<style scoped>
.currency-input-container {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.currency-select-wrapper {
  flex-shrink: 0;
  min-width: 120px;
}

.conversion-display {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: hsl(var(--muted) / 0.5);
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid hsl(var(--border));
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .currency-input-container {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .currency-select-wrapper {
    min-width: unset;
    width: 100%;
  }
}

/* Focus states */
.currency-input-container:focus-within .currency-select-wrapper {
  /* Subtle focus indication for the container */
}

/* Error states */
.currency-input-container:has(.border-destructive) .currency-select-wrapper {
  /* Error state styling if needed */
}
</style>