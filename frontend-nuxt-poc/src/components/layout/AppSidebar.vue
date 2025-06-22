<template>
  <aside 
    class="app-sidebar"
    :class="{ 'app-sidebar--collapsed': isCollapsed }"
  >
    <!-- Sidebar header -->
    <div class="sidebar-header">
      <Scale class="sidebar-logo" />
      <span v-if="!isCollapsed" class="sidebar-title">Aster</span>
      <button 
        class="collapse-button"
        @click="toggleCollapse"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <ChevronLeft 
          class="size-4 transition-transform"
          :class="{ 'rotate-180': isCollapsed }"
        />
      </button>
    </div>

    <!-- Main navigation -->
    <nav class="sidebar-nav">
      <MainMenu />
    </nav>

    <!-- Bottom section -->
    <div class="sidebar-bottom">
      <button 
        class="nav-item"
        :class="{ 'nav-item--collapsed': isCollapsed }"
        @click="showHelp"
        :title="isCollapsed ? 'Help & Support' : undefined"
      >
        <HelpCircle class="nav-icon" />
        <span v-if="!isCollapsed" class="nav-label">Help & Support</span>
      </button>
      
      <button 
        class="nav-item"
        :class="{ 'nav-item--collapsed': isCollapsed }"
        @click="showSettings"
        :title="isCollapsed ? 'Settings' : undefined"
      >
        <Settings class="nav-icon" />
        <span v-if="!isCollapsed" class="nav-label">Settings</span>
      </button>
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
  @apply flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800;
  @apply transition-all duration-300 ease-in-out;
  width: 240px;
}

.app-sidebar--collapsed {
  width: 80px;
}

.sidebar-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800;
}

.sidebar-logo {
  @apply size-8 text-primary flex-shrink-0;
}

.sidebar-title {
  @apply font-bold text-xl text-gray-900 dark:text-gray-100;
}

.collapse-button {
  @apply p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-primary;
}

.sidebar-nav {
  @apply flex-1 overflow-y-auto py-4;
}

.nav-section {
  @apply mb-6;
}

.section-label {
  @apply px-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}

.nav-item {
  @apply relative flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium;
  @apply text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
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
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300;
}

.nav-badge--primary {
  @apply bg-primary/20 text-primary;
}

.nav-badge--warning {
  @apply bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300;
}

.sidebar-bottom {
  @apply border-t border-gray-200 dark:border-gray-800 p-4;
}

/* Custom scrollbar for navigation */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-700 rounded;
}

/* Tooltip for collapsed state */
.nav-item--collapsed:hover::after {
  content: attr(title);
  @apply absolute left-full ml-2 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-700 text-white rounded;
  @apply whitespace-nowrap z-50;
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