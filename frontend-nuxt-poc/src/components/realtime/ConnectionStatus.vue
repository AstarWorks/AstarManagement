<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRealTimeStore } from '~/stores/kanban/real-time'
import { Badge } from '~/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'

const realTimeStore = useRealTimeStore()
const { syncStatus, networkStatus } = storeToRefs(realTimeStore)

const statusConfig = computed(() => {
  switch (syncStatus.value.status) {
    case 'idle':
      return { 
        variant: 'success' as const, 
        label: 'Connected', 
        icon: Wifi,
        spin: false
      }
    case 'syncing':
      return { 
        variant: 'warning' as const, 
        label: 'Syncing...', 
        icon: Loader2,
        spin: true
      }
    case 'offline':
      return { 
        variant: 'secondary' as const, 
        label: 'Offline', 
        icon: WifiOff,
        spin: false
      }
    case 'error':
      return { 
        variant: 'destructive' as const, 
        label: 'Connection Error', 
        icon: AlertCircle,
        spin: false
      }
    default:
      return { 
        variant: 'secondary' as const, 
        label: 'Unknown', 
        icon: AlertCircle,
        spin: false
      }
  }
})

const lastUpdateFormatted = computed(() => {
  if (!syncStatus.value.lastSyncTime) return 'Never'
  return formatDistanceToNow(syncStatus.value.lastSyncTime, { addSuffix: true })
})

const connectionQuality = computed(() => {
  if (!networkStatus.value.isOnline) return 'Offline'
  const type = networkStatus.value.effectiveType
  if (type === '4g') return 'Excellent'
  if (type === '3g') return 'Good'
  if (type === '2g') return 'Poor'
  return 'Unknown'
})
</script>

<template>
  <div class="flex items-center gap-2">
    <Badge :variant="statusConfig.variant" class="flex items-center gap-1">
      <component 
        :is="statusConfig.icon" 
        class="h-3 w-3"
        :class="{ 'animate-spin': statusConfig.spin }"
      />
      <span class="text-xs">{{ statusConfig.label }}</span>
    </Badge>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span class="text-xs text-muted-foreground cursor-default">
            Last sync: {{ lastUpdateFormatted }}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div class="space-y-1 text-xs">
            <div>Connection: {{ connectionQuality }}</div>
            <div v-if="syncStatus.errorMessage" class="text-destructive">
              Error: {{ syncStatus.errorMessage }}
            </div>
            <div v-if="syncStatus.retryCount > 0">
              Retry attempts: {{ syncStatus.retryCount }}
            </div>
            <div v-if="networkStatus.downlink">
              Speed: {{ networkStatus.downlink }} Mbps
            </div>
            <div v-if="networkStatus.rtt">
              Latency: {{ networkStatus.rtt }}ms
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>