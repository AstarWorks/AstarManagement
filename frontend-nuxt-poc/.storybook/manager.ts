import { addons } from '@storybook/manager-api'
import { themes } from '@storybook/theming'

addons.setConfig({
  theme: {
    ...themes.dark,
    brandTitle: 'Aster Management UI',
    brandUrl: '/',
    brandImage: undefined,
    brandTarget: '_self',
    
    // UI
    appBg: '#09090b',
    appContentBg: '#0a0a0a',
    appBorderColor: '#27272a',
    appBorderRadius: 8,
    
    // Typography
    fontBase: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontCode: '"JetBrains Mono", "SF Mono", Monaco, monospace',
    
    // Text colors
    textColor: '#fafafa',
    textInverseColor: '#09090b',
    
    // Toolbar colors
    barTextColor: '#a1a1aa',
    barSelectedColor: '#3b82f6',
    barBg: '#0a0a0a',
    
    // Form colors
    inputBg: '#18181b',
    inputBorder: '#27272a',
    inputTextColor: '#fafafa',
    inputBorderRadius: 6
  }
})