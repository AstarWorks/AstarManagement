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
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts',
    '@nuxtjs/color-mode',
    'shadcn-nuxt'
  ],
  
  googleFonts: {
    families: {
      'Geist': [400, 500, 600, 700],
      'Geist+Mono': [400, 500, 600, 700]
    },
    display: 'swap',
    preload: true
  },
  
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'aster-color-mode'
  },

  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
  
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  },
  
  router: {
    options: {
      strict: true,
      scrollBehaviorType: 'smooth'
    }
  },
  
  experimental: {
    payloadExtraction: false
  },
  
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
      include: ['axios', 'date-fns', 'uuid', 'vee-validate', '@vee-validate/zod', 'zod']
    }
  },
  
  imports: {
    dirs: ['composables/**', 'utils/**']
  },
  
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ]
})
