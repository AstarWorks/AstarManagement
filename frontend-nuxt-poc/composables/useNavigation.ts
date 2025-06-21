/**
 * Navigation Composable
 * 
 * @description Provides navigation utilities including programmatic navigation,
 * route transitions, progress indicators, and history management.
 */

export const useNavigation = () => {
  const router = useRouter()
  const route = useRoute()
  const navigationStore = useNavigationStore()
  
  // Navigation state
  const isNavigating = ref(false)
  const navigationProgress = ref(0)
  
  // Start navigation progress
  const startProgress = () => {
    isNavigating.value = true
    navigationProgress.value = 10
    
    // Simulate progress
    const interval = setInterval(() => {
      if (navigationProgress.value < 90) {
        navigationProgress.value += Math.random() * 30
      }
    }, 100)
    
    // Clean up on completion
    const stopProgress = () => {
      clearInterval(interval)
      navigationProgress.value = 100
      
      setTimeout(() => {
        isNavigating.value = false
        navigationProgress.value = 0
      }, 200)
    }
    
    return stopProgress
  }
  
  // Enhanced navigation with progress and history tracking
  const navigateTo = async (to: string | object, options?: any) => {
    const stopProgress = startProgress()
    
    try {
      // Add to navigation history
      const targetPath = typeof to === 'string' ? to : (to as any).path || route.path
      navigationStore.addToHistory(targetPath)
      
      // Perform navigation
      await router.push(to)
      
      // Close mobile menu if open
      navigationStore.closeMobileMenu()
      
    } catch (error) {
      console.error('Navigation error:', error)
      throw error
    } finally {
      stopProgress()
    }
  }
  
  // Go back with fallback
  const goBack = (fallback = '/') => {
    const previousPath = navigationStore.goBack()
    
    if (previousPath) {
      router.push(previousPath)
    } else if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
    }
  }
  
  // Refresh current page
  const refresh = async () => {
    await router.replace({
      path: route.path,
      query: { ...route.query, _t: Date.now() }
    })
  }
  
  // Navigate with confirmation
  const navigateWithConfirmation = async (
    to: string | object,
    message = 'Are you sure you want to leave this page?'
  ) => {
    if (window.confirm(message)) {
      await navigateTo(to)
    }
  }
  
  // Prefetch route
  const prefetchRoute = async (to: string) => {
    try {
      await router.resolve(to)
    } catch (error) {
      console.warn('Failed to prefetch route:', to, error)
    }
  }
  
  // Check if route exists
  const routeExists = (path: string): boolean => {
    try {
      const resolved = router.resolve(path)
      return resolved.matched.length > 0
    } catch {
      return false
    }
  }
  
  // Get route title
  const getRouteTitle = (routePath?: string): string => {
    const targetRoute = routePath ? router.resolve(routePath) : route
    return targetRoute.meta?.title as string || 'Aster Management'
  }
  
  // Check if current route matches
  const isCurrentRoute = (path: string, exact = false): boolean => {
    if (exact) {
      return route.path === path
    }
    return route.path.startsWith(path)
  }
  
  // Get breadcrumb trail for current route
  const getBreadcrumbTrail = () => {
    return navigationStore.breadcrumbs
  }
  
  // Navigation guards
  const addBeforeNavigationGuard = (guard: (to: any, from: any) => boolean | Promise<boolean>) => {
    return router.beforeEach(async (to, from, next) => {
      try {
        const canNavigate = await guard(to, from)
        if (canNavigate) {
          next()
        } else {
          next(false)
        }
      } catch (error) {
        console.error('Navigation guard error:', error)
        next(false)
      }
    })
  }
  
  // Scroll to top
  const scrollToTop = (smooth = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }
  
  // Scroll to element
  const scrollToElement = (elementId: string, smooth = true) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'start'
      })
    }
  }
  
  return {
    // State
    isNavigating: readonly(isNavigating),
    navigationProgress: readonly(navigationProgress),
    currentRoute: route,
    
    // Navigation methods
    navigateTo,
    goBack,
    refresh,
    navigateWithConfirmation,
    
    // Route utilities
    prefetchRoute,
    routeExists,
    getRouteTitle,
    isCurrentRoute,
    getBreadcrumbTrail,
    
    // Guards and middleware
    addBeforeNavigationGuard,
    
    // Scroll utilities
    scrollToTop,
    scrollToElement
  }
}