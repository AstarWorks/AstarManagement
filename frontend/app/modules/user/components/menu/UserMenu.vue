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
      :stats="userStats"
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
import type { IMenuItemConfig } from '@foundation/config/userMenuConfig'
import UserMenuTrigger from "./UserMenuTrigger.vue";
import UserMenuDropdown from "./UserMenuDropdown.vue";

interface Props {
  showQuickStats?: boolean
}

withDefaults(defineProps<Props>(), {
  showQuickStats: true
})

// Composables - 業界標準のuseAuthを使用
const { signOut } = useAuth()
const { profile, stats } = useUserProfile()
const router = useRouter()

// State
const isOpen = ref(false)
const dropdown = ref()

// Computed
const user = computed(() => profile.value)

// Use stats from repository, with fallback
const userStats = computed(() => stats.value || {
  activeCases: 0,
  tasksToday: 0,
  unreadMessages: 0
})

// TODO: Replace with real notification service
const notificationCounts = ref({
  notifications: 0
})

// Methods
const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const handleMenuItemClick = async (item: IMenuItemConfig) => {
  closeMenu()
  
  if (item.action === 'logout') {
    await handleLogout()
  } else if (item.path) {
    await router.push(item.path)
  }
}

const handleLogout = async () => {
  try {
    // セッション状態のクリアを確実に待機してからリダイレクト
    await signOut({ callbackUrl: '/', redirect: false })
    
    // セッション状態が完全にクリアされるまで待機
    const { status } = useAuth()
    const maxWaitTime = 5000 // 5秒のタイムアウト
    const startTime = Date.now()
    
    while (status.value !== 'unauthenticated' && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // 手動でリダイレクト
    await router.push('/signin')
  } catch (error) {
    console.error('Logout failed:', error)
    // エラー時のフォールバック
    await router.push('/signin')
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