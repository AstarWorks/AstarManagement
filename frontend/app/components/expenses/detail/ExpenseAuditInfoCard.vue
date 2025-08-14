<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('expense.detail.auditInfo') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="space-y-3 text-sm">
        <!-- Created info -->
        <div class="flex items-center gap-2">
          <Icon name="lucide:calendar-plus" class="w-4 h-4 text-muted-foreground" />
          <span class="text-muted-foreground">{{ t('common.createdAt') }}:</span>
          <span class="font-medium">{{ formatDateTime(expense.createdAt) }}</span>
        </div>
        
        <!-- Created by -->
        <div v-if="expense.createdBy" class="flex items-center gap-2">
          <Icon name="lucide:user-plus" class="w-4 h-4 text-muted-foreground" />
          <span class="text-muted-foreground">{{ t('common.createdBy') }}:</span>
          <span class="font-medium">{{ expense.createdBy }}</span>
        </div>

        <!-- Updated info -->
        <div v-if="expense.updatedAt !== expense.createdAt" class="flex items-center gap-2">
          <Icon name="lucide:calendar-check" class="w-4 h-4 text-muted-foreground" />
          <span class="text-muted-foreground">{{ t('common.updatedAt') }}:</span>
          <span class="font-medium">{{ formatDateTime(expense.updatedAt) }}</span>
        </div>
        
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { IExpense } from '~/types/expense'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Icon } from '#components'

interface Props {
  expense: IExpense
}

defineProps<Props>()
const { t } = useI18n()

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>