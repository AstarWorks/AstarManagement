<template>
  <div class="flex gap-4 p-4 overflow-x-auto min-h-screen bg-gray-100">
    <div
      v-for="status in statuses"
      :key="status.value"
      class="flex-shrink-0 w-80"
    >
      <!-- Column Header -->
      <div class="mb-3 p-3 bg-white rounded-lg border">
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-sm">{{ status.label }}</h3>
          <Badge variant="secondary" class="text-xs">
            {{ mattersByStatus[status.value].length }}
          </Badge>
        </div>
      </div>

      <!-- Column Cards -->
      <div class="space-y-2">
        <MatterCard
          v-for="matter in mattersByStatus[status.value]"
          :key="matter.id"
          :matter="matter"
          :view-preferences="viewPreferences"
          @click="handleMatterClick"
        />
        
        <!-- Empty State -->
        <div
          v-if="mattersByStatus[status.value].length === 0"
          class="p-8 text-center text-gray-500 text-sm border-2 border-dashed rounded-lg"
        >
          No matters
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Matter, MatterStatus } from '~/types/matter'
import { useKanbanStore } from '~/stores/kanban'

// Store
const kanbanStore = useKanbanStore()
const { mattersByStatus, viewPreferences } = storeToRefs(kanbanStore)

// Status columns configuration
const statuses: { value: MatterStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'completed', label: 'Completed' }
]

// Methods
const handleMatterClick = (matter: Matter) => {
  console.log('Matter clicked:', matter)
  // TODO: Open matter details
}
</script>