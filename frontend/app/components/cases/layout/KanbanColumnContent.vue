<template>
  <div
    class="column-content flex-1 p-3 overflow-y-auto bg-background rounded-b-lg border-l-2 border-r-2 border-b-2 min-h-[400px] md:min-h-[200px]"
    :class="status.color"
    style="max-height: calc(100vh - 350px); scrollbar-width: thin; scrollbar-color: rgb(229 231 235) transparent;"
  >
    <!-- Loading State -->
    <div v-if="isLoading && cases.length === 0" class="loading-state">
      <div class="space-y-3">
        <Skeleton
          v-for="i in 3"
          :key="i"
          class="h-32 w-full"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="cases.length === 0"
      class="flex flex-col items-center justify-center h-32 text-center"
    >
      <Icon name="lucide:inbox" class="h-8 w-8 text-muted-foreground mb-2" />
      <p class="text-sm text-muted-foreground">
        {{ $t(`matter.kanban.columns.${status.key}.empty`) }}
      </p>
    </div>

    <!-- Case Cards -->
    <div v-else>
      <draggable
        :model-value="cases"
        :group="{ name: 'cases', pull: true, put: true }"
        :sort="false"
        item-key="id"
        class="space-y-3 min-h-[100px]"
        ghost-class="ghost-card"
        chosen-class="chosen-card"
        drag-class="drag-card"
        @start="$emit('dragStart', $event)"
        @end="$emit('dragEnd', $event)"
        @change="$emit('caseMove', $event)"
        @update:model-value="$emit('update:cases', $event)"
      >
        <template #item="{ element: case_ }">
          <CaseCard
            :case-data="case_"
            :is-loading="loadingCaseIds.has(case_.id)"
            class="cursor-move transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-fadeIn"
            @clicked="$emit('caseClicked', case_)"
          />
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type { Case, CaseStatus } from '~/types/case'
import { Skeleton } from '~/components/ui/skeleton'

interface StatusColumn {
  key: CaseStatus
  title: string
  description: string
  color: string
  headerColor: string
}

interface Props {
  status: StatusColumn
  cases: Case[]
  isLoading?: boolean
  loadingCaseIds: Set<string>
}

interface Emits {
  (e: 'dragStart', event: any): void
  (e: 'dragEnd', event: any): void
  (e: 'caseMove', event: any): void
  (e: 'caseClicked', caseData: Case): void
  (e: 'update:cases', cases: Case[]): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t: $t } = useI18n()
</script>

<style scoped>
/* Custom scrollbar for webkit browsers */
.column-content::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-track {
  background: transparent;
}

.column-content::-webkit-scrollbar-thumb {
  background: rgb(229 231 235);
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
  background: rgb(107 114 128);
}

/* Drag and drop styles using Tailwind classes */
:deep(.ghost-card) {
  @apply opacity-50 bg-primary/10 border-2 border-dashed border-primary rotate-1 animate-pulse;
}

:deep(.chosen-card) {
  @apply scale-105 shadow-2xl z-50 animate-bounce;
  cursor: grabbing !important;
}

:deep(.drag-card) {
  @apply opacity-80 rotate-1 animate-pulse;
}
</style>