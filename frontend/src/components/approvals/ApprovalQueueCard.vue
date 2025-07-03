<!--
  Approval Queue Card Component
  
  @description Display card for individual expense items in the approval queue.
  Shows expense details, approval status, and action buttons.
  
  @author Claude
  @created 2025-07-03
  @task T07_S14 - Approval Workflow System
-->

<template>
  <Card class="approval-queue-card" :class="cardClasses">
    <!-- Priority Indicator -->
    <div v-if="item.priority === 'high' || item.isUrgent" class="priority-indicator">
      <Badge variant="destructive" class="priority-badge">
        <Icon name="Zap" class="w-3 h-3 mr-1" />
        {{ item.isUrgent ? 'URGENT' : 'HIGH PRIORITY' }}
      </Badge>
    </div>

    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <!-- Expense Category -->
          <div class="flex items-center gap-2 mb-1">
            <Icon :name="categoryIcon" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm text-muted-foreground">{{ categoryLabel }}</span>
            <Badge v-if="item.daysPending > 2" variant="outline" class="text-xs">
              {{ item.daysPending }} days pending
            </Badge>
          </div>
          
          <!-- Description -->
          <CardTitle class="text-base line-clamp-2 mb-2">
            {{ item.description }}
          </CardTitle>
          
          <!-- Submitter Info -->
          <div class="flex items-center gap-2 mb-2">
            <Avatar class="w-5 h-5">
              <AvatarImage :src="item.submittedBy.avatar" />
              <AvatarFallback class="text-xs">
                {{ getInitials(item.submittedBy.name) }}
              </AvatarFallback>
            </Avatar>
            <span class="text-sm text-muted-foreground">
              by {{ item.submittedBy.name }}
            </span>
          </div>
        </div>
        
        <!-- Amount Display -->
        <div class="text-right">
          <div class="amount-display">
            <span class="text-lg font-bold">{{ formattedAmount }}</span>
          </div>
          <div class="text-sm text-muted-foreground">
            {{ formatDate(item.expenseDate) }}
          </div>
        </div>
      </div>
    </CardHeader>

    <CardContent class="pt-0">
      <!-- Matter Association -->
      <div v-if="item.matterTitle" class="flex items-center gap-2 mb-3">
        <Icon name="Scale" class="w-3 h-3 text-muted-foreground" />
        <span class="text-sm text-muted-foreground line-clamp-1">{{ item.matterTitle }}</span>
      </div>

      <!-- Receipt Indicator -->
      <div v-if="item.receiptFilename" class="flex items-center gap-2 mb-3">
        <Icon name="Paperclip" class="w-3 h-3 text-green-600" />
        <span class="text-sm text-green-600">Receipt attached</span>
      </div>

      <!-- Escalation Notice -->
      <div v-if="item.escalation" class="escalation-notice mb-3">
        <Alert class="border-orange-500 bg-orange-50">
          <Icon name="ArrowUp" class="h-3 w-3" />
          <AlertTitle class="text-sm">Escalated</AlertTitle>
          <AlertDescription class="text-xs">
            {{ item.escalation.reason }}
          </AlertDescription>
        </Alert>
      </div>

      <!-- Additional Info -->
      <div class="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>Submitted {{ formatRelativeTime(item.createdAt) }}</span>
        <div class="flex items-center gap-2">
          <Badge v-if="item.billable" variant="outline" class="text-xs">Billable</Badge>
          <Badge :variant="priorityVariant" class="text-xs">
            {{ item.priority.toUpperCase() }}
          </Badge>
        </div>
      </div>
    </CardContent>

    <!-- Action Buttons -->
    <CardFooter class="pt-0 pb-4">
      <div class="flex items-center gap-2 w-full">
        <!-- Primary Actions -->
        <Button 
          v-if="canApprove"
          size="sm" 
          class="flex-1"
          @click="$emit('approve', item)"
        >
          <Icon name="Check" class="w-3 h-3 mr-1" />
          Approve
        </Button>
        
        <Button 
          v-if="canReject"
          variant="outline" 
          size="sm" 
          class="flex-1"
          @click="$emit('reject', item)"
        >
          <Icon name="X" class="w-3 h-3 mr-1" />
          Reject
        </Button>

        <!-- Secondary Actions Menu -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Icon name="MoreVertical" class="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="$emit('view', item)">
              <Icon name="Eye" class="w-3 h-3 mr-2" />
              View Details
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              v-if="canDelegate"
              @click="$emit('delegate', item)"
            >
              <Icon name="UserCheck" class="w-3 h-3 mr-2" />
              Delegate
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              v-if="canEscalate"
              @click="$emit('escalate', item)"
            >
              <Icon name="ArrowUp" class="w-3 h-3 mr-2" />
              Escalate
            </DropdownMenuItem>
            
            <DropdownMenuSeparator v-if="item.receiptFilename" />
            
            <DropdownMenuItem 
              v-if="item.receiptFilename"
              @click="viewReceipt"
            >
              <Icon name="Paperclip" class="w-3 h-3 mr-2" />
              View Receipt
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem @click="copyExpenseId">
              <Icon name="Copy" class="w-3 h-3 mr-2" />
              Copy ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ApprovalQueueItem, ApprovalPermissions } from '~/types/approval'
