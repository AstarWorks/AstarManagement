<script setup lang="ts">
import { computed } from 'vue'
import { Kanban, Table2, Grid3x3 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'

export type ViewMode = 'kanban' | 'table' | 'grid'

interface Props {
  modelValue: ViewMode
  showGrid?: boolean
  showLabels?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  showGrid: false,
  showLabels: true,
  variant: 'outline',
  size: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: ViewMode]
}>()

// View configurations
const views = computed(() => {
  const baseViews = [
    {
      id: 'kanban',
      label: 'Kanban',
      icon: Kanban,
      description: 'Visual board with drag-and-drop'
    },
    {
      id: 'table',
      label: 'Table',
      icon: Table2,
      description: 'Data-dense table view'
    }
  ]
  
  if (props.showGrid) {
    baseViews.push({
      id: 'grid',
      label: 'Grid',
      icon: Grid3x3,
      description: 'Card grid layout'
    })
  }
  
  return baseViews
})

// Current view
const currentView = computed(() => 
  views.value.find(v => v.id === props.modelValue) || views.value[0]
)

// Handle view change
const handleViewChange = (viewId: ViewMode) => {
  if (viewId !== props.modelValue) {
    emit('update:modelValue', viewId)
  }
}

// Icon size based on button size
const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'h-3.5 w-3.5'
    case 'lg': return 'h-5 w-5'
    default: return 'h-4 w-4'
  }
})

// Single button mode (when only 2 views)
const isSingleButtonMode = computed(() => views.value.length === 2 && !props.showLabels)
</script>

<template>
  <!-- Single Toggle Button Mode -->
  <Button
    v-if="isSingleButtonMode"
    :variant="variant"
    :size="size"
    :class="cn('view-switcher-toggle', className)"
    @click="handleViewChange(props.modelValue === 'kanban' ? 'table' : 'kanban')"
    :title="`Switch to ${props.modelValue === 'kanban' ? 'Table' : 'Kanban'} view`"
  >
    <component 
      :is="currentView.icon" 
      :class="iconSize"
    />
    <span v-if="showLabels && size !== 'icon'" class="ml-2">
      {{ currentView.label }}
    </span>
  </Button>
  
  <!-- Dropdown Mode -->
  <DropdownMenu v-else>
    <DropdownMenuTrigger asChild>
      <Button
        :variant="variant"
        :size="size"
        :class="cn('view-switcher-dropdown', className)"
      >
        <component 
          :is="currentView.icon" 
          :class="iconSize"
        />
        <span v-if="showLabels && size !== 'icon'" class="ml-2">
          {{ currentView.label }}
        </span>
      </Button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel>View Mode</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <DropdownMenuItem
        v-for="view in views"
        :key="view.id"
        :class="[
          'cursor-pointer',
          view.id === modelValue && 'bg-accent'
        ]"
        @click="handleViewChange(view.id as ViewMode)"
      >
        <component 
          :is="view.icon" 
          class="mr-2 h-4 w-4"
        />
        <div class="flex-1">
          <div class="font-medium">{{ view.label }}</div>
          <div class="text-xs text-muted-foreground">
            {{ view.description }}
          </div>
        </div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped>
.view-switcher-toggle,
.view-switcher-dropdown {
  transition: all 0.2s ease;
}
</style>