<template>
  <div class="expense-list-skeleton space-y-3 p-4">
    <!-- Header skeleton -->
    <div class="flex items-center justify-between mb-4">
      <Skeleton class="h-6 w-32" />
      <Skeleton class="h-8 w-24" />
    </div>
    
    <!-- Expense item skeletons -->
    <div
      v-for="index in itemCount"
      :key="index"
      class="expense-item-skeleton flex items-center gap-4 p-4 border rounded-lg bg-card"
    >
      <!-- Date skeleton -->
      <div class="flex-shrink-0">
        <Skeleton class="h-4 w-20" />
      </div>
      
      <!-- Content area -->
      <div class="flex-1 space-y-2">
        <!-- Category and description -->
        <div class="flex items-center gap-2">
          <Skeleton class="h-5 w-16 rounded-full" /> <!-- Category badge -->
          <Skeleton class="h-4 w-48" /> <!-- Description -->
        </div>
        
        <!-- Tags skeleton -->
        <div class="flex gap-1">
          <Skeleton class="h-4 w-12 rounded-full" />
          <Skeleton class="h-4 w-16 rounded-full" />
          <Skeleton class="h-4 w-10 rounded-full" />
        </div>
      </div>
      
      <!-- Amount area -->
      <div class="flex-shrink-0 text-right space-y-1">
        <Skeleton class="h-5 w-20 ml-auto" /> <!-- Income amount -->
        <Skeleton class="h-5 w-24 ml-auto" /> <!-- Expense amount -->
        <Skeleton class="h-4 w-16 ml-auto" /> <!-- Balance -->
      </div>
      
      <!-- Actions skeleton -->
      <div class="flex-shrink-0 flex gap-1">
        <Skeleton class="h-8 w-8 rounded" />
        <Skeleton class="h-8 w-8 rounded" />
        <Skeleton class="h-8 w-8 rounded" />
      </div>
    </div>
    
    <!-- Pagination skeleton -->
    <div class="flex items-center justify-between pt-4">
      <Skeleton class="h-4 w-40" />
      <div class="flex gap-2">
        <Skeleton class="h-8 w-8 rounded" />
        <Skeleton class="h-8 w-8 rounded" />
        <Skeleton class="h-8 w-8 rounded" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Skeleton } from '~/foundation/components/ui/skeleton'

interface Props {
  /** Number of skeleton items to show */
  itemCount?: number
  /** Show header skeleton */
  showHeader?: boolean
  /** Show pagination skeleton */
  showPagination?: boolean
}

withDefaults(defineProps<Props>(), {
  itemCount: 5,
  showHeader: true,
  showPagination: true
})
</script>

<style scoped>
.expense-list-skeleton {
  animation: pulse 2s ease-in-out infinite;
}

.expense-item-skeleton {
  min-height: 80px; /* Match ExpenseListItem height */
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .expense-item-skeleton {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .expense-item-skeleton > div {
    width: 100%;
  }
}

/* Accessible animation respecting user preferences */
@media (prefers-reduced-motion: reduce) {
  .expense-list-skeleton {
    animation: none;
  }
}
</style>