// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({

  // Modules
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/test-utils',
    'shadcn-nuxt',
    '@nuxtjs/i18n',
  ],

  // Server-side rendering
  ssr: true,

  // Components
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  // Auto imports
  imports: {
    dirs: ['composables/**', 'utils/**', 'stores/**'],
  },
  devtools: { enabled: true },

  // App configuration
  app: {
    head: {
      title: 'Aster Management',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '法律事務所管理システム' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  // CSS
  css: ['~/assets/css/tailwind.css'],


  // Runtime config
  runtimeConfig: {
    // Private keys (server-side only)
    jwtSecret: process.env.JWT_SECRET,

    // Public keys (exposed to client)
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || 'development',
      enableAiFeatures: process.env.NUXT_PUBLIC_ENABLE_AI_FEATURES === 'true',
      enableRealTimeSync: process.env.NUXT_PUBLIC_ENABLE_REAL_TIME_SYNC === 'true',
      enableOfflineMode: process.env.NUXT_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
      showDebugInfo: process.env.NUXT_PUBLIC_SHOW_DEBUG_INFO === 'true',
    },
  },

  // Source directory
  srcDir: './app/',


  // Build
  build: {
    analyze: process.env.ANALYZE === 'true',
  },

  // Experimental features
  experimental: {
    payloadExtraction: false,
    typedPages: true,
  },
  compatibilityDate: '2025-07-15',

  // Generate
  nitro: {
    esbuild: {
      options: {
        target: ['chrome91', 'firefox90', 'safari15'],
      },
    },
  },

  // Vite configuration
  vite: {
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    },
    plugins: [
      tailwindcss()
    ],
    optimizeDeps: {
      include: ['zod', 'vee-validate'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router'],
            ui: ['radix-vue', 'lucide-vue-next'],
            utils: ['zod', 'vee-validate', 'class-variance-authority'],
          },
        },
      },
    },
  },

  // TypeScript configuration
  typescript: {
    strict: true,
  },

  // PostCSS configuration
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {}
    }
  },

  // ESLint
  eslint: {
    config: {
      stylistic: {
        indent: 2,
        quotes: 'single',
        semi: false,
      },
    },
  },

  // i18n configuration  
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    strategy: 'no_prefix',
  },

  // Pinia
  pinia: {
    storesDirs: ['./stores/**'],
  },

  // shadcn configuration
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  },

})