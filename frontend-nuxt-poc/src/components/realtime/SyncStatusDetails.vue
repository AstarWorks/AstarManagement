<template>
  <div class="sync-status-details">
    <!-- Current Status -->
    <div class="status-section">
      <h4 class="text-sm font-medium mb-2">Connection Status</h4>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Network:</span>
          <Badge :variant="networkBadgeVariant">{{ networkQuality }}</Badge>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">WebSocket:</span>
          <Badge :variant="wsConnected ? 'success' : 'secondary'">
            {{ wsConnected ? 'Connected' : 'Disconnected' }}
          </Badge>
        </div>
        <div v-if="lastSyncTime" class="col-span-2 flex items-center justify-between">
          <span class="text-muted-foreground">Last sync:</span>
          <span class="text-xs">{{ formatLastSync(lastSyncTime) }}</span>
        </div>
      </div>
    </div>
    
    <Separator class="my-4" />
    
    <!-- Sync Mode Selection -->
    <div class="mode-section">
      <h4 class="text-sm font-medium mb-2">Sync Mode</h4>
      <RadioGroup 
        :model-value="syncMode" 
        @update:model-value="handleModeChange"
        class="space-y-2"
      >
        <div 
          v-for="(config, mode) in SYNC_MODE_DESCRIPTIONS" 
          :key="mode"
          class="flex items-start space-x-2"
        >
          <RadioGroupItem :value="mode" :id="`mode-${mode}`" />
          <Label 
            :for="`mode-${mode}`" 
            class="flex-1 cursor-pointer space-y-1"
          >
            <div class="flex items-center space-x-2">
              <component 
                :is="getModeIcon(config.icon)" 
                class="h-4 w-4"
                :class="config.color"
              />
              <span class="font-medium">{{ config.label }}</span>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ config.description }}
            </p>
          </Label>
        </div>
      </RadioGroup>
    </div>
    
    <!-- Performance Metrics -->
    <div v-if="batteryLevel !== null || memoryUsage !== null" class="mt-4">
      <Separator class="mb-4" />
      <h4 class="text-sm font-medium mb-2">Performance</h4>
      <div class="space-y-2">
        <div v-if="batteryLevel !== null" class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground flex items-center space-x-2">
            <Battery class="h-4 w-4" />
            <span>Battery</span>
          </span>
          <span :class="batteryColorClass">{{ Math.round(batteryLevel) }}%</span>
        </div>
        <div v-if="memoryUsage !== null" class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground flex items-center space-x-2">
            <Cpu class="h-4 w-4" />
            <span>Memory</span>
          </span>
          <span :class="memoryColorClass">{{ Math.round(memoryUsage) }}%</span>
        </div>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="mt-4 flex justify-end space-x-2">
      <Button
        variant="outline"
        size="sm"
        @click="handleSyncNow"
        :disabled="syncStatus === 'syncing' || syncStatus === 'offline'"
      >
        <RefreshCw class="h-4 w-4 mr-2" :class="{ 'animate-spin': syncStatus === 'syncing' }" />
        Sync Now
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import {
  Activity,
  Battery,
  Cpu,
  Hand,
  RefreshCw,
  WifiOff,
  Zap
} from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Separator } from '~/components/ui/separator'
import { SYNC_MODE_DESCRIPTIONS } from '~/config/background-sync'
import type { SyncMode, NetworkQuality } from '~/config/background-sync'

// Props
interface Props {
  syncMode: SyncMode
  syncStatus: string
  networkQuality: NetworkQuality
  lastSyncTime: number
  wsConnected: boolean
  batteryLevel: number | null
  memoryUsage: number | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'mode-change': [mode: SyncMode]
  'sync-now': []
}>()

// Icon mapping
const iconMap = {
  'zap': Zap,
  'activity': Activity,
  'battery': Battery,
  'wifi-off': WifiOff,
  'hand': Hand
}

const getModeIcon = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || Activity
}

// Network badge variant
const networkBadgeVariant = computed(() => {
  switch (props.networkQuality) {
    case 'excellent':
      return 'success'
    case 'good':
      return 'default'
    case 'fair':
      return 'warning'
    case 'poor':
      return 'destructive'
    case 'offline':
      return 'secondary'
    default:
      return 'default'
  }
})

// Battery color class
const batteryColorClass = computed(() => {
  if (props.batteryLevel === null) return ''
  if (props.batteryLevel < 20) return 'text-red-500'
  if (props.batteryLevel < 50) return 'text-yellow-500'
  return 'text-green-500'
})

// Memory color class
const memoryColorClass = computed(() => {
  if (props.memoryUsage === null) return ''
  if (props.memoryUsage > 90) return 'text-red-500'
  if (props.memoryUsage > 70) return 'text-yellow-500'
  return 'text-green-500'
})

// Format last sync time
const formatLastSync = (timestamp: number) => {
  try {
    return formatDistanceToNow(timestamp, { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

// Handlers
const handleModeChange = (mode: string) => {
  emit('mode-change', mode as SyncMode)
}

const handleSyncNow = () => {
  emit('sync-now')
}
</script>

<style scoped>
.sync-status-details {
  @apply space-y-4;
}

.status-section,
.mode-section {
  @apply space-y-2;
}

/* Badge variant styles (if not defined globally) */
:deep(.badge) {
  @apply inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset;
}

:deep(.badge.success) {
  @apply bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20;
}

:deep(.badge.warning) {
  @apply bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20;
}
</style>