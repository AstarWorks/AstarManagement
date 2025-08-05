<template>
  <div v-if="showStats" class="filter-stats mt-4 pt-4 border-t">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div class="stat-item">
        <div class="text-2xl font-bold text-primary">
          {{ formatNumber(stats.totalMatched) }}
        </div>
        <div class="text-xs text-muted-foreground">
          {{ $t('expense.filters.stats.matched') }}
        </div>
      </div>
      
      <div class="stat-item">
        <div class="text-2xl font-bold text-green-600">
          {{ formatCurrency(stats.totalIncome) }}
        </div>
        <div class="text-xs text-muted-foreground">
          {{ $t('expense.filters.stats.income') }}
        </div>
      </div>
      
      <div class="stat-item">
        <div class="text-2xl font-bold text-red-600">
          {{ formatCurrency(stats.totalExpense) }}
        </div>
        <div class="text-xs text-muted-foreground">
          {{ $t('expense.filters.stats.expense') }}
        </div>
      </div>
      
      <div class="stat-item">
        <div class="text-2xl font-bold" :class="getBalanceClass(stats.netBalance)">
          {{ formatCurrency(stats.netBalance) }}
        </div>
        <div class="text-xs text-muted-foreground">
          {{ $t('expense.filters.stats.balance') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { computed } from 'vue' // Unused import removed
import { useExpenseFormatters } from '~/composables/useExpenseFormatters'

interface FilterStats {
  totalMatched: number
  totalIncome: number
  totalExpense: number
  netBalance: number
}

interface Props {
  /** Statistics data to display */
  stats?: FilterStats
  /** Whether to show statistics (typically when filters are active) */
  showStats?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  stats: () => ({
    totalMatched: 0,
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0
  }),
  showStats: true
})

// Use formatters for consistent styling and formatting
const { formatCurrency, formatNumber, getBalanceClass } = useExpenseFormatters()
</script>

<style scoped>
.filter-stats {
  /* Styles handled by Tailwind classes */
}

.stat-item {
  @apply flex flex-col items-center;
}
</style>