/**
 * Navigation Store Client Plugin
 * 
 * @description Initializes navigation store subscriptions and auto-save functionality
 * after Pinia is properly set up.
 */

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on client side
  if (!process.client) return
  
  // Wait for stores to be available
  await nextTick()
  
  try {
    const { useNavigationStore } = await import('~/stores/navigation')
    const navigationStore = useNavigationStore()
    
    // Set up auto-save for expanded state
    navigationStore.$subscribe(() => {
      navigationStore.saveExpandedState()
    })
    
    console.log('Navigation store auto-save initialized')
  } catch (error) {
    console.warn('Failed to initialize navigation store auto-save:', error)
  }
})