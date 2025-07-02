<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { 
  MatterInfoCard,
  MatterPartiesPanel,
  MatterDatesWidget,
  MatterStatusWidget,
  MatterSummaryPanel
} from '~/components/matter/panels'
import { useMattersQuery } from '~/composables/useMattersQuery'
import type { Matter } from '~/types/matter'

interface Props {
  matter: Matter
}

const props = defineProps<Props>()

// Example of using TanStack Query for real-time updates
const { refetch: refetchMatter } = useMattersQuery()

// Handle panel events
const handleEdit = (field: string) => {
  console.log('Edit requested for field:', field)
  // Would open edit modal/drawer
}

const handleContact = (type: 'email' | 'phone', value: string) => {
  if (type === 'email') {
    window.location.href = `mailto:${value}`
  } else if (type === 'phone') {
    window.location.href = `tel:${value}`
  }
}

const handleSetReminder = (date: string, type: string) => {
  console.log('Set reminder for:', date, type)
  // Would integrate with reminder/calendar system
}

const handleStatusChange = (currentStatus: string) => {
  console.log('Status change requested from:', currentStatus)
  // Would open status change modal
}

const handleGenerateSummary = () => {
  console.log('Generate AI summary requested')
  // Would call AI service to generate summary
}

const handleRefresh = () => {
  // Refetch matter data
  refetchMatter()
}
</script>

<template>
  <div class="matter-overview-tab">
    <!-- Desktop Layout - 2 columns -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Column - Main Information -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Matter Summary Panel -->
        <MatterSummaryPanel
          :matter="matter"
          @edit="handleEdit"
          @generate-summary="handleGenerateSummary"
          @refresh="handleRefresh"
        />
        
        <!-- Matter Info Card -->
        <MatterInfoCard
          :matter="matter"
          @edit="() => handleEdit('info')"
          @refresh="handleRefresh"
        />
        
        <!-- Parties Panel -->
        <MatterPartiesPanel
          :matter="matter"
          @contact="handleContact"
          @refresh="handleRefresh"
        />
      </div>
      
      <!-- Right Column - Status and Dates -->
      <div class="lg:col-span-4 space-y-6">
        <!-- Status Widget -->
        <MatterStatusWidget
          :matter="matter"
          @status-change="handleStatusChange"
          @refresh="handleRefresh"
        />
        
        <!-- Dates Widget -->
        <MatterDatesWidget
          :matter="matter"
          @set-reminder="handleSetReminder"
          @refresh="handleRefresh"
        />
      </div>
    </div>
    
    <!-- Mobile Layout - Stack all panels -->
    <div class="grid grid-cols-1 gap-4 lg:hidden">
      <!-- Compact versions on mobile -->
      <MatterStatusWidget
        :matter="matter"
        :show-compact="true"
        @status-change="handleStatusChange"
        @refresh="handleRefresh"
      />
      
      <MatterSummaryPanel
        :matter="matter"
        :show-compact="true"
        @edit="handleEdit"
        @generate-summary="handleGenerateSummary"
        @refresh="handleRefresh"
      />
      
      <MatterInfoCard
        :matter="matter"
        :show-compact="true"
        @edit="() => handleEdit('info')"
        @refresh="handleRefresh"
      />
      
      <MatterDatesWidget
        :matter="matter"
        :show-compact="true"
        @set-reminder="handleSetReminder"
        @refresh="handleRefresh"
      />
      
      <MatterPartiesPanel
        :matter="matter"
        :show-compact="true"
        @contact="handleContact"
        @refresh="handleRefresh"
      />
    </div>
  </div>
</template>

<style scoped>
.matter-overview-tab {
  @apply w-full;
}

/* Ensure proper spacing on different screen sizes */
@media (max-width: 1024px) {
  .matter-overview-tab {
    @apply px-0;
  }
}
</style>