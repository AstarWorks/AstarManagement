<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">
        {{ $t('cases.detail.basicInfo.title') }}
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Client Information -->
      <div class="info-row">
        <Label class="text-sm font-medium text-muted-foreground">
          {{ $t('cases.detail.basicInfo.client') }}
        </Label>
        <div class="flex items-center gap-2 mt-1">
          <Icon 
            :name="caseData.client.type === 'individual' ? 'lucide:user' : 'lucide:building'" 
            class="h-4 w-4 text-muted-foreground" 
          />
          <span class="font-medium">{{ caseData.client.name }}</span>
          <ClientTypeBadge :type="caseData.client.type" size="xs" />
        </div>
      </div>

      <!-- Assigned Lawyer -->
      <div class="info-row">
        <Label class="text-sm font-medium text-muted-foreground">
          {{ $t('cases.detail.basicInfo.assignedLawyer') }}
        </Label>
        <div class="flex items-center gap-2 mt-1">
          <Icon name="lucide:user-check" class="h-4 w-4 text-muted-foreground" />
          <span class="font-medium">{{ caseData.assignedLawyer }}</span>
        </div>
      </div>

      <!-- Due Date -->
      <div class="info-row">
        <Label class="text-sm font-medium text-muted-foreground">
          {{ $t('cases.detail.basicInfo.dueDate') }}
        </Label>
        <div class="flex items-center gap-2 mt-1">
          <Icon name="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
          <span class="font-medium">{{ formatDate(caseData.dueDate) }}</span>
          <DueDateAlert 
            v-if="isDueSoon(caseData.dueDate)" 
            :due-date="caseData.dueDate" 
            size="xs" 
          />
        </div>
      </div>

      <!-- Tags -->
      <div class="info-row">
        <Label class="text-sm font-medium text-muted-foreground">
          {{ $t('cases.detail.basicInfo.tags') }}
        </Label>
        <div class="flex flex-wrap gap-1 mt-1">
          <CaseTag
            v-for="tag in caseData.tags"
            :key="tag"
            :tag="tag"
            size="xs"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Case } from '~/types/case'

interface Props {
  caseData: Case
}

defineProps<Props>()

const { formatDate, isDueSoon } = useCaseFormatting()
</script>

<style scoped>
.info-row {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgb(229 231 235);
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
</style>