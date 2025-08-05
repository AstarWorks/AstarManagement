<template>
  <div class="expense-detail-page">
    <!-- Loading state -->
    <ExpenseDetailSkeleton v-if="loading" />
    
    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <Card class="bg-destructive/10">
        <CardContent class="p-6">
          <Icon name="lucide:alert-circle" class="w-12 h-12 text-destructive mx-auto mb-4" />
          <p class="text-destructive mb-4">{{ error }}</p>
          <Button variant="outline" @click="$emit('retry')">
            {{ t('common.retry') }}
          </Button>
        </CardContent>
      </Card>
    </div>
    
    <!-- Content -->
    <template v-else-if="expense">
      <ExpenseDetailHeader
        :expense="expense"
        :deleting="deleting"
        @edit="$emit('edit')"
        @delete="$emit('delete')"
        @print="$emit('print')"
        @copy="$emit('copy')"
        @back="$emit('back')"
      />
      
      <!-- Responsive grid layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-6">
          <ExpenseBasicInfoCard :expense="expense" />
          <ExpenseCaseInfoCard v-if="expense.caseId" :expense="expense" />
          <ExpenseMemoCard v-if="expense.memo" :expense="expense" />
        </div>
        
        <!-- Sidebar -->
        <div class="space-y-6">
          <ExpenseTagsCard 
            v-if="expense.tags && expense.tags.length > 0" 
            :tags="expense.tags" 
          />
          <ExpenseAttachmentsCard 
            v-if="expense.attachments && expense.attachments.length > 0" 
            :attachments="expense.attachments"
            :expense-id="expense.id"
            @preview="$emit('preview', $event)"
          />
          <ExpenseAuditInfoCard :expense="expense" />
        </div>
      </div>
    </template>
    
    <!-- Not found state -->
    <div v-else class="text-center py-12">
      <Card>
        <CardContent class="p-6">
          <Icon name="lucide:file-x" class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">
            {{ t('expense.detail.notFound.title') }}
          </h3>
          <p class="text-muted-foreground mb-4">
            {{ t('expense.detail.notFound.message') }}
          </p>
          <Button @click="$emit('back')">
            {{ t('expense.detail.actions.backToList') }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IExpense, IAttachment } from '~/types/expense'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Icon } from '#components'

// Import detail components
import ExpenseDetailHeader from './ExpenseDetailHeader.vue'
import ExpenseDetailSkeleton from './ExpenseDetailSkeleton.vue'
import ExpenseBasicInfoCard from './ExpenseBasicInfoCard.vue'
import ExpenseCaseInfoCard from './ExpenseCaseInfoCard.vue'
import ExpenseMemoCard from './ExpenseMemoCard.vue'
import ExpenseTagsCard from './ExpenseTagsCard.vue'
import ExpenseAttachmentsCard from './ExpenseAttachmentsCard.vue'
import ExpenseAuditInfoCard from './ExpenseAuditInfoCard.vue'

interface Props {
  expense?: IExpense | null
  loading?: boolean
  error?: string | null
  deleting?: boolean
}

defineProps<Props>()

defineEmits<{
  edit: []
  delete: []
  print: []
  copy: []
  back: []
  retry: []
  preview: [attachment: IAttachment]
}>()

const { t } = useI18n()
</script>

<style scoped>
.expense-detail-page {
  @apply container mx-auto px-4 py-6 max-w-7xl;
}

@media (max-width: 640px) {
  .expense-detail-page {
    @apply px-2 py-4;
  }
}

/* Print styles */
@media print {
  .expense-detail-page {
    @apply max-w-none;
  }
  
  /* Hide interactive elements */
  :deep(button),
  :deep(.expense-detail-header .dropdown-menu),
  :deep(.fixed) {
    display: none !important;
  }
  
  /* Adjust card styles for print */
  :deep(.card) {
    box-shadow: none !important;
    border: 1px solid #e5e5e5 !important;
    break-inside: avoid;
  }
  
  /* Ensure proper page breaks */
  :deep(.grid) {
    display: block !important;
  }
  
  :deep(.space-y-6 > *) {
    margin-bottom: 1rem !important;
    break-inside: avoid;
  }
}
</style>