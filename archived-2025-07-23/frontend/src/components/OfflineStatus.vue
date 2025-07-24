<template>
  <Transition
    name="offline-status"
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-[-100%] opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-[-100%] opacity-0"
  >
    <div
      v-if="showStatus"
      class="fixed top-0 left-0 right-0 z-50 shadow-lg"
      :class="statusClass"
    >
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between py-3">
          <!-- Status Icon and Message -->
          <div class="flex items-center gap-3">
            <div class="relative">
              <component
                :is="statusIcon"
                class="w-5 h-5"
                :class="iconClass"
              />
              <!-- Pulse animation for syncing -->
              <div
                v-if="isSyncing"
                class="absolute inset-0 animate-ping"
              >
                <component
                  :is="statusIcon"
                  class="w-5 h-5 opacity-75"
                  :class="iconClass"
                />
              </div>
            </div>
            
            <div>
              <p class="font-medium text-sm">
                {{ statusMessage }}
              </p>
              <p
                v-if="statusDetails"
                class="text-xs opacity-90 mt-0.5"
              >
                {{ statusDetails }}
              </p>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center gap-2">
            <!-- Sync Progress -->
            <div
              v-if="isSyncing && syncProgress.total > 0"
              class="flex items-center gap-2 text-sm"
            >
              <span class="opacity-90">
                {{ syncProgress.current }}/{{ syncProgress.total }}
              </span>
              <div class="w-24 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  class="h-full bg-white/60 transition-all duration-300"
                  :style="{ width: `${syncProgressPercentage}%` }"
                />
              </div>
            </div>
            
            <!-- Manual Sync Button -->
            <Button
              v-if="canManualSync"
              size="sm"
              variant="ghost"
              class="text-xs"
              :disabled="isSyncing"
              @click="handleManualSync"
            >
              <RefreshCw
                class="w-4 h-4"
                :class="{ 'animate-spin': isSyncing }"
              />
              Sync Now
            </Button>
            
            <!-- Retry Failed -->
            <Button
              v-if="hasFailedMutations"
              size="sm"
              variant="ghost"
              class="text-xs"
              @click="handleRetryFailed"
            >
              <AlertTriangle class="w-4 h-4 mr-1" />
              Retry Failed ({{ failedCount }})
            </Button>
            
            <!-- Close Button -->
            <Button
              v-if="canDismiss"
              size="sm"
              variant="ghost"
              class="text-xs"
              @click="handleDismiss"
            >
              <X class="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <!-- Expandable Details -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-96 opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="max-h-96 opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <div
            v-if="showDetails && (hasQueuedMutations || syncErrors.length > 0)"
            class="pb-3 overflow-hidden"
          >
            <!-- Queued Mutations -->
            <div
              v-if="pendingCount > 0"
              class="mt-2 p-3 bg-white/10 rounded-md"
            >
              <p class="text-xs font-medium mb-2">
                Pending Operations ({{ pendingCount }})
              </p>
              <ul class="space-y-1 text-xs opacity-80">
                <li
                  v-for="mutation in pendingMutations"
                  :key="mutation.id"
                  class="flex items-center justify-between"
                >
                  <span class="truncate flex-1">
                    {{ getMutationDescription(mutation) }}
                  </span>
                  <span class="text-xs opacity-60 ml-2">
                    {{ formatTime(mutation.timestamp) }}
                  </span>
                </li>
              </ul>
            </div>
            
            <!-- Sync Errors -->
            <div
              v-if="syncErrors.length > 0"
              class="mt-2 p-3 bg-red-500/10 rounded-md"
            >
              <p class="text-xs font-medium mb-2 text-red-200">
                Failed Operations ({{ syncErrors.length }})
              </p>
              <ul class="space-y-1 text-xs text-red-100">
                <li
                  v-for="error in syncErrors"
                  :key="error.mutation.id"
                  class="flex items-center justify-between"
                >
                  <span class="truncate flex-1">
                    {{ getMutationDescription(error.mutation) }}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    class="text-xs ml-2"
                    @click="handleRetryMutation(error.mutation.id)"
                  >
                    Retry
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        </Transition>
        
        <!-- Toggle Details Button -->
        <button
          v-if="hasQueuedMutations || syncErrors.length > 0"
          class="w-full py-1 text-xs opacity-60 hover:opacity-80 transition-opacity"
          @click="showDetails = !showDetails"
        >
          <ChevronDown
            class="w-4 h-4 mx-auto transition-transform"
            :class="{ 'rotate-180': showDetails }"
          />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Offline Status Component
 * 
 * @description Displays the current offline/online status with sync progress
 * and queue information. Provides actions for manual sync and retry operations.
 */

import { ref, computed, watch } from 'vue'
import { useOnline } from '@vueuse/core'
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  X,
  ChevronDown,
  Cloud,
  CloudOff
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { useGlobalOfflineMutationQueue } from '~/composables/useOfflineMutationQueue'
import { formatDistanceToNow } from 'date-fns'

