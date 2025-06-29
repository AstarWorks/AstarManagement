<template>
  <div class="menu-group">
    <h3 v-if="title" class="menu-group-title">
      {{ title }}
    </h3>
    <ul class="menu-group-list">
      <MenuItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        :depth="0"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
/**
 * Menu Group Component
 * 
 * @description Groups related menu items with an optional title.
 * Used for organizing navigation into logical sections.
 */

import type { NavItem } from '~/types/navigation'

interface Props {
  title?: string
  items: NavItem[]
}

defineProps<Props>()
</script>

<style scoped>
.menu-group {
  @apply mb-6;
}

.menu-group-title {
  @apply px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400;
  @apply uppercase tracking-wider;
}

.menu-group-list {
  @apply space-y-1;
}
</style>