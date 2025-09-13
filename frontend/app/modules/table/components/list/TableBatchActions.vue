<template>
  <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
    <Card class="px-4 py-2 shadow-lg">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium">
          {{ $t('modules.table.selected', { count: selectedCount }) }}
        </span>
        
        <Button 
          variant="ghost" 
          size="sm" 
          @click="$emit('clear')"
        >
          {{ $t('modules.table.actions.clearSelection') }}
        </Button>
        
        <Separator orientation="vertical" class="h-4" />
        
        <Button 
          variant="destructive" 
          size="sm"
          @click="$emit('delete')"
        >
          <Icon name="lucide:trash" class="mr-2 h-4 w-4" />
          {{ $t('modules.table.actions.deleteSelected') }}
        </Button>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  selectedCount: number
}>()

defineEmits<{
  clear: []
  delete: []
}>()
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateX(-50%) translateY(100%);
  opacity: 0;
}
</style>