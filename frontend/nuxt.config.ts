// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'
import tailwindcss from "@tailwindcss/vite";
import tailwindAutoReference from 'vite-plugin-vue-tailwind-auto-reference';
import vueDevTools from 'vite-plugin-vue-devtools'

// 環境変数の取得
const apiMode = process.env.NUXT_PUBLIC_API_MODE || 'development'
const isProductionMode = apiMode === 'production'
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
    ssr: false,

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

    // Alias configuration
    alias: {
        '@modules': fileURLToPath(new URL('./app/modules', import.meta.url)),
        '@foundation': fileURLToPath(new URL('./app/foundation', import.meta.url)),
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
            tailwindAutoReference('assets/css/main.css'),
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

    // nuxt-auth configuration (環境別に分岐)
    auth: {
        baseURL: isFrontendOnlyMode ? '/api/mock/auth' : '/api/v1/auth',
        provider: isProductionMode ? {
            // Auth0設定（本番環境）
            type: 'auth0',
            domain: process.env.AUTH0_DOMAIN,
            clientId: process.env.AUTH0_CLIENT_ID,
            clientSecret: process.env.AUTH0_CLIENT_SECRET,
            audience: process.env.AUTH0_AUDIENCE
        } : {
            // Local/Mock設定（開発環境・フロントエンド単体）
            type: 'local',
            runtimeConfig: {
                baseURL: isFrontendOnlyMode ? '/api/mock' : '/api/v1'
            },
            endpoints: {
                signIn: { path: '/login', method: 'post' },
                signOut: { path: '/logout', method: 'post' },
                signUp: { path: '/register', method: 'post' },
                getSession: { path: '/validate', method: 'get' }
            },
            token: {
                signInResponseTokenPointer: '/token',
                type: 'Bearer',
                cookieName: 'auth.token',
                headerName: 'Authorization',
                maxAgeInSeconds: 60 * 60 * 24 * 30, // 30 days
                sameSiteAttribute: 'lax' as const
            },
            refresh: {
                isEnabled: true,
                endpoint: { path: '/refresh', method: 'post' },
                refreshOnlyToken: true,
                token: {
                    signInResponseRefreshTokenPointer: '/refreshToken',
                    refreshRequestTokenPointer: '/refreshToken',
                    cookieName: 'auth.refresh-token',
                    maxAgeInSeconds: 60 * 60 * 24 * 30
                }
            },
            sessionDataType: {
                id: 'string',
                email: 'string',
                name: 'string',
                role: 'string'
            }
        },
        sessionRefresh: {
            enablePeriodically: 5 * 60 * 1000,
            enableOnWindowFocus: true
        },
        globalAppMiddleware: false
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