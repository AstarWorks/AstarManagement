<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">
        {{ $t('cases.detail.progress.title') }}
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Status Overview -->
      <div class="status-overview">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">
            {{ $t('cases.detail.progress.currentStatus') }}
          </span>
          <Badge :variant="getStatusVariant(caseData.status)">
            {{ getStatusLabel(caseData.status) }}
          </Badge>
        </div>
        <CaseProgressIndicator :status="caseData.status" size="md" />
      </div>

      <!-- Dates Information -->
      <div class="dates-info space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">
            {{ $t('cases.detail.progress.createdAt') }}
          </span>
          <span>{{ formatDate(caseData.createdAt) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">
            {{ $t('cases.detail.progress.updatedAt') }}
          </span>
          <span>{{ formatDate(caseData.updatedAt) }}</span>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions pt-4 border-t space-y-2">
        <Button
          variant="outline"
          size="sm"
          class="w-full justify-start"
          @click="$emit('statusChangeClicked', caseData.id)"
        >
          <Icon name="lucide:arrow-right" class="h-4 w-4 mr-2" />
          {{ $t('cases.detail.progress.actions.changeStatus') }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="w-full justify-start"
          @click="$emit('editClicked', caseData.id)"
        >
          <Icon name="lucide:edit-3" class="h-4 w-4 mr-2" />
          {{ $t('cases.detail.progress.actions.edit') }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useCaseFormatting } from '@case/composables/useCaseFormatting';
import type {  ICase  } from '@case/types/case'

interface Props {
  caseData: ICase
}

interface Emits {
  (e: 'statusChangeClicked' | 'editClicked', caseId: string): void
}

defineProps<Props>()
defineEmits<Emits>()

const { formatDate, getStatusLabel, getStatusVariant } = useCaseFormatting()
</script>