<template>
  <TableRow
    :class="rowClass"
    class="cursor-pointer hover:bg-muted/50 transition-colors"
    @click="emit('click', expense)"
  >
    <!-- Selection Checkbox -->
    <TableCell>
      <Checkbox
        :checked="isSelected"
        @update:checked="emit('toggleSelection', expense.id)"
        @click.stop
      />
    </TableCell>

    <!-- Date Column -->
    <TableCell v-if="isColumnVisible('date')">
      <div class="font-mono text-sm">
        {{ formatDate(expense.date) }}
      </div>
    </TableCell>

    <!-- Category Column -->
    <TableCell v-if="isColumnVisible('category')">
      <Badge variant="outline" :class="getCategoryBadgeClass(expense.category)">
        {{ expense.category }}
      </Badge>
    </TableCell>

    <!-- Description Column -->
    <TableCell v-if="isColumnVisible('description')" class="max-w-xs">
      <div class="space-y-1">
        <div 
          class="font-medium truncate" 
          :title="expense.description"
        >
          {{ expense.description }}
        </div>
        <div 
          v-if="expense.memo" 
          class="text-xs text-muted-foreground truncate" 
          :title="expense.memo"
        >
          {{ expense.memo }}
        </div>
      </div>
    </TableCell>

    <!-- Amount Column -->
    <TableCell v-if="isColumnVisible('amount')" class="text-right">
      <div class="expense-amounts space-y-1">
        <div 
          v-if="expense.incomeAmount > 0" 
          class="text-green-600 font-mono text-sm"
        >
          +{{ formatCurrency(expense.incomeAmount) }}
        </div>
        <div 
          v-if="expense.expenseAmount > 0" 
          class="text-red-600 font-mono text-sm"
        >
          -{{ formatCurrency(expense.expenseAmount) }}
        </div>
      </div>
    </TableCell>

    <!-- Balance Column -->
    <TableCell v-if="isColumnVisible('balance')" class="text-right font-mono">
      <span :class="balanceClass">
        {{ formatCurrency(balance) }}
      </span>
    </TableCell>

    <!-- Case Column -->
    <TableCell v-if="isColumnVisible('case')">
      <Badge 
        v-if="expense.caseId" 
        variant="secondary"
        class="text-xs"
      >
        {{ $t('expense.table.case') }}: {{ expense.caseId }}
      </Badge>
    </TableCell>

    <!-- Tags Column -->
    <TableCell v-if="isColumnVisible('tags')">
      <div class="flex gap-1 flex-wrap">
        <Badge
          v-for="tagId in expense.tagIds.slice(0, 2)"
          :key="tagId"
          variant="secondary"
          class="text-xs"
        >
          {{ tagId }}
        </Badge>
        <Badge
          v-if="expense.tagIds.length > 2"
          variant="outline"
          class="text-xs"
        >
          +{{ expense.tagIds.length - 2 }}
        </Badge>
      </div>
    </TableCell>

    <!-- Memo Column -->
    <TableCell v-if="isColumnVisible('memo')">
      <div 
        v-if="expense.memo" 
        class="text-sm text-muted-foreground truncate max-w-[150px]"
        :title="expense.memo"
      >
        {{ expense.memo }}
      </div>
    </TableCell>

    <!-- Attachments Column -->
    <TableCell v-if="isColumnVisible('attachments')" class="text-center">
      <Icon 
        v-if="expense.attachmentIds && expense.attachmentIds.length > 0"
        name="lucide:paperclip" 
        class="w-4 h-4 text-muted-foreground"
        :title="`${expense.attachmentIds.length}個の添付ファイル`"
      />
    </TableCell>

    <!-- Actions Column -->
    <TableCell>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" @click.stop>
            <Icon name="lucide:more-horizontal" class="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="emit('view', expense)">
            <Icon name="lucide:eye" class="w-4 h-4 mr-2" />
            {{ $t('expense.actions.view') }}
          </DropdownMenuItem>
          <DropdownMenuItem @click="emit('edit', expense)">
            <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
            {{ $t('expense.actions.edit') }}
          </DropdownMenuItem>
          <DropdownMenuItem @click="emit('duplicate', expense)">
            <Icon name="lucide:copy" class="w-4 h-4 mr-2" />
            {{ $t('expense.actions.duplicate') }}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive"
            @click="emit('delete', expense)"
          >
            <Icon name="lucide:trash" class="w-4 h-4 mr-2" />
            {{ $t('expense.actions.delete') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </TableRow>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IExpense } from '~/modules/expense/types'
import {
  TableCell,
  TableRow,
} from '~/foundation/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '~/foundation/components/ui/dropdown-menu'
import { Button } from '~/foundation/components/ui/button'
import { Checkbox } from '~/foundation/components/ui/checkbox'
import { Badge } from '~/foundation/components/ui/badge'
import { useExpenseFormatters } from '~/modules/expense/composables/shared/useExpenseFormatters'
import { useExpenseCalculations } from '~/modules/expense/composables/shared/useExpenseCalculations'

interface Props {
  /** Expense data for this row */
  expense: IExpense
  /** Whether this row is selected */
  isSelected: boolean
  /** Function to check column visibility */
  isColumnVisible: (columnKey: string) => boolean
}

interface Emits {
  /** Expense action events */
  (event: 'click' | 'view' | 'edit' | 'duplicate' | 'delete', expense: IExpense): void
  /** Selection toggle event */
  (event: 'toggleSelection', expenseId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use formatters composable for consistent styling
const { formatCurrency, formatDate, getCategoryBadgeClass, getBalanceClass: _getBalanceClass } = useExpenseFormatters()

// Use calculations composable for balance computation
const expenseRef = computed(() => props.expense)
const { balance, balanceClass } = useExpenseCalculations(expenseRef)

// Row styling based on selection state
const rowClass = computed(() => {
  const baseClass = 'transition-colors'
  return props.isSelected ? `${baseClass} bg-muted/30` : baseClass
})
</script>

<style scoped>
.expense-amounts {
  /* Ensure proper spacing for amounts */
}
</style>