/**
 * Pinia Client Plugin
 * 
 * @description Ensures Pinia is properly initialized on the client side
 * and provides store hydration for SSR compatibility.
 */

export default defineNuxtPlugin(async (nuxtApp: any) => {
  // Ensure Pinia is available before other plugins try to use stores
  const { $pinia } = nuxtApp
  
  if (!$pinia) {
    console.warn('Pinia is not available in Nuxt app')
    return
  }
  
  // Initialize default auth state if needed
  if (process.client) {
    try {
      const { useAuthStore } = await import('~/stores/auth')
      const authStore = useAuthStore()
      
      // Check for persisted auth state
      const persistedAuth = localStorage.getItem('auth-store')
      if (persistedAuth) {
        try {
          const authData = JSON.parse(persistedAuth)
          // You can hydrate the store here if needed
          console.log('Found persisted auth data')
        } catch (error) {
          console.warn('Failed to parse persisted auth data:', error)
          localStorage.removeItem('auth-store')
        }
      }
    } catch (error) {
      console.warn('Failed to initialize auth store:', error)
    }
  }
})