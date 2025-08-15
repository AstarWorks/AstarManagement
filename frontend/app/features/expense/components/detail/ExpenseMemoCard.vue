<template>
  <Card v-if="expense.memo">
    <CardHeader>
      <CardTitle>{{ t('expense.form.fields.memo') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <p class="whitespace-pre-wrap text-sm">{{ expense.memo }}</p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { IExpense } from '@expense/types/expense'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'

interface Props {
  expense: IExpense
}

defineProps<Props>()
const { t } = useI18n()
</script>