<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
        >
          <div class="toast-content">
            <div class="toast-icon">
              <component :is="getIcon(toast.type)" class="size-5" />
            </div>
            <div class="toast-text">
              <h4 class="toast-title">{{ toast.title }}</h4>
              <p v-if="toast.description" class="toast-description">
                {{ toast.description }}
              </p>
            </div>
            <button
              v-if="toast.action"
              class="toast-action"
              @click="toast.action.onClick"
            >
              {{ toast.action.label }}
            </button>
            <button
              class="toast-close"
              @click="dismiss(toast.id)"
              aria-label="Close"
            >
              <X class="size-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Toast Container Component
 * 
 * @description Renders toast notifications with animations and styling.
 * Should be included in the app.vue or main layout.
 */

import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  MessageSquare,
  X 
} from 'lucide-vue-next'

const { $toast, $toastState } = useNuxtApp()

const toasts = computed(() => $toastState.toasts)

const dismiss = (id: string) => {
  $toast.dismiss(id)
}

const getIcon = (type?: string) => {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'error':
      return XCircle
    case 'warning':
      return AlertTriangle
    case 'info':
      return Info
    default:
      return MessageSquare
  }
}
</script>

<style scoped>
.toast-container {
  @apply fixed top-4 right-4 z-50 pointer-events-none;
  max-width: 420px;
}

.toast {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-3 pointer-events-auto;
  @apply border border-gray-200 dark:border-gray-700;
  @apply transform transition-all duration-300;
}

.toast-content {
  @apply flex items-start p-4 gap-3;
}

.toast-icon {
  @apply flex-shrink-0 mt-0.5;
}

.toast--success .toast-icon {
  @apply text-green-600 dark:text-green-400;
}

.toast--error .toast-icon {
  @apply text-red-600 dark:text-red-400;
}

.toast--warning .toast-icon {
  @apply text-yellow-600 dark:text-yellow-400;
}

.toast--info .toast-icon {
  @apply text-blue-600 dark:text-blue-400;
}

.toast-text {
  @apply flex-1 min-w-0;
}

.toast-title {
  @apply font-semibold text-gray-900 dark:text-gray-100;
}

.toast-description {
  @apply mt-1 text-sm text-gray-600 dark:text-gray-400;
}

.toast-action {
  @apply ml-3 flex-shrink-0 text-sm font-medium text-primary hover:text-primary/80;
  @apply transition-colors;
}

.toast-close {
  @apply ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300;
  @apply transition-colors;
}

/* Animation classes */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .toast-container {
    @apply left-4 right-4 top-auto bottom-4;
    max-width: none;
  }
  
  .toast-enter-from,
  .toast-leave-to {
    transform: translateY(100%);
  }
}
</style>