// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  
  typescript: {
    strict: true,
    typeCheck: true
  },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  
  css: ['~/assets/css/main.css'],
  
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080'
    }
  },
  
  ssr: true,
  
  nitro: {
    prerender: {
      routes: ['/']
    }
  },
  
  vite: {
    optimizeDeps: {
      include: ['axios', 'date-fns', 'uuid']
    }
  }
})
