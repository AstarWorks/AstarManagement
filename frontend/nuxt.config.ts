// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'
import tailwindcss from "@tailwindcss/vite";
import tailwindAutoReference from 'vite-plugin-vue-tailwind-auto-reference';
import vueDevTools from 'vite-plugin-vue-devtools'

// 環境変数の取得
const apiMode = process.env.NUXT_PUBLIC_API_MODE || 'development'
const _isProductionMode = apiMode === 'production'
const isFrontendOnlyMode = apiMode === 'frontend-only'

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
      '@sidebase/nuxt-auth',
    ],

    // Client-side rendering only (SPA mode)
    ssr: true,

    // Auto imports
    imports: {
        dirs: [
            'composables/**',
            'modules/*/stores/**',
            'modules/*/composables/**',
            'foundation/stores/**',
            'foundation/composables/**',
            'foundation/utils'
        ],
    },
    devtools: {enabled: process.env.NODE_ENV !== 'production'},

    // App configuration
    app: {
        head: {
            title: 'Astar Management',
            meta: [
                {charset: 'utf-8'},
                {name: 'viewport', content: 'width=device-width, initial-scale=1'},
                {name: 'description', content: '法律事務所管理システム'},
            ],
            link: [
                {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
            ],
        },
    },

    // CSS
    css: ['~/assets/css/main.css'],

    // Runtime config
    runtimeConfig: {
        // Private keys (server-side only)
        authSecret: process.env.AUTH_SECRET || 'dev-secret-change-in-production',
        jwtSecret: process.env.JWT_SECRET,

        // Public keys (exposed to client)
        public: {
            apiMode: process.env.NUXT_PUBLIC_API_MODE || 'development',
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

    // Alias configuration
    alias: {
        '@modules': fileURLToPath(new URL('./app/modules', import.meta.url)),
        '@foundation': fileURLToPath(new URL('./app/foundation', import.meta.url)),
        '@shared': fileURLToPath(new URL('./app/shared', import.meta.url)),
        '@ui': fileURLToPath(new URL('./app/foundation/components/ui', import.meta.url))
    },


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
        preset: 'static',  // For SPA mode with static hosting
        esbuild: {
            options: {
                target: ['chrome91', 'firefox90', 'safari15'],
            },
        },
        // Proxy configuration for development (環境別に分岐)
        devProxy: isFrontendOnlyMode ? {} : {
            '/api/v1': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    },

    // Vite configuration
    vite: {
        define: {
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: process.env.NODE_ENV === 'development' ? 'true' : 'false',
        },
        plugins: [
            // @ts-expect-error - Plugin type compatibility issue with Vite v6
            tailwindAutoReference('./app/assets/css/main.css'),
            tailwindcss(),
            vueDevTools(),
        ],
        optimizeDeps: {
            include: ['zod', 'vee-validate'],
        },
        server: {
            watch: {
                usePolling: true,
                interval: 100,
            },
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

    // nuxt-auth configuration with AuthJS provider
    auth: {
        globalAppMiddleware: true,
        provider: {
            type: 'authjs',
            trustHost: false,
            defaultProvider: process.env.NODE_ENV === 'production' ? 'auth0' : undefined ,
            addDefaultCallbackUrl: true
        },
    },

    // ESLint
    eslint: {
        config: {
            stylistic: {
                indent: 4,
                quotes: 'single',
                semi: false,
            },
        },
    },

    // i18n configuration
    i18n: {
        vueI18n: '~/i18n.config.ts',
        defaultLocale: 'ja',
        detectBrowserLanguage: false,
        strategy: 'no_prefix',
    },

    // Pinia
    pinia: {
        storesDirs: ['./stores/**'],
    },

    // shadcn configuration
    shadcn: {
        prefix: '',
        componentDir: '~/foundation/components/ui'
    },
})