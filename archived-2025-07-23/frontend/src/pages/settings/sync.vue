<script setup lang="ts">
/**
 * Sync Settings Page
 * 
 * @description Settings page for configuring background sync preferences
 * with real-time status monitoring and sync controls.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Settings, HelpCircle, AlertCircle } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import SyncConfiguration from '~/components/settings/SyncConfiguration.vue'
import type { SyncMode } from '~/config/background-sync'
import { useMatterStore } from '~/stores/matter'
import { useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/types/query'

// Page metadata
definePageMeta({
  title: 'Sync Settings',
  layout: 'default'
})

// Composables
const router = useRouter()
const matterStore = useMatterStore()
const queryClient = useQueryClient()
const { $toast } = useNuxtApp()

// State
const isLoading = ref(false)
const showHelp = ref(false)
const syncStats = ref({
  totalSynced: 0,
  pendingChanges: 0,
  lastError: null as string | null
})

// Computed
const hasPendingChanges = computed(() => syncStats.value.pendingChanges > 0)

// Methods
const handleModeChanged = (mode: SyncMode) => {
  console.log('Sync mode changed to:', mode)
  
  // Update query client default options based on mode
  if (mode === 'offline') {
    // Disable all background refetching
    queryClient.setDefaultOptions({
      queries: {
        refetchInterval: false,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false
      }
    })
  } else {
    // Re-enable refetching based on mode
    queryClient.setDefaultOptions({
      queries: {
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
      }
    })
  }
}

const handleManualSync = async () => {
  isLoading.value = true
  syncStats.value.lastError = null
  
  try {
    // Invalidate all queries to trigger refetch
    await queryClient.invalidateQueries()
    
    // Refetch matter data
    await queryClient.refetchQueries({
      queryKey: queryKeys.matters.all
    })
    
    // Update sync stats
    const matters = matterStore.matters
    syncStats.value.totalSynced = matters.length
    syncStats.value.pendingChanges = 0
    
    $toast.success('Manual sync completed', `Synced ${matters.length} matters`)
  } catch (error) {
    console.error('Manual sync failed:', error)
    syncStats.value.lastError = error instanceof Error ? error.message : 'Unknown error'
    $toast.error('Sync failed', 'Please check your connection and try again')
  } finally {
    isLoading.value = false
  }
}

const navigateBack = () => {
  router.back()
}

const toggleHelp = () => {
  showHelp.value = !showHelp.value
}

// Load initial sync stats
onMounted(async () => {
  try {
    // Get cached data stats
    const queries = queryClient.getQueryCache().getAll()
    const cachedMatters = queries.filter(q => 
      q.queryKey.includes('matters') && q.state.data
    )
    
    syncStats.value.totalSynced = cachedMatters.length
    
    // Check for any pending mutations
    const mutations = queryClient.getMutationCache().getAll()
    const pendingMutations = mutations.filter(m => 
      m.state.status === 'pending'
    )
    
    syncStats.value.pendingChanges = pendingMutations.length
  } catch (error) {
    console.error('Failed to load sync stats:', error)
  }
})
</script>

<template>
  <div class="sync-settings-page">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              @click="navigateBack"
              aria-label="Go back"
            >
              <ArrowLeft class="h-4 w-4" />
            </Button>
            <div>
              <h1 class="text-2xl font-semibold flex items-center gap-2">
                <Settings class="h-6 w-6" />
                Sync Settings
              </h1>
              <p class="text-sm text-muted-foreground">
                Configure how your data syncs with the server
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            @click="toggleHelp"
            aria-label="Toggle help"
          >
            <HelpCircle class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Help Alert -->
        <Alert v-if="showHelp" class="mb-6">
          <HelpCircle class="h-4 w-4" />
          <AlertTitle>About Sync Settings</AlertTitle>
          <AlertDescription class="mt-2 space-y-2">
            <p>
              Sync settings control how frequently your data updates from the server.
              Choose a mode that balances your need for real-time updates with battery
              life and data usage.
            </p>
            <ul class="list-disc list-inside space-y-1 text-sm">
              <li><strong>Real-time:</strong> Best for active collaboration</li>
              <li><strong>Balanced:</strong> Good for everyday use</li>
              <li><strong>Battery Saver:</strong> Extends battery life on mobile devices</li>
              <li><strong>Offline:</strong> Work without internet connection</li>
              <li><strong>Manual:</strong> Full control over when to sync</li>
            </ul>
          </AlertDescription>
        </Alert>

        <!-- Pending Changes Alert -->
        <Alert v-if="hasPendingChanges">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Pending Changes</AlertTitle>
          <AlertDescription>
            You have {{ syncStats.pendingChanges }} unsaved changes that will be synced
            when connection is restored.
          </AlertDescription>
        </Alert>

        <!-- Error Alert -->
        <Alert v-if="syncStats.lastError" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Sync Error</AlertTitle>
          <AlertDescription>
            {{ syncStats.lastError }}
          </AlertDescription>
        </Alert>

        <!-- Sync Configuration Component -->
        <SyncConfiguration 
          @mode-changed="handleModeChanged"
          @manual-sync="handleManualSync"
        />

        <!-- Sync Statistics -->
        <div class="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 class="text-sm font-medium mb-2">Sync Statistics</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">Total items synced:</span>
              <span class="ml-2 font-medium">{{ syncStats.totalSynced }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Pending changes:</span>
              <span class="ml-2 font-medium">{{ syncStats.pendingChanges }}</span>
            </div>
          </div>
        </div>

        <!-- Additional Actions -->
        <div class="flex flex-col sm:flex-row gap-4 pt-4 border-t">
          <Button variant="outline" @click="router.push('/settings')">
            Back to Settings
          </Button>
          <Button 
            variant="outline" 
            @click="router.push('/settings/network')"
            class="sm:ml-auto"
          >
            Network Settings
          </Button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.sync-settings-page {
  min-height: 100vh;
  background-color: hsl(var(--background));
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  header h1 {
    font-size: 1.5rem;
  }
}
</style>