<template>
  <div class="quick-actions-section">
    <h3 class="text-lg font-semibold mb-4">{{ $t('dashboard.quickActions.title') }}</h3>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Expense Quick Actions -->
      <QuickActionCard
        :title="$t('expense.actions.create')"
        :description="$t('expense.quickActions.create.description')"
        :icon="'lucide:receipt-text'"
        :to="'/expenses/new'"
        :stats="expenseStats"
      />
      
      <QuickActionCard
        :title="$t('expense.actions.import')"
        :description="$t('expense.quickActions.import.description')"
        :icon="'lucide:upload'"
        :to="'/expenses/import'"
      />
      
      <QuickActionCard
        :title="$t('expense.navigation.reports')"
        :description="$t('expense.quickActions.reports.description')"
        :icon="'lucide:bar-chart-3'"
        :to="'/expenses/reports'"
        :stats="reportStats"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import QuickActionCard from './QuickActionCard.vue'

export interface QuickActionStats {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
}

// Mock stats - will be replaced with real data from stores
const expenseStats = ref<QuickActionStats[]>([
  { label: 'This Month', value: '¥125,000', trend: 'up' },
  { label: 'Pending', value: 3 }
])

const reportStats = ref<QuickActionStats[]>([
  { label: 'Balance', value: '¥892,500', trend: 'up' },
  { label: 'Categories', value: 8 }
])
</script>

<style scoped>
.quick-actions-section {
  @apply mb-8;
}
</style>