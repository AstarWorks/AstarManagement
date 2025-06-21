/**
 * Breadcrumbs Composable
 * 
 * @description Manages breadcrumb generation and updates based on the current route.
 * Automatically generates breadcrumbs from route meta or navigation structure.
 */

import type { BreadcrumbItem, NavItem } from '~/types/navigation'
import { mainNavigation } from '~/config/navigation'
import { generateBreadcrumbs } from '~/utils/navigation'

export const useBreadcrumbs = () => {
  const route = useRoute()
  
  // Lazy access to navigation store to avoid Pinia initialization issues
  const getNavigationStore = () => {
    try {
      return useNavigationStore()
    } catch (error) {
      // Fallback if Pinia is not available
      console.warn('Navigation store not available:', error)
      return null
    }
  }
  
  // Generate breadcrumbs from route
  const generateFromRoute = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = []
    
    // Always start with home
    breadcrumbs.push({
      label: 'Home',
      path: '/',
      icon: 'Home'
    })
    
    // Split path into segments
    const segments = route.path.split('/').filter(Boolean)
    let currentPath = ''
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      
      // Check if route has custom breadcrumb in meta
      if (route.meta.breadcrumb) {
        const breadcrumb = typeof route.meta.breadcrumb === 'function'
          ? route.meta.breadcrumb(route)
          : route.meta.breadcrumb
          
        breadcrumbs.push({
          label: breadcrumb,
          path: isLast ? undefined : currentPath,
          current: isLast
        })
      } else {
        // Generate from navigation structure
        const navBreadcrumbs = generateBreadcrumbs(mainNavigation as NavItem[], route.path)
        if (navBreadcrumbs.length > 1) {
          // Skip home since we already added it
          breadcrumbs.push(...navBreadcrumbs.slice(1).map((crumb, idx) => ({
            ...crumb,
            current: idx === navBreadcrumbs.length - 2
          })))
        } else {
          // Fallback to segment name
          const label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            
          breadcrumbs.push({
            label,
            path: isLast ? undefined : currentPath,
            current: isLast
          })
        }
      }
    })
    
    return breadcrumbs
  }
  
  // Update breadcrumbs when route changes
  const updateBreadcrumbs = () => {
    const breadcrumbs = generateFromRoute()
    const navigationStore = getNavigationStore()
    if (navigationStore) {
      navigationStore.setBreadcrumbs(breadcrumbs)
    }
  }
  
  // Set custom breadcrumbs
  const setBreadcrumbs = (breadcrumbs: BreadcrumbItem[]) => {
    const navigationStore = getNavigationStore()
    if (navigationStore) {
      navigationStore.setBreadcrumbs(breadcrumbs)
    }
  }
  
  // Add breadcrumb
  const addBreadcrumb = (breadcrumb: BreadcrumbItem) => {
    const navigationStore = getNavigationStore()
    if (navigationStore) {
      const current = navigationStore.breadcrumbs
      navigationStore.setBreadcrumbs([...current, breadcrumb])
    }
  }
  
  // Remove last breadcrumb
  const popBreadcrumb = () => {
    const navigationStore = getNavigationStore()
    if (navigationStore) {
      const current = navigationStore.breadcrumbs
      if (current.length > 1) {
        navigationStore.setBreadcrumbs(current.slice(0, -1))
      }
    }
  }
  
  // Clear all breadcrumbs
  const clearBreadcrumbs = () => {
    const navigationStore = getNavigationStore()
    if (navigationStore) {
      navigationStore.clearBreadcrumbs()
    }
  }
  
  // Auto-update on route change
  watch(() => route.path, () => {
    updateBreadcrumbs()
  }, { immediate: true })
  
  return {
    breadcrumbs: computed(() => getNavigationStore()?.breadcrumbs || []),
    setBreadcrumbs,
    addBreadcrumb,
    popBreadcrumb,
    clearBreadcrumbs,
    updateBreadcrumbs
  }
}