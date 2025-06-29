// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Use src directory for source files
  srcDir: 'src/',
  
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  
  typescript: {
    strict: true,
    typeCheck: true,
    shim: true
  },
  
  vite: {
    vue: {
      script: {
        defineModel: true,
        propsDestructure: true
      }
    },
    
    // Build optimizations
    build: {
      // Code splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router'],
            'ui': ['@radix-ui/vue-accordion', '@radix-ui/vue-alert-dialog'],
            'utils': ['date-fns', 'clsx', 'tailwind-merge']
          }
        }
      },
      
      // Minification settings for production
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: process.env.NODE_ENV === 'production'
        }
      },
      
      // Enable source maps for production debugging
      sourcemap: process.env.NODE_ENV === 'development' ? true : 'hidden',
      
      // Bundle size reporting
      reportCompressedSize: true,
      chunkSizeWarningLimit: 500 // 500KB warning threshold
    },
    
    // Development optimizations
    optimizeDeps: {
      include: [
        'vue',
        'vue-router', 
        '@vueuse/core',
        'axios', 
        'date-fns', 
        'uuid', 
        'vee-validate', 
        '@vee-validate/zod', 
        'zod',
        'lucide-vue-next',
        '@tanstack/vue-query',
        'pdfjs-dist'
      ]
    },
    
    // CSS optimization
    css: {
      devSourcemap: true
    }
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
    componentDir: './src/components/ui'
  },
  
  app: {
    // Global head configuration for SEO
    head: {
      title: 'Aster Legal Management',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Legal case management system with Kanban board visualization' },
        { name: 'theme-color', content: '#ffffff' },
        // Open Graph meta tags
        { property: 'og:title', content: 'Aster Legal Management' },
        { property: 'og:description', content: 'Efficient legal case management with visual workflow' },
        { property: 'og:type', content: 'website' },
        // Twitter Card meta tags
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Aster Legal Management' },
        { name: 'twitter:description', content: 'Efficient legal case management with visual workflow' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // Preconnect to external domains for performance
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
      ]
    },
    
    // Page transitions with SSR compatibility
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
    // Enable view transitions API for better UX
    viewTransition: true,
    
    // Payload extraction for better caching
    payloadExtraction: true,
    
    // Tree shaking for better performance
    treeshakeClientOnly: true
  },
  
  // Bundle analysis configuration
  analyze: {
    analyzerMode: 'static',
    generateStatsFile: true,
    statsFilename: 'stats.json',
    openAnalyzer: false,
    logLevel: 'info',
    defaultSizes: 'gzip'
  },
  
  css: ['~/assets/css/main.css'],
  
  runtimeConfig: {
    // Private keys (only available on server-side)
    apiSecret: process.env.API_SECRET || 'dev-secret',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    
    // Public keys (exposed to client-side)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080/api',
      websocketUrl: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
      environment: process.env.NODE_ENV || 'development'
    }
  },
  
  ssr: true,
  
  nitro: {
    // Server compression is handled by the hosting environment
    
    // Server-side caching configuration
    storage: {
      redis: {
        driver: 'redis',
        // Redis configuration for production
        // host: process.env.REDIS_HOST || 'localhost',
        // port: process.env.REDIS_PORT || 6379,
      }
    },
    
    // Route rules for SSR optimization
    routeRules: {
      // Kanban page - SSR with caching
      '/kanban': { 
        ssr: true,
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      },
      
      // API routes - server-side caching
      '/api/**': {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
        }
      },
      
      // Static pages - prerender with long-term caching
      '/': { prerender: true },
      '/login': { prerender: true },
      
      // Test pages - SSR disabled for development
      '/test-**': { ssr: false },
      '/examples/**': { ssr: false }
    },
    
    // Experimental features for performance
    experimental: {
      wasm: true
    },
    
    prerender: {
      routes: ['/']
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
