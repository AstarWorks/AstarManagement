<template>
  <nav class="bottom-nav" role="navigation" aria-label="Mobile navigation">
    <NuxtLink
      v-for="item in mobileNavigation"
      :key="item.id"
      :to="item.path"
      class="nav-tab"
      :class="{ 'nav-tab--active': isActive(item) }"
      @click="handleNavigation"
    >
      <component 
        :is="getIcon(item.icon)" 
        class="nav-tab-icon"
      />
      <span class="nav-tab-label">{{ item.label }}</span>
      <span 
        v-if="item.badge" 
        class="nav-tab-badge"
        :class="`nav-tab-badge--${item.badge.variant || 'default'}`"
      >
        {{ item.badge.value }}
      </span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
/**
 * Bottom Navigation Component
 * 
 * @description Mobile bottom navigation bar with tab-style navigation.
 * Provides quick access to primary app sections on mobile devices.
 */

import * as Icons from 'lucide-vue-next'
import { mobileNavigation } from '~/config/navigation'
import { isPathActive } from '~/utils/navigation'
import type { NavItem } from '~/types/navigation'

const route = useRoute()

// Get icon component
const getIcon = (iconName?: string) => {
  if (!iconName) return Icons.Circle
  return (Icons as any)[iconName] || Icons.Circle
}

// Check if nav item is active
const isActive = (item: NavItem) => {
  if (!item.path) return false
  return isPathActive(item.path, route.path, item.exact)
}

// Handle navigation with haptic feedback
const handleNavigation = () => {
  // Add haptic feedback if supported
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}
</script>

<style scoped>
.bottom-nav {
  @apply fixed bottom-0 left-0 right-0 z-40;
  @apply flex items-center justify-around;
  @apply bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800;
  @apply px-2 pb-safe-bottom;
  height: calc(64px + env(safe-area-inset-bottom));
}

.nav-tab {
  @apply relative flex flex-col items-center justify-center flex-1;
  @apply h-full py-2 px-1 min-w-0;
  @apply text-gray-600 dark:text-gray-400;
  @apply transition-colors duration-200;
  -webkit-tap-highlight-color: transparent;
}

.nav-tab--active {
  @apply text-primary;
}

.nav-tab-icon {
  @apply size-6 mb-1;
  @apply transition-transform duration-200;
}

.nav-tab--active .nav-tab-icon {
  @apply scale-110;
}

.nav-tab-label {
  @apply text-xs font-medium;
  @apply truncate max-w-full;
}

.nav-tab-badge {
  @apply absolute top-1 right-1/4 transform translate-x-1/2;
  @apply min-w-[18px] h-[18px] px-1 flex items-center justify-center;
  @apply text-[10px] font-bold rounded-full;
}

.nav-tab-badge--default {
  @apply bg-gray-500 text-white;
}

.nav-tab-badge--primary {
  @apply bg-primary text-white;
}

.nav-tab-badge--danger {
  @apply bg-red-500 text-white;
}

.nav-tab-badge--warning {
  @apply bg-yellow-500 text-white;
}

.nav-tab-badge--success {
  @apply bg-green-500 text-white;
}

/* Active indicator */
.nav-tab--active::before {
  content: '';
  @apply absolute top-0 left-1/4 right-1/4;
  @apply h-0.5 bg-primary rounded-b-full;
  @apply animate-in slide-in-from-top duration-300;
}

/* Press effect */
.nav-tab:active {
  @apply scale-95;
}

/* Safe area padding for devices with home indicator */
.pb-safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .nav-tab,
  .nav-tab-icon,
  .nav-tab--active::before {
    @apply transition-none;
  }
}

/* Landscape orientation adjustments */
@media (orientation: landscape) and (max-height: 500px) {
  .bottom-nav {
    height: calc(56px + env(safe-area-inset-bottom));
  }
  
  .nav-tab-icon {
    @apply size-5;
  }
  
  .nav-tab-label {
    @apply text-[10px];
  }
}
</style>