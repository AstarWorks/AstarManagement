<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <Skeleton 
      v-for="i in count" 
      :key="i" 
      class="h-48 rounded-lg"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  count?: number
}>(), {
  count: 6
})
</script>