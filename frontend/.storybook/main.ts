import type { StorybookConfig } from '@storybook-vue/nuxt';
import { fileURLToPath, URL } from 'node:url'

const config: StorybookConfig = {
  "stories": [
    "../components/**/*.mdx",
    "../app/**/components/**/*.stories.@(js|jsx|ts|tsx|mdx|vue)",
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  "framework": {
    "name": "@storybook-vue/nuxt",
    "options": {}
  },

  viteFinal: async (config) => {
    // config.resolveがundefinedの場合、空のオブジェクトをセットする
    config.resolve = config.resolve ?? {}

    // これで config.resolve は必ずオブジェクトになるので、安全にaliasにアクセスできる
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': fileURLToPath(new URL('../app', import.meta.url)),
      '~': fileURLToPath(new URL('../app', import.meta.url)),
      '@modules': fileURLToPath(new URL('../app/modules', import.meta.url)),
      '@foundation': fileURLToPath(new URL('../app/foundation', import.meta.url)),
      '@shared': fileURLToPath(new URL('../app/shared', import.meta.url)),
      '@ui': fileURLToPath(new URL('../app/foundation/components/ui', import.meta.url)),
    }
    return config
  },
}
export default config;