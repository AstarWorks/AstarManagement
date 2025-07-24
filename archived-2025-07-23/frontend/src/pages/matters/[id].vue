<template>
  <div class="matter-detail-page">
    <!-- Page Header with Breadcrumbs -->
    <div class="page-header border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 py-4">
        <!-- Breadcrumb Navigation -->
        <nav aria-label="Breadcrumb" class="mb-4">
          <ol class="flex items-center space-x-2 text-sm text-muted-foreground">
            <li>
              <NuxtLink to="/" class="hover:text-foreground transition-colors">
                Dashboard
              </NuxtLink>
            </li>
            <li class="flex items-center">
              <ChevronRight class="w-4 h-4 mx-2" />
              <NuxtLink to="/matters" class="hover:text-foreground transition-colors">
                Matters
              </NuxtLink>
            </li>
            <li class="flex items-center">
              <ChevronRight class="w-4 h-4 mx-2" />
              <span class="font-medium text-foreground">
                {{ matter?.title || matterNumber }}
              </span>
            </li>
          </ol>
        </nav>

        <!-- Page Title -->
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <h1 class="text-2xl font-semibold tracking-tight">
              {{ matter?.title || 'Matter Details' }}
            </h1>
            <p class="text-sm text-muted-foreground">
              Case #{{ matter?.caseNumber || matterNumber }}
            </p>
          </div>
          
          <!-- Quick Actions -->
          <div class="flex items-center gap-2">
            <!-- Matter Navigation -->
            <div class="flex items-center border rounded-md">
              <Button 
                variant="ghost" 
                size="sm" 
                @click="matterDetailStore.getPreviousMatter()"
                :disabled="!matterDetailStore.previousMatterId"
                class="rounded-r-none border-r"
                title="Previous matter (Ctrl+←)"
              >
                <ChevronLeft class="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                @click="matterDetailStore.getNextMatter()"
                :disabled="!matterDetailStore.nextMatterId"
                class="rounded-l-none"
                title="Next matter (Ctrl+→)"
              >
                <ChevronRight class="w-4 h-4" />
              </Button>
            </div>
            
            <!-- Action Buttons -->
            <Button variant="outline" size="sm" @click="handleEdit">
              <Edit class="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" @click="handleShare">
              <Share2 class="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="matter-detail-layout">
      <div class="container mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Sidebar -->
          <aside 
            class="lg:col-span-3"
            :class="{ 'hidden lg:block': sidebarCollapsed }"
          >
            <MatterSidebar 
              :matter="matter"
              :loading="loading"
              @collapse="handleSidebarToggle"
              @edit="handleEdit"
              @delete="handleDelete"
            />
          </aside>

          <!-- Main Content Area -->
          <main 
            class="lg:col-span-9"
            :class="{ 'lg:col-span-12': sidebarCollapsed }"
          >
            <!-- Loading State -->
            <div v-if="loading" class="space-y-6">
              <Skeleton class="h-12 w-full" />
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton v-for="i in 4" :key="i" class="h-24" />
              </div>
              <Skeleton class="h-64 w-full" />
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="flex flex-col items-center justify-center py-12">
              <AlertCircle class="w-12 h-12 text-destructive mb-4" />
              <h3 class="text-lg font-semibold mb-2">Error Loading Matter</h3>
              <p class="text-muted-foreground mb-4">{{ error }}</p>
              <Button @click="retry" variant="outline">
                <RefreshCw class="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>

            <!-- Tab Navigation and Content -->
            <div v-else-if="matter" class="matter-tabs">
              <!-- Mobile Sidebar Toggle -->
              <div class="lg:hidden mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  @click="handleSidebarToggle"
                  class="w-full justify-start"
                >
                  <Menu class="w-4 h-4 mr-2" />
                  {{ sidebarCollapsed ? 'Show' : 'Hide' }} Matter Info
                </Button>
              </div>

              <!-- Tab Navigation -->
              <Tabs 
                :value="activeTab" 
                @update:value="handleTabChange"
                class="w-full"
              >
                <TabsList class="grid w-full grid-cols-5 lg:grid-cols-9 mb-6">
                  <TabsTrigger 
                    v-for="tab in availableTabs" 
                    :key="tab.id"
                    :value="tab.id"
                    class="text-xs lg:text-sm"
                    :disabled="false"
                  >
                    <component :is="tab.icon" class="w-4 h-4 mr-1 lg:mr-2" />
                    <span class="hidden sm:inline">{{ tab.label }}</span>
                  </TabsTrigger>
                </TabsList>

                <!-- Tab Content with KeepAlive -->
                <div class="tab-content-container min-h-[500px]">
                  <!-- Overview Tab -->
                  <TabsContent value="overview" class="mt-0">
                    <KeepAlive>
                      <Suspense>
                        <MatterOverviewTab :matter="matter" />
                        <template #fallback>
                          <div class="space-y-4">
                            <Skeleton class="h-8 w-full" />
                            <Skeleton class="h-32 w-full" />
                          </div>
                        </template>
                      </Suspense>
                    </KeepAlive>
                  </TabsContent>

                  <!-- Activity Tab -->
                  <TabsContent value="activity" class="mt-0">
                    <KeepAlive>
                      <Suspense>
                        <MatterActivityTab :matter-id="matterId" :matter="matter" />
                        <template #fallback>
                          <div class="space-y-4">
                            <Skeleton class="h-12 w-full" />
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Skeleton v-for="i in 6" :key="i" class="h-32" />
                            </div>
                          </div>
                        </template>
                      </Suspense>
                    </KeepAlive>
                  </TabsContent>

                  <!-- Tasks Tab -->
                  <TabsContent value="tasks" class="mt-0">
                    <KeepAlive>
                      <Suspense>
                        <MatterTasksTab :matter-id="matterId" />
                        <template #fallback>
                          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Skeleton v-for="i in 6" :key="i" class="h-32" />
                          </div>
                        </template>
                      </Suspense>
                    </KeepAlive>
                  </TabsContent>

                  <!-- Schedule Tab -->
                  <TabsContent value="schedule" class="mt-0">
                    <KeepAlive>
                      <Suspense>
                        <MatterScheduleTab :matter-id="matterId" />
                        <template #fallback>
                          <Skeleton class="h-64 w-full" />
                        </template>
                      </Suspense>
                    </KeepAlive>
                  </TabsContent>

                  <!-- Communications Tab -->
                  <TabsContent value="communications" class="mt-0">
                    <KeepAlive>
                      <Suspense>
                        <MatterCommunicationsTab :matter-id="matterId" />
                        <template #fallback>
                          <div class="space-y-4">
                            <Skeleton v-for="i in 4" :key="i" class="h-16 w-full" />
                          </div>
                        </template>
                      </Suspense>
                    </KeepAlive>
                  </TabsContent>

                  <!-- Documents Tab -->
                  <TabsContent value="documents" class="mt-0">
                    <KeepAlive>
                      <Suspense>
                        <MatterDocumentsTab :matter-id="matterId" />
                        <template #fallback>
                          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Skeleton v-for="i in 6" :key="i" class="h-24" />
                          </div>
                        </template>
                      </Suspense>
                    </KeepAlive>
                  </TabsContent>

                  <!-- FAX Tab -->
                  <TabsContent value="fax" class="mt-0">
                    <KeepAlive>
                      <Suspense>
                        <MatterFaxTab :matter-id="matterId" />
                        <template #fallback>
                          <div class="space-y-4">
                            <Skeleton v-for="i in 3" :key="i" class="h-20 w-full" />
                          </div>
                        </template>
                      </Suspense>
                    </KeepAlive>
                  </TabsContent>

                  <!-- Billing Tab -->
                  <TabsContent value="billing" class="mt-0">
                    <KeepAlive>
                      <Suspense>
                        <MatterBillingTab :matter-id="matterId" />
                        <template #fallback>
                          <div class="space-y-4">
                            <Skeleton class="h-12 w-full" />
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Skeleton v-for="i in 4" :key="i" class="h-24" />
                            </div>
                          </div>
                        </template>
                      </Suspense>
                    </KeepAlive>
                  </TabsContent>

                  <!-- Notes Tab -->
                  <TabsContent value="notes" class="mt-0">
                    <KeepAlive>
                      <Suspense>
                        <MatterNotesTab :matter-id="matterId" />
                        <template #fallback>
                          <Skeleton class="h-96 w-full" />
                        </template>
                      </Suspense>
                    </KeepAlive>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, KeepAlive } from 'vue'
