<!--
  Example: MatterCard Integration with StaleDataIndicator
  
  @description Example showing how to integrate the StaleDataIndicator
  component with the existing MatterCard component.
  
  @author Claude
  @created 2025-06-26
-->

<template>
  <div class="matter-card-with-indicator">
    <!-- Original MatterCard component -->
    <MatterCard
      :matter="matter"
      :is-dragging="isDragging"
      :view-preferences="viewPreferences"
      :search-terms="searchTerms"
      @click="handleMatterClick"
      @edit="handleMatterEdit"
      @status-change="handleStatusChange"
    >
      <!-- Inject stale data indicator into the card header slot -->
      <template #header-actions>
        <StaleDataIndicator
          data-type="matters"
          :last-updated="matter.updatedAt"
          :sync-mode="syncMode"
          :compact="true"
          :show-text="false"
          class="ml-2"
          @refresh="handleRefreshMatter"
          @stale-detected="handleStaleDetected"
        />
      </template>
    </MatterCard>
  </div>
</template>

<script setup lang="ts">
/**
 * Example of MatterCard with StaleDataIndicator Integration
 * 
 * This example demonstrates how to add the stale data indicator
 * to existing matter cards in the kanban board.
 */

import { ref, computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import type { MatterCard as MatterCardType, ViewPreferences } from '~/types/kanban'
import MatterCard from './MatterCard.vue'
import { StaleDataIndicator } from '~/components/ui/StaleDataIndicator.vue'
import { useBackgroundSync } from '~/composables/useBackgroundSync'

// Props
interface Props {
  matter: MatterCardType
  isDragging?: boolean
  viewPreferences: ViewPreferences
  searchTerms?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
  searchTerms: () => []
})

// Emit events
const emit = defineEmits<{
  click: [matter: MatterCardType]
  edit: [matter: MatterCardType]
  statusChange: [matterId: string, newStatus: string]
  refreshed: [matterId: string]
}>()

// Composables
const queryClient = useQueryClient()
const { syncMode } = useBackgroundSync()

// Methods
const handleMatterClick = (matter: MatterCardType) => {
  emit('click', matter)
}

const handleMatterEdit = (matter: MatterCardType) => {
  emit('edit', matter)
}

const handleStatusChange = (matterId: string, newStatus: string) => {
  emit('statusChange', matterId, newStatus)
}

const handleRefreshMatter = async () => {
  // Invalidate this specific matter's query
  await queryClient.invalidateQueries({
    queryKey: ['matters', props.matter.id]
  })
  
  // Also invalidate the kanban board data
  await queryClient.invalidateQueries({
    queryKey: ['kanban', props.matter.status]
  })
  
  emit('refreshed', props.matter.id)
}

const handleStaleDetected = () => {
  console.log(`Matter ${props.matter.caseNumber} data is stale`)
  // Could show a notification or take other action
}
</script>

<!-- Alternative implementation: Overlay indicator -->
<template>
  <div class="matter-card-wrapper relative">
    <!-- Original MatterCard -->
    <MatterCard
      :matter="matter"
      :is-dragging="isDragging"
      :view-preferences="viewPreferences"
      :search-terms="searchTerms"
      @click="handleMatterClick"
      @edit="handleMatterEdit"
      @status-change="handleStatusChange"
    />
    
    <!-- Overlay stale indicator in top-right corner -->
    <div class="absolute top-2 right-2 z-10">
      <StaleDataIndicator
        data-type="matters"
        :last-updated="matter.updatedAt"
        :compact="true"
        :show-text="false"
        @refresh="handleRefreshMatter"
      />
    </div>
  </div>
</template>

<!-- Alternative implementation: Inline indicator -->
<template>
  <MatterCard
    :matter="matter"
    :is-dragging="isDragging"
    :view-preferences="viewPreferences"
    :search-terms="searchTerms"
    @click="handleMatterClick"
    @edit="handleMatterEdit"
    @status-change="handleStatusChange"
  >
    <!-- Custom content slot to add indicator inline -->
    <template #meta-info>
      <div class="flex items-center gap-2">
        <Clock class="w-3 h-3 flex-shrink-0" />
        <span>Updated {{ formatDate(matter.updatedAt) }}</span>
        
        <!-- Inline stale indicator -->
        <StaleDataIndicator
          data-type="matters"
          :last-updated="matter.updatedAt"
          :compact="true"
          :show-text="true"
          class="ml-auto"
          @refresh="handleRefreshMatter"
        />
      </div>
    </template>
  </MatterCard>
</template>

<style scoped>
/* Wrapper styles for overlay approach */
.matter-card-wrapper {
  position: relative;
}

/* Ensure indicator is clickable above card */
.matter-card-wrapper .stale-data-indicator {
  pointer-events: auto;
}

/* Adjust z-index for proper layering */
.matter-card-wrapper .absolute {
  z-index: 10;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .matter-card-wrapper .absolute {
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>