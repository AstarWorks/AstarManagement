<!--
  Expense Card Component
  
  @description Display component for expense items in lists and grids.
  Shows key expense information with status indicators and action buttons.
  
  @author Claude
  @created 2025-07-03
  @task T01_S14 - Expense Entry Form
-->

<template>
  <Card class="expense-card" :class="cardClasses">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <Icon :name="categoryIcon" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm text-muted-foreground">{{ categoryLabel }}</span>
          </div>
          <CardTitle class="text-base line-clamp-2">{{ expense.description }}</CardTitle>
        </div>
        <div class="flex flex-col items-end gap-1">
          <Badge :variant="statusVariant" class="text-xs">
            {{ statusLabel }}
          </Badge>
          <Badge v-if="expense.billable" variant="outline" class="text-xs">
            Billable
          </Badge>
        </div>
      </div>
    </CardHeader>

    <CardContent class="pt-0">
      <!-- Amount and Date -->
      <div class="flex items-center justify-between mb-3">
        <div class="amount-display">
          <span class="text-lg font-semibold">{{ formattedAmount }}</span>
          <span v-if="expense.currency !== 'JPY'" class="text-sm text-muted-foreground ml-1">
            {{ expense.currency }}
          </span>
        </div>
        <div class="text-sm text-muted-foreground">
          {{ formattedDate }}
        </div>
      </div>

      <!-- Matter Association -->
      <div v-if="expense.matter" class="flex items-center gap-2 mb-3">
        <Icon name="Scale" class="w-3 h-3 text-muted-foreground" />
        <span class="text-sm text-muted-foreground">{{ expense.matter.title }}</span>
      </div>

      <!-- Receipt Indicator -->
      <div v-if="expense.receiptFilename" class="flex items-center gap-2 mb-3">
        <Icon name="Paperclip" class="w-3 h-3 text-muted-foreground" />
        <span class="text-sm text-muted-foreground">Receipt attached</span>
      </div>

      <!-- Approval Information -->
      <div v-if="showApprovalInfo" class="approval-info">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">
            {{ approvalInfoText }}
          </span>
          <span v-if="expense.approvedAt" class="text-muted-foreground">
            {{ formatRelativeTime(expense.approvedAt) }}
          </span>
        </div>
      </div>

      <!-- Notes Preview -->
      <div v-if="expense.notes" class="mt-3 pt-3 border-t">
        <p class="text-sm text-muted-foreground line-clamp-2">
          {{ expense.notes }}
        </p>
      </div>
    </CardContent>

    <!-- Actions Footer -->
    <CardFooter v-if="showActions" class="pt-0">
      <div class="flex items-center gap-2 w-full">
        <Button
          variant="outline"
          size="sm"
          @click="$emit('view', expense.id)"
        >
          <Icon name="Eye" class="w-3 h-3 mr-1" />
          View
        </Button>
        
        <Button
          v-if="canEdit"
          variant="outline"
          size="sm"
          @click="$emit('edit', expense.id)"
        >
          <Icon name="Edit" class="w-3 h-3 mr-1" />
          Edit
        </Button>

        <Button
          v-if="canApprove"
          variant="outline"
          size="sm"
          @click="$emit('approve', expense.id)"
        >
          <Icon name="Check" class="w-3 h-3 mr-1" />
          Approve
        </Button>

        <Button
          v-if="canReject"
          variant="outline"
          size="sm"
          @click="$emit('reject', expense.id)"
        >
          <Icon name="X" class="w-3 h-3 mr-1" />
          Reject
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" class="ml-auto">
              <Icon name="MoreVertical" class="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="$emit('view', expense.id)">
              <Icon name="Eye" class="w-3 h-3 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              v-if="canEdit"
              @click="$emit('edit', expense.id)"
            >
              <Icon name="Edit" class="w-3 h-3 mr-2" />
              Edit Expense
            </DropdownMenuItem>
            <DropdownMenuItem 
              v-if="expense.receiptFilename"
              @click="$emit('viewReceipt', expense.id)"
            >
              <Icon name="Paperclip" class="w-3 h-3 mr-2" />
              View Receipt
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="canDelete" />
            <DropdownMenuItem 
              v-if="canDelete"
              class="text-destructive"
              @click="$emit('delete', expense.id)"
            >
              <Icon name="Trash2" class="w-3 h-3 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Expense } from '~/types/expense'