import { 
  ChevronRight, 
  ChevronLeft,
  Edit, 
  Share2, 
  Menu, 
  AlertCircle, 
  RefreshCw,
  FileText,
  CheckSquare,
  Calendar,
  MessageSquare,
  FolderOpen,
  FileText as FaxIcon,
  DollarSign,
  StickyNote,
  Activity
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

// Layout Components
import MatterSidebar from '~/components/matter/MatterSidebar.vue'

// Tab Components (will be created in subsequent subtasks)
import MatterOverviewTab from '~/components/matter/tabs/MatterOverviewTab.vue'
import MatterActivityTab from '~/components/matter/tabs/MatterActivityTab.vue'
import MatterTasksTab from '~/components/matter/tabs/MatterTasksTab.vue'
import MatterScheduleTab from '~/components/matter/tabs/MatterScheduleTab.vue'
import MatterCommunicationsTab from '~/components/matter/tabs/MatterCommunicationsTab.vue'
import MatterDocumentsTab from '~/components/matter/tabs/MatterDocumentsTab.vue'
import MatterFaxTab from '~/components/matter/tabs/MatterFaxTab.vue'
import MatterBillingTab from '~/components/matter/tabs/MatterBillingTab.vue'
import MatterNotesTab from '~/components/matter/tabs/MatterNotesTab.vue'

// Types
import type { Matter } from '~/types/matter'

// Stores
import { useMatterDetailStore } from '~/stores/matterDetail'

// Meta tags
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

// Route parameters
const route = useRoute()
const router = useRouter()
const matterId = computed(() => route.params.id as string)
const matterNumber = computed(() => matterId.value.split('-').pop() || matterId.value)

// Reactive state from store
const matter = computed(() => matterDetailStore.matter)
const loading = computed(() => matterDetailStore.loading)
const error = computed(() => matterDetailStore.error)
const sidebarCollapsed = computed(() => matterDetailStore.sidebarCollapsed)
const activeTab = computed(() => matterDetailStore.activeTab)
const subTabs = computed(() => matterDetailStore.subTabs)

// Tab configuration
const tabConfig = [
  { id: 'overview', label: 'Overview', icon: FileText, roles: ['client', 'lawyer', 'clerk'] },
  { id: 'activity', label: 'Activity', icon: Activity, roles: ['lawyer', 'clerk'] },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['lawyer', 'clerk'] },
  { id: 'schedule', label: 'Schedule', icon: Calendar, roles: ['lawyer', 'clerk'] },
  { id: 'communications', label: 'Communications', icon: MessageSquare, roles: ['lawyer', 'clerk'] },
  { id: 'documents', label: 'Documents', icon: FolderOpen, roles: ['client', 'lawyer', 'clerk'] },
  { id: 'fax', label: 'FAX', icon: FaxIcon, roles: ['lawyer', 'clerk'] },
  { id: 'billing', label: 'Billing', icon: DollarSign, roles: ['client', 'lawyer', 'clerk'] },
  { id: 'notes', label: 'Notes', icon: StickyNote, roles: ['lawyer', 'clerk'] }
]

