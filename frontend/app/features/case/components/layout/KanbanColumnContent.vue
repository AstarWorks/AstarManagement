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
        ghost-class="opacity-50 border-2 border-dashed border-primary/10 rotate-1 animate-pulse"
        chosen-class="scale-105 shadow-2xl z-50 animate-bounce cursor-grabbing"
        drag-class="opacity-80 rotate-1 animate-pulse"
        @start="$emit('dragStart', $event)"
        @end="$emit('dragEnd', $event)"
        @change="$emit('caseMove', $event)"
        @update:model-value="$emit('update:cases', $event)"
      >
        <template #item="{ element: case_ }">
          <CaseCardContainer
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
import type { ICase, CaseStatus } from '@case/types/case'
import { Skeleton } from '@ui/skeleton'
import CaseCardContainer from '../display/CaseCardContainer.vue'

interface StatusColumn {
  key: CaseStatus
  title: string
  description: string
  color: string
  headerColor: string
}

interface Props {
  status: StatusColumn
  cases: ICase[]
  isLoading?: boolean
  loadingCaseIds: Set<string>
}

interface Emits {
  (e: 'dragStart' | 'dragEnd' | 'caseMove', event: DragEvent): void
  (e: 'caseClicked', caseData: ICase): void
  (e: 'update:cases', cases: ICase[]): void
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

/* Additional drag and drop styles */
.cursor-grabbing {
  cursor: grabbing !important;
}
</style>