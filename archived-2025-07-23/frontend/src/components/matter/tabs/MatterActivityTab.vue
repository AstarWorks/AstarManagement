<!--
  Matter Activity Tab Component
  
  Combines activity timeline with document list and communication history
  for a comprehensive view of all matter-related activities.
  
  Features:
  - Tabbed interface with activity timeline, documents, and communications
  - Real-time updates across all sections
  - Consistent filtering and search
  - Mobile-responsive design
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Clock, 
  FileText, 
  MessageSquare, 
  Activity,
  Filter,
  Search,
  RefreshCw
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

// Timeline and Activity Components
import MatterActivityTimeline from '~/components/matter/timeline/MatterActivityTimeline.vue'
import MatterDocumentList from '~/components/matter/documents/MatterDocumentList.vue'
import MatterCommunicationHistory from '~/components/matter/communications/MatterCommunicationHistory.vue'

// Types
import type { Matter } from '~/types/matter'

interface Props {
  /** Matter ID */
  matterId: string
  /** Matter data for context */
  matter?: Matter
  /** Initial active tab */
  initialTab?: string
  /** Enable real-time updates */
  enableRealTime?: boolean
  /** Show search and filters */
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialTab: 'timeline',
  enableRealTime: true,
  showControls: true
})

// Local state
const activeTab = ref(props.initialTab)
const globalSearch = ref('')
const showFilters = ref(false)
const isRefreshing = ref(false)

// Tab configuration
const tabs = [
  {
    id: 'timeline',
    label: 'Activity Timeline',
    icon: Clock,
    description: 'Complete chronological activity feed',
    component: 'MatterActivityTimeline'
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    description: 'Document uploads, views, and downloads',
    component: 'MatterDocumentList'
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: MessageSquare,
    description: 'Emails, notes, and phone calls',
    component: 'MatterCommunicationHistory'
  }
]

// Computed properties
const activeTabConfig = computed(() => {
  return tabs.find(tab => tab.id === activeTab.value) || tabs[0]
})

// Methods
const handleTabChange = (tabId: string) => {
  activeTab.value = tabId
}

const handleGlobalSearch = (value: string) => {
  globalSearch.value = value
}

const handleRefreshAll = async () => {
  isRefreshing.value = true
  
  try {
    // Emit refresh event to child components
    // In a real app, this would trigger data refetch across all tabs
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    isRefreshing.value = false
  }
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}
</script>

<template>
  <div class="matter-activity-tab">
    <!-- Tab Header with Controls -->
    <div v-if="showControls" class="tab-header border-b border-border pb-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <!-- Title and Description -->
        <div class="space-y-1">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Activity class="w-5 h-5" />
            Matter Activity
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ activeTabConfig.description }}
          </p>
        </div>
        
        <!-- Controls -->
        <div class="flex items-center gap-2">
          <!-- Global Search -->
          <div class="relative min-w-[200px]">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              :value="globalSearch"
              @update:value="handleGlobalSearch"
              placeholder="Search all activities..."
              class="pl-10"
            />
          </div>
          
          <!-- Filter Toggle -->
          <Button
            @click="toggleFilters"
            variant="outline"
            size="sm"
            :class="showFilters ? 'bg-accent' : ''"
          >
            <Filter class="w-4 h-4" />
          </Button>
          
          <!-- Refresh All -->
          <Button
            @click="handleRefreshAll"
            variant="outline"
            size="sm"
            :disabled="isRefreshing"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Main Tabs Interface -->
    <Tabs :value="activeTab" @update:value="handleTabChange" class="w-full">
      <!-- Tab Navigation -->
      <TabsList class="grid w-full grid-cols-3 mb-6">
        <TabsTrigger 
          v-for="tab in tabs" 
          :key="tab.id"
          :value="tab.id"
          class="flex items-center gap-2"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span class="hidden sm:inline">{{ tab.label }}</span>
          <!-- Mobile: Show icon only -->
          <span class="sm:hidden">
            {{ tab.label.split(' ')[0] }}
          </span>
        </TabsTrigger>
      </TabsList>
      
      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Activity Timeline Tab -->
        <TabsContent value="timeline" class="mt-0">
          <MatterActivityTimeline
            :matter-id="matterId"
            :enable-real-time="enableRealTime"
            :show-header="false"
            max-height="800px"
            class="activity-timeline-container"
          />
        </TabsContent>
        
        <!-- Documents Tab -->
        <TabsContent value="documents" class="mt-0">
          <MatterDocumentList
            :matter-id="matterId"
            :search-term="globalSearch"
            :show-filters="showFilters"
            :enable-real-time="enableRealTime"
            view-mode="activity"
            class="document-list-container"
          />
        </TabsContent>
        
        <!-- Communications Tab -->
        <TabsContent value="communications" class="mt-0">
          <MatterCommunicationHistory
            :matter-id="matterId"
            :search-term="globalSearch"
            :show-filters="showFilters"
            :enable-real-time="enableRealTime"
            view-mode="activity"
            class="communication-history-container"
          />
        </TabsContent>
      </div>
    </Tabs>
    
    <!-- Activity Summary Cards (when no specific tab is active) -->
    <div v-if="false" class="activity-summary grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <Card v-for="tab in tabs" :key="tab.id" class="cursor-pointer hover:bg-accent/50 transition-colors">
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground mb-3">
            {{ tab.description }}
          </p>
          <div class="flex items-center justify-between">
            <Badge variant="secondary" class="text-xs">
              Loading...
            </Badge>
            <Button 
              @click="handleTabChange(tab.id)"
              variant="ghost" 
              size="sm"
            >
              View All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- Empty State for Matter without Activity -->
    <div v-if="false" class="empty-state text-center py-12">
      <Activity class="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 class="text-lg font-semibold mb-2">No Activity Yet</h3>
      <p class="text-muted-foreground mb-6 max-w-md mx-auto">
        This matter doesn't have any recorded activity yet. Activities will appear here as documents are uploaded, 
        communications are sent, and changes are made to the matter.
      </p>
      <div class="flex justify-center gap-2">
        <Button variant="outline">
          <FileText class="w-4 h-4 mr-2" />
          Upload Document
        </Button>
        <Button variant="outline">
          <MessageSquare class="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.matter-activity-tab {
  @apply w-full min-h-[600px];
}

