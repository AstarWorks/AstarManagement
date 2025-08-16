<template>
  <div 
    class="expense-list-item"
    :class="{
      'selected': selected,
      'hover:bg-muted/50': !selected,
      'bg-muted/30': selected
    }"
    @click="$emit('view', props.expense)"
  >
    <div class="item-content flex items-center gap-4 p-4 h-full">
      <!-- Selection checkbox -->
      <div class="selection-area flex items-center">
        <Checkbox
          :checked="selected"
          @update:checked="(checked: boolean) => $emit('select', { expenseId: props.expense.id, selected: checked })"
          @click.stop
        />
      </div>

      <!-- Date column -->
      <div class="date-column flex-shrink-0 w-24">
        <div class="text-sm font-mono text-muted-foreground">
          {{ formatDate(props.expense.date) }}
        </div>
      </div>

      <!-- Category badge -->
      <div class="category-column flex-shrink-0">
        <Badge 
          variant="outline" 
          :class="getCategoryBadgeClass(props.expense.category)"
          class="text-xs"
        >
          {{ props.expense.category }}
        </Badge>
      </div>

      <!-- Description and memo -->
      <div class="description-column flex-1 min-w-0">
        <div class="font-medium truncate" :title="props.expense.description">
          {{ props.expense.description }}
        </div>
        <div 
          v-if="props.expense.memo" 
          class="text-xs text-muted-foreground truncate mt-1" 
          :title="props.expense.memo"
        >
          {{ props.expense.memo }}
        </div>
      </div>

      <!-- Case info -->
      <div v-if="props.expense.caseId" class="case-column flex-shrink-0">
        <Badge variant="secondary" class="text-xs">
          {{ $t('expense.table.case') }}: {{ props.expense.caseId }}
        </Badge>
      </div>

      <!-- Tags (if any) -->
      <div v-if="props.expense.tagIds && props.expense.tagIds.length > 0" class="tags-column flex-shrink-0">
        <div class="flex gap-1">
          <Badge
            v-for="tagId in props.expense.tagIds.slice(0, 2)"
            :key="tagId"
            variant="secondary"
            class="text-xs"
          >
            {{ tagId }}
          </Badge>
          <Badge
            v-if="props.expense.tagIds.length > 2"
            variant="outline"
            class="text-xs"
          >
            +{{ props.expense.tagIds.length - 2 }}
          </Badge>
        </div>
      </div>

      <!-- Amount display -->
      <div class="amount-column flex-shrink-0 text-right min-w-[100px]">
        <div class="space-y-1">
          <div v-if="props.expense.incomeAmount > 0" class="text-green-600 font-mono text-sm">
            +{{ formatCurrency(props.expense.incomeAmount) }}
          </div>
          <div v-if="props.expense.expenseAmount > 0" class="text-red-600 font-mono text-sm">
            -{{ formatCurrency(props.expense.expenseAmount) }}
          </div>
        </div>
      </div>

      <!-- Balance -->
      <div class="balance-column flex-shrink-0 text-right min-w-[80px]">
        <span 
          class="font-mono text-sm"
          :class="getBalanceClass(props.expense.incomeAmount - props.expense.expenseAmount)"
        >
          {{ formatCurrency(props.expense.incomeAmount - props.expense.expenseAmount) }}
        </span>
      </div>

      <!-- Actions menu -->
      <div class="actions-column flex-shrink-0">
        <ExpenseListItemActions
          @view="$emit('view', props.expense)"
          @edit="$emit('edit', props.expense)"
          @duplicate="$emit('duplicate', props.expense)"
          @delete="$emit('delete', props.expense)"
        />
      </div>
    </div>

    <!-- Hover indicators -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- Left accent for selection -->
      <div 
        v-if="selected"
        class="absolute left-0 top-0 bottom-0 w-1 bg-primary"
      />
      
      <!-- Attachments indicator -->
      <div 
        v-if="props.expense.attachmentIds && props.expense.attachmentIds.length > 0"
        class="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"
        :title="$t('expense.indicators.hasAttachments')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IExpense } from '~/modules/expense/types'
import { useExpenseFormatters } from '~/modules/expense/composables/shared/useExpenseFormatters'
import { Badge } from '~/foundation/components/ui/badge'
import { Checkbox } from '~/foundation/components/ui/checkbox'
import ExpenseListItemActions from './ExpenseListItemActions.vue'

interface Props {
  expense: IExpense
  index: number
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})

defineEmits<{
  'select': [{ expenseId: string; selected: boolean }]
  'edit': [IExpense]
  'view': [IExpense]
  'delete': [IExpense]
  'duplicate': [IExpense]
}>()

// Use the expense formatters composable
const { formatDate, formatCurrency, getCategoryBadgeClass, getBalanceClass } = useExpenseFormatters()
</script>

<style scoped>
.expense-list-item {
  @apply relative border-b border-border transition-colors cursor-pointer group;
}

.expense-list-item:last-child {
  @apply border-b-0;
}

.expense-list-item:hover .actions-column button {
  @apply opacity-100;
}

.item-content {
  @apply min-h-[80px];
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .case-column,
  .tags-column {
    @apply hidden;
  }
  
  .item-content {
    @apply gap-2;
  }
}

@media (max-width: 640px) {
  .date-column {
    @apply w-16;
  }
  
  .amount-column {
    @apply min-w-[80px];
  }
  
  .balance-column {
    @apply min-w-[60px];
  }
}

/* Focus and accessibility */
.expense-list-item:focus-within {
  @apply ring-2 ring-offset-2 ring-primary;
}

.selection-area input[type="checkbox"]:focus {
  @apply ring-2 ring-offset-2 ring-primary;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .expense-list-item {
    @apply border-border;
  }
  
  .expense-list-item.selected {
    @apply bg-primary/20;
  }
}
</style>