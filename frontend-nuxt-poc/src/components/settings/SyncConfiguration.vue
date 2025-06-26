<script setup lang="ts">
/**
 * Sync Configuration Component
 * 
 * @description Allows users to configure their background sync preferences with
 * visual indicators, impact estimates, and real-time status updates.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { Switch } from '~/components/ui/switch'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '~/components/ui/tooltip'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Separator } from '~/components/ui/separator'
import {
  Activity,
  Battery,
  BatteryLow,
  Cloud,
  CloudOff,
  Hand,
  Info,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-vue-next'
import type { SyncMode } from '~/config/background-sync'
import { 
  SYNC_MODE_DESCRIPTIONS, 
  getDefaultSyncMode,
  SYNC_CONFIGS 
} from '~/config/background-sync'
import { useRealtimeSync } from '~/composables/useRealtimeSync'
import { formatDistanceToNow } from 'date-fns'

// Props
interface Props {
  initialMode?: SyncMode
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: undefined
})

// Emit events
const emit = defineEmits<{
  'mode-changed': [mode: SyncMode]
  'manual-sync': []
}>()

// State
const selectedMode = ref<SyncMode>(props.initialMode || getDefaultSyncMode())
const isSyncing = ref(false)
const lastSyncTime = ref<number>(Date.now())
const batteryLevel = ref<number | null>(null)
const networkType = ref<string>('unknown')
const dataUsage = ref({ sent: 0, received: 0 })
const syncHistory = ref<Array<{ time: number; duration: number; items: number }>>([])

// Advanced settings
const advancedSettingsOpen = ref(false)
const selectedDataTypes = ref<string[]>(['matters', 'kanban', 'activity'])
const enableNotifications = ref(true)
const enableSounds = ref(false)

// Composables
const { isConnected, latency, messagesPerMinute, connect, disconnect } = useRealtimeSync()

// Mode icons mapping
const modeIcons = {
  aggressive: Zap,
  balanced: Activity,
  conservative: Battery,
  offline: WifiOff,
  manual: Hand
} as const

// Computed properties
const currentModeConfig = computed(() => SYNC_MODE_DESCRIPTIONS[selectedMode.value])

const syncStatus = computed(() => {
  if (!isConnected.value && selectedMode.value !== 'offline') {
    return { text: 'Disconnected', color: 'text-destructive', icon: CloudOff }
  }
  if (isSyncing.value) {
    return { text: 'Syncing...', color: 'text-blue-500', icon: RefreshCw }
  }
  if (selectedMode.value === 'offline') {
    return { text: 'Offline Mode', color: 'text-muted-foreground', icon: CloudOff }
  }
  return { text: 'Connected', color: 'text-green-500', icon: Cloud }
})

const lastSyncFormatted = computed(() => {
  if (!lastSyncTime.value) return 'Never'
  return formatDistanceToNow(lastSyncTime.value, { addSuffix: true })
})

const estimatedBatteryImpact = computed(() => {
  const impacts = {
    aggressive: { percentage: 15, hours: 4 },
    balanced: { percentage: 8, hours: 8 },
    conservative: { percentage: 3, hours: 16 },
    offline: { percentage: 0, hours: 24 },
    manual: { percentage: 1, hours: 20 }
  }
  return impacts[selectedMode.value]
})

const estimatedDataUsage = computed(() => {
  const usage = {
    aggressive: { daily: 50, unit: 'MB' },
    balanced: { daily: 20, unit: 'MB' },
    conservative: { daily: 5, unit: 'MB' },
    offline: { daily: 0, unit: 'MB' },
    manual: { daily: 2, unit: 'MB' }
  }
  return usage[selectedMode.value]
})

const connectionQuality = computed(() => {
  if (!isConnected.value) return 0
  if (!latency.value) return 50
  
  // Convert latency to quality percentage (lower latency = higher quality)
  const maxLatency = 500
  const quality = Math.max(0, Math.min(100, ((maxLatency - latency.value) / maxLatency) * 100))
  return Math.round(quality)
})

// Methods
const handleModeChange = (mode: SyncMode) => {
  selectedMode.value = mode
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('sync-mode', mode)
  }
  
  // Handle connection changes
  if (mode === 'offline') {
    disconnect()
  } else if (!isConnected.value) {
    connect()
  }
  
  emit('mode-changed', mode)
  
  // Show notification
  const { $toast } = useNuxtApp()
  $toast.success('Sync mode updated', `Switched to ${currentModeConfig.value.label} mode`)
}

const handleManualSync = async () => {
  if (isSyncing.value) return
  
  isSyncing.value = true
  const startTime = Date.now()
  
  try {
    // Trigger manual sync
    emit('manual-sync')
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const duration = Date.now() - startTime
    lastSyncTime.value = Date.now()
    
    // Add to sync history
    syncHistory.value.unshift({
      time: lastSyncTime.value,
      duration,
      items: Math.floor(Math.random() * 50) + 10
    })
    
    // Keep only last 5 sync records
    if (syncHistory.value.length > 5) {
      syncHistory.value = syncHistory.value.slice(0, 5)
    }
    
    const { $toast } = useNuxtApp()
    $toast.success('Sync completed', `Updated ${syncHistory.value[0].items} items`)
    
  } catch (error) {
    console.error('Manual sync failed:', error)
    const { $toast } = useNuxtApp()
    $toast.error('Sync failed', 'Please check your connection and try again')
  } finally {
    isSyncing.value = false
  }
}

const toggleDataType = (dataType: string) => {
  const index = selectedDataTypes.value.indexOf(dataType)
  if (index > -1) {
    selectedDataTypes.value.splice(index, 1)
  } else {
    selectedDataTypes.value.push(dataType)
  }
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('sync-data-types', JSON.stringify(selectedDataTypes.value))
  }
}

// Battery monitoring
const updateBatteryInfo = async () => {
  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery()
      batteryLevel.value = Math.round(battery.level * 100)
      
      battery.addEventListener('levelchange', () => {
        batteryLevel.value = Math.round(battery.level * 100)
      })
    } catch (error) {
      console.debug('Battery API not available')
    }
  }
}

// Network monitoring
const updateNetworkInfo = () => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    networkType.value = connection.effectiveType || 'unknown'
    
    connection.addEventListener('change', () => {
      networkType.value = connection.effectiveType || 'unknown'
    })
  }
}

// Simulate data usage tracking
const trackDataUsage = () => {
  const interval = setInterval(() => {
    if (isConnected.value && selectedMode.value !== 'offline') {
      const rate = messagesPerMinute.value || 0
      dataUsage.value.sent += Math.random() * rate * 0.1
      dataUsage.value.received += Math.random() * rate * 0.5
    }
  }, 5000)
  
  onUnmounted(() => clearInterval(interval))
}

// Lifecycle
onMounted(() => {
  // Load saved preferences
  if (typeof window !== 'undefined') {
    const savedMode = localStorage.getItem('sync-mode')
    if (savedMode) {
      selectedMode.value = savedMode as SyncMode
    }
    
    const savedDataTypes = localStorage.getItem('sync-data-types')
    if (savedDataTypes) {
      selectedDataTypes.value = JSON.parse(savedDataTypes)
    }
    
    const savedNotifications = localStorage.getItem('sync-notifications')
    if (savedNotifications !== null) {
      enableNotifications.value = savedNotifications === 'true'
    }
    
    const savedSounds = localStorage.getItem('sync-sounds')
    if (savedSounds !== null) {
      enableSounds.value = savedSounds === 'true'
    }
  }
  
  updateBatteryInfo()
  updateNetworkInfo()
  trackDataUsage()
})

// Watch for preference changes
watch(enableNotifications, (value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sync-notifications', value.toString())
  }
})

watch(enableSounds, (value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sync-sounds', value.toString())
  }
})
</script>

<template>
  <div class="sync-configuration space-y-6">
    <!-- Status Card -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <component :is="syncStatus.icon" 
              :class="[
                'h-5 w-5',
                syncStatus.color,
                { 'animate-spin': isSyncing }
              ]"
            />
            <CardTitle>Sync Status</CardTitle>
          </div>
          <Badge variant="outline" :class="syncStatus.color">
            {{ syncStatus.text }}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4">
          <!-- Connection Quality -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Connection Quality</span>
              <span class="font-medium">{{ connectionQuality }}%</span>
            </div>
            <Progress :model-value="connectionQuality" class="h-2" />
          </div>
          
          <!-- Last Sync Time -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Last sync</span>
            <span class="text-sm font-medium">{{ lastSyncFormatted }}</span>
          </div>
          
          <!-- Network Info -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Network</span>
            <div class="flex items-center gap-2">
              <Wifi class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium uppercase">{{ networkType }}</span>
            </div>
          </div>
          
          <!-- Manual Sync Button -->
          <Button 
            @click="handleManualSync"
            :disabled="isSyncing"
            class="w-full"
            variant="outline"
          >
            <RefreshCw :class="['h-4 w-4 mr-2', { 'animate-spin': isSyncing }]" />
            {{ isSyncing ? 'Syncing...' : 'Sync Now' }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Sync Mode Selection -->
    <Card>
      <CardHeader>
        <CardTitle>Sync Mode</CardTitle>
        <CardDescription>
          Choose how frequently data syncs with the server
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          :model-value="selectedMode"
          @update:model-value="handleModeChange"
          class="space-y-4"
        >
          <div 
            v-for="(config, mode) in SYNC_MODE_DESCRIPTIONS" 
            :key="mode"
            class="flex items-start space-x-3"
          >
            <RadioGroupItem :value="mode" :id="`mode-${mode}`" />
            <div class="flex-1 space-y-1">
              <Label 
                :for="`mode-${mode}`" 
                class="flex items-center gap-2 cursor-pointer"
              >
                <component :is="modeIcons[mode]" :class="['h-4 w-4', config.color]" />
                <span class="font-medium">{{ config.label }}</span>
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ config.description }}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info class="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left" class="max-w-xs">
                  <p class="text-sm">
                    <template v-if="mode === 'aggressive'">
                      Updates every 3-5 seconds. Best for critical real-time collaboration
                      but uses more battery and data.
                    </template>
                    <template v-else-if="mode === 'balanced'">
                      Updates every 15-30 seconds. Good balance between freshness and
                      resource usage.
                    </template>
                    <template v-else-if="mode === 'conservative'">
                      Updates every 1-2 minutes. Saves battery and data while keeping
                      information reasonably current.
                    </template>
                    <template v-else-if="mode === 'offline'">
                      No automatic updates. Work offline and sync manually when needed.
                    </template>
                    <template v-else-if="mode === 'manual'">
                      Updates only when you tap the sync button. Full control over
                      when data is refreshed.
                    </template>
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>

    <!-- Impact Estimates -->
    <div class="grid gap-4 md:grid-cols-2">
      <!-- Battery Impact -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <BatteryLow class="h-4 w-4" />
            Battery Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Drain rate</span>
              <span class="text-sm font-medium">
                ~{{ estimatedBatteryImpact.percentage }}% per hour
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Est. battery life</span>
              <span class="text-sm font-medium">
                ~{{ estimatedBatteryImpact.hours }} hours
              </span>
            </div>
            <div v-if="batteryLevel !== null" class="pt-2 border-t">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Current level</span>
                <div class="flex items-center gap-2">
                  <Battery class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm font-medium">{{ batteryLevel }}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Data Usage -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <Smartphone class="h-4 w-4" />
            Data Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Est. daily usage</span>
              <span class="text-sm font-medium">
                ~{{ estimatedDataUsage.daily }} {{ estimatedDataUsage.unit }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">This session</span>
              <span class="text-sm font-medium">
                {{ (dataUsage.sent + dataUsage.received).toFixed(1) }} MB
              </span>
            </div>
            <div class="pt-2 border-t space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted-foreground">Sent</span>
                <span>{{ dataUsage.sent.toFixed(2) }} MB</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted-foreground">Received</span>
                <span>{{ dataUsage.received.toFixed(2) }} MB</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Advanced Settings -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Advanced Settings</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            @click="advancedSettingsOpen = !advancedSettingsOpen"
          >
            {{ advancedSettingsOpen ? 'Hide' : 'Show' }}
          </Button>
        </div>
      </CardHeader>
      <CardContent v-if="advancedSettingsOpen" class="space-y-4">
        <!-- Data Types -->
        <div class="space-y-3">
          <Label>Data Types to Sync</Label>
          <div class="space-y-2">
            <div 
              v-for="dataType in ['matters', 'kanban', 'activity', 'static']"
              :key="dataType"
              class="flex items-center justify-between"
            >
              <div class="flex items-center space-x-2">
                <Switch
                  :checked="selectedDataTypes.includes(dataType)"
                  @update:checked="toggleDataType(dataType)"
                  :id="`data-${dataType}`"
                />
                <Label 
                  :for="`data-${dataType}`" 
                  class="text-sm font-normal capitalize cursor-pointer"
                >
                  {{ dataType }}
                </Label>
              </div>
              <span class="text-xs text-muted-foreground">
                <template v-if="dataType === 'matters'">Legal cases</template>
                <template v-else-if="dataType === 'kanban'">Board state</template>
                <template v-else-if="dataType === 'activity'">Notifications</template>
                <template v-else-if="dataType === 'static'">Settings</template>
              </span>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Notifications -->
        <div class="space-y-3">
          <Label>Notifications</Label>
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <Switch
                v-model:checked="enableNotifications"
                id="notifications"
              />
              <Label for="notifications" class="text-sm font-normal cursor-pointer">
                Show sync notifications
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <Switch
                v-model:checked="enableSounds"
                :disabled="!enableNotifications"
                id="sounds"
              />
              <Label for="sounds" class="text-sm font-normal cursor-pointer">
                Play notification sounds
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Sync History -->
        <div v-if="syncHistory.length > 0" class="space-y-3">
          <Label>Recent Sync History</Label>
          <div class="space-y-2">
            <div 
              v-for="(sync, index) in syncHistory"
              :key="sync.time"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-muted-foreground">
                {{ formatDistanceToNow(sync.time, { addSuffix: true }) }}
              </span>
              <span class="font-medium">
                {{ sync.items }} items in {{ (sync.duration / 1000).toFixed(1) }}s
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.sync-configuration {
  max-width: 800px;
  margin: 0 auto;
}

/* Smooth transitions for interactive elements */
:deep(.animate-spin) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>