.tab-header {
  @apply bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60;
}

.tab-content {
  @apply min-h-[500px];
}

/* Container styles for consistent spacing */
.activity-timeline-container,
.document-list-container,
.communication-history-container {
  @apply w-full;
}

/* Tab transition effects */
.tab-content :deep(.tabs-content) {
  @apply transition-all duration-200 ease-in-out;
}

.tab-content :deep(.tabs-content[data-state="active"]) {
  @apply animate-in fade-in-0 slide-in-from-bottom-2;
}

.tab-content :deep(.tabs-content[data-state="inactive"]) {
  @apply animate-out fade-out-0 slide-out-to-bottom-2;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .tab-header {
    @apply space-y-4;
  }
  
  .tab-header .flex {
    @apply flex-col items-start gap-4;
  }
  
  .tab-header .flex:first-child {
    @apply w-full;
  }
  
  .tab-header .flex:last-child {
    @apply w-full justify-start;
  }
}

/* Accessibility improvements */
.matter-activity-tab :deep(.tabs-trigger) {
  @apply transition-colors duration-200;
}

.matter-activity-tab :deep(.tabs-trigger:focus-visible) {
  @apply outline-2 outline-offset-2 outline-ring;
}

.matter-activity-tab :deep(.tabs-trigger[data-state="active"]) {
  @apply bg-background text-foreground shadow-sm;
}

/* Loading states */
.tab-content:has(.loading) {
  @apply opacity-50 pointer-events-none;
}

/* Animation for smooth tab switching */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-content .tabs-content {
  animation: fade-in 0.2s ease-out;
}

/* Custom scrollbar for long content */
.activity-timeline-container :deep(.scroll-area-viewport),
.document-list-container :deep(.scroll-area-viewport),
.communication-history-container :deep(.scroll-area-viewport) {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground)) transparent;
}

.activity-timeline-container :deep(.scroll-area-viewport)::-webkit-scrollbar,
.document-list-container :deep(.scroll-area-viewport)::-webkit-scrollbar,
.communication-history-container :deep(.scroll-area-viewport)::-webkit-scrollbar {
  width: 6px;
}

.activity-timeline-container :deep(.scroll-area-viewport)::-webkit-scrollbar-track,
.document-list-container :deep(.scroll-area-viewport)::-webkit-scrollbar-track,
.communication-history-container :deep(.scroll-area-viewport)::-webkit-scrollbar-track {
  background: transparent;
}

.activity-timeline-container :deep(.scroll-area-viewport)::-webkit-scrollbar-thumb,
.document-list-container :deep(.scroll-area-viewport)::-webkit-scrollbar-thumb,
.communication-history-container :deep(.scroll-area-viewport)::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground));
  border-radius: 3px;
}
</style>