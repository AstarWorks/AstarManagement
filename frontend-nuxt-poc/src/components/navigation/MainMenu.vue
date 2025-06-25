<template>
  <nav class="main-menu" role="navigation" aria-label="Main navigation">
    <div class="menu-groups">
      <MenuGroup
        v-for="group in visibleGroups"
        :key="group.title"
        :title="group.title"
        :items="group.items"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
/**
 * Main Menu Component
 * 
 * @description Primary navigation menu that renders menu items filtered by
 * user permissions. Supports nested menu structures and active states.
 */

import { navigationGroups } from '~/config/navigation'
import { filterNavigationByPermissions } from '~/utils/navigation'

// Use real auth store for permissions
const authStore = useAuthStore()

const visibleGroups = computed(() => 
  navigationGroups.map(group => ({
    ...group,
    items: filterNavigationByPermissions(group.items, authStore.permissions)
  })).filter(group => group.items.length > 0)
)
</script>

<style scoped>
.main-menu {
  @apply w-full;
}

.menu-groups {
  @apply p-2;
}
</style>