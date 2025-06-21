<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo and brand -->
      <div class="header-brand">
        <button 
          v-if="showMenuToggle"
          class="menu-toggle"
          @click="toggleSidebar"
          aria-label="Toggle sidebar"
        >
          <Menu class="size-6" />
        </button>
        
        <NuxtLink to="/" class="brand-link">
          <Scale class="size-6 text-primary" />
          <span class="brand-text">Aster Management</span>
        </NuxtLink>
      </div>

      <!-- Center navigation (desktop) -->
      <nav class="header-nav hidden md:flex">
        <NuxtLink 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ 'nav-link--active': isActive(item.path) }"
        >
          <component :is="item.icon" class="size-4 mr-2" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Right section -->
      <div class="header-actions">
        <!-- Notifications -->
        <button 
          class="action-button"
          @click="showNotifications = !showNotifications"
          aria-label="Notifications"
        >
          <Bell class="size-5" />
          <span v-if="unreadCount > 0" class="notification-badge">
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </button>

        <!-- Theme toggle -->
        <button 
          class="action-button"
          @click="toggleTheme"
          :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
        >
          <Sun v-if="isDark" class="size-5" />
          <Moon v-else class="size-5" />
        </button>

        <!-- User menu -->
        <div class="user-menu-container">
          <button 
            class="user-menu-trigger"
            @click="showUserMenu = !showUserMenu"
            aria-label="User menu"
          >
            <div class="user-avatar">
              <User class="size-5" />
            </div>
            <ChevronDown class="size-4 ml-1 hidden sm:block" />
          </button>

          <!-- User dropdown menu -->
          <Transition name="dropdown">
            <div v-if="showUserMenu" class="user-dropdown">
              <div class="dropdown-header">
                <p class="user-name">{{ currentUser?.name || 'Guest' }}</p>
                <p class="user-email">{{ currentUser?.email || 'Not logged in' }}</p>
              </div>
              
              <div class="dropdown-divider" />
              
              <NuxtLink to="/profile" class="dropdown-item" @click="showUserMenu = false">
                <User class="size-4 mr-2" />
                Profile
              </NuxtLink>
              
              <NuxtLink to="/settings" class="dropdown-item" @click="showUserMenu = false">
                <Settings class="size-4 mr-2" />
                Settings
              </NuxtLink>
              
              <div class="dropdown-divider" />
              
              <button class="dropdown-item text-red-600" @click="handleLogout">
                <LogOut class="size-4 mr-2" />
                Logout
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Mobile navigation menu -->
    <Transition name="slide-down">
      <nav v-if="showMobileMenu" class="mobile-nav">
        <NuxtLink 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link--active': isActive(item.path) }"
          @click="showMobileMenu = false"
        >
          <component :is="item.icon" class="size-5 mr-3" />
          {{ item.label }}
        </NuxtLink>
      </nav>
    </Transition>
  </header>
</template>

<script setup lang="ts">
/**
 * App Header Component
 * 
 * @description Main application header with navigation, user menu, and notifications.
 * Responsive design with mobile menu support.
 */

import { 
  Menu, 
  Scale, 
  Bell, 
  Sun, 
  Moon, 
  User, 
  ChevronDown,
  LogOut,
  Settings,
  Home,
  Briefcase,
  FileText,
  Users
} from 'lucide-vue-next'

interface Props {
  showMenuToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showMenuToggle: true
})

const emit = defineEmits<{
  toggleSidebar: []
}>()

const router = useRouter()
const route = useRoute()

// Theme composable
const { isDark, toggleTheme: toggleThemeMode } = useTheme()

// State
const showUserMenu = ref(false)
const showNotifications = ref(false)
const showMobileMenu = ref(false)
const unreadCount = ref(3) // TODO: Get from store

// Mock user data - replace with actual auth store
const currentUser = ref({
  name: 'John Doe',
  email: 'john.doe@example.com'
})

// Navigation items
const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/matters', label: 'Matters', icon: Briefcase },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/clients', label: 'Clients', icon: Users }
]

// Methods
const toggleSidebar = () => {
  emit('toggleSidebar')
}

const toggleTheme = () => {
  toggleThemeMode()
}

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const handleLogout = async () => {
  showUserMenu.value = false
  // TODO: Implement actual logout
  await router.push('/login')
}

// Close dropdowns when clicking outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.user-menu-container')) {
      showUserMenu.value = false
    }
    if (!target.closest('.action-button')) {
      showNotifications.value = false
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style scoped>
.app-header {
  @apply sticky top-0 z-40 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800;
}

.header-container {
  @apply flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8;
}

.header-brand {
  @apply flex items-center gap-3;
}

.menu-toggle {
  @apply p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-primary;
}

.brand-link {
  @apply flex items-center gap-2 font-semibold text-lg;
  @apply text-gray-900 dark:text-gray-100 hover:text-primary transition-colors;
}

.brand-text {
  @apply hidden sm:block;
}

.header-nav {
  @apply flex items-center gap-1;
}

.nav-link {
  @apply flex items-center px-3 py-2 rounded-md text-sm font-medium;
  @apply text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
}

.nav-link--active {
  @apply text-primary bg-primary/10;
}

.header-actions {
  @apply flex items-center gap-2;
}

.action-button {
  @apply relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-primary;
}

.notification-badge {
  @apply absolute -top-1 -right-1 min-w-[20px] h-5 px-1 flex items-center justify-center;
  @apply bg-red-500 text-white text-xs font-bold rounded-full;
}

.user-menu-container {
  @apply relative ml-2;
}

.user-menu-trigger {
  @apply flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply focus:outline-none focus:ring-2 focus:ring-primary transition-colors;
}

.user-avatar {
  @apply w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center;
}

.user-dropdown {
  @apply absolute right-0 mt-2 w-56 rounded-md shadow-lg;
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
  @apply overflow-hidden;
}

.dropdown-header {
  @apply px-4 py-3 bg-gray-50 dark:bg-gray-900;
}

.user-name {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.user-email {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.dropdown-divider {
  @apply border-t border-gray-200 dark:border-gray-700;
}

.dropdown-item {
  @apply flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.mobile-nav {
  @apply md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900;
}

.mobile-nav-link {
  @apply flex items-center px-4 py-3 text-sm font-medium;
  @apply text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
  @apply border-b border-gray-100 dark:border-gray-800;
}

.mobile-nav-link--active {
  @apply text-primary bg-primary/10;
}

/* Animations */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>