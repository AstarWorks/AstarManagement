<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="text-2xl font-bold">{{ $t('modules.table.title') }}</h2>
      <p class="text-muted-foreground">
        {{ $t('modules.table.subtitle', { count: stats.total }) }}
      </p>
    </div>
    
    <div class="flex items-center gap-2">
      <!-- View Mode Toggle -->
      <ToggleGroup 
        :model-value="viewMode" 
        type="single" 
        @update:model-value="(value) => value && $emit('toggle-view', value as ViewMode)"
      >
        <ToggleGroupItem value="card" :aria-label="$t('modules.table.view.card')">
          <Icon name="lucide:layout-grid" class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" :aria-label="$t('modules.table.view.list')">
          <Icon name="lucide:list" class="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      
      <!-- Share Button -->
      <Button variant="outline" size="icon" @click="$emit('share')">
        <Icon name="lucide:user-plus" class="h-4 w-4" />
      </Button>
      
      <!-- Create Button -->
      <Button @click="$emit('create')">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        {{ $t('modules.table.actions.create') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ViewMode } from '../../composables/table/useTableViewMode'

interface Stats {
  total: number
  filtered: number
  hasRecords: number
}

defineProps<{
  stats: Stats
  viewMode: ViewMode
}>()

defineEmits<{
  'toggle-view': [mode: ViewMode]
  create: []
  share: []
}>()
</script>