<template>
  <!-- Backdrop -->
  <Transition name="backdrop">
    <div
      v-if="isOpen"
      class="menu-backdrop"
      @click="close"
    />
  </Transition>

  <!-- Slide-out menu -->
  <Transition name="slide">
    <div
      v-if="isOpen"
      class="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
    >
      <!-- Menu header -->
      <div class="menu-header">
        <h2 id="mobile-menu-title" class="menu-title">
          Menu
        </h2>
        <button
          class="close-button"
          @click="close"
          aria-label="Close menu"
        >
          <X class="size-6" />
        </button>
      </div>

      <!-- Menu content -->
      <div class="menu-content">
        <!-- User info section -->
        <div v-if="user" class="user-section">
          <div class="user-avatar">
            <img
              v-if="user.avatar"
              :src="user.avatar"
              :alt="user.name"
              class="avatar-image"
            />
            <User v-else class="size-6 text-gray-400" />
          </div>
          <div class="user-info">
            <p class="user-name">{{ user.name }}</p>
            <p class="user-email">{{ user.email }}</p>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="menu-nav">
          <MainMenu />
        </nav>

        <!-- Additional actions -->
        <div class="menu-actions">
          <button
            class="action-button"
            @click="toggleTheme"
          >
            <Sun v-if="isDark" class="size-5" />
            <Moon v-else class="size-5" />
            <span>{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
          </button>
          
          <NuxtLink
            to="/settings"
            class="action-button"
            @click="close"
          >
            <Settings class="size-5" />
            <span>Settings</span>
          </NuxtLink>
          
          <button
            class="action-button text-red-600"
            @click="handleLogout"
          >
            <LogOut class="size-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Mobile Menu Component
 * 
 * @description Slide-out navigation menu for mobile devices with user info,
 * navigation items, theme toggle, and additional actions.
 */

import { X, User, Sun, Moon, Settings, LogOut } from 'lucide-vue-next'

interface Props {
  isOpen?: boolean
}


const props = withDefaults(defineProps<Props>(), {
  isOpen: false
})

const emit = defineEmits<{
  close: []
  logout: []
}>()

const { isDark, toggleTheme: toggleThemeMode } = useTheme()

// Get user data from auth store
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const close = () => {
  emit('close')
}

const toggleTheme = () => {
  toggleThemeMode()
}

const handleLogout = async () => {
  await authStore.logout()
  emit('logout')
  close()
  await navigateTo('/login')
}

// Close menu on escape key
onMounted(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.isOpen) {
      close()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})

// Prevent body scroll when menu is open
watch(() => props.isOpen, (isOpen) => {
  if (process.client) {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})
</script>

<style scoped>
.menu-backdrop {
  @apply fixed inset-0 z-40 bg-black/50;
}

.mobile-menu {
  @apply fixed top-0 left-0 z-50 h-full w-80 max-w-[85vw];
  @apply bg-white dark:bg-gray-900 shadow-xl;
  @apply flex flex-col;
}

.menu-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800;
}

.menu-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.close-button {
  @apply p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300;
  @apply transition-colors;
}

.menu-content {
  @apply flex-1 flex flex-col overflow-hidden;
}

.user-section {
  @apply flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800;
}

.user-avatar {
  @apply size-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden;
}

.avatar-image {
  @apply size-full object-cover;
}

.user-info {
  @apply flex-1 min-w-0;
}

.user-name {
  @apply font-medium text-gray-900 dark:text-gray-100 truncate;
}

.user-email {
  @apply text-sm text-gray-500 dark:text-gray-400 truncate;
}

.menu-nav {
  @apply flex-1 overflow-y-auto py-2;
}

.menu-actions {
  @apply border-t border-gray-200 dark:border-gray-800 p-4 space-y-2;
}

.action-button {
  @apply flex items-center gap-3 w-full p-3 rounded-md;
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply transition-colors;
}

/* Transitions */
.backdrop-enter-active,
.backdrop-leave-active {
  @apply transition-opacity duration-300;
}

.backdrop-enter-from,
.backdrop-leave-to {
  @apply opacity-0;
}

.slide-enter-active,
.slide-leave-active {
  @apply transition-transform duration-300;
}

.slide-enter-from,
.slide-leave-to {
  @apply -translate-x-full;
}

/* Mobile optimizations */
@media (max-width: 400px) {
  .mobile-menu {
    @apply w-full;
  }
}
</style>