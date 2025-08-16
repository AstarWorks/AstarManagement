<template>
  <div class="expense-additional-info-step space-y-6">
    <div class="text-center mb-6">
      <Icon name="lucide:file-plus" class="w-12 h-12 mx-auto mb-3 text-primary" />
      <h3 class="text-xl font-semibold mb-2">
        {{ t('expense.form.steps.additional') }}
      </h3>
      <p class="text-muted-foreground">
        {{ t('expense.form.steps.additionalDescription') }}
      </p>
    </div>

    <div class="space-y-6">
      <!-- Case Association Field -->
      <ExpenseCaseSelector />

      <!-- Memo Field -->
      <ExpenseMemoInput />

      <!-- Tags Field -->
      <ExpenseTagSelector />

      <!-- Attachment Upload Preview -->
      <!-- TODO: Implement attachment upload functionality in Sprint S03_M003 -->
      <div class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <Icon name="lucide:upload-cloud" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p class="text-sm text-muted-foreground mb-1">
          {{ t('expense.form.attachmentPlaceholder') }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ t('expense.form.attachmentComingSoon') }}
        </p>
      </div>
    </div>

    <!-- Form Summary -->
    <ExpenseAdditionalInfoSummary />
  </div>
</template>

<script setup lang="ts">
// Components
import ExpenseCaseSelector from './ExpenseCaseSelector.vue'
import ExpenseTagSelector from './ExpenseTagSelector.vue'
import ExpenseMemoInput from './ExpenseMemoInput.vue'
import ExpenseAdditionalInfoSummary from './ExpenseAdditionalInfoSummary.vue'

// Composables
const { t } = useI18n()
</script>