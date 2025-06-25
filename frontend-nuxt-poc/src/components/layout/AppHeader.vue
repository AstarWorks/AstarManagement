<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo and brand -->
      <div class="header-brand">
        <Button 
          v-if="showMenuToggle"
          variant="ghost"
          size="sm"
          @click="toggleSidebar"
          aria-label="Toggle sidebar"
        >
          <Menu class="size-4" />
        </Button>
        
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
        <Button 
          variant="ghost"
          size="sm"
          @click="showNotifications = !showNotifications"
          aria-label="Notifications"
          class="relative"
        >
          <Bell class="size-4" />
          <Badge v-if="unreadCount > 0" class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-xs">
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </Badge>
        </Button>

        <!-- Theme toggle -->
        <Button 
          variant="ghost"
          size="sm"
          @click="toggleTheme"
          :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
        >
          <Sun v-if="isDark" class="size-4" />
          <Moon v-else class="size-4" />
        </Button>

        <!-- User menu -->
        <div class="user-menu-container">
          <Button 
            variant="ghost"
            size="sm"
            @click="showUserMenu = !showUserMenu"
            aria-label="User menu"
            class="gap-2"
          >
            <AvatarRoot class="h-6 w-6">
              <AvatarFallback>
                <User class="size-4" />
              </AvatarFallback>
            </AvatarRoot>
            <ChevronDown class="size-4 hidden sm:block" />
          </Button>

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
              
              <Button variant="ghost" size="sm" class="w-full justify-start text-destructive hover:text-destructive" @click="handleLogout">
                <LogOut class="size-4 mr-2" />
                Logout
              </Button>
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
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { AvatarRoot, AvatarFallback } from '~/components/ui/avatar'

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
  @apply sticky top-0 z-40 w-full bg-background border-b border-border;
}

.header-container {
  @apply flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8;
}

.header-brand {
  @apply flex items-center gap-3;
}

.brand-link {
  @apply flex items-center gap-2 font-semibold text-lg;
  @apply text-foreground hover:text-primary transition-colors;
}

.brand-text {
  @apply hidden sm:block;
}

.header-nav {
  @apply flex items-center gap-1;
}

.nav-link {
  @apply flex items-center px-3 py-2 rounded-md text-sm font-medium;
  @apply text-muted-foreground hover:text-foreground;
  @apply hover:bg-accent transition-colors;
}

.nav-link--active {
  @apply text-primary bg-primary/10;
}

.header-actions {
  @apply flex items-center gap-2;
}


.user-menu-container {
  @apply relative ml-2;
}

.user-dropdown {
  @apply absolute right-0 mt-2 w-56 rounded-md shadow-lg;
  @apply bg-popover border border-border;
  @apply overflow-hidden;
}

.dropdown-header {
  @apply px-4 py-3 bg-muted;
}

.user-name {
  @apply font-medium text-foreground;
}

.user-email {
  @apply text-sm text-muted-foreground;
}

.dropdown-divider {
  @apply border-t border-border;
}

.dropdown-item {
  @apply flex items-center w-full px-4 py-2 text-sm text-foreground;
  @apply hover:bg-accent transition-colors;
}

.mobile-nav {
  @apply md:hidden border-t border-border bg-background;
}

.mobile-nav-link {
  @apply flex items-center px-4 py-3 text-sm font-medium;
  @apply text-muted-foreground hover:text-foreground;
  @apply hover:bg-accent transition-colors;
  @apply border-b border-border;
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