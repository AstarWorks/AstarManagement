<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Clock,
  ChevronDown,
  Bell
} from 'lucide-vue-next'
import type { UserRole } from '~/types/auth'

// Component props
interface Props {
  /** Show user role badge */
  showRole?: boolean
  /** Show session timeout indicator */
  showSessionTimeout?: boolean
  /** Avatar size */
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  showRole: true,
  showSessionTimeout: true,
  size: 'md'
})

// Component emits
const emit = defineEmits<{
  /** Fired when user clicks profile */
  profile: []
  /** Fired when user clicks settings */
  settings: []
  /** Fired when user logs out */
  logout: []
}>()

// Composables
const authStore = useAuthStore()
const router = useRouter()

// Computed
const user = computed(() => authStore.user)
const userDisplayName = computed(() => authStore.userDisplayName)
const sessionTimeRemaining = computed(() => authStore.sessionTimeRemaining)
const userInitials = computed(() => {
  if (!user.value) return 'U'
  
  if (user.value.profile?.firstName && user.value.profile?.lastName) {
    return `${user.value.profile.firstName[0]}${user.value.profile.lastName[0]}`
  }
  
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const roleColor = computed(() => {
  switch (user.value?.role) {
    case 'admin':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'lawyer':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'clerk':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'client':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
})

const sessionWarning = computed(() => {
  const timeLeft = sessionTimeRemaining.value
  if (timeLeft <= 5 * 60 * 1000) { // 5 minutes or less
    return {
      show: true,
      color: 'text-red-600',
      message: `Session expires in ${Math.floor(timeLeft / 60000)} minutes`
    }
  } else if (timeLeft <= 10 * 60 * 1000) { // 10 minutes or less
    return {
      show: true,
      color: 'text-yellow-600',
      message: `Session expires in ${Math.floor(timeLeft / 60000)} minutes`
    }
  }
  return { show: false, color: '', message: '' }
})

const avatarSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 w-8'
    case 'lg':
      return 'h-12 w-12'
    default:
      return 'h-10 w-10'
  }
})

// Methods
const handleProfile = () => {
  emit('profile')
  router.push('/profile')
}

const handleSettings = () => {
  emit('settings')
  router.push('/settings')
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    emit('logout')
  } catch (error) {
    console.error('Logout failed:', error)
    // Force logout on error
    await router.push('/login')
  }
}

const formatRole = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

// Session timeout warning
const showSessionWarning = ref(false)

watch(sessionWarning, (warning) => {
  if (warning.show && !showSessionWarning.value) {
    showSessionWarning.value = true
    // Auto-hide warning after 5 seconds
    setTimeout(() => {
      showSessionWarning.value = false
    }, 5000)
  }
}, { immediate: true })
</script>

<template>
  <div class="relative">
    <!-- Session timeout warning -->
    <div
      v-if="showSessionTimeout && sessionWarning.show && showSessionWarning"
      class="absolute -top-12 right-0 z-50 bg-yellow-50 border border-yellow-200 rounded-md p-2 shadow-lg min-w-max"
    >
      <div class="flex items-center space-x-2">
        <Clock class="h-4 w-4 text-yellow-600" />
        <span class="text-sm text-yellow-800">{{ sessionWarning.message }}</span>
      </div>
    </div>
    
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="relative h-auto p-2 hover:bg-muted/50">
          <div class="flex items-center space-x-3">
            <!-- Avatar -->
            <Avatar :class="avatarSize">
              <AvatarImage
                v-if="user?.avatar"
                :src="user.avatar"
                :alt="userDisplayName"
              />
              <AvatarFallback class="text-sm font-medium">
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>
            
            <!-- User info (hidden on mobile) -->
            <div class="hidden md:block text-left">
              <div class="text-sm font-medium">{{ userDisplayName }}</div>
              <div class="text-xs text-muted-foreground">{{ user?.email }}</div>
            </div>
            
            <!-- Dropdown indicator -->
            <ChevronDown class="h-4 w-4 text-muted-foreground" />
          </div>
          
          <!-- Session warning indicator -->
          <div
            v-if="showSessionTimeout && sessionWarning.show"
            class="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full animate-pulse"
          />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" class="w-64">
        <!-- User info header -->
        <DropdownMenuLabel>
          <div class="flex items-center space-x-3">
            <Avatar class="h-10 w-10">
              <AvatarImage
                v-if="user?.avatar"
                :src="user.avatar"
                :alt="userDisplayName"
              />
              <AvatarFallback>{{ userInitials }}</AvatarFallback>
            </Avatar>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ userDisplayName }}</div>
              <div class="text-sm text-muted-foreground truncate">{{ user?.email }}</div>
              <!-- Role badge -->
              <Badge v-if="showRole && user?.role" :class="roleColor" class="text-xs mt-1">
                {{ formatRole(user.role) }}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <!-- Session info -->
        <div v-if="showSessionTimeout" class="px-2 py-1">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>Session</span>
            <span :class="sessionWarning.color">
              {{ Math.floor(sessionTimeRemaining / 60000) }}m remaining
            </span>
          </div>
        </div>
        
        <DropdownMenuSeparator v-if="showSessionTimeout" />
        
        <!-- Menu items -->
        <DropdownMenuItem @click="handleProfile" class="cursor-pointer">
          <User class="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem @click="handleSettings" class="cursor-pointer">
          <Settings class="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <!-- Security options for eligible users -->
        <DropdownMenuItem
          v-if="user?.role === 'admin' || user?.role === 'lawyer'"
          @click="router.push('/security')"
          class="cursor-pointer"
        >
          <Shield class="mr-2 h-4 w-4" />
          <span>Security</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <!-- Logout -->
        <DropdownMenuItem @click="handleLogout" class="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut class="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<style scoped>
/* Custom animations for session warning */
@keyframes pulse-yellow {
  0%, 100% {
    @apply bg-yellow-500;
  }
  50% {
    @apply bg-yellow-600;
  }
}

.animate-pulse-yellow {
  animation: pulse-yellow 2s infinite;
}

/* Dropdown menu styling */
.dropdown-content {
  @apply bg-background border border-border shadow-lg rounded-md;
}

/* Avatar fallback styling */
.avatar-fallback {
  @apply bg-muted text-muted-foreground font-medium;
}

/* Role badge animations */
.role-badge {
  @apply transition-all duration-200;
}

/* Session warning styling */
.session-warning {
  @apply animate-in slide-in-from-top-2 duration-300;
}
</style>