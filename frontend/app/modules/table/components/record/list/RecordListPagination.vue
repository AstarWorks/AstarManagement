<template>
  <div
    v-if="hasMore"
    ref="loadMoreTrigger"
    class="flex items-center justify-center border-t p-4"
  >
    <Button
      variant="ghost"
      size="sm"
      :disabled="loading"
      @click="$emit('load-more')"
    >
      <Icon
        v-if="loading"
        name="lucide:loader-2"
        class="h-4 w-4 animate-spin"
      />
      {{ loading ? $t('foundation.common.labels.loading') : $t('foundation.actions.data.loadMore') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
  hasMore: boolean
  loading: boolean
}>()

// Emits
const emit = defineEmits<{
  'load-more': []
}>()

// Template ref
const loadMoreTrigger = ref<HTMLElement>()

// Expose for infinite scroll
defineExpose({
  loadMoreTrigger
})
</script>