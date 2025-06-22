import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/**/*.story.@(js|jsx|ts|tsx|mdx)',
    '../components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../components/**/*.story.@(js|jsx|ts|tsx|mdx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    'storybook-dark-mode',
    '@storybook/addon-viewport'
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  core: {
    builder: '@storybook/builder-vite'
  },
  typescript: {
    check: false,
    reactDocgen: false
  },
  viteFinal: async (config) => {
    // Add Nuxt aliases
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': new URL('../', import.meta.url).pathname,
      '@': new URL('../', import.meta.url).pathname
    }
    
    // Ensure CSS is handled properly
    config.css = config.css || {}
    config.css.modules = {
      localsConvention: 'camelCase'
    }
    
    return config
  }
}

export default config