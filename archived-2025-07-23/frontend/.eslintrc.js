module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  extends: [
    '@nuxt/eslint-config',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: [
    'vue',
    '@typescript-eslint'
  ],
  rules: {
    // Vue 3 Composition API specific rules
    'vue/no-deprecated-slot-attribute': 'error',
    'vue/no-deprecated-slot-scope-attribute': 'error',
    'vue/prefer-import-from-vue': 'error',
    'vue/no-export-in-script-setup': 'error',
    'vue/script-setup-uses-vars': 'error',
    'vue/no-setup-props-destructure': 'error',
    
    // Vue 3 Template syntax rules
    'vue/require-default-prop': 'off', // Not needed with TypeScript
    'vue/require-prop-types': 'off', // Not needed with TypeScript
    'vue/prop-name-casing': ['error', 'camelCase'],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/no-v-html': 'warn',
    'vue/html-self-closing': ['error', {
      html: {
        void: 'always',
        normal: 'always',
        component: 'always'
      },
      svg: 'always',
      math: 'always'
    }],
    
    // Vue 3 Accessibility rules
    'vue/require-toggle-inside-transition': 'error',
    'vue/no-static-inline-styles': 'warn',
    'vue/html-button-has-type': 'error',
    'vue/no-required-prop-with-default': 'error',
    
    // Vue 3 Performance rules
    'vue/no-useless-v-bind': 'error',
    'vue/no-useless-mustaches': 'error',
    'vue/no-useless-concat': 'error',
    'vue/prefer-separate-static-class': 'error',
    
    // TypeScript specific rules for Vue 3
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // Nuxt 3 specific rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    
    // General code quality rules
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': 'off', // Conflicts with prettier
    'indent': 'off', // Handled by prettier
    
    // Import rules for better organization
    'sort-imports': ['error', {
      ignoreCase: false,
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      allowSeparatedGroups: true
    }]
  },
  overrides: [
    {
      // TypeScript files
      files: ['*.ts', '*.tsx', '*.vue'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    },
    {
      // Vue files specific rules
      files: ['*.vue'],
      rules: {
        // Allow single word component names in pages directory
        'vue/multi-word-component-names': 'off'
      }
    },
    {
      // Nuxt pages and layouts
      files: ['src/pages/**/*.vue', 'src/layouts/**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off'
      }
    },
    {
      // Test files
      files: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
      env: {
        vitest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      // Storybook files
      files: ['**/*.stories.ts', '**/*.stories.js'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'vue/multi-word-component-names': 'off'
      }
    }
  ],
  ignorePatterns: [
    'dist',
    'node_modules',
    '.nuxt',
    '.output',
    'storybook-static',
    '*.min.js'
  ]
}