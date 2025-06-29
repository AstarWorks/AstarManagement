<template>
  <div 
    ref="containerRef"
    class="mobile-layout relative w-full h-full overflow-auto overscroll-behavior-y-contain -webkit-overflow-scrolling-touch"
    :style="touchStyles as any"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Pull-to-refresh indicator -->
    <div 
      v-if="enablePullToRefresh && (isPulling || isRefreshing)"
      class="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 transition-transform duration-200"
      :style="{ 
        transform: `translateX(-50%) translateY(${isPulling ? pullDistance - 40 : isRefreshing ? 20 : -40}px)` 
      }"
    >
      <div class="bg-background border rounded-full shadow-lg p-3 flex items-center justify-center">
        <div 
          class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
          :class="{ 'animate-spin': isRefreshing || pullDistance > 60 }"
          :style="{
            transform: !isRefreshing && isPulling ? `rotate(${(pullDistance / 60) * 180}deg)` : undefined
          }"
        />
      </div>
    </div>

    <!-- Main content -->
    <div 
      class="min-h-full"
      :style="{
        paddingTop: enablePullToRefresh && isPulling ? `${pullDistance}px` : undefined,
        transition: enablePullToRefresh && !isPulling ? 'padding-top 0.2s ease-out' : undefined
      }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Mobile Layout Component with Viewport and Touch Optimizations
 * 
 * @description Provides mobile-optimized layout wrapper with viewport management,
 * touch target optimization, and performance enhancements for mobile devices.
 * Ported from React MobileLayout.tsx to Vue 3 Composition API.
 */

interface Props {
  enablePullToRefresh?: boolean
  disableZoom?: boolean
  optimizeTouch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enablePullToRefresh: false,
  disableZoom: true,
  optimizeTouch: true
})

const emit = defineEmits<{
  refresh: []
}>()

// Template refs
const containerRef = ref<HTMLDivElement>()

// State for pull-to-refresh
const isRefreshing = ref(false)
const pullDistance = ref(0)
const isPulling = ref(false)

// Touch state refs
const touchStartY = ref(0)
const lastTouchY = ref(0)

// Computed touch styles
const touchStyles = computed(() => {
  if (!props.optimizeTouch) return {}
  
  return {
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: props.disableZoom ? 'pan-y' : 'manipulation'
  }
})

// Viewport and touch optimizations
onMounted(() => {
  // Set mobile viewport meta tag
  let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
  
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta')
    viewportMeta.name = 'viewport'
    document.head.appendChild(viewportMeta)
  }

  const viewportContent = [
    'width=device-width',
    'initial-scale=1.0',
    props.disableZoom ? 'maximum-scale=1.0' : 'maximum-scale=5.0',
    props.disableZoom ? 'user-scalable=no' : 'user-scalable=yes',
    'viewport-fit=cover',
    'shrink-to-fit=no'
  ].join(', ')

  viewportMeta.content = viewportContent

  // iOS-specific optimizations
  if (props.disableZoom) {
    const style = document.createElement('style')
    style.textContent = `
      input, select, textarea {
        font-size: 16px !important;
      }
    `
    document.head.appendChild(style)
    
    onUnmounted(() => {
      document.head.removeChild(style)
    })
  }
})

// Touch optimization
onMounted(() => {
  if (!props.optimizeTouch) return

  // Prevent double-tap zoom
  let lastTouchEnd = 0
  const preventDoubleClick = (event: TouchEvent) => {
    const now = new Date().getTime()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }

  // Prevent pinch zoom if disabled
  const preventPinchZoom = (event: TouchEvent) => {
    if (props.disableZoom && event.touches.length > 1) {
      event.preventDefault()
    }
  }

  // Add touch event listeners
  document.addEventListener('touchend', preventDoubleClick, { passive: false })
  document.addEventListener('touchstart', preventPinchZoom, { passive: false })
  document.addEventListener('touchmove', preventPinchZoom, { passive: false })

  onUnmounted(() => {
    document.removeEventListener('touchend', preventDoubleClick)
    document.removeEventListener('touchstart', preventPinchZoom)
    document.removeEventListener('touchmove', preventPinchZoom)
  })
})

// Pull-to-refresh handlers
const handleTouchStart = (e: TouchEvent) => {
  if (!props.enablePullToRefresh || !containerRef.value) return
  
  const scrollTop = containerRef.value.scrollTop
  if (scrollTop > 0) return
  
  touchStartY.value = e.touches[0].clientY
  lastTouchY.value = e.touches[0].clientY
}

const handleTouchMove = (e: TouchEvent) => {
  if (!props.enablePullToRefresh || !containerRef.value) return
  
  const scrollTop = containerRef.value.scrollTop
  if (scrollTop > 0) return
  
  const currentY = e.touches[0].clientY
  const diff = currentY - touchStartY.value
  
  if (diff > 0) {
    isPulling.value = true
    pullDistance.value = Math.min(diff * 0.5, 80) // Damping effect
    
    // Prevent default scrolling when pulling
    e.preventDefault()
  }
  
  lastTouchY.value = currentY
}

const handleTouchEnd = async () => {
  if (!props.enablePullToRefresh || !isPulling.value) return
  
  isPulling.value = false
  
  if (pullDistance.value > 60 && !isRefreshing.value) {
    isRefreshing.value = true
    try {
      emit('refresh')
      // Wait for parent to handle refresh
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      isRefreshing.value = false
    }
  }
  
  pullDistance.value = 0
}
</script>