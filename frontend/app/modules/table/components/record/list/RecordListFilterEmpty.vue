<template>
  <div class="p-8">
    <div class="text-center">
      <Icon name="lucide:filter-x" class="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 class="mt-4 text-lg font-semibold">{{ $t('modules.table.record.filterEmpty.title') }}</h3>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ $t('modules.table.record.filterEmpty.description') }}
      </p>
      <Button variant="outline" class="mt-4" @click="$emit('clear-filters')">
        <Icon name="lucide:filter-x" class="mr-2 h-4 w-4" />
        {{ $t('foundation.actions.system.clearFilters') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Emits
const emit = defineEmits<{
  'clear-filters': []
}>()
</script>