<template>
  <!-- Case Metadata -->
  <div class="space-y-2">
    <!-- Assigned Lawyer -->
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon name="lucide:user-check" class="h-3 w-3 flex-shrink-0" />
      <span class="truncate">{{ caseData.assignedLawyer }}</span>
    </div>

    <!-- Due Date -->
    <div class="flex items-center gap-2 text-xs" :class="getDueDateClass(caseData.dueDate)">
      <Icon name="lucide:calendar" class="h-3 w-3 flex-shrink-0" />
      <span>{{ formatCardDueDate(caseData.dueDate) }}</span>
      <DueDateAlert v-if="isDueSoon(caseData.dueDate)" :due-date="caseData.dueDate" size="xs" />
    </div>

    <!-- Tags -->
    <div v-if="caseData.tags.length > 0" class="flex flex-wrap gap-1">
      <CaseTag
        v-for="tag in visibleTags"
        :key="tag"
        :tag="tag"
        size="xs"
      />
      <Badge
        v-if="hiddenTagsCount > 0"
        variant="secondary"
        class="text-xs"
      >
        +{{ hiddenTagsCount }}
      </Badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Case } from '~/types/case'

interface Props {
  caseData: Case
  viewMode?: 'minimal' | 'compact' | 'detailed'
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'compact'
})

// Use formatting composable
const { formatCardDueDate, getDueDateClass, isDueSoon } = useCaseFormatting()

// Tag display logic
const maxTags = computed(() => props.viewMode === 'detailed' ? 4 : 2)
const visibleTags = computed(() => props.caseData.tags.slice(0, maxTags.value))
const hiddenTagsCount = computed(() => Math.max(0, props.caseData.tags.length - maxTags.value))
</script>