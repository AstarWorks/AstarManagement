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
      <RadioGroup v-model="amountType" class="flex gap-6">
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="expense-type" value="expense" />
          <Label for="expense-type" class="cursor-pointer">
            <div class="flex items-center gap-2">
              <Icon name="lucide:minus-circle" class="w-4 h-4 text-red-500" />
              {{ t('expense.form.amountTypes.expense') }}
            </div>
          </Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="income-type" value="income" />
          <Label for="income-type" class="cursor-pointer">
            <div class="flex items-center gap-2">
              <Icon name="lucide:plus-circle" class="w-4 h-4 text-green-500" />
              {{ t('expense.form.amountTypes.income') }}
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>

    <div :class="`grid ${GRID_CONFIG.FIELDS} gap-6`">
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
                :step="INPUT_CONFIG.STEP"
                :min="amountLimits.MIN"
                :max="amountLimits.MAX"
                :placeholder="t('expense.form.placeholders.incomeAmount')"
                :disabled="amountType === 'expense'"
                class="pl-8"
                @input="handleIncomeInput"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                {{ CURRENCY_CONFIG.SYMBOL }}
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
                :step="INPUT_CONFIG.STEP"
                :min="amountLimits.MIN"
                :max="amountLimits.MAX"
                :placeholder="t('expense.form.placeholders.expenseAmount')"
                :disabled="amountType === 'income'"
                class="pl-8"
                @input="handleExpenseInput"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                {{ CURRENCY_CONFIG.SYMBOL }}
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
      <div :class="`grid ${GRID_CONFIG.PRESETS} gap-2`">
        <Button
          v-for="preset in amountPresets"
          :key="preset.value"
          type="button"
          variant="outline"
          size="sm"
          class="text-xs"
          @click="applyAmountPreset(preset.value)"
        >
          {{ CURRENCY_CONFIG.SYMBOL }}{{ preset.label }}
        </Button>
      </div>
    </div>

    <!-- Validation Summary -->
    <Alert v-if="!isAmountValid" variant="destructive">
      <Icon name="lucide:alert-triangle" class="h-4 w-4" />
      <AlertDescription>
        {{ t('expense.form.validation.amountRequired') }}
      </AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@ui/form'
import { Input } from '@ui/input/index'
import { Button } from '@ui/button/index'
import { Label } from '@ui/label'
import { Alert, AlertDescription } from '@ui/alert'
import { RadioGroup, RadioGroupItem } from '@ui/radio-group'
import { useExpenseAmountStep } from '@expense/composables/form/useExpenseAmountStep'
import { CURRENCY_CONFIG, INPUT_CONFIG, GRID_CONFIG } from '~/constants/expenseFormConstants'

// Composables
const { t } = useI18n()
const {
  // State
  amountType,
  calculatedBalance,
  isAmountValid,
  
  // Configuration
  amountPresets,
  amountLimits,
  
  // Computed properties
  balanceColorClass,
  balanceDescription,
  
  // Methods
  handleIncomeInput,
  handleExpenseInput,
  applyAmountPreset,
  
  // Formatters
  formatCurrency
} = useExpenseAmountStep()
</script>