<template>
  <div class="p-8">
    <div class="text-center">
      <Icon name="lucide:database" class="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 class="mt-4 text-lg font-semibold">{{ $t('modules.table.record.empty.title') }}</h3>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ $t('modules.table.record.empty.description') }}
      </p>
      <Button class="mt-4" @click="$emit('create')">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        {{ $t('modules.table.record.actions.createFirst') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Emits
const emit = defineEmits<{
  create: []
}>()
</script>