import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: [
    '../app/components/**/*.stories.@(js|jsx|ts|tsx|vue)',
    '../stories/**/*.stories.@(js|jsx|ts|tsx|vue)',
  ],
  staticDirs: ['./static'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    'msw-storybook-addon',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  async viteFinal(config) {
    // Nuxtのalias設定を追加
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': require('path').resolve(__dirname, '../app'),
      '@': require('path').resolve(__dirname, '../app'),
      '#app': require('path').resolve(__dirname, '../app'),
    }
    return config
  },
  features: {
    buildStoriesJson: true,
    interactionsDebugger: true,
  },
  typescript: {
    check: true,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
}

export default config