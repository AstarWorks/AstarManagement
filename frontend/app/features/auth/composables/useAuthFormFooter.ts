/**
 * Auth Form Footer Composable
 * Simple over Easy: Reusable footer logic for auth forms
 * Centralizes navigation and external link handling
 */

export interface IUseAuthFormFooterOptions {
  /** Whether to enable analytics tracking */
  enableAnalytics?: boolean
  /** Custom base URLs for links */
  baseUrls?: {
    privacy?: string
    terms?: string
    support?: string
  }
}

export interface IUseAuthFormFooterReturn {
  /** Handle privacy policy click */
  handlePrivacyClick: () => void
  /** Handle terms of service click */
  handleTermsClick: () => void
  /** Handle support link click */
  handleSupportClick: () => void
  /** Open external link safely */
  openExternalLink: (url: string, trackingEvent?: string) => void
  /** Navigate to internal route */
  navigateToRoute: (route: string) => void
}

/**
 * Auth form footer composable with enhanced navigation
 */
export const useAuthFormFooter = (options: IUseAuthFormFooterOptions = {}): IUseAuthFormFooterReturn => {
  const {
    enableAnalytics = false,
    baseUrls = {
      privacy: '/privacy',
      terms: '/terms',
      support: '/support'
    }
  } = options

  const router = useRouter()

  // Analytics tracking helper
  const trackEvent = (event: string, properties?: Record<string, unknown>) => {
    if (enableAnalytics && process.env.NODE_ENV === 'production') {
      // Integration point for analytics (e.g., Google Analytics, Mixpanel)
      console.log('[Analytics]', event, properties)
    }
  }

  // Safe external link opener
  const openExternalLink = (url: string, trackingEvent?: string) => {
    try {
      // Track event if specified
      if (trackingEvent) {
        trackEvent(trackingEvent, { url })
      }

      // Open in new tab with security measures
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
      
      // Fallback if popup blocked
      if (!newWindow) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Failed to open external link:', error)
      // Fallback to same window
      window.location.href = url
    }
  }

  // Internal route navigation
  const navigateToRoute = (route: string) => {
    try {
      router.push(route)
    } catch (error) {
      console.error('Failed to navigate to route:', error)
      // Fallback to location change
      window.location.href = route
    }
  }

  // Specific handlers for footer links
  const handlePrivacyClick = () => {
    const url = baseUrls.privacy || '/privacy'
    
    if (url.startsWith('http')) {
      openExternalLink(url, 'privacy_policy_clicked')
    } else {
      navigateToRoute(url)
      trackEvent('privacy_policy_clicked', { type: 'internal' })
    }
  }

  const handleTermsClick = () => {
    const url = baseUrls.terms || '/terms'
    
    if (url.startsWith('http')) {
      openExternalLink(url, 'terms_of_service_clicked')
    } else {
      navigateToRoute(url)
      trackEvent('terms_of_service_clicked', { type: 'internal' })
    }
  }

  const handleSupportClick = () => {
    const url = baseUrls.support || '/support'
    
    if (url.startsWith('http')) {
      openExternalLink(url, 'support_clicked')
    } else {
      navigateToRoute(url)
      trackEvent('support_clicked', { type: 'internal' })
    }
  }

  return {
    handlePrivacyClick,
    handleTermsClick,
    handleSupportClick,
    openExternalLink,
    navigateToRoute,
  }
}