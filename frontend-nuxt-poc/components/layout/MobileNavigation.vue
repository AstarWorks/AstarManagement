<template>
  <nav class="mobile-navigation">
    <NuxtLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="nav-tab"
      :class="{ 'nav-tab--active': isActive(item.path) }"
    >
      <component :is="item.icon" class="nav-tab-icon" />
      <span class="nav-tab-label">{{ item.label }}</span>
      <span 
        v-if="item.badge" 
        class="nav-tab-badge"
        :class="`nav-tab-badge--${item.badgeType || 'default'}`"
      >
        {{ item.badge }}
      </span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
/**
 * Mobile Navigation Component
 * 
 * @description Bottom navigation bar for mobile devices with iOS-style tab bar.
 * Includes swipe gestures and haptic feedback support.
 */

import { 
  Home,
  Briefcase,
  FileText,
  Users,
  Menu
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

// Navigation items for mobile
const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/matters', label: 'Matters', icon: Briefcase },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/menu', label: 'More', icon: Menu, badge: '3', badgeType: 'primary' }
]

// Check if route is active
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// Add haptic feedback on navigation (if supported)
const handleNavigation = (path: string) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

// Swipe gesture support
onMounted(() => {
  let touchStartX = 0
  let touchEndX = 0
  
  const handleTouchStart = (e: Event) => {
    const touchEvent = e as TouchEvent
    touchStartX = touchEvent.changedTouches[0].screenX
  }
  
  const handleTouchEnd = (e: Event) => {
    const touchEvent = e as TouchEvent
    touchEndX = touchEvent.changedTouches[0].screenX
    handleSwipe()
  }
  
  const handleSwipe = () => {
    const swipeThreshold = 50
    const diff = touchEndX - touchStartX
    
    if (Math.abs(diff) < swipeThreshold) return
    
    const currentIndex = navItems.findIndex(item => isActive(item.path))
    
    if (diff > 0 && currentIndex > 0) {
      // Swipe right - go to previous tab
      router.push(navItems[currentIndex - 1].path)
    } else if (diff < 0 && currentIndex < navItems.length - 1) {
      // Swipe left - go to next tab
      router.push(navItems[currentIndex + 1].path)
    }
  }
  
  // Add listeners to the navigation element
  const nav = document.querySelector('.mobile-navigation')
  if (nav) {
    nav.addEventListener('touchstart', handleTouchStart, { passive: true })
    nav.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    onUnmounted(() => {
      nav.removeEventListener('touchstart', handleTouchStart)
      nav.removeEventListener('touchend', handleTouchEnd)
    })
  }
})
</script>

<style scoped>
.mobile-navigation {
  @apply fixed bottom-0 left-0 right-0 z-40;
  @apply flex items-center justify-around;
  @apply bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800;
  @apply px-2 pb-safe-bottom;
  height: calc(56px + env(safe-area-inset-bottom));
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
  .mobile-navigation {
    height: calc(48px + env(safe-area-inset-bottom));
  }
  
  .nav-tab-icon {
    @apply size-5;
  }
  
  .nav-tab-label {
    @apply text-[10px];
  }
}
</style>