<script setup lang="ts">
import { Card } from '@/components/ui/card'
import { Scale } from 'lucide-vue-next'

// Component props
interface Props {
  /** Page title */
  title?: string
  /** Page description */
  description?: string
  /** Show background pattern */
  showPattern?: boolean
  /** Maximum width for content */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Aster Management',
  description: 'Legal Case Management System',
  showPattern: true,
  maxWidth: 'md'
})

// Computed
const maxWidthClass = computed(() => {
  switch (props.maxWidth) {
    case 'sm':
      return 'max-w-sm'
    case 'lg':
      return 'max-w-lg'
    case 'xl':
      return 'max-w-xl'
    default:
      return 'max-w-md'
  }
})

// Meta management
useHead({
  title: props.title,
  meta: [
    { name: 'description', content: props.description },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ]
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Background with optional pattern -->
    <div
      class="flex-1 flex items-center justify-center px-4 py-8 relative"
      :class="{
        'bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900': showPattern
      }"
    >
      <!-- Background pattern -->
      <div
        v-if="showPattern"
        class="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,black,rgba(0,0,0,0.6))]"
      />
      
      <!-- Main content container -->
      <div class="relative w-full" :class="maxWidthClass">
        <!-- Header -->
        <div class="text-center mb-8">
          <!-- Logo -->
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-6 shadow-lg">
            <Scale class="h-8 w-8 text-primary-foreground" />
          </div>
          
          <!-- Title and description -->
          <h1 class="text-3xl font-bold text-foreground mb-2">
            {{ title }}
          </h1>
          <p class="text-muted-foreground text-lg">
            {{ description }}
          </p>
        </div>
        
        <!-- Main content slot -->
        <div class="space-y-6">
          <slot />
        </div>
        
        <!-- Footer -->
        <div class="mt-8 text-center">
          <p class="text-sm text-muted-foreground">
            &copy; {{ new Date().getFullYear() }} Aster Management. All rights reserved.
          </p>
        </div>
      </div>
    </div>
    
    <!-- Bottom decorative element -->
    <div
      v-if="showPattern"
      class="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20"
    />
  </div>
</template>

<style scoped>
/* Grid pattern for background */
.bg-grid-slate-100 {
  background-image: 
    linear-gradient(to right, theme('colors.slate.100') 1px, transparent 1px),
    linear-gradient(to bottom, theme('colors.slate.100') 1px, transparent 1px);
  background-size: 2rem 2rem;
}

.dark .bg-grid-slate-700\/25 {
  background-image: 
    linear-gradient(to right, rgba(51, 65, 85, 0.25) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(51, 65, 85, 0.25) 1px, transparent 1px);
  background-size: 2rem 2rem;
}

/* Animation for logo */
.logo-container {
  @apply transition-transform duration-300 hover:scale-105;
}

/* Gradient animations */
.gradient-bg {
  background: linear-gradient(-45deg, #f8fafc, #ffffff, #f1f5f9, #e2e8f0);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

.dark .gradient-bg {
  background: linear-gradient(-45deg, #0f172a, #1e293b, #334155, #475569);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .logo-container {
    @apply w-12 h-12 mb-4;
  }
  
  .logo-container svg {
    @apply h-6 w-6;
  }
  
  h1 {
    @apply text-2xl;
  }
  
  p {
    @apply text-base;
  }
}

/* Loading state animations */
.auth-card {
  @apply animate-in slide-in-from-bottom-4 duration-500;
}

/* Focus states for accessibility */
.auth-layout:focus-within {
  @apply outline-none;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .bg-grid-slate-100 {
    background-image: 
      linear-gradient(to right, #000000 1px, transparent 1px),
      linear-gradient(to bottom, #000000 1px, transparent 1px);
  }
  
  .dark .bg-grid-slate-700\/25 {
    background-image: 
      linear-gradient(to right, #ffffff 1px, transparent 1px),
      linear-gradient(to bottom, #ffffff 1px, transparent 1px);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .gradient-bg {
    animation: none;
  }
  
  .auth-card {
    animation: none;
  }
  
  .logo-container {
    @apply transition-none;
  }
}
</style>