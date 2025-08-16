<template>
  <div class="pagination-root">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  class?: unknown
}

defineProps<Props>()
</script>

<style scoped>
.pagination-root {
  @apply bg-background;
}
</style>