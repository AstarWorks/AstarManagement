<template>
  <div class="relative">
    <!-- User Menu Trigger -->
    <Button
      variant="ghost"
      size="sm"
      class="flex items-center space-x-2 h-10 hover:bg-gray-50"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :aria-label="`${$t('navigation.menu.user')} - ${user?.name}`"
      @click="toggleMenu"
    >
      <!-- User Avatar -->
      <Avatar class="h-8 w-8">
        <AvatarImage :src="user?.avatar" :alt="user?.name || 'User'" />
        <AvatarFallback class="bg-blue-100 text-blue-700 text-sm font-medium">
          {{ getUserInitials(user?.name) }}
        </AvatarFallback>
      </Avatar>
      
      <!-- User Name (Hidden on mobile) -->
      <div class="hidden sm:block text-left">
        <p class="text-sm font-medium text-gray-900 truncate max-w-24">
          {{ user?.name || 'ユーザー' }}
        </p>
        <p class="text-xs text-gray-500 truncate max-w-24">
          {{ getPrimaryRole(user?.roles) }}
        </p>
      </div>
      
      <!-- Dropdown Arrow -->
      <Icon 
        name="lucide:chevron-down" 
        class="h-4 w-4 text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </Button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"  
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
        role="menu"
        aria-orientation="vertical"
        :aria-labelledby="'user-menu-button'"
      >
        <!-- User Info Header -->
        <div class="px-4 py-3 border-b border-gray-100">
          <div class="flex items-center space-x-3">
            <Avatar class="h-12 w-12 ring-2 ring-gray-100">
              <AvatarImage :src="user?.avatar" :alt="user?.name || 'User'" />
              <AvatarFallback class="bg-blue-100 text-blue-700 text-lg font-semibold">
                {{ getUserInitials(user?.name) }}
              </AvatarFallback>
            </Avatar>
            
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">
                {{ user?.name || 'ユーザー名不明' }}
              </p>
              <p class="text-xs text-gray-500 truncate">
                {{ user?.email || '' }}
              </p>
              
              <!-- Role Badges -->
              <div class="flex flex-wrap gap-1 mt-2">
                <Badge
                  v-for="role in user?.roles || []"
                  :key="role.id"
                  :variant="getRoleBadgeVariant(role.name)"
                  class="text-xs px-2 py-0.5"
                >
                  {{ role.displayName }}
                </Badge>
              </div>
            </div>
          </div>
          
          <!-- Quick Stats (if lawyer/admin) -->
          <div 
            v-if="showQuickStats" 
            class="mt-3 grid grid-cols-3 gap-2 text-center"
          >
            <div class="text-xs">
              <p class="font-semibold text-gray-900">{{ mockStats.activeCases }}</p>
              <p class="text-gray-500">進行中案件</p>
            </div>
            <div class="text-xs">
              <p class="font-semibold text-gray-900">{{ mockStats.tasksToday }}</p>
              <p class="text-gray-500">今日のタスク</p>
            </div>
            <div class="text-xs">
              <p class="font-semibold text-gray-900">{{ mockStats.unreadMessages }}</p>
              <p class="text-gray-500">未読メッセージ</p>
            </div>
          </div>
        </div>

        <!-- Menu Items -->
        <div class="py-2">
          <template v-for="(section, sectionIndex) in menuSections" :key="sectionIndex">
            <!-- Section Items -->
            <template v-for="item in section.items" :key="item.id">
              <component
                :is="item.action ? 'button' : 'NuxtLink'"
                :to="item.action ? undefined : item.path"
                class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
:class="[
                  item.id === 'logout' ? 'text-red-600 hover:bg-red-50' : ''
                ]"
                role="menuitem"
                @click="handleMenuItemClick(item)"
              >
                <Icon :name="item.icon" class="mr-3 h-4 w-4" />
                <span class="flex-1">{{ item.label }}</span>
                
                <!-- Show notification count for some items -->
                <Badge
                  v-if="item.id === 'notifications' && mockStats.unreadNotifications > 0"
                  variant="destructive"
                  class="ml-2 text-xs min-w-[1.25rem] h-5"
                >
                  {{ mockStats.unreadNotifications > 99 ? '99+' : mockStats.unreadNotifications }}
                </Badge>
                
                <!-- External link indicator -->
                <Icon 
                  v-if="item.external" 
                  name="lucide:external-link" 
                  class="ml-2 h-3 w-3 text-gray-400"
                />
              </component>
            </template>
            
            <!-- Section Divider -->
            <hr v-if="sectionIndex < menuSections.length - 1" class="my-2 border-gray-100" />
          </template>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>{{ $t('auth.lastLogin') }}: {{ formatLastLogin(user?.lastLoginAt) }}</span>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
              <span>{{ $t('auth.status.online') }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Mobile Overlay -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 md:hidden"
      @click="closeMenu"
    />
  </div>
</template>

<script setup lang="ts">
import type { User, Role } from '~/types/auth'

// Props
interface Props {
  showQuickStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showQuickStats: true
})

