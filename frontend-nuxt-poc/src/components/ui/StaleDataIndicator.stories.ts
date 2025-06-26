/**
 * StaleDataIndicator Storybook Stories
 * 
 * @description Interactive examples of the StaleDataIndicator component
 * @author Claude
 * @created 2025-06-26
 */

import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import StaleDataIndicator from './StaleDataIndicator.vue'
import { Button } from '~/components/ui/button'

const meta: Meta<typeof StaleDataIndicator> = {
  title: 'UI/StaleDataIndicator',
  component: StaleDataIndicator,
  tags: ['autodocs'],
  argTypes: {
    dataType: {
      control: 'select',
      options: ['matters', 'kanban', 'activity', 'static'],
      description: 'Type of data being monitored'
    },
    lastUpdated: {
      control: 'date',
      description: 'Last update timestamp'
    },
    syncMode: {
      control: 'select',
      options: ['aggressive', 'balanced', 'conservative', 'offline', 'manual'],
      description: 'Sync mode override'
    },
    showText: {
      control: 'boolean',
      description: 'Show status text'
    },
    compact: {
      control: 'boolean',
      description: 'Use compact size'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Helper function to create timestamps
const minutesAgo = (minutes: number) => Date.now() - (minutes * 60 * 1000)

/**
 * Default state - Fresh data
 */
export const Fresh: Story = {
  args: {
    dataType: 'matters',
    lastUpdated: minutesAgo(0.5), // 30 seconds ago
    showText: true,
    compact: false
  }
}

/**
 * Stale data state
 */
export const Stale: Story = {
  args: {
    dataType: 'matters',
    lastUpdated: minutesAgo(2), // 2 minutes ago
    showText: true,
    compact: false
  }
}

/**
 * Very stale data state
 */
export const VeryStale: Story = {
  args: {
    dataType: 'matters',
    lastUpdated: minutesAgo(10), // 10 minutes ago
    showText: true,
    compact: false
  }
}

/**
 * Unknown freshness state
 */
export const Unknown: Story = {
  args: {
    dataType: 'matters',
    lastUpdated: null,
    showText: true,
    compact: false
  }
}

/**
 * Compact mode for inline usage
 */
export const Compact: Story = {
  args: {
    dataType: 'kanban',
    lastUpdated: minutesAgo(3),
    showText: false,
    compact: true
  }
}

/**
 * Different data types with varying staleness
 */
export const DataTypes: Story = {
  render: () => ({
    components: { StaleDataIndicator },
    setup() {
      const dataTypes = [
        { type: 'matters', label: 'Legal Matters', lastUpdated: minutesAgo(0.5) },
        { type: 'kanban', label: 'Kanban Board', lastUpdated: minutesAgo(2) },
        { type: 'activity', label: 'Activity Feed', lastUpdated: minutesAgo(5) },
        { type: 'static', label: 'Static Data', lastUpdated: minutesAgo(60) }
      ]
      
      return { dataTypes }
    },
    template: `
      <div class="space-y-4">
        <div v-for="data in dataTypes" :key="data.type" class="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 class="font-medium">{{ data.label }}</h3>
            <p class="text-sm text-muted-foreground">Data type: {{ data.type }}</p>
          </div>
          <StaleDataIndicator
            :data-type="data.type"
            :last-updated="data.lastUpdated"
            show-text
          />
        </div>
      </div>
    `
  })
}

/**
 * Interactive example with refresh capability
 */
export const Interactive: Story = {
  render: () => ({
    components: { StaleDataIndicator, Button },
    setup() {
      const lastUpdated = ref(minutesAgo(3))
      const refreshCount = ref(0)
      
      const handleRefresh = async () => {
        // Simulate async refresh
        await new Promise(resolve => setTimeout(resolve, 1000))
        lastUpdated.value = Date.now()
        refreshCount.value++
      }
      
      const makeStale = () => {
        lastUpdated.value = minutesAgo(5)
      }
      
      return { lastUpdated, refreshCount, handleRefresh, makeStale }
    },
    template: `
      <div class="space-y-4">
        <div class="p-6 border rounded-lg">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium">Interactive Data Freshness</h3>
            <StaleDataIndicator
              data-type="matters"
              :last-updated="lastUpdated"
              show-text
              @refresh="handleRefresh"
            />
          </div>
          
          <div class="space-y-2 text-sm">
            <p>Refresh count: {{ refreshCount }}</p>
            <p>Last updated: {{ new Date(lastUpdated).toLocaleTimeString() }}</p>
          </div>
          
          <div class="mt-4">
            <Button @click="makeStale" variant="outline" size="sm">
              Make Data Stale
            </Button>
          </div>
        </div>
      </div>
    `
  })
}

/**
 * Kanban board integration example
 */
export const KanbanIntegration: Story = {
  render: () => ({
    components: { StaleDataIndicator },
    setup() {
      const columns = [
        { id: '1', title: 'To Do', lastUpdated: minutesAgo(0.5), count: 5 },
        { id: '2', title: 'In Progress', lastUpdated: minutesAgo(3), count: 3 },
        { id: '3', title: 'Review', lastUpdated: minutesAgo(8), count: 2 },
        { id: '4', title: 'Done', lastUpdated: minutesAgo(15), count: 10 }
      ]
      
      return { columns }
    },
    template: `
      <div class="grid grid-cols-4 gap-4">
        <div v-for="column in columns" :key="column.id" class="border rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium">{{ column.title }}</h3>
            <StaleDataIndicator
              data-type="kanban"
              :last-updated="column.lastUpdated"
              compact
              :show-text="false"
            />
          </div>
          <p class="text-sm text-muted-foreground">{{ column.count }} items</p>
        </div>
      </div>
    `
  })
}

/**
 * Different sync modes comparison
 */
export const SyncModes: Story = {
  render: () => ({
    components: { StaleDataIndicator },
    setup() {
      const syncModes = [
        { mode: 'aggressive', label: 'Real-time', description: 'Updates every 5 seconds' },
        { mode: 'balanced', label: 'Balanced', description: 'Updates every 30 seconds' },
        { mode: 'conservative', label: 'Battery Saver', description: 'Updates every minute' },
        { mode: 'manual', label: 'Manual', description: 'Updates on demand only' }
      ]
      
      const lastUpdated = minutesAgo(1.5) // 90 seconds ago
      
      return { syncModes, lastUpdated }
    },
    template: `
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground mb-4">
          Same data (90 seconds old) shown with different sync modes:
        </p>
        <div v-for="sync in syncModes" :key="sync.mode" class="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 class="font-medium">{{ sync.label }}</h3>
            <p class="text-sm text-muted-foreground">{{ sync.description }}</p>
          </div>
          <StaleDataIndicator
            data-type="matters"
            :last-updated="lastUpdated"
            :sync-mode="sync.mode"
            show-text
          />
        </div>
      </div>
    `
  })
}

/**
 * Mobile-optimized view
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  render: () => ({
    components: { StaleDataIndicator },
    template: `
      <div class="p-4 space-y-4">
        <div class="border rounded-lg p-3">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="font-medium truncate">Legal Matter #2024-001</h3>
              <p class="text-sm text-muted-foreground">Contract Review</p>
            </div>
            <StaleDataIndicator
              data-type="matters"
              :last-updated="Date.now() - 180000"
              compact
              show-text
            />
          </div>
        </div>
        
        <div class="border rounded-lg p-3">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="font-medium truncate">Legal Matter #2024-002</h3>
              <p class="text-sm text-muted-foreground">Litigation</p>
            </div>
            <StaleDataIndicator
              data-type="matters"
              :last-updated="Date.now() - 30000"
              compact
              :show-text="false"
            />
          </div>
        </div>
      </div>
    `
  })
}