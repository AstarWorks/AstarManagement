/**
 * TanStack Query DevTools Plugin
 * 
 * @description Conditionally loads Vue Query DevTools in development environment
 * for debugging queries, mutations, and cache state.
 */

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only load in development
  if (process.env.NODE_ENV !== 'production') {
    const { VueQueryDevtools } = await import('@tanstack/vue-query-devtools')
    
    nuxtApp.vueApp.use(VueQueryDevtools, {
      // DevTools configuration
      buttonPosition: 'bottom-right',
      position: 'bottom',
      initialIsOpen: false,
      
      // Custom styles to match the app theme
      style: {
        zIndex: 99999,
      },
      
      // Error tracking
      errorTypes: [
        {
          name: 'Legal Error',
          initializer: (query: any) => query.state.error?.code?.startsWith('LEGAL_')
        }
      ]
    })
    
    console.log('🔍 TanStack Query DevTools enabled')
  }
})