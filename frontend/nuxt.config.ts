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
    'shadcn-nuxt',
    '@nuxtjs/i18n',
  ],

  // Server-side rendering
  ssr: true,

  // Auto imports
  imports: {
    dirs: ['stores/**'],
  },
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  // App configuration
  app: {
    head: {
      title: 'Astar Management',
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
    payloadExtraction: true,
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
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: process.env.NODE_ENV === 'development' ? 'true' : 'false',
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
    locales: ['ja'],
    strategy: 'no_prefix',
    vueI18n: '~/i18n.config.ts'
  },

  // Pinia
  pinia: {
    storesDirs: ['./stores/**'],
  },

  // shadcn configuration
  shadcn: {
    prefix: '',
    componentDir: '~/components/ui'
  },

})