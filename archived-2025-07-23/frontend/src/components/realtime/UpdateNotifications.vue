<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRealTimeStore } from '~/stores/kanban/real-time'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { X, CheckCircle, AlertCircle, Info, Clock } from 'lucide-vue-next'

interface Props {
  /**
   * Maximum number of notifications to display simultaneously
   */
  maxNotifications?: number
  
  /**
   * Auto-dismiss time for notifications (in milliseconds)
   */
  autoDismissTime?: number
  
  /**
   * Position of notification container
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  
  /**
   * Show notification sound (when supported)
   */
  enableSound?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxNotifications: 5,
  autoDismissTime: 5000,
  position: 'top-right',
  enableSound: true
})

interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  action?: {
    label: string
    handler: () => void
  }
  dismissible: boolean
  autoDismiss: boolean
}

const realTimeStore = useRealTimeStore()
const { realtimeEvents, syncStatus } = storeToRefs(realTimeStore)

const notifications = ref<NotificationItem[]>([])
const isVisible = ref(true)

// Notification type configurations
const notificationConfig = computed(() => ({
  success: {
    icon: CheckCircle,
    variant: 'default' as const,
    bgClass: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
  },
  error: {
    icon: AlertCircle,
    variant: 'destructive' as const,
    bgClass: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
  },
  warning: {
    icon: AlertCircle,
    variant: 'default' as const,
    bgClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
  },
  info: {
    icon: Info,
    variant: 'default' as const,
    bgClass: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
  }
}))

// Position classes
const positionClasses = computed(() => {
  const base = 'fixed z-50 flex flex-col gap-2'
  switch (props.position) {
    case 'top-right':
      return `${base} top-4 right-4`
    case 'top-left':
      return `${base} top-4 left-4`
    case 'bottom-right':
      return `${base} bottom-4 right-4`
    case 'bottom-left':
      return `${base} bottom-4 left-4`
    default:
      return `${base} top-4 right-4`
  }
})

// Auto-dismiss timers
const dismissTimers = new Map<string, NodeJS.Timeout>()

const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
  const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newNotification: NotificationItem = {
    ...notification,
    id,
    timestamp: new Date()
  }
  
  // Add to beginning of array
  notifications.value.unshift(newNotification)
  
  // Trim to max notifications
  if (notifications.value.length > props.maxNotifications) {
    const removed = notifications.value.splice(props.maxNotifications)
    removed.forEach(n => clearDismissTimer(n.id))
  }
  
  // Set auto-dismiss timer
  if (newNotification.autoDismiss) {
    const timer = setTimeout(() => {
      dismissNotification(id)
    }, props.autoDismissTime)
    dismissTimers.set(id, timer)
  }
  
  // Play notification sound
  if (props.enableSound && 'Audio' in window) {
    try {
      // Use Web Audio API for subtle notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      // Silently fail if audio is not supported
      console.debug('Notification sound failed:', error)
    }
  }
}

const dismissNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications.value.splice(index, 1)
    clearDismissTimer(id)
  }
}

const clearDismissTimer = (id: string) => {
  const timer = dismissTimers.get(id)
  if (timer) {
    clearTimeout(timer)
    dismissTimers.delete(id)
  }
}

const clearAllNotifications = () => {
  notifications.value.forEach(n => clearDismissTimer(n.id))
  notifications.value = []
}

const formatRelativeTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 60000) { // Less than 1 minute
    return 'just now'
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  } else {
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  }
}

// Watch for real-time events to create notifications
watch(realtimeEvents, (events) => {
  if (!events || events.length === 0) return
  
  // Get the latest event
  const latestEvent = events[0]
  
  switch (latestEvent.type) {
    case 'matter_created':
      addNotification({
        type: 'success',
        title: 'New Matter Created',
        message: `Matter "${latestEvent.data.title}" was created by ${latestEvent.data.userName || 'another user'}`,
        dismissible: true,
        autoDismiss: true
      })
      break
      
    case 'matter_updated':
      addNotification({
        type: 'info',
        title: 'Matter Updated',
        message: `Matter "${latestEvent.data.title}" was updated by ${latestEvent.data.userName || 'another user'}`,
        dismissible: true,
        autoDismiss: true
      })
      break
      
    case 'matter_deleted':
      addNotification({
        type: 'warning',
        title: 'Matter Deleted',
        message: `A matter was deleted by ${latestEvent.data.userName || 'another user'}`,
        dismissible: true,
        autoDismiss: true
      })
      break
      
    case 'user_joined':
      addNotification({
        type: 'info',
        title: 'User Joined',
        message: `${latestEvent.data.userName} joined the board`,
        dismissible: true,
        autoDismiss: true
      })
      break
      
    case 'user_left':
      addNotification({
        type: 'info',
        title: 'User Left',
        message: `${latestEvent.data.userName} left the board`,
        dismissible: true,
        autoDismiss: true
      })
      break
  }
}, { deep: true })

