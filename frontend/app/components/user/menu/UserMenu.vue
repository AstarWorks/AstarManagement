<template>
  <div class="relative">
    <!-- User Menu Trigger -->
    <UserMenuTrigger
      :user="user"
      :is-open="isOpen"
      @toggle="toggleMenu"
    />

    <!-- Dropdown Menu -->
    <UserMenuDropdown
      ref="dropdown"
      :user="user"
      :is-open="isOpen"
      :stats="mockStats"
      :notification-counts="notificationCounts"
      :show-quick-stats="showQuickStats"
      @item-click="handleMenuItemClick"
    />

    <!-- Mobile Overlay -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 md:hidden"
      @click="closeMenu"
    />
  </div>
</template>

<script setup lang="ts">
import type { MenuItemConfig } from '~/config/userMenuConfig'

interface Props {
  showQuickStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showQuickStats: true
})

// Composables
const authStore = useAuthStore()
const router = useRouter()

// State
const isOpen = ref(false)
const dropdown = ref()

// Computed
const user = computed(() => authStore.user)

// Mock stats for demonstration
const mockStats = ref({
  activeCases: 12,
  tasksToday: 5,
  unreadMessages: 3
})

// Mock notification counts
const notificationCounts = ref({
  notifications: 2
})

// Methods
const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const handleMenuItemClick = async (item: MenuItemConfig) => {
  closeMenu()
  
  if (item.action === 'logout') {
    await handleLogout()
  } else if (item.path) {
    await router.push(item.path)
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    await router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
    await router.push('/login')
  }
}

// Close menu when clicking outside
const menuElement = computed(() => dropdown.value?.menu)
onClickOutside(menuElement, closeMenu)

// Close menu on escape key
onKeyStroke('Escape', () => {
  if (isOpen.value) {
    closeMenu()
  }
})

// Close menu when route changes
watch(() => router.currentRoute.value.path, closeMenu)
</script>