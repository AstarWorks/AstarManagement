import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import prettierConfig from 'eslint-config-prettier'
import storybookPlugin from 'eslint-plugin-storybook'

export default createConfigForNuxt({
  features: {
    // Enable stylistic rules for better code consistency
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
  },
  dirs: {
    src: [
      './app/components',
      './app/composables',
      './app/layouts',
      './app/middleware',
      './app/pages',
      './app/plugins',
      './app/stores',
      './app/utils',
      './app/types',
      './app/schemas',
    ],
  },
})
  .prepend(
    // Global ignores - these files/dirs will be ignored by all rules
    {
      ignores: [
        'dist/**/*',
        'node_modules/**/*',
        '.nuxt/**/*',
        '.output/**/*',
        'coverage/**/*',
        'storybook-static/**/*',
        'playwright-report/**/*',
        'test-results/**/*',
        '**/*.d.ts',
      ],
    }
  )
  .append(
    // Prettier config to disable conflicting ESLint rules
    prettierConfig,
    // Vue.js specific rules
    {
      files: ['**/*.vue'],
      rules: {
        // Vue component naming
        'vue/component-name-in-template-casing': ['error', 'PascalCase'],
        'vue/custom-event-name-casing': ['error', 'camelCase'],
        'vue/component-definition-name-casing': ['error', 'PascalCase'],
        
        // Allow single-word component names for UI library components
        'vue/multi-word-component-names': ['error', {
          ignores: [
            // UI Components (shadcn-vue style)
            'Alert', 'Avatar', 'Badge', 'Breadcrumb', 'Button', 
            'Calendar', 'Card', 'Checkbox', 'Collapsible', 'Command',
            'Dialog', 'Input', 'Label', 'Popover', 'Select',
            'Separator', 'Sheet', 'Skeleton', 'Table', 'Tabs',
            'Textarea', 'Toggle', 'Tooltip',
            // Page names
            'index', 'login', 'dashboard', 'unauthorized', 'kanban',
            // Layout names
            'default', 'auth'
          ]
        }],
        
        // Vue composition API preferences
        'vue/prefer-define-options': 'error',
        'vue/prefer-separate-static-class': 'error',
        'vue/prefer-true-attribute-shorthand': 'error',
        
        // Vue template formatting
        'vue/html-self-closing': ['error', {
          'html': {
            'void': 'always',
            'normal': 'always',
            'component': 'always',
          },
          'svg': 'always',
          'math': 'always',
        }],
        'vue/max-attributes-per-line': ['error', {
          'singleline': { 'max': 3 },
          'multiline': { 'max': 1 },
        }],
        
        // Accessibility rules
        'vue/require-explicit-emits': 'error',
        'vue/v-on-event-hyphenation': ['error', 'always'],
      },
    },
    // TypeScript specific rules
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // TypeScript preferences for legal domain
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { 
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
        }],
        
        // Naming conventions for legal entities
        '@typescript-eslint/naming-convention': [
          'error',
          {
            'selector': 'interface',
            'format': ['PascalCase'],
            'prefix': ['I'],
          },
          {
            'selector': 'typeAlias',
            'format': ['PascalCase'],
          },
          {
            'selector': 'enum',
            'format': ['PascalCase'],
          },
          {
            'selector': 'enumMember',
            'format': ['UPPER_CASE'],
          },
        ],
      },
    },
    // Storybook specific rules
    {
      files: ['**/*.stories.@(js|jsx|ts|tsx)'],
      plugins: {
        storybook: storybookPlugin,
      },
      rules: {
        'storybook/hierarchy-separator': 'error',
        'storybook/default-exports': 'error',
        'storybook/story-exports': 'error',
        'storybook/no-redundant-story-name': 'error',
      },
    },
    // Test files specific rules
    {
      files: ['**/*.test.@(js|ts)', '**/*.spec.@(js|ts)', '**/test/**/*', '**/tests/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
    // Legal domain specific rules
    {
      files: ['**/*'],
      rules: {
        // Enforce explicit error handling (important for legal systems)
        'prefer-promise-reject-errors': 'error',
        'no-throw-literal': 'error',
        
        // Security-related rules for legal data
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        
        // Data consistency rules
        'eqeqeq': ['error', 'always'],
        'no-implicit-coercion': 'error',
        
        // Code organization
        'prefer-const': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        
        // Prevent common mistakes in legal domain
        'no-duplicate-case': 'error',
        'no-fallthrough': 'error',
        'default-case': 'error',
      },
    }
  )