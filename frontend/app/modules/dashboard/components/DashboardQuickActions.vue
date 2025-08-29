<template>
  <div class="quick-actions-section">
    <h3 class="text-lg font-semibold mb-4">{{ $t('modules.dashboard.sections.quickActions.title') }}</h3>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Expense Quick Actions -->
      <QuickActionCard
        :title="$t('modules.expense.titlePlural')"
        :description="$t('foundation.messages.info.default')"
        :icon="'lucide:list'"
        :to="'/expenses'"
        :stats="listStats"
      />
      
      <QuickActionCard
        :title="$t('modules.expense.form.actions.create')"
        :description="$t('foundation.messages.info.default')"
        :icon="'lucide:receipt-text'"
        :to="'/expenses/new'"
        :stats="expenseStats"
      />
      
      <QuickActionCard
        :title="$t('modules.expense.form.actions.import')"
        :description="$t('foundation.messages.info.default')"
        :icon="'lucide:import'"
        :to="'/expenses/import'"
      />
      
      <QuickActionCard
        :title="$t('foundation.actions.data.export')"
        :description="$t('foundation.messages.info.default')"
        :icon="'lucide:bar-chart-3'"
        :to="'/expenses/reports'"
        :stats="reportStats"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import QuickActionCard from '~/modules/dashboard/components/QuickActionCard.vue'

export interface QuickActionStats {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
}

defineProps<{
  listStats?: QuickActionStats[]
  expenseStats?: QuickActionStats[]
  reportStats?: QuickActionStats[]
}>()

// Mock stats - will be replaced with real data from stores
// const listStats = ref<QuickActionStats[]>([
//   { label: 'Total Expenses', value: 47, trend: 'up' },
//   { label: 'This Month', value: 12 }
// ])

// const expenseStats = ref<QuickActionStats[]>([
//   { label: 'This Month', value: '¥125,000', trend: 'up' },
//   { label: 'Pending', value: 3 }
// ])

// const reportStats = ref<QuickActionStats[]>([
//   { label: 'Balance', value: '¥892,500', trend: 'up' },
//   { label: 'Categories', value: 8 }
// ])
</script>

<style scoped>
.quick-actions-section {
  @apply mb-8;
}
</style>