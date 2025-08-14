<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('expense.detail.basicInfo') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Date -->
        <div>
          <Label class="text-muted-foreground">{{ t('expense.form.fields.date') }}</Label>
          <p class="mt-1 font-medium">{{ formatDate(expense.date) }}</p>
        </div>

        <!-- Category -->
        <div>
          <Label class="text-muted-foreground">{{ t('expense.form.fields.category') }}</Label>
          <p class="mt-1 font-medium">{{ t(`expense.categories.${expense.category}`) }}</p>
        </div>

        <!-- Description -->
        <div class="md:col-span-2">
          <Label class="text-muted-foreground">{{ t('expense.form.fields.description') }}</Label>
          <p class="mt-1 font-medium">{{ expense.description }}</p>
        </div>

        <!-- Income Amount -->
        <div>
          <Label class="text-muted-foreground">{{ t('expense.form.fields.incomeAmount') }}</Label>
          <p class="mt-1 font-medium text-green-600">
            {{ formatCurrency(expense.incomeAmount) }}
          </p>
        </div>

        <!-- Expense Amount -->
        <div>
          <Label class="text-muted-foreground">{{ t('expense.form.fields.expenseAmount') }}</Label>
          <p class="mt-1 font-medium text-red-600">
            {{ formatCurrency(expense.expenseAmount) }}
          </p>
        </div>

        <!-- Balance -->
        <div class="md:col-span-2">
          <Label class="text-muted-foreground">{{ t('expense.form.fields.balance') }}</Label>
          <p class="mt-1 text-lg font-bold" :class="balanceClass">
            {{ formatCurrency(balance) }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { IExpense } from '~/types/expense'
import { useExpenseCalculations } from '~/composables/useExpenseCalculations'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'

interface Props {
  expense: IExpense
}

const props = defineProps<Props>()
const { t } = useI18n()

// Use expense calculations composable
const expenseRef = toRef(props, 'expense')
const { balance, balanceClass } = useExpenseCalculations(expenseRef)

// Formatters
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('ja-JP')
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount)
}
</script>