/**
 * Test Configuration Utilities
 * 
 * Centralized configuration for E2E tests including environment setup,
 * test data management, and browser-specific settings
 */

export interface TestConfig {
  baseURL: string
  apiURL: string
  timeout: {
    test: number
    action: number
    navigation: number
  }
  retries: number
  users: TestUsers
  browsers: BrowserConfig[]
}

export interface TestUsers {
  lawyer: TestUser
  clerk: TestUser
  client: TestUser
}

export interface TestUser {
  email: string
  password: string
  role: string
  displayName: string
}

export interface BrowserConfig {
  name: string
  viewport?: { width: number; height: number }
  userAgent?: string
  isMobile?: boolean
}

/**
 * Get test configuration based on environment
 */
export function getTestConfig(): TestConfig {
  const env = process.env.NODE_ENV || 'development'
  
  const baseConfig: TestConfig = {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    apiURL: process.env.API_URL || 'http://localhost:8080/api',
    timeout: {
      test: 60 * 1000, // 60 seconds
      action: 15 * 1000, // 15 seconds  
      navigation: 30 * 1000 // 30 seconds
    },
    retries: process.env.CI ? 2 : 0,
    users: {
      lawyer: {
        email: 'test.lawyer@example.com',
        password: 'TestPassword123!',
        role: 'lawyer',
        displayName: 'Test Lawyer'
      },
      clerk: {
        email: 'test.clerk@example.com',
        password: 'TestPassword123!', 
        role: 'clerk',
        displayName: 'Test Clerk'
      },
      client: {
        email: 'test.client@example.com',
        password: 'TestPassword123!',
        role: 'client',
        displayName: 'Test Client'
      }
    },
    browsers: [
      {
        name: 'chromium',
        viewport: { width: 1280, height: 720 }
      },
      {
        name: 'firefox',
        viewport: { width: 1280, height: 720 }
      },
      {
        name: 'webkit',
        viewport: { width: 1280, height: 720 }
      },
      {
        name: 'mobile-chrome',
        viewport: { width: 375, height: 812 },
        isMobile: true
      },
      {
        name: 'mobile-safari',
        viewport: { width: 375, height: 812 },
        isMobile: true
      }
    ]
  }
  
  // Environment-specific overrides
  switch (env) {
    case 'staging':
      return {
        ...baseConfig,
        baseURL: process.env.STAGING_URL || 'https://staging.astermanagement.com',
        apiURL: process.env.STAGING_API_URL || 'https://api-staging.astermanagement.com'
      }
      
    case 'production':
      return {
        ...baseConfig,
        baseURL: process.env.PROD_URL || 'https://astermanagement.com',
        apiURL: process.env.PROD_API_URL || 'https://api.astermanagement.com',
        retries: 3 // More retries in production
      }
      
    default:
      return baseConfig
  }
}

/**
 * Get browser-specific configuration
 */
export function getBrowserConfig(browserName: string): BrowserConfig | undefined {
  const config = getTestConfig()
  return config.browsers.find(browser => browser.name === browserName)
}

/**
 * Check if current test is running on mobile
 */
export function isMobileTest(browserName: string): boolean {
  const browserConfig = getBrowserConfig(browserName)
  return browserConfig?.isMobile ?? false
}

/**
 * Get test user for specific role
 */
export function getTestUser(role: keyof TestUsers): TestUser {
  const config = getTestConfig()
  return config.users[role]
}

/**
 * Environment detection utilities
 */
export const Environment = {
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isStaging: () => process.env.NODE_ENV === 'staging',
  isProduction: () => process.env.NODE_ENV === 'production',
  isCI: () => !!process.env.CI,
  isHeadless: () => process.env.HEADLESS !== 'false'
} as const

/**
 * Test data configuration
 */
export interface TestData {
  matters: TestMatter[]
  clients: TestClient[]
  documents: TestDocument[]
}

export interface TestMatter {
  id: string
  title: string
  status: 'INTAKE' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  clientName: string
  assignedLawyer?: string
  dueDate?: string
  createdAt: string
}

export interface TestClient {
  id: string
  name: string
  email: string
  phone: string
  company?: string
}

export interface TestDocument {
  id: string
  name: string
  type: 'contract' | 'correspondence' | 'evidence' | 'filing'
  matterId: string
  size: number
  uploadedAt: string
}

/**
 * Get test data for E2E tests
 */
export function getTestData(): TestData {
  return {
    matters: [
      {
        id: 'matter-e2e-1',
        title: 'Contract Dispute - ABC Corp',
        status: 'INTAKE',
        priority: 'HIGH',
        clientName: 'ABC Corporation',
        assignedLawyer: 'Test Lawyer',
        dueDate: '2025-07-15',
        createdAt: '2025-06-26T08:00:00Z'
      },
      {
        id: 'matter-e2e-2',
        title: 'Employment Law - Jane Doe',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM', 
        clientName: 'Jane Doe',
        assignedLawyer: 'Test Lawyer',
        dueDate: '2025-07-30',
        createdAt: '2025-06-20T09:00:00Z'
      },
      {
        id: 'matter-e2e-3',
        title: 'Intellectual Property - XYZ Ltd',
        status: 'REVIEW',
        priority: 'LOW',
        clientName: 'XYZ Limited',
        assignedLawyer: 'Test Lawyer',
        createdAt: '2025-06-15T10:00:00Z'
      }
    ],
    clients: [
      {
        id: 'client-e2e-1',
        name: 'ABC Corporation',
        email: 'contact@abccorp.com',
        phone: '+1-555-0101',
        company: 'ABC Corporation'
      },
      {
        id: 'client-e2e-2', 
        name: 'Jane Doe',
        email: 'jane.doe@email.com',
        phone: '+1-555-0102'
      }
    ],
    documents: [
      {
        id: 'doc-e2e-1',
        name: 'Contract_Agreement.pdf',
        type: 'contract',
        matterId: 'matter-e2e-1',
        size: 1024 * 1024, // 1MB
        uploadedAt: '2025-06-26T08:30:00Z'
      },
      {
        id: 'doc-e2e-2',
        name: 'Employment_Letter.pdf', 
        type: 'correspondence',
        matterId: 'matter-e2e-2',
        size: 512 * 1024, // 512KB
        uploadedAt: '2025-06-20T09:30:00Z'
      }
    ]
  }
}