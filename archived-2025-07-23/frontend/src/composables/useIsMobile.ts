/**
 * Mobile Detection Composable
 * 
 * @description Detects if the current device is mobile based on viewport width
 * and provides reactive mobile state for responsive components.
 */

export const useIsMobile = () => {
  const isMobile = ref(false)
  
  const checkIsMobile = () => {
    if (process.client) {
      isMobile.value = window.innerWidth < 768
    }
  }
  
  onMounted(() => {
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
  })
  
  onUnmounted(() => {
    if (process.client) {
      window.removeEventListener('resize', checkIsMobile)
    }
  })
  
  return {
    isMobile: readonly(isMobile)
  }
}

/**
 * Alternative implementation using VueUse for better performance
 */
export const useIsMobileVueUse = () => {
  const { width } = useWindowSize()
  const isMobile = computed(() => width.value < 768)
  
  return {
    isMobile
  }
}