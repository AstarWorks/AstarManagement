<template>
  <Card v-if="expense.caseId">
    <CardHeader>
      <CardTitle>{{ t('expense.detail.caseInfo') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <div>
          <Label class="text-muted-foreground">{{ t('expense.form.fields.case') }}</Label>
          <NuxtLink
            :to="`/cases/${expense.caseId}`"
            class="mt-1 font-medium text-primary hover:underline inline-flex items-center gap-2"
          >
            <Icon name="lucide:briefcase" class="w-4 h-4" />
            {{ expense.caseId }}
            <Icon name="lucide:external-link" class="w-3 h-3" />
          </NuxtLink>
        </div>

        <!-- Case Title (if available) -->
        <!-- TODO: Add caseTitle when available from API -->
        
        <!-- Case Status (if available) -->
        <!-- TODO: Add caseStatus when available from API -->
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { IExpense } from '~/types/expense'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Icon } from '#components'

interface Props {
  expense: IExpense
}

defineProps<Props>()
const { t } = useI18n()
const NuxtLink = resolveComponent('NuxtLink')
</script>