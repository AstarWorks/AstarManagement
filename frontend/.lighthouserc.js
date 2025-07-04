export default {
  ci: {
    // Collection configuration
    collect: {
      startServerCommand: 'bun run build && bun run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 120000, // 2 minutes for build + startup
      url: [
        // Critical pages for legal case management
        'http://localhost:3000/',
        'http://localhost:3000/kanban',
        'http://localhost:3000/matters',
        'http://localhost:3000/login',
        'http://localhost:3000/matters/new',
      ],
      numberOfRuns: 3, // Run each URL 3 times for more reliable results
      settings: {
        // Use desktop settings by default
        preset: 'desktop',
        // Override specific settings
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
        // Screen dimensions for desktop
        screenEmulation: {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          mobile: false,
        },
      },
      // Also collect mobile metrics
      mobileSettings: {
        preset: 'mobile',
        throttling: {
          cpuSlowdownMultiplier: 4,
        },
      },
    },

    // Assertion configuration for performance budgets
    assert: {
      assertions: {
        // Core Web Vitals targets
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }], // 2.5s
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }], // 1.8s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // 300ms
        'interactive': ['warn', { maxNumericValue: 3800 }], // 3.8s TTI
        
        // Performance score thresholds
        'categories:performance': ['error', { minScore: 0.85 }], // 85% minimum
        'categories:accessibility': ['error', { minScore: 0.95 }], // 95% minimum
        'categories:best-practices': ['warn', { minScore: 0.90 }], // 90% minimum
        'categories:seo': ['warn', { minScore: 0.90 }], // 90% minimum
        
        // Bundle size constraints
        'resource-summary:script:size': ['warn', { maxNumericValue: 200000 }], // 200KB JS
        'resource-summary:total:size': ['warn', { maxNumericValue: 500000 }], // 500KB total
        
        // Critical rendering path
        'critical-request-chains': ['warn', { maxLength: 3 }],
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',
        
        // JavaScript execution
        'bootup-time': ['warn', { maxNumericValue: 2000 }], // 2s JS boot time
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 3000 }], // 3s main thread
        
        // Network efficiency
        'uses-text-compression': 'error',
        'uses-responsive-images': 'warn',
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'offscreen-images': 'warn',
        
        // Caching strategies
        'uses-long-cache-ttl': 'warn',
        'max-potential-fid': ['warn', { maxNumericValue: 100 }], // 100ms FID
        
        // Accessibility specific
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'button-name': 'error',
        'link-name': 'error',
        
        // Legal app specific - form performance
        'form-field-multiple-labels': 'error',
        'input-image-alt': 'error',
        
        // Memory and runtime performance
        'dom-size': ['warn', { maxNumericValue: 1500 }], // 1500 DOM nodes
      },
    },

    // Upload configuration for CI/CD
    upload: {
      target: 'temporary-public-storage', // Use 'lhci' for self-hosted server
      // For GitHub Actions integration
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
      githubToken: process.env.GITHUB_TOKEN,
    },

    // Server configuration (if using LHCI server)
    server: {
      // port: 9001,
      // storage: {
      //   storageMethod: 'sql',
      //   sqlDialect: 'sqlite',
      //   sqlDatabasePath: './lhci.db',
      // },
    },
  },
}