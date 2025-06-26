<script setup lang="ts">
/**
 * Sync Configuration Demo Page
 * 
 * @description Demonstration of the sync configuration component
 * with various states and interactions.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { 
  Code2, 
  Info, 
  Smartphone, 
  Settings, 
  CheckCircle2,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-vue-next'
import SyncConfiguration from '~/components/settings/SyncConfiguration.vue'
import type { SyncMode } from '~/config/background-sync'

// Page metadata
definePageMeta({
  title: 'Sync Configuration Demo',
  layout: 'default'
})

// State
const selectedMode = ref<SyncMode>('balanced')
const showCode = ref(false)
const events = ref<Array<{ time: Date; event: string; details?: string }>>([])
const connectionSimulation = ref<'online' | 'offline'>('online')

// Methods
const addEvent = (event: string, details?: string) => {
  events.value.unshift({
    time: new Date(),
    event,
    details
  })
  
  // Keep only last 10 events
  if (events.value.length > 10) {
    events.value = events.value.slice(0, 10)
  }
}

const handleModeChanged = (mode: SyncMode) => {
  selectedMode.value = mode
  addEvent('Mode Changed', `Switched to ${mode} mode`)
  
  const { $toast } = useNuxtApp()
  $toast.info('Demo Event', `Mode changed to: ${mode}`)
}

const handleManualSync = () => {
  addEvent('Manual Sync', 'User triggered manual sync')
  
  const { $toast } = useNuxtApp()
  $toast.success('Demo Event', 'Manual sync triggered')
}

const toggleConnection = () => {
  connectionSimulation.value = connectionSimulation.value === 'online' ? 'offline' : 'online'
  addEvent('Connection Change', `Simulated ${connectionSimulation.value} state`)
}

const clearEvents = () => {
  events.value = []
  addEvent('Events Cleared', 'Event log reset')
}

// Example code for developers
const exampleCode = `<template>
  <SyncConfiguration 
    :initial-mode="'balanced'"
    @mode-changed="handleModeChanged"
    @manual-sync="handleManualSync"
  />
</template>

<script setup>
import SyncConfiguration from '~/components/settings/SyncConfiguration.vue'

const handleModeChanged = (mode) => {
  console.log('Sync mode changed to:', mode)
  // Update your app's sync behavior
}

const handleManualSync = () => {
  console.log('Manual sync requested')
  // Trigger data refresh
}
</script>`
</script>

<template>
  <div class="sync-configuration-demo">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold flex items-center gap-2">
              <Settings class="h-8 w-8" />
              Sync Configuration Demo
            </h1>
            <p class="text-muted-foreground mt-1">
              Interactive demonstration of the background sync configuration component
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="showCode = !showCode"
            >
              <Code2 class="h-4 w-4 mr-2" />
              {{ showCode ? 'Hide' : 'Show' }} Code
            </Button>
            <Badge variant="secondary">
              <CheckCircle2 class="h-3 w-3 mr-1" />
              Component Ready
            </Badge>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Left Column: Component Demo -->
        <div class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Component</CardTitle>
              <CardDescription>
                Interact with the sync configuration component below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SyncConfiguration 
                :initial-mode="selectedMode"
                @mode-changed="handleModeChanged"
                @manual-sync="handleManualSync"
              />
            </CardContent>
          </Card>

          <!-- Code Example -->
          <Card v-if="showCode">
            <CardHeader>
              <CardTitle>Implementation Example</CardTitle>
              <CardDescription>
                Copy this code to use the component in your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm"><code>{{ exampleCode }}</code></pre>
            </CardContent>
          </Card>
        </div>

        <!-- Right Column: Demo Controls & Info -->
        <div class="space-y-6">
          <!-- Demo Controls -->
          <Card>
            <CardHeader>
              <CardTitle>Demo Controls</CardTitle>
              <CardDescription>
                Simulate different scenarios to test the component
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <component 
                    :is="connectionSimulation === 'online' ? Wifi : WifiOff"
                    class="h-4 w-4"
                  />
                  <span class="text-sm font-medium">
                    Connection: {{ connectionSimulation }}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  @click="toggleConnection"
                >
                  Toggle Connection
                </Button>
              </div>

              <Separator />

              <div class="space-y-2">
                <h4 class="text-sm font-medium">Current State</h4>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div>Mode:</div>
                  <div class="font-mono">{{ selectedMode }}</div>
                  <div>Connection:</div>
                  <div class="font-mono">{{ connectionSimulation }}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Event Log -->
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <CardTitle>Event Log</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="clearEvents"
                >
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div v-if="events.length === 0" class="text-center py-8 text-muted-foreground">
                <Activity class="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No events yet. Interact with the component to see events.</p>
              </div>
              <div v-else class="space-y-2 max-h-64 overflow-y-auto">
                <div 
                  v-for="(event, index) in events" 
                  :key="index"
                  class="flex items-start gap-2 text-sm p-2 rounded-lg hover:bg-muted/50"
                >
                  <span class="text-xs text-muted-foreground whitespace-nowrap">
                    {{ event.time.toLocaleTimeString() }}
                  </span>
                  <div class="flex-1">
                    <span class="font-medium">{{ event.event }}</span>
                    <span v-if="event.details" class="text-muted-foreground ml-1">
                      - {{ event.details }}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Features Info -->
          <Card>
            <CardHeader>
              <CardTitle>Component Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul class="space-y-2 text-sm">
                <li class="flex items-start gap-2">
                  <CheckCircle2 class="h-4 w-4 text-green-500 mt-0.5" />
                  <span>5 sync modes with visual indicators</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle2 class="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Real-time connection status monitoring</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle2 class="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Battery and data usage estimates</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle2 class="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Manual sync with progress indication</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle2 class="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Configurable data type selection</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle2 class="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Sync history tracking</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle2 class="h-4 w-4 text-green-500 mt-0.5" />
                  <span>LocalStorage persistence</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle2 class="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Fully accessible with ARIA labels</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircle2 class="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Responsive mobile design</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <!-- Usage Tips -->
          <Alert>
            <Info class="h-4 w-4" />
            <AlertTitle>Usage Tips</AlertTitle>
            <AlertDescription class="mt-2 space-y-2">
              <p>This component is designed for production use in the Aster Management system.</p>
              <ul class="list-disc list-inside space-y-1 text-sm mt-2">
                <li>Integrates with TanStack Query for cache management</li>
                <li>Works with the real-time WebSocket connection</li>
                <li>Respects user preferences via localStorage</li>
                <li>Mobile-optimized for lawyers on the go</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.sync-configuration-demo {
  min-height: 100vh;
  background-color: hsl(var(--background));
}

pre code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

/* Custom scrollbar for event log */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
</style>