// Get current user and available tabs  
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const matterDetailStore = useMatterDetailStore()
const availableTabs = computed(() => {
  if (!user.value) return tabConfig.slice(0, 1) // Only overview for unauthenticated
  
  return tabConfig.filter(tab => 
    tab.roles.includes(user.value?.role?.toLowerCase() || 'client')
  )
})

// Active tab management now handled by store

// Load matter data using store
const loadMatter = async () => {
  await matterDetailStore.loadMatter(matterId.value)
  
  // Load saved state for this matter
  matterDetailStore.loadSavedState(matterId.value)
  
  // Set active tab from URL if provided
  const urlTab = route.query.tab as string
  const urlView = route.query.view as string
  
  if (urlTab && urlTab !== activeTab.value) {
    matterDetailStore.setActiveTab(urlTab, urlView)
  }
  
  // Update page title when matter loads
  if (matter.value) {
    useHead({
      title: `${matter.value.title} - Matter Details`
    })
  }
}

// Handle tab changes with state management
const handleTabChange = (newTab: string) => {
  const currentView = route.query.view as string
  matterDetailStore.setActiveTab(newTab, currentView)
}

// Initialize tab from URL
const initializeTab = () => {
  const urlTab = route.query.tab as string || 'overview'
  const urlView = route.query.view as string
  
  if (availableTabs.value.some(tab => tab.id === urlTab)) {
    matterDetailStore.setActiveTab(urlTab, urlView)
  }
}

