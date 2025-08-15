<template>
  <div class="expense-data-table-mobile md:hidden">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <Card v-for="i in pageSize" :key="`mobile-skeleton-${i}`" class="p-4">
        <Skeleton class="h-4 w-3/4 mb-2" />
        <Skeleton class="h-3 w-1/2 mb-2" />
        <Skeleton class="h-3 w-full" />
      </Card>
    </div>
    
    <!-- Empty State -->
    <ExpenseTableEmpty 
      v-else-if="expenses.length === 0" 
      @create="emit('createExpense')" 
    />
    
    <!-- Expense Cards -->
    <div v-else class="space-y-4">
      <Card 
        v-for="expense in expenses" 
        :key="expense.id" 
        class="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        :aria-label="`${t('expense.card.ariaLabel', { description: expense.description })}`"
        role="article"
        tabindex="0"
        @click="emit('rowClick', expense)"
        @keydown.enter="emit('rowClick', expense)"
        @keydown.space.prevent="emit('rowClick', expense)"
      >
        <!-- Card Header with Selection and Category -->
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <Checkbox
              :id="`mobile-select-${expense.id}`"
              :checked="isSelected(expense.id)"
              :aria-label="`${t('expense.select')} ${expense.description}`"
              @update:checked="emit('toggleSelection', expense.id)"
              @click.stop
            />
            <Badge 
              variant="outline" 
              :class="getCategoryBadgeClass(expense.category)"
              :aria-label="`${t('expense.category')}: ${t(`expense.categories.${expense.category}`)}`"
            >
              {{ t(`expense.categories.${expense.category}`) }}
            </Badge>
          </div>
          
          <!-- Mobile Actions Menu -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child @click.stop>
              <Button 
                variant="ghost" 
                size="sm"
                :aria-label="`${t('expense.actions.menu')} ${expense.description}`"
              >
                <Icon name="lucide:more-vertical" class="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click.stop="emit('view', expense)">
                <Icon name="lucide:eye" class="w-4 h-4 mr-2" />
                {{ t('expense.actions.view') }}
              </DropdownMenuItem>
              <DropdownMenuItem @click.stop="emit('edit', expense)">
                <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
                {{ t('expense.actions.edit') }}
              </DropdownMenuItem>
              <DropdownMenuItem @click.stop="emit('duplicate', expense)">
                <Icon name="lucide:copy" class="w-4 h-4 mr-2" />
                {{ t('expense.actions.duplicate') }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                class="text-destructive"
                @click.stop="emit('delete', expense)"
              >
                <Icon name="lucide:trash" class="w-4 h-4 mr-2" />
                {{ t('expense.actions.delete') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <!-- Card Content -->
        <div class="space-y-2">
          <div class="font-medium">{{ expense.description }}</div>
          
          <div v-if="expense.memo" class="text-sm text-muted-foreground line-clamp-2">
            {{ expense.memo }}
          </div>
          
          <div v-if="expense.case?.name" class="text-sm text-muted-foreground">
            <Icon name="lucide:briefcase" class="inline w-3 h-3 mr-1" />
            {{ expense.case.name }}
          </div>
          
          <!-- Date and Amount Row -->
          <div class="flex justify-between items-center pt-2 border-t">
            <div class="text-sm text-muted-foreground">
              <Icon name="lucide:calendar" class="inline w-3 h-3 mr-1" />
              {{ formatDate(expense.date) }}
            </div>
            
            <div class="text-right">
              <div 
                v-if="expense.incomeAmount > 0" 
                class="text-green-600 font-mono text-sm"
                :aria-label="`${t('expense.income')}: ${formatCurrency(expense.incomeAmount)}`"
              >
                +{{ formatCurrency(expense.incomeAmount) }}
              </div>
              <div 
                v-if="expense.expenseAmount > 0" 
                class="text-red-600 font-mono text-sm"
                :aria-label="`${t('expense.expense')}: ${formatCurrency(expense.expenseAmount)}`"
              >
                -{{ formatCurrency(expense.expenseAmount) }}
              </div>
            </div>
          </div>
          
          <!-- Tags if present -->
          <div v-if="expense.tags && expense.tags.length > 0" class="flex flex-wrap gap-1 pt-2">
            <Badge 
              v-for="tag in expense.tags" 
              :key="tag.id"
              variant="secondary"
              size="sm"
            >
              {{ tag.name }}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IExpenseWithBalance, IExpenseCase } from '@expense/types/expense'
import { Card } from '@ui/card'
import { Skeleton } from '@ui/skeleton'
import { Badge } from '@ui/badge'
import { Checkbox } from '@ui/checkbox'
import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@ui/dropdown-menu'
import { useExpenseFormatters } from '@expense/composables/shared/useExpenseFormatters'
import { useI18n } from 'vue-i18n'
import ExpenseTableEmpty from './ExpenseTableEmpty.vue'

interface IExtendedExpense extends IExpenseWithBalance {
  case?: IExpenseCase
}

interface Props {
  expenses: IExtendedExpense[]
  loading?: boolean
  pageSize?: number
  isSelected: (id: string) => boolean
}

interface Emits {
  'rowClick': [IExtendedExpense]
  'toggleSelection': [string]
  'view': [IExtendedExpense]
  'edit': [IExtendedExpense]
  'delete': [IExtendedExpense]
  'duplicate': [IExtendedExpense]
  'createExpense': []
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
  pageSize: 10
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const {
  formatCurrency,
  formatDate,
  getCategoryBadgeClass
} = useExpenseFormatters()
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>