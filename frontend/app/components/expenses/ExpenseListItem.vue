<template>
  <div 
    class="expense-list-item"
    :class="{
      'selected': selected,
      'hover:bg-muted/50': !selected,
      'bg-muted/30': selected
    }"
    @click="handleClick"
  >
    <div class="item-content flex items-center gap-4 p-4 h-full">
      <!-- Selection checkbox -->
      <div class="selection-area flex items-center">
        <Checkbox
          :checked="selected"
          @update:checked="handleSelect"
          @click.stop
        />
      </div>

      <!-- Date column -->
      <div class="date-column flex-shrink-0 w-24">
        <div class="text-sm font-mono text-muted-foreground">
          {{ formatDate(expense.date) }}
        </div>
      </div>

      <!-- Category badge -->
      <div class="category-column flex-shrink-0">
        <Badge 
          variant="outline" 
          :class="getCategoryBadgeClass(expense.category)"
          class="text-xs"
        >
          {{ expense.category }}
        </Badge>
      </div>

      <!-- Description and memo -->
      <div class="description-column flex-1 min-w-0">
        <div class="font-medium truncate" :title="expense.description">
          {{ expense.description }}
        </div>
        <div 
          v-if="expense.memo" 
          class="text-xs text-muted-foreground truncate mt-1" 
          :title="expense.memo"
        >
          {{ expense.memo }}
        </div>
      </div>

      <!-- Case info -->
      <div v-if="expense.caseId" class="case-column flex-shrink-0">
        <Badge variant="secondary" class="text-xs">
          {{ $t('expense.table.case') }}: {{ expense.caseId }}
        </Badge>
      </div>

      <!-- Tags (if any) -->
      <div v-if="expense.tags.length > 0" class="tags-column flex-shrink-0">
        <div class="flex gap-1">
          <Badge
            v-for="tag in expense.tags.slice(0, 2)"
            :key="tag.id"
            variant="secondary"
            class="text-xs"
          >
            {{ tag.name }}
          </Badge>
          <Badge
            v-if="expense.tags.length > 2"
            variant="outline"
            class="text-xs"
          >
            +{{ expense.tags.length - 2 }}
          </Badge>
        </div>
      </div>

      <!-- Amount display -->
      <div class="amount-column flex-shrink-0 text-right min-w-[100px]">
        <div class="space-y-1">
          <div v-if="expense.incomeAmount > 0" class="text-green-600 font-mono text-sm">
            +{{ formatCurrency(expense.incomeAmount) }}
          </div>
          <div v-if="expense.expenseAmount > 0" class="text-red-600 font-mono text-sm">
            -{{ formatCurrency(expense.expenseAmount) }}
          </div>
        </div>
      </div>

      <!-- Balance -->
      <div class="balance-column flex-shrink-0 text-right min-w-[80px]">
        <span 
          class="font-mono text-sm"
          :class="getBalanceClass(expense.balance)"
        >
          {{ formatCurrency(expense.balance) }}
        </span>
      </div>

      <!-- Actions menu -->
      <div class="actions-column flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button 
              variant="ghost" 
              size="sm" 
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop
            >
              <Icon name="lucide:more-horizontal" class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="handleView">
              <Icon name="lucide:eye" class="w-4 h-4 mr-2" />
              {{ $t('expense.actions.view') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleEdit">
              <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
              {{ $t('expense.actions.edit') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleDuplicate">
              <Icon name="lucide:copy" class="w-4 h-4 mr-2" />
              {{ $t('expense.actions.duplicate') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              class="text-destructive"
              @click="handleDelete"
            >
              <Icon name="lucide:trash" class="w-4 h-4 mr-2" />
              {{ $t('expense.actions.delete') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        v-if="expense.attachments && expense.attachments.length > 0"
        class="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"
        :title="$t('expense.indicators.hasAttachments')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IExpense } from '~/types/expense'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'

interface Props {
  expense: IExpense
  index: number
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})

const emit = defineEmits<{
  'select': [{ expenseId: string; selected: boolean }]
  'edit': [IExpense]
  'view': [IExpense]
  'delete': [IExpense]
  'duplicate': [IExpense]
}>()

// Event handlers
const handleClick = () => {
  emit('view', props.expense)
}

const handleSelect = (checked: boolean) => {
  emit('select', { 
    expenseId: props.expense.id, 
    selected: checked 
  })
}

const handleEdit = () => {
  emit('edit', props.expense)
}

const handleView = () => {
  emit('view', props.expense)
}

const handleDelete = () => {
  emit('delete', props.expense)
}

const handleDuplicate = () => {
  emit('duplicate', props.expense)
}

// Utility functions
const getCategoryBadgeClass = (category: string) => {
  const categoryClasses: Record<string, string> = {
    '交通費': 'border-blue-200 text-blue-700 bg-blue-50',
    '印紙代': 'border-red-200 text-red-700 bg-red-50',
    'コピー代': 'border-green-200 text-green-700 bg-green-50',
    '郵送料': 'border-yellow-200 text-yellow-700 bg-yellow-50',
    'その他': 'border-purple-200 text-purple-700 bg-purple-50'
  }
  return categoryClasses[category] || 'border-gray-200 text-gray-700 bg-gray-50'
}

const getBalanceClass = (balance: number) => {
  if (balance > 0) return 'text-green-600'
  if (balance < 0) return 'text-red-600'
  return 'text-muted-foreground'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(amount)
}
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