// Props
interface Props {
  /** Always show status bar even when online */
  alwaysShow?: boolean
  /** Allow dismissing the status bar */
  dismissible?: boolean
  /** Show expandable details section */
  expandable?: boolean
  /** Auto-hide after being online for this duration (ms) */
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  alwaysShow: false,
  dismissible: true,
  expandable: true,
  autoHideDelay: 5000
})

// Emit events
const emit = defineEmits<{
  dismiss: []
  syncComplete: [results: any[]]
  syncError: [error: Error]
}>()

// Composables
const isOnline = useOnline()
const {
  queue,
  isSyncing,
  syncProgress,
  pendingCount,
  failedCount,
  hasQueuedMutations,
  canSync,
  syncErrors,
  syncQueue,
  retryMutation,
  clearFailed
} = useGlobalOfflineMutationQueue()

// Local state
const showDetails = ref(false)
const isDismissed = ref(false)
const autoHideTimer = ref<NodeJS.Timeout | null>(null)

// Computed properties
const showStatus = computed(() => {
  if (isDismissed.value) return false
  if (props.alwaysShow) return true
  if (!isOnline.value) return true
  if (isSyncing.value) return true
  if (hasQueuedMutations.value) return true
  return false
})

const statusClass = computed(() => {
  if (!isOnline.value) {
    return 'bg-orange-500 text-white'
  }
  if (failedCount.value > 0) {
    return 'bg-red-500 text-white'
  }
  if (isSyncing.value) {
    return 'bg-blue-500 text-white'
  }
  return 'bg-green-500 text-white'
})

const statusIcon = computed(() => {
  if (!isOnline.value) return CloudOff
  if (failedCount.value > 0) return AlertTriangle
  if (isSyncing.value) return RefreshCw
  return Cloud
})

const iconClass = computed(() => {
  if (isSyncing.value) return 'animate-spin'
  return ''
})

const statusMessage = computed(() => {
  if (!isOnline.value) {
    return 'You are currently offline'
  }
  if (isSyncing.value) {
    return 'Syncing your changes...'
  }
  if (failedCount.value > 0) {
    return `${failedCount.value} operations failed to sync`
  }
  if (pendingCount.value > 0) {
    return `${pendingCount.value} operations waiting to sync`
  }
  return 'All changes synced'
})

const statusDetails = computed(() => {
  if (!isOnline.value && hasQueuedMutations.value) {
    return `${queue.value.length} operations will sync when connection is restored`
  }
  if (isSyncing.value && syncProgress.value.total > 0) {
    const percentage = Math.round((syncProgress.value.current / syncProgress.value.total) * 100)
    return `Processing ${syncProgress.value.current} of ${syncProgress.value.total} operations (${percentage}%)`
  }
  return null
})

const syncProgressPercentage = computed(() => {
  if (syncProgress.value.total === 0) return 0
  return Math.round((syncProgress.value.current / syncProgress.value.total) * 100)
})

const canManualSync = computed(() => 
  isOnline.value && !isSyncing.value && pendingCount.value > 0
)

const hasFailedMutations = computed(() => failedCount.value > 0)

const canDismiss = computed(() => 
  props.dismissible && !isSyncing.value && isOnline.value
)

const pendingMutations = computed(() => 
  queue.value.filter(m => m.status === 'pending').slice(0, 5)
)

// Methods
function getMutationDescription(mutation: any): string {
  // Extract a readable description from the mutation
  const key = Array.isArray(mutation.mutationKey) 
    ? mutation.mutationKey.join('.')
    : mutation.mutationKey
  
  // Try to get operation type from key or variables
  if (key?.includes('create')) return 'Creating new item'
  if (key?.includes('update')) return 'Updating item'
  if (key?.includes('delete')) return 'Deleting item'
  if (key?.includes('move')) return 'Moving item'
  
  return 'Syncing changes'
}

function formatTime(timestamp: number): string {
  return formatDistanceToNow(timestamp, { addSuffix: true })
}

async function handleManualSync() {
  try {
    const results = await syncQueue()
    emit('syncComplete', results)
  } catch (error) {
    emit('syncError', error as Error)
  }
}

async function handleRetryFailed() {
  // Retry all failed mutations
  const failed = queue.value.filter(m => m.status === 'failed')
  for (const mutation of failed) {
    await retryMutation(mutation.id)
  }
  handleManualSync()
}

async function handleRetryMutation(mutationId: string) {
  await retryMutation(mutationId)
  handleManualSync()
}

function handleDismiss() {
  isDismissed.value = true
  emit('dismiss')
}

// Auto-hide when coming back online
watch(isOnline, (online) => {
  if (online && props.autoHideDelay > 0 && !hasQueuedMutations.value) {
    // Clear any existing timer
    if (autoHideTimer.value) {
      clearTimeout(autoHideTimer.value)
    }
    
    // Set new timer
    autoHideTimer.value = setTimeout(() => {
      if (!isSyncing.value && !hasQueuedMutations.value) {
        isDismissed.value = true
      }
    }, props.autoHideDelay)
  }
})

// Reset dismissed state when going offline
watch(isOnline, (online) => {
  if (!online) {
    isDismissed.value = false
  }
})

// Cleanup
onUnmounted(() => {
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
  }
})
</script>