import { EXPENSE_CATEGORIES } from '~/types/expense'
import { formatCurrency } from '~/utils/currencyFormatters'
import { formatDate, formatRelativeTime } from '~/utils/formatters'

// Component Props
interface Props {
  /** Expense data */
  expense: Expense
  /** Show action buttons */
  showActions?: boolean
  /** Can edit this expense */
  canEdit?: boolean
  /** Can approve this expense */
  canApprove?: boolean
  /** Can reject this expense */
  canReject?: boolean
  /** Can delete this expense */
  canDelete?: boolean
  /** Compact display mode */
  compact?: boolean
  /** Highlight card (e.g., selected) */
  highlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  canEdit: false,
  canApprove: false,
  canReject: false,
  canDelete: false,
  compact: false,
  highlighted: false
})

// Component Emits
defineEmits<{
  view: [expenseId: string]
  edit: [expenseId: string]
  approve: [expenseId: string]
  reject: [expenseId: string]
  delete: [expenseId: string]
  viewReceipt: [expenseId: string]
}>()

// Computed Properties
const categoryIcon = computed(() => {
  const category = EXPENSE_CATEGORIES[props.expense.expenseType]
  return category?.icon || 'MoreHorizontal'
})

const categoryLabel = computed(() => {
  const category = EXPENSE_CATEGORIES[props.expense.expenseType]
  return category?.label || 'Other'
})

const formattedAmount = computed(() => {
  return formatCurrency(props.expense.amount, props.expense.currency)
})

const formattedDate = computed(() => {
  return formatDate(props.expense.expenseDate)
})

const statusLabel = computed(() => {
  switch (props.expense.approvalStatus) {
    case 'PENDING':
      return 'Pending Approval'
    case 'APPROVED':
      return 'Approved'
    case 'REJECTED':
      return 'Rejected'
    case 'REIMBURSED':
      return 'Reimbursed'
    default:
      return 'Unknown'
  }
})

const statusVariant = computed(() => {
  switch (props.expense.approvalStatus) {
    case 'PENDING':
      return 'secondary'
    case 'APPROVED':
      return 'default'
    case 'REJECTED':
      return 'destructive'
    case 'REIMBURSED':
      return 'default'
    default:
      return 'secondary'
  }
})

const cardClasses = computed(() => ({
  'border-primary': props.highlighted,
  'bg-muted/30': props.highlighted,
  'h-auto': props.compact
}))

const showApprovalInfo = computed(() => {
  return props.expense.approvalStatus !== 'PENDING' && 
         (props.expense.approvedBy || props.expense.approvedAt)
})

const approvalInfoText = computed(() => {
  if (props.expense.approvedByUser) {
    const action = props.expense.approvalStatus === 'APPROVED' ? 'Approved' : 'Rejected'
    return `${action} by ${props.expense.approvedByUser.name}`
  }
  return props.expense.approvalStatus === 'APPROVED' ? 'Approved' : 'Rejected'
})
</script>

<style scoped>
.expense-card {
  transition: all 0.2s ease;
}

.expense-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.amount-display {
  display: flex;
  align-items: baseline;
}

.approval-info {
  padding: 0.5rem;
  background: hsl(var(--muted) / 0.5);
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid hsl(var(--border));
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Status-based styling */
.expense-card[data-status="REJECTED"] {
  border-left: 3px solid hsl(var(--destructive));
}

.expense-card[data-status="APPROVED"] {
  border-left: 3px solid hsl(var(--success));
}

.expense-card[data-status="REIMBURSED"] {
  border-left: 3px solid hsl(var(--primary));
}

.expense-card[data-status="PENDING"] {
  border-left: 3px solid hsl(var(--warning));
}
</style>