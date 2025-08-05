<template>
  <div class="expense-amount-step space-y-6">
    <div class="text-center mb-6">
      <Icon name="lucide:yen" class="w-12 h-12 mx-auto mb-3 text-primary" />
      <h3 class="text-xl font-semibold mb-2">
        {{ t('expense.form.steps.amount') }}
      </h3>
      <p class="text-muted-foreground">
        {{ t('expense.form.steps.amountDescription') }}
      </p>
    </div>

    <!-- Amount Type Selection -->
    <div class="mb-6">
      <Label class="text-sm font-medium mb-3 block">
        {{ t('expense.form.amountType') }}
      </Label>
      <div class="flex gap-6">
        <div class="flex items-center space-x-2">
          <input 
            id="expense-type" 
            v-model="amountType" 
            value="expense" 
            type="radio" 
            class="w-4 h-4 text-primary focus:ring-primary border-gray-300"
          />
          <Label for="expense-type" class="cursor-pointer">
            <div class="flex items-center gap-2">
              <Icon name="lucide:minus-circle" class="w-4 h-4 text-red-500" />
              {{ t('expense.form.amountTypes.expense') }}
            </div>
          </Label>
        </div>
        <div class="flex items-center space-x-2">
          <input 
            id="income-type" 
            v-model="amountType" 
            value="income" 
            type="radio" 
            class="w-4 h-4 text-primary focus:ring-primary border-gray-300"
          />
          <Label for="income-type" class="cursor-pointer">
            <div class="flex items-center gap-2">
              <Icon name="lucide:plus-circle" class="w-4 h-4 text-green-500" />
              {{ t('expense.form.amountTypes.income') }}
            </div>
          </Label>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Income Amount Field -->
      <FormField v-slot="{ componentField }" name="incomeAmount">
        <FormItem>
          <FormLabel for="incomeAmount">
            {{ t('expense.form.fields.incomeAmount') }}
          </FormLabel>
          <FormControl>
            <div class="relative">
              <Input
                id="incomeAmount"
                v-bind="componentField"
                type="number"
                step="1"
                min="0"
                max="999999999"
                :placeholder="t('expense.form.placeholders.incomeAmount')"
                :disabled="amountType === 'expense'"
                class="pl-8"
                @input="handleIncomeInput"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                ¥
              </div>
            </div>
          </FormControl>
          <FormDescription>
            {{ t('expense.form.descriptions.incomeAmount') }}
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- Expense Amount Field -->
      <FormField v-slot="{ componentField }" name="expenseAmount">
        <FormItem>
          <FormLabel for="expenseAmount">
            {{ t('expense.form.fields.expenseAmount') }}
          </FormLabel>
          <FormControl>
            <div class="relative">
              <Input
                id="expenseAmount"
                v-bind="componentField"
                type="number"
                step="1"
                min="0"
                max="999999999"
                :placeholder="t('expense.form.placeholders.expenseAmount')"
                :disabled="amountType === 'income'"
                class="pl-8"
                @input="handleExpenseInput"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                ¥
              </div>
            </div>
          </FormControl>
          <FormDescription>
            {{ t('expense.form.descriptions.expenseAmount') }}
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <!-- Balance Calculation Display -->
    <div class="bg-muted/50 p-4 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="lucide:calculator" class="w-5 h-5 text-muted-foreground" />
          <span class="font-medium">{{ t('expense.form.balanceCalculation') }}</span>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold" :class="balanceColorClass">
            {{ formatCurrency(calculatedBalance) }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ balanceDescription }}
          </div>
        </div>
      </div>
    </div>

    <!-- Common Amount Presets -->
    <div class="mt-6">
      <Label class="text-sm font-medium mb-3 block">
        {{ t('expense.form.commonAmounts') }}
      </Label>
      <div class="grid grid-cols-3 md:grid-cols-6 gap-2">
        <Button
          v-for="preset in amountPresets"
          :key="preset.value"
          type="button"
          variant="outline"
          size="sm"
          class="text-xs"
          @click="applyAmountPreset(preset.value)"
        >
          ¥{{ preset.label }}
        </Button>
      </div>
    </div>

    <!-- Validation Summary -->
    <Alert v-if="!isAmountValid && (incomeAmount > 0 || expenseAmount > 0)" variant="destructive">
      <Icon name="lucide:alert-triangle" class="h-4 w-4" />
      <AlertDescription>
        {{ t('expense.form.validation.amountRequired') }}
      </AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { useFieldValue, useField } from 'vee-validate'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
// RadioGroup removed - using simple radio buttons instead
import { Alert, AlertDescription } from '~/components/ui/alert'

// Composables
const { t } = useI18n()

// Form fields
const incomeAmount = useFieldValue<number>('incomeAmount')
const expenseAmount = useFieldValue<number>('expenseAmount')
const { setValue: setIncomeAmount } = useField<number>('incomeAmount')
const { setValue: setExpenseAmount } = useField<number>('expenseAmount')

// Amount type state (expense or income)
const amountType = ref<'expense' | 'income'>('expense')

// Watch amount type changes and clear opposite field
watch(amountType, (newType) => {
  if (newType === 'expense') {
    setIncomeAmount(0)
  } else {
    setExpenseAmount(0)
  }
})

// Balance calculation
const calculatedBalance = computed(() => {
  const income = Number(incomeAmount.value) || 0
  const expense = Number(expenseAmount.value) || 0
  return income - expense
})

const balanceColorClass = computed(() => {
  const balance = calculatedBalance.value
  if (balance > 0) return 'text-green-600'
  if (balance < 0) return 'text-red-600'
  return 'text-muted-foreground'
})

const balanceDescription = computed(() => {
  const balance = calculatedBalance.value
  if (balance > 0) return t('expense.form.balanceTypes.positive')
  if (balance < 0) return t('expense.form.balanceTypes.negative')
  return t('expense.form.balanceTypes.zero')
})

// Amount validation
const isAmountValid = computed(() => {
  const income = Number(incomeAmount.value) || 0
  const expense = Number(expenseAmount.value) || 0
  return income > 0 || expense > 0
})

// Common amount presets for Japanese legal practice
const amountPresets = [
  { value: 100, label: '100' },
  { value: 200, label: '200' },
  { value: 500, label: '500' },
  { value: 1000, label: '1,000' },
  { value: 2000, label: '2,000' },
  { value: 5000, label: '5,000' },
  { value: 10000, label: '10,000' },
  { value: 20000, label: '20,000' }
]

// Format currency for display
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(amount)
}

// Handle input events to ensure only positive numbers
const handleIncomeInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Math.max(0, parseInt(target.value) || 0)
  setIncomeAmount(value)
}

const handleExpenseInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Math.max(0, parseInt(target.value) || 0)
  setExpenseAmount(value)
}

// Apply amount preset
const applyAmountPreset = (amount: number) => {
  if (amountType.value === 'expense') {
    setExpenseAmount(amount)
  } else {
    setIncomeAmount(amount)
  }
}

// Auto-detect amount type based on input
watch([incomeAmount, expenseAmount], ([income, expense]) => {
  const incomeNum = Number(income) || 0
  const expenseNum = Number(expense) || 0
  if (incomeNum > 0 && expenseNum === 0) {
    amountType.value = 'income'
  } else if (expenseNum > 0 && incomeNum === 0) {
    amountType.value = 'expense'
  }
}, { immediate: true })
</script>