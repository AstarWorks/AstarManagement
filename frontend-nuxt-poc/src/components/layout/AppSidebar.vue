<template>
  <aside 
    class="app-sidebar"
    :class="{ 'app-sidebar--collapsed': isCollapsed }"
  >
    <!-- Sidebar header -->
    <div class="sidebar-header">
      <Scale class="sidebar-logo" />
      <span v-if="!isCollapsed" class="sidebar-title">Aster</span>
      <Button 
        variant="ghost"
        size="sm"
        @click="toggleCollapse"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <ChevronLeft 
          class="size-4 transition-transform"
          :class="{ 'rotate-180': isCollapsed }"
        />
      </Button>
    </div>

    <!-- Main navigation -->
    <nav class="sidebar-nav">
      <MainMenu />
    </nav>

    <!-- Bottom section -->
    <div class="sidebar-bottom">
      <Button 
        variant="ghost"
        size="sm"
        :class="cn('nav-item', { 'nav-item--collapsed': isCollapsed })"
        @click="showHelp"
        :title="isCollapsed ? 'Help & Support' : undefined"
      >
        <HelpCircle class="nav-icon" />
        <span v-if="!isCollapsed" class="nav-label">Help & Support</span>
      </Button>
      
      <Button 
        variant="ghost"
        size="sm"
        :class="cn('nav-item', { 'nav-item--collapsed': isCollapsed })"
        @click="showSettings"
        :title="isCollapsed ? 'Settings' : undefined"
      >
        <Settings class="nav-icon" />
        <span v-if="!isCollapsed" class="nav-label">Settings</span>
      </Button>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * App Sidebar Component
 * 
 * @description Collapsible sidebar navigation with sections, badges, and keyboard support.
 * State is persisted in Pinia store.
 */

import { 
  Scale,
  ChevronLeft,
  Home,
  Briefcase,
  FileText,
  Users,
  Calendar,
  DollarSign,
  BarChart,
  Settings,
  HelpCircle,
  Inbox,
  Clock
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const route = useRoute()
const router = useRouter()

// Use UI store for sidebar state - create a simple reactive state for now
const isCollapsed = ref(false)

// Use navigation store to manage sidebar state
const navigationStore = useNavigationStore()

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  // TODO: Save to Pinia store
  localStorage.setItem('sidebarCollapsed', String(isCollapsed.value))
}

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const showHelp = () => {
  // TODO: Implement help modal
  console.log('Show help')
}

const showSettings = () => {
  router.push('/settings')
}

// Load saved state
onMounted(() => {
  const saved = localStorage.getItem('sidebarCollapsed')
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }
  
  // Keyboard navigation
  const handleKeyboard = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault()
      toggleCollapse()
    }
  }
  
  document.addEventListener('keydown', handleKeyboard)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyboard)
  })
})
</script>

<style scoped>
.app-sidebar {
  @apply flex flex-col h-full bg-background border-r border-border;
  @apply transition-all duration-300 ease-in-out;
  width: 240px;
}

.app-sidebar--collapsed {
  width: 80px;
}

.sidebar-header {
  @apply flex items-center justify-between p-4 border-b border-border;
}

.sidebar-logo {
  @apply size-8 text-primary flex-shrink-0;
}

.sidebar-title {
  @apply font-bold text-xl text-foreground;
}

.sidebar-nav {
  @apply flex-1 overflow-y-auto py-4;
}

.nav-section {
  @apply mb-6;
}

.section-label {
  @apply px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider;
}

.nav-item {
  @apply relative flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium;
  @apply text-muted-foreground hover:text-foreground;
  @apply hover:bg-accent transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary;
}

.nav-item--active {
  @apply text-primary bg-primary/10;
  @apply before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary;
}

.nav-item--collapsed {
  @apply justify-center px-0;
}

.nav-icon {
  @apply size-5 flex-shrink-0;
}

.nav-label {
  @apply flex-1 text-left;
}

.nav-badge {
  @apply px-2 py-0.5 text-xs font-semibold rounded-full;
}

.nav-badge--default {
  @apply bg-muted text-muted-foreground;
}

.nav-badge--primary {
  @apply bg-primary/20 text-primary;
}

.nav-badge--warning {
  @apply bg-warning/20 text-warning-foreground;
}

.sidebar-bottom {
  @apply border-t border-border p-4;
}

/* Custom scrollbar for navigation */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  @apply bg-border rounded;
}

/* Tooltip for collapsed state */
.nav-item--collapsed:hover::after {
  content: attr(title);
  @apply absolute left-full ml-2 px-2 py-1 text-xs bg-popover text-popover-foreground border border-border rounded;
  @apply whitespace-nowrap z-50 shadow-md;
  pointer-events: none;
}

/* Animation for collapse/expand */
.nav-label,
.section-label,
.nav-badge {
  @apply transition-opacity duration-200;
}

.app-sidebar--collapsed .nav-label,
.app-sidebar--collapsed .section-label,
.app-sidebar--collapsed .nav-badge,
.app-sidebar--collapsed .sidebar-title {
  @apply opacity-0 pointer-events-none;
}
</style>