// Watch sync status for connection notifications
watch(syncStatus, (status, prevStatus) => {
  if (!prevStatus) return // Skip initial load
  
  if (status.status === 'offline' && prevStatus.status !== 'offline') {
    addNotification({
      type: 'warning',
      title: 'Connection Lost',
      message: 'You are now offline. Changes will be synced when connection is restored.',
      dismissible: true,
      autoDismiss: false,
      action: {
        label: 'Retry',
        handler: () => {
          realTimeStore.forceSyncNow()
        }
      }
    })
  } else if (status.status === 'syncing' && prevStatus.status === 'offline') {
    addNotification({
      type: 'info',
      title: 'Reconnecting',
      message: 'Connection restored. Syncing changes...',
      dismissible: true,
      autoDismiss: true
    })
  } else if (status.status === 'idle' && prevStatus.status === 'syncing') {
    addNotification({
      type: 'success',
      title: 'Sync Complete',
      message: 'All changes have been synchronized.',
      dismissible: true,
      autoDismiss: true
    })
  } else if (status.status === 'error') {
    addNotification({
      type: 'error',
      title: 'Sync Error',
      message: status.errorMessage || 'Failed to sync changes. Please check your connection.',
      dismissible: true,
      autoDismiss: false,
      action: {
        label: 'Retry',
        handler: () => {
          realTimeStore.forceSyncNow()
        }
      }
    })
  }
})

// Cleanup timers on unmount
onUnmounted(() => {
  dismissTimers.forEach(timer => clearTimeout(timer))
  dismissTimers.clear()
})

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Dismiss all notifications with Escape key
  if (event.key === 'Escape' && notifications.value.length > 0) {
    clearAllNotifications()
    event.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="notifications.length > 0 && isVisible"
      :class="positionClasses"
      role="region"
      aria-label="Real-time notifications"
      aria-live="polite"
    >
      <!-- Notification Header (when multiple notifications) -->
      <div 
        v-if="notifications.length > 1" 
        class="flex items-center justify-between mb-2"
      >
        <Badge variant="secondary" class="text-xs">
          {{ notifications.length }} notifications
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          @click="clearAllNotifications"
          class="h-6 px-2 text-xs"
        >
          Clear all
        </Button>
      </div>

      <!-- Individual Notifications -->
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 transform translate-x-full"
        enter-to-class="opacity-100 transform translate-x-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 transform translate-x-0"
        leave-to-class="opacity-0 transform translate-x-full"
        move-class="transition-transform duration-200"
      >
        <Alert
          v-for="notification in notifications"
          :key="notification.id"
          :variant="notificationConfig[notification.type].variant"
          :class="[
            'w-80 shadow-lg border-l-4 relative',
            notificationConfig[notification.type].bgClass
          ]"
        >
          <!-- Notification Icon -->
          <component
            :is="notificationConfig[notification.type].icon"
            class="h-4 w-4"
          />
          
          <!-- Notification Content -->
          <div class="flex-1">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold text-sm mb-1">
                  {{ notification.title }}
                </h4>
                <AlertDescription class="text-sm">
                  {{ notification.message }}
                </AlertDescription>
              </div>
              
              <!-- Dismiss Button -->
              <Button
                v-if="notification.dismissible"
                variant="ghost"
                size="sm"
                @click="dismissNotification(notification.id)"
                class="h-6 w-6 p-0 ml-2 opacity-60 hover:opacity-100"
                :aria-label="`Dismiss ${notification.title} notification`"
              >
                <X class="h-3 w-3" />
              </Button>
            </div>
            
            <!-- Timestamp and Action -->
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center text-xs text-muted-foreground">
                <Clock class="h-3 w-3 mr-1" />
                {{ formatRelativeTime(notification.timestamp) }}
              </div>
              
              <!-- Action Button -->
              <Button
                v-if="notification.action"
                variant="outline"
                size="sm"
                @click="notification.action.handler"
                class="h-6 px-2 text-xs"
              >
                {{ notification.action.label }}
              </Button>
            </div>
          </div>
          
          <!-- Auto-dismiss Progress Bar -->
          <div
            v-if="notification.autoDismiss"
            class="absolute bottom-0 left-0 h-1 bg-primary/30 animate-pulse"
            :style="{ 
              width: '100%',
              animation: `shrink ${props.autoDismissTime}ms linear forwards`
            }"
          />
        </Alert>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Ensure proper stacking and transitions */
.notification-container {
  pointer-events: auto;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border-l-4 {
    border-left-width: 6px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .transition-all,
  .animate-pulse {
    animation: none;
    transition: none;
  }
}
</style>