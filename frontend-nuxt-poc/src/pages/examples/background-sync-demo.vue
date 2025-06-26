<template>
  <div class="background-sync-demo">
    <div class="container mx-auto p-6 max-w-4xl">
      <h1 class="text-3xl font-bold mb-6">Background Sync Demo</h1>
      
      <!-- Sync Status Overview -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Mode</p>
              <p class="text-lg font-semibold">{{ syncMode }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Status</p>
              <p class="text-lg font-semibold">{{ syncStatus }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Network</p>
              <p class="text-lg font-semibold">{{ networkQuality }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Last Sync</p>
              <p class="text-lg font-semibold">{{ formatLastSync(lastSyncTime) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <!-- Sync Mode Selection -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>Sync Mode Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            :model-value="syncMode" 
            @update:model-value="setSyncMode"
            class="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div 
              v-for="(config, mode) in SYNC_MODE_DESCRIPTIONS" 
              :key="mode"
              class="flex items-start space-x-2"
            >
              <RadioGroupItem :value="mode" :id="`demo-mode-${mode}`" />
              <Label 
                :for="`demo-mode-${mode}`" 
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
                <p class="text-sm text-muted-foreground">
                  {{ config.description }}
                </p>
              </Label>
            </div>
          </RadioGroup>
          
          <div class="mt-4 flex gap-2">
            <Button @click="syncAllData" :disabled="!isOnline">
              <RefreshCw class="h-4 w-4 mr-2" />
              Sync Now
            </Button>
            <Button variant="outline" @click="clearCache">
              <Trash2 class="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <!-- Real-time WebSocket Status -->
      <Card class="mb-6" v-if="syncMode === 'aggressive' || syncMode === 'balanced'">
        <CardHeader>
          <CardTitle>WebSocket Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span>Connection Status</span>
              <Badge :variant="wsConnected ? 'success' : 'secondary'">
                {{ wsConnected ? 'Connected' : 'Disconnected' }}
              </Badge>
            </div>
            <div class="flex items-center justify-between">
              <span>Latency</span>
              <span>{{ latency ? `${latency}ms` : 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Messages/min</span>
              <span>{{ messagesPerMinute }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Queued Messages</span>
              <span>{{ queuedMessages }}</span>
            </div>
            
            <div class="pt-2">
              <Button 
                @click="wsConnected ? wsDisconnect() : wsConnect()"
                variant="outline"
                size="sm"
              >
                {{ wsConnected ? 'Disconnect' : 'Connect' }} WebSocket
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <!-- Performance Metrics -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-if="batteryLevel !== null" class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <Battery class="h-4 w-4" />
                  Battery Level
                </span>
                <span>{{ Math.round(batteryLevel) }}%</span>
              </div>
              <Progress :value="batteryLevel" />
            </div>
            
            <div v-if="memoryUsage !== null" class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <Cpu class="h-4 w-4" />
                  Memory Usage
                </span>
                <span>{{ Math.round(memoryUsage) }}%</span>
              </div>
              <Progress :value="memoryUsage" />
            </div>
            
            <Alert v-if="batteryLevel !== null && batteryLevel < 20" variant="warning">
              <AlertCircle class="h-4 w-4" />
              <AlertTitle>Low Battery</AlertTitle>
              <AlertDescription>
                Sync may be reduced to preserve battery life.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
      
      <!-- Demo Data -->
      <Card>
        <CardHeader>
          <CardTitle>Sample Data (Auto-synced)</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="isLoadingMatters" class="text-center py-8">
            <RefreshCw class="h-8 w-8 animate-spin mx-auto mb-2" />
            <p class="text-muted-foreground">Loading matters...</p>
          </div>
          
          <div v-else-if="mattersError" class="text-center py-8">
            <AlertCircle class="h-8 w-8 text-destructive mx-auto mb-2" />
            <p class="text-destructive">{{ mattersError.message }}</p>
          </div>
          
          <div v-else class="space-y-2">
            <div 
              v-for="matter in matters?.slice(0, 5)" 
              :key="matter.id"
              class="p-3 border rounded-lg"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ matter.title }}</span>
                <Badge variant="outline">{{ matter.status }}</Badge>
              </div>
              <p class="text-sm text-muted-foreground">
                Updated: {{ formatDistanceToNow(new Date(matter.updatedAt)) }} ago
              </p>
            </div>
            
            <p v-if="matters?.length === 0" class="text-center py-4 text-muted-foreground">
              No matters found. Data will appear when synced.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  Activity,
  AlertCircle,
  Battery,
  Cpu,
  Hand,
  RefreshCw,
  Trash2,
  WifiOff,
  Zap
} from 'lucide-vue-next'
import { useBackgroundSync } from '~/composables/useBackgroundSync'
import { useRealtimeSync } from '~/composables/useRealtimeSync'
import { 
  SYNC_MODE_DESCRIPTIONS, 
  createSyncQueryOptions 
} from '~/config/background-sync'
import { queryKeys } from '~/types/query'
import type { Matter } from '~/types/matter'
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Progress } from '~/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'

// Use background sync
const {
  syncMode,
  syncStatus,
  isOnline,
  networkQuality,
  lastSyncTime,
  batteryLevel,
  memoryUsage,
  setSyncMode,
  syncAllData
} = useBackgroundSync()

// Use realtime sync
const {
  isConnected: wsConnected,
  latency,
  messagesPerMinute,
  queuedMessages,
  connect: wsConnect,
  disconnect: wsDisconnect
} = useRealtimeSync()

// Query client
const queryClient = useQueryClient()

// Demo query with sync options
const {
  data: matters,
  isLoading: isLoadingMatters,
  error: mattersError
} = useQuery({
  queryKey: queryKeys.matters.all,
  queryFn: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    return [
      {
        id: '1',
        title: 'Contract Review - ABC Corp',
        status: 'in_progress',
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Patent Filing - XYZ Innovation',
        status: 'new',
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ] as Matter[]
  },
  ...createSyncQueryOptions('matters', syncMode.value)
})

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

// Format last sync time
const formatLastSync = (timestamp: number) => {
  if (!timestamp) return 'Never'
  try {
    return formatDistanceToNow(timestamp, { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

// Clear cache
const clearCache = () => {
  queryClient.clear()
  console.log('Cache cleared')
}
</script>

<style scoped>
.background-sync-demo {
  min-height: 100vh;
  background: hsl(var(--background));
}
</style>