import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { themes } from '@storybook/theming'

// Import global styles
import '../src/assets/css/main.css'

// Setup app-level providers
setup((app) => {
  // Add Pinia for state management
  app.use(createPinia())
  
  // Mock router for components that use routing
  const router = createRouter({
    history: createWebHistory(),
    routes: []
  })
  app.use(router)
})

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    darkMode: {
      dark: { ...themes.dark, appBg: '#09090b', brandTitle: 'Aster Management' },
      light: { ...themes.normal, appBg: '#ffffff', brandTitle: 'Aster Management' },
      current: 'light',
      stylePreview: true,
      darkClass: 'dark',
      lightClass: 'light',
      classTarget: 'html'
    },
    docs: {
      theme: themes.dark
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' }
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' }
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' }
        },
        wide: {
          name: 'Wide Screen',
          styles: { width: '1920px', height: '1080px' }
        }
      }
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff'
        },
        {
          name: 'dark',
          value: '#09090b'
        },
        {
          name: 'gray',
          value: '#f3f4f6'
        }
      ]
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div class="p-6 min-h-[400px]"><story /></div>'
    })
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: ['light', 'dark'],
        showName: true
      }
    }
  },
  tags: ['autodocs']
}

export default preview