// Event handlers
const handleEdit = () => {
  // TODO: Implement edit functionality
  console.log('Edit matter:', matterId.value)
}

const handleShare = () => {
  // TODO: Implement share functionality
  console.log('Share matter:', matterId.value)
}

const handleDelete = () => {
  // TODO: Implement delete functionality
  console.log('Delete matter:', matterId.value)
}

const handleSidebarToggle = () => {
  matterDetailStore.toggleSidebar()
}

const retry = () => {
  loadMatter()
}

// Watchers
watch(() => route.query, () => {
  initializeTab()
})

watch(() => route.params.id, () => {
  if (route.params.id) {
    loadMatter()
  }
})

// Watch for tab changes to update URL
watch(() => activeTab.value, (newTab) => {
  const query = { ...route.query }
  if (newTab !== 'overview') {
    query.tab = newTab
  } else {
    delete query.tab
  }
  
  router.replace({ 
    query: Object.keys(query).length > 0 ? query : undefined 
  })
})

// Watch for sub-tab view changes to update URL
watch(() => subTabs.value, (newSubTabs, oldSubTabs) => {
  if (!newSubTabs || !oldSubTabs) return
  
  const query = { ...route.query }
  
  // Update view parameter based on current active tab and its sub-view
  const currentTab = activeTab.value
  if (currentTab === 'tasks' && newSubTabs.tasks !== oldSubTabs.tasks) {
    if (newSubTabs.tasks !== 'kanban') {
      query.view = newSubTabs.tasks
    } else {
      delete query.view
    }
  } else if (currentTab === 'schedule' && newSubTabs.schedule !== oldSubTabs.schedule) {
    if (newSubTabs.schedule !== 'list') {
      query.view = newSubTabs.schedule
    } else {
      delete query.view
    }
  }
  
  router.replace({ 
    query: Object.keys(query).length > 0 ? query : undefined 
  })
}, { deep: true })

// Keyboard shortcuts handler
const handleKeyboardShortcut = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key >= '1' && event.key <= '9') {
    event.preventDefault()
    const tabIndex = parseInt(event.key) - 1
    
    if (tabIndex < availableTabs.value.length) {
      handleTabChange(availableTabs.value[tabIndex].id)
    }
  }
  
  // Previous/Next matter navigation
  if (event.ctrlKey && event.key === 'ArrowLeft') {
    event.preventDefault()
    matterDetailStore.getPreviousMatter()
  }
  
  if (event.ctrlKey && event.key === 'ArrowRight') {
    event.preventDefault()
    matterDetailStore.getNextMatter()
  }
}

// Lifecycle
onMounted(() => {
  initializeTab()
  loadMatter()
  
  // Register keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcut)
})

onUnmounted(() => {
  // Cleanup keyboard shortcuts
  document.removeEventListener('keydown', handleKeyboardShortcut)
  
  // Cleanup store state
  matterDetailStore.cleanup()
})

// SEO
useSeoMeta({
  title: () => matter.value ? `${matter.value.title} - Matter Details` : 'Matter Details',
  description: () => matter.value?.description || 'Legal matter case details and management'
})
</script>

<style scoped>
.matter-detail-page {
  min-height: 100vh;
  background: hsl(var(--background));
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 40;
}

.matter-detail-layout {
  flex: 1;
}

.tab-content-container {
  scroll-behavior: smooth;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .matter-tabs :deep(.tabs-list) {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .matter-tabs :deep(.tabs-list)::-webkit-scrollbar {
    display: none;
  }
}

/* Animation for sidebar toggle */
.matter-detail-layout {
  transition: all 0.2s ease-in-out;
}

/* Focus styles for accessibility */
.matter-tabs :deep(.tabs-trigger:focus-visible) {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
</style>