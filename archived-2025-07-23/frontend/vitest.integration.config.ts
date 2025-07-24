import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/integration/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    include: ['tests/integration/**/*.test.ts'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  define: {
    'import.meta.vitest': 'undefined'
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
      '@': resolve(__dirname, './src'),
      '@/test': resolve(__dirname, './tests')
    }
  }
})