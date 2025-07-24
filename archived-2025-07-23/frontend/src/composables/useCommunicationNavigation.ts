import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useCommunicationNavigation() {
  const route = useRoute()
  const router = useRouter()
  
  // Extract current section from route
  const currentSection = computed(() => {
    const path = route.path
    const sections = ['memos', 'notes', 'emails', 'messages', 'calls']
    
    for (const section of sections) {
      if (path.includes(`/communications/${section}`)) {
        return section
      }
    }
    
    return 'memos' // default section
  })
  
  // Navigation helper
  const navigateToSection = (section: string) => {
    router.push(`/communications/${section}`)
  }
  
  // Breadcrumb helper
  const updateBreadcrumbs = () => {
    const sectionTitles = {
      memos: 'Client Memos',
      notes: 'Internal Notes', 
      emails: 'Email Communications',
      messages: 'Messages',
      calls: 'Phone Calls'
    }
    
    const currentTitle = sectionTitles[currentSection.value as keyof typeof sectionTitles] || 'Communications'
    
    // In a real app, this would update a breadcrumb store
    // For now, we'll just log the breadcrumb structure
    const breadcrumbs = [
      { label: 'Home', path: '/' },
      { label: 'Communications', path: '/communications' },
      { label: currentTitle, current: true }
    ]
    
    console.log('Updated breadcrumbs:', breadcrumbs)
    
    return breadcrumbs
  }
  
  // Helper to get section metadata
  const getSectionInfo = (section: string) => {
    const sectionInfo = {
      memos: {
        title: 'Client Memos',
        description: 'Communications with clients and external parties',
        icon: 'MessageSquare'
      },
      notes: {
        title: 'Internal Notes',
        description: 'Internal team communications and notes',
        icon: 'StickyNote'
      },
      emails: {
        title: 'Email Communications',
        description: 'Email conversations and correspondence',
        icon: 'Mail'
      },
      messages: {
        title: 'Messages',
        description: 'Slack, Discord, and other messaging platforms',
        icon: 'MessageCircle'
      },
      calls: {
        title: 'Phone Calls',
        description: 'Phone call logs and recordings',
        icon: 'Phone'
      }
    }
    
    return sectionInfo[section as keyof typeof sectionInfo] || sectionInfo.memos
  }
  
  // Check if section is valid
  const isValidSection = (section: string) => {
    return ['memos', 'notes', 'emails', 'messages', 'calls'].includes(section)
  }
  
  return {
    currentSection,
    navigateToSection,
    updateBreadcrumbs,
    getSectionInfo,
    isValidSection
  }
}