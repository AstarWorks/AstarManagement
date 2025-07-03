<template>
  <li class="menu-item" :style="{ '--depth': depth }">
    <!-- Single item with link -->
    <NuxtLink
      v-if="item.path && !hasVisibleChildren"
      :to="item.path"
      :class="[
        'menu-link',
        { 'menu-link--active': isActive }
      ]"
      :exact="item.exact"
      @click="handleClick"
    >
      <component 
        :is="item.icon" 
        v-if="item.icon"
        class="menu-icon" 
      />
      <span class="menu-label">{{ item.label }}</span>
      <span 
        v-if="item.badge"
        class="menu-badge"
        :class="`menu-badge--${item.badge.variant || 'default'}`"
      >
        {{ item.badge.value }}
      </span>
    </NuxtLink>

    <!-- Expandable item with children -->
    <div v-else-if="hasVisibleChildren">
      <button
        class="menu-button"
        :class="{ 'menu-button--expanded': isExpanded }"
        @click="toggleExpanded"
        :aria-expanded="isExpanded"
        :aria-controls="`menu-${item.id}-children`"
      >
        <component 
          :is="item.icon" 
          v-if="item.icon"
          class="menu-icon" 
        />
        <span class="menu-label">{{ item.label }}</span>
        <ChevronDown class="menu-chevron" />
      </button>
      
      <Transition name="expand">
        <ul
          v-show="isExpanded"
          :id="`menu-${item.id}-children`"
          class="menu-children"
        >
          <MenuItem
            v-for="child in item.children"
            :key="child.id"
            :item="child"
            :depth="depth + 1"
          />
        </ul>
      </Transition>
    </div>

    <!-- Item without link (label only) -->
    <div v-else class="menu-text">
      <component 
        :is="item.icon" 
        v-if="item.icon"
        class="menu-icon" 
      />
      <span class="menu-label">{{ item.label }}</span>
    </div>
  </li>
</template>

<script setup lang="ts">
/**
 * Menu Item Component
 * 
 * @description Renders individual menu items with support for nesting,
 * active states, badges, and icons. Handles expansion of sub-menus.
 */

import { ChevronDown } from 'lucide-vue-next'
import * as Icons from 'lucide-vue-next'
import type { NavItem } from '~/types/navigation'
import { isPathActive } from '~/utils/navigation'

interface Props {
  item: NavItem
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0
})

const route = useRoute()
const navigationStore = useNavigationStore()

// Dynamic icon component resolution
const item = computed(() => {
  if (props.item.icon && typeof props.item.icon === 'string') {
    return {
      ...props.item,
      icon: (Icons as any)[props.item.icon] || Icons.FileText
    }
  }
  return props.item
})

const hasVisibleChildren = computed(() => 
  item.value.children && item.value.children.length > 0
)

const isActive = computed(() => 
  item.value.path ? isPathActive(item.value.path, route.path, item.value.exact) : false
)

const isExpanded = computed(() => 
  navigationStore.isMenuExpanded(item.value.id)
)

const toggleExpanded = () => {
  navigationStore.toggleMenu(item.value.id)
}

const handleClick = () => {
  // Close mobile menu on navigation
  if (window.innerWidth < 768) {
    navigationStore.closeMobileMenu()
  }
}

// Auto-expand if child is active
onMounted(() => {
  if (hasVisibleChildren.value && item.value.children) {
    const hasActiveChild = item.value.children.some(child => 
      child.path && isPathActive(child.path, route.path, child.exact)
    )
    
    if (hasActiveChild) {
      navigationStore.expandMenu(item.value.id)
    }
  }
})
</script>

<style scoped>
.menu-item {
  @apply relative;
}

.menu-link,
.menu-button,
.menu-text {
  @apply flex items-center gap-3 w-full px-3 py-2 rounded-md;
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
  @apply transition-colors duration-200;
  padding-left: calc(0.75rem + var(--depth) * 1.5rem);
}

.menu-link:hover,
.menu-button:hover {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100;
}

.menu-link--active {
  @apply bg-primary/10 text-primary;
}

.menu-button {
  @apply cursor-pointer;
}

.menu-icon {
  @apply size-5 flex-shrink-0;
}

.menu-label {
  @apply flex-1 text-left;
}

.menu-chevron {
  @apply size-4 text-gray-400 transition-transform duration-200;
}

.menu-button--expanded .menu-chevron {
  transform: rotate(180deg);
}

.menu-badge {
  @apply px-2 py-0.5 text-xs font-semibold rounded-full;
}

.menu-badge--default {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300;
}

.menu-badge--danger {
  @apply bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300;
}

.menu-badge--warning {
  @apply bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300;
}

.menu-children {
  @apply mt-1 space-y-1;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  @apply transition-all duration-200 origin-top;
}

.expand-enter-from,
.expand-leave-to {
  @apply opacity-0 scale-y-95;
}
</style>