<template>
  <div class="flex items-center gap-2">
    <!-- Selection Clear Button -->
    <Button
      v-if="selectedCount > 0"
      variant="outline"
      size="sm"
      @click="$emit('clear-selection')"
    >
      {{ $t('foundation.actions.basic.clear') }}
      <Badge variant="secondary" class="ml-2">
        {{ selectedCount }}
      </Badge>
    </Button>

    <!-- Batch Operations -->
    <Button
      v-if="selectedCount > 0"
      variant="outline"
      size="sm"
      @click="$emit('duplicate-selected')"
    >
      <Icon name="lucide:copy" class="h-4 w-4" />
      {{ $t('foundation.actions.data.duplicate') }}
    </Button>

    <Button
      v-if="selectedCount > 0"
      variant="outline"
      size="sm"
      class="text-destructive"
      @click="$emit('delete-selected')"
    >
      <Icon name="lucide:trash" class="h-4 w-4" />
      {{ $t('foundation.actions.basic.delete') }}
    </Button>

    <!-- Export Dropdown -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="sm">
          <Icon name="lucide:download" class="h-4 w-4" />
          {{ $t('foundation.actions.data.export') }}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem @click="$emit('export', 'csv')">
          <Icon name="lucide:file-text" class="mr-2 h-4 w-4" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem @click="$emit('export', 'json')">
          <Icon name="lucide:file-json" class="mr-2 h-4 w-4" />
          JSON
        </DropdownMenuItem>
        <DropdownMenuItem @click="$emit('export', 'excel')">
          <Icon name="lucide:file-spreadsheet" class="mr-2 h-4 w-4" />
          Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Create Button -->
    <Button size="sm" @click="$emit('create')">
      <Icon name="lucide:plus" class="h-4 w-4" />
      {{ $t('modules.table.record.actions.create') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
  selectedCount: number
}>()

// Emits
const emit = defineEmits<{
  'clear-selection': []
  'duplicate-selected': []
  'delete-selected': []
  export: [format: 'csv' | 'json' | 'excel']
  create: []
}>()
</script>