import { EXPENSE_CATEGORIES } from '~/types/expense'
import { formatCurrency } from '~/utils/currencyFormatters'
import { formatDate, formatRelativeTime } from '~/utils/formatters'

// Component Props
interface Props {
  /** Approval queue item */
  item: ApprovalQueueItem
  /** User permissions */
  permissions?: ApprovalPermissions
  /** Whether card is selected/highlighted */
  highlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  highlighted: false
})

// Component Emits
defineEmits<{
  approve: [item: ApprovalQueueItem]
  reject: [item: ApprovalQueueItem]
  delegate: [item: ApprovalQueueItem]
  escalate: [item: ApprovalQueueItem]
  view: [item: ApprovalQueueItem]
}>()

// Computed Properties
const categoryIcon = computed(() => {
  const category = EXPENSE_CATEGORIES[props.item.expenseType]
  return category?.icon || 'MoreHorizontal'
})

const categoryLabel = computed(() => {
  const category = EXPENSE_CATEGORIES[props.item.expenseType]
  return category?.label || 'Other'
})

const formattedAmount = computed(() => {
  return formatCurrency(props.item.amount, props.item.currency)
})

const priorityVariant = computed(() => {
  switch (props.item.priority) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'default'
    case 'low':
      return 'secondary'
    default:
      return 'outline'
  }
})

const cardClasses = computed(() => ({
  'border-destructive bg-destructive/5': props.item.isUrgent,
  'border-orange-400 bg-orange-50': props.item.daysPending > 2 && !props.item.isUrgent,
  'border-primary bg-primary/5': props.highlighted,
  'shadow-md': props.highlighted
}))

// Permission Checks
const canApprove = computed(() => {
  if (!props.permissions?.canApprove) return false
  
  // Check amount limits
  if (props.permissions.maxApprovalAmount && 
      props.item.amount > props.permissions.maxApprovalAmount) {
    return false
  }
  
  // Check expense types
  if (props.permissions.allowedExpenseTypes?.length && 
      !props.permissions.allowedExpenseTypes.includes(props.item.expenseType)) {
    return false
  }
  
  return true
})

const canReject = computed(() => {
  return canApprove.value // Same permissions as approval
})

const canDelegate = computed(() => {
  return props.permissions?.canDelegate || false
})

const canEscalate = computed(() => {
  return props.permissions?.canEscalate && props.item.daysPending >= 2
})

// Helper Functions
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

const viewReceipt = () => {
  // Open receipt viewer
  console.log('View receipt for expense:', props.item.id)
}

const copyExpenseId = async () => {
  try {
    await navigator.clipboard.writeText(props.item.id)
    // Show toast notification
  } catch (error) {
    console.error('Failed to copy ID:', error)
  }
}
</script>

<style scoped>
.approval-queue-card {
  position: relative;
  transition: all 0.2s ease;
}

.approval-queue-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.priority-indicator {
  position: absolute;
  top: -8px;
  right: 1rem;
  z-index: 10;
}

.priority-badge {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.amount-display {
  text-align: right;
}

.escalation-notice {
  border-left: 3px solid hsl(var(--orange-500));
  padding-left: 0.75rem;
  margin-left: -0.75rem;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Priority-based styling */
.approval-queue-card[data-priority="high"] {
  border-left: 4px solid hsl(var(--destructive));
}

.approval-queue-card[data-priority="medium"] {
  border-left: 4px solid hsl(var(--warning));
}

.approval-queue-card[data-priority="low"] {
  border-left: 4px solid hsl(var(--muted));
}

/* Urgent item animation */
.approval-queue-card.border-destructive {
  animation: pulse-urgent 2s infinite;
}

@keyframes pulse-urgent {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .approval-queue-card {
    margin: 0 -1rem;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
</style>