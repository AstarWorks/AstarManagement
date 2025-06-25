import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    includeSource: ['src/**/*.{js,ts}']
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