// Composables
const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

// State
const isOpen = ref(false)

// Computed
const user = computed(() => authStore.user)

// Mock stats for demonstration
const mockStats = ref({
  activeCases: 12,
  tasksToday: 5,
  unreadMessages: 3,
  unreadNotifications: 2
})

const showQuickStats = computed(() => {
  if (!props.showQuickStats || !user.value) return false
  
  // Show stats for lawyers and senior staff
  return user.value.roles.some(role => 
    ['lawyer', 'senior_paralegal', 'admin'].includes(role.name)
  )
})

// Menu structure based on user role
const menuSections = computed(() => {
  const baseMenuSections = [
    {
      id: 'account',
      items: [
        {
          id: 'profile',
          label: t('navigation.profile'),
          icon: 'lucide:user',
          path: '/profile'
        },
        {
          id: 'settings',
          label: t('navigation.settings'), 
          icon: 'lucide:settings',
          path: '/settings'
        },
        {
          id: 'notifications',
          label: t('notification.title'),
          icon: 'lucide:bell',
          path: '/notifications'
        }
      ]
    },
    {
      id: 'quick-actions',
      items: [
        {
          id: 'new-case',
          label: t('matter.create.title'),
          icon: 'lucide:plus-circle',
          path: '/cases/new'
        },
        {
          id: 'calendar',
          label: t('navigation.calendar'),
          icon: 'lucide:calendar',
          path: '/calendar'
        }
      ]
    },
    {
      id: 'support',
      items: [
        {
          id: 'help',
          label: t('navigation.help'),
          icon: 'lucide:help-circle',
          path: '/help'
        },
        {
          id: 'feedback',
          label: t('navigation.feedback'), 
          icon: 'lucide:message-square',
          path: '/feedback'
        }
      ]
    },
    {
      id: 'session',  
      items: [
        {
          id: 'logout',
          label: t('navigation.logout'),
          icon: 'lucide:log-out',
          action: 'logout'
        }
      ]
    }
  ]

  // Add admin section for admin users
  if (user.value?.roles.some(role => role.name === 'admin')) {
    baseMenuSections.splice(-2, 0, {
      id: 'admin',
      items: [
        {
          id: 'admin-panel',
          label: t('admin.title'),
          icon: 'lucide:shield',
          path: '/admin'
        },
        {
          id: 'user-management',
          label: t('admin.users.title'),
          icon: 'lucide:users',
          path: '/admin/users'
        }
      ]
    })
  }

  return baseMenuSections
})

// Methods
const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const getUserInitials = (name?: string): string => {
  if (!name) return '?'
  
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return parts[0][0] || '?'
}

const getPrimaryRole = (roles?: Role[]): string => {
  if (!roles || roles.length === 0) return 'ゲスト'
  
  // Return the most important role's display name
  const roleHierarchy = ['admin', 'lawyer', 'senior_paralegal', 'paralegal', 'secretary', 'client']
  
  for (const roleName of roleHierarchy) {
    const role = roles.find(r => r.name === roleName)
    if (role) return role.displayName
  }
  
  return roles[0].displayName
}

const getRoleBadgeVariant = (roleName: string): string => {
  const variants: Record<string, string> = {
    admin: 'destructive',
    lawyer: 'default',
    senior_paralegal: 'secondary',
    paralegal: 'outline',
    secretary: 'outline',
    client: 'secondary'
  }
  return variants[roleName] || 'outline'
}

const formatLastLogin = (lastLogin?: Date): string => {
  if (!lastLogin) return t('auth.lastLogin.never')
  
  const now = new Date()
  const diff = now.getTime() - lastLogin.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 60) {
    return t('auth.lastLogin.minutesAgo', { minutes })
  } else if (hours < 24) {
    return t('auth.lastLogin.hoursAgo', { hours })
  } else {
    return t('auth.lastLogin.daysAgo', { days })
  }
}

const handleMenuItemClick = async (item: any) => {
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
    // Force redirect even if logout API fails
    await router.push('/login')
  }
}

// Close menu when clicking outside
onClickOutside(templateRef('menu'), closeMenu)

// Close menu on escape key
onKeyStroke('Escape', () => {
  if (isOpen.value) {
    closeMenu()
  }
})

// Close menu when route changes
watch(() => router.currentRoute.value.path, closeMenu)
</script>

<style scoped>
/* Custom scrollbar for long menus */
.menu-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.menu-scroll::-webkit-scrollbar {
  width: 4px;
}

.menu-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.menu-scroll::-webkit-scrollbar-thumb {
  background-color: rgb(203 213 225);
  border-radius: 2px;
}

.menu-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgb(148 163 184);
}

/* Ensure proper z-index stacking */
.menu-dropdown {
  z-index: 50;
}

/* Avatar improvements for Japanese names */
.avatar-fallback {
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .menu-dropdown {
    position: fixed;
    top: 4rem;
    right: 1rem;
    left: 1rem;
    width: auto;
  }
}
</style>