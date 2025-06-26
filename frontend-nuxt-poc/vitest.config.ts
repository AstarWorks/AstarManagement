import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    includeSource: ['src/**/*.{js,ts}'],
    testTimeout: 10000, // Increase timeout to 10 seconds
    hookTimeout: 10000, // Increase hook timeout
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/types/**',
        '**/*.stories.{js,ts}',
        'src/test/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true // Help with async test issues
      }
    }
  },
  define: {
    'import.meta.vitest': 'undefined'
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
      '@': resolve(__dirname, './src')
    }
  }
})