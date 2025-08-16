<template>
  <div class="kanban-page min-h-screen p-4 bg-background">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-foreground">{{ $t('matter.kanban.title') }}</h1>
        <p class="text-muted-foreground mt-1">{{ $t('matter.kanban.subtitle') }}</p>
      </div>
      <div class="flex items-center space-x-3">
        <!-- Desktop Filter Button -->
        <Button variant="outline" class="hidden md:flex" @click="toggleFilters">
          <Icon name="lucide:filter" class="w-4 h-4 mr-2" />
          {{ $t('matter.kanban.actions.filter') }}
        </Button>
        
        <!-- Mobile Filter Sheet Trigger -->
        <Sheet>
          <SheetTrigger as-child class="md:hidden">
            <Button variant="outline">
              <Icon name="lucide:filter" class="w-4 h-4 mr-2" />
              {{ $t('matter.kanban.actions.filter') }}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-[320px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>{{ $t('matter.kanban.actions.filter') }}</SheetTitle>
              <SheetDescription>
                {{ $t('matter.kanban.filters.description') }}
              </SheetDescription>
            </SheetHeader>
            <div class="mt-6">
              <KanbanFilters />
            </div>
          </SheetContent>
        </Sheet>
        
        <Button @click="caseModal.createNewCase">
          <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
          {{ $t('matter.kanban.actions.newCase') }}
        </Button>
      </div>
    </div>

    <!-- Desktop Filters Panel -->
    <KanbanFilters 
      v-if="showFilters"
      class="mb-6 hidden md:block"
    />

    <!-- Kanban Board -->
    <div class="kanban-board">
      <ScrollArea class="kanban-container" style="max-height: calc(100vh - 200px);">
        <div class="kanban-columns flex gap-4 min-w-max pb-4">
          <!-- Loading Skeleton -->
          <template v-if="caseStore.isLoading">
            <div 
              v-for="n in 7" 
              :key="`skeleton-${n}`"
              class="kanban-column-skeleton flex flex-col min-w-[280px] max-w-[320px] space-y-3"
            >
              <Skeleton class="h-20 w-full rounded-lg" />
              <div class="space-y-2 p-3">
                <Skeleton class="h-32 w-full rounded-md" />
                <Skeleton class="h-28 w-full rounded-md" />
                <Skeleton class="h-36 w-full rounded-md" />
              </div>
            </div>
          </template>
          
          <!-- Actual Kanban Columns -->
          <template v-else>
            <KanbanColumn
              v-for="status in statusConfig.statusColumns.value"
              :key="status.key"
              :status="status"
              :cases="getCasesByStatus(status.key)"
              :is-loading="caseStore.isLoading"
              @case-moved="handleCaseMove"
              @case-clicked="caseModal.openModal"
            />
          </template>
        </div>
      </ScrollArea>
    </div>

    <!-- Case Detail Modal -->
    <CaseDetailModal
      v-if="modalCaseData"
      :case-data="modalCaseData"
      :is-open="caseModal.isOpen.value"
      @close="caseModal.closeModal"
      @updated="caseStore.updateCase"
    />
  </div>
</template>

<script setup lang="ts">
import type { ICase, CaseStatus } from '~/modules/case/types/case'
import { Skeleton } from '~/foundation/components/ui/skeleton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '~/foundation/components/ui/sheet/index'
import { ScrollArea } from '~/foundation/components/ui/scroll-area'
import { useKanbanStatusConfig } from '~/modules/case/config/kanbanStatusConfig'
import { useCaseStore } from '~/modules/case/stores/case'
import { useFilteredCases } from '~/modules/case/composables/useFilteredCases'
import { useCaseModal } from '~/modules/case/composables/useCaseModal'
import { useCaseDragDrop } from '~/modules/case/composables/useCaseDragDrop'

// Page metadata with i18n
definePageMeta({
  requiresAuth: true,
  layout: 'default',
  title: 'matter.kanban.title'
})

// VueUse composables for clean state management
const [showFilters, toggleFilters] = useToggle(false)

// Business logic with stores and composables
const caseStore = useCaseStore()
const { getCasesByStatus } = useFilteredCases()
const statusConfig = useKanbanStatusConfig()
const caseModal = useCaseModal()
const _dragDrop = useCaseDragDrop()

// Convert readonly case data to mutable for modal
const modalCaseData = computed(() => {
  const selectedCase = caseModal.selectedCase.value
  if (!selectedCase) return null
  
  // Create a proper Case object with mutable arrays
  return {
    ...selectedCase,
    tags: [...selectedCase.tags] // Convert readonly to mutable array
  } as ICase
})

// Case movement handler with enhanced error handling
const handleCaseMove = async (caseId: string, newStatus: CaseStatus, oldStatus: CaseStatus) => {
  try {
    await caseStore.updateCaseStatus(caseId, newStatus, oldStatus)
  } catch (error) {
    console.error('Failed to move case:', error)
    // Error handling is managed in the store
  }
}

// Load initial data
onMounted(() => {
  caseStore.loadCases()
})
</script>

<style scoped>
.kanban-page {
  max-width: 100vw;
}


.kanban-columns {
  min-width: 1600px; /* 7 columns × ~230px each */
}

@media (max-width: 768px) {
  .kanban-columns {
    min-width: 100%;
    flex-direction: column;
    gap: 1rem;
  }
}
</style>