<template>
  <div class="mobile-nav">
    <!-- Expense-specific mobile nav items -->
    <div v-if="isExpenseRoute" class="mobile-nav-section">
      <h4 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
        {{ $t('expense.navigation.title') }}
      </h4>
      
      <MobileNavItem 
        :to="'/expenses'" 
        :icon="'lucide:list'"
        :label="$t('expense.list.title')"
        :active="route.path === '/expenses'"
      />
      
      <MobileNavItem 
        :to="'/expenses/new'" 
        :icon="'lucide:plus'"
        :label="$t('expense.actions.create')"
        :active="route.path === '/expenses/new'"
      />
      
      <MobileNavItem 
        :to="'/expenses/import'" 
        :icon="'lucide:upload'"
        :label="$t('expense.actions.import')"
        :active="route.path === '/expenses/import'"
      />
      
      <MobileNavItem 
        :to="'/expenses/reports'" 
        :icon="'lucide:bar-chart'"
        :label="$t('expense.navigation.reports')"
        :active="route.path === '/expenses/reports'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MobileNavItem from './MobileNavItem.vue'

const route = useRoute()

const isExpenseRoute = computed(() => {
  return route.path.startsWith('/expenses')
})
</script>

<style scoped>
.mobile-nav {
  @apply py-4;
}

.mobile-nav-section {
  @apply mb-6;
}
</style>