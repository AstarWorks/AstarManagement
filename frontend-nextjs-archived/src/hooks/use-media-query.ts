/**
 * Custom hook for responsive media query detection
 * 
 * @description Provides real-time media query matching for responsive design.
 * Returns boolean indicating if the current viewport matches the query.
 * 
 * @param query - CSS media query string
 * @returns boolean - Whether the query matches current viewport
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 767px)')
 * const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 * ```
 */

import * as React from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)
    
    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    // Add listener
    mediaQuery.addEventListener('change', handler)
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [query])

  return matches
}

// Common breakpoint utilities
export const useBreakpoints = () => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    // Convenience flags
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop
  }
}