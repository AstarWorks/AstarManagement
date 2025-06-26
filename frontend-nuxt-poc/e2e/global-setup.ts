/**
 * Global Setup for E2E Tests
 * 
 * This file runs once before all tests to prepare the test environment
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...')
  
  const { baseURL } = config.projects[0].use
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the development server to be ready
    console.log(`⏳ Waiting for dev server at ${baseURL}...`)
    await page.goto(baseURL!)
    await page.waitForLoadState('networkidle')
    
    // Verify the app is properly loaded
    await page.waitForSelector('body', { timeout: 30000 })
    console.log('✅ Dev server is ready')
    
    // Set up test user authentication state if needed
    // This can be used to pre-authenticate users for faster test execution
    await setupTestAuthentication(page)
    
    // Initialize test data if needed
    await initializeTestData()
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
  
  console.log('✅ Global E2E test setup completed')
}

/**
 * Set up authentication state for test users
 */
async function setupTestAuthentication(page: any) {
  // This would typically involve:
  // 1. Creating test users via API
  // 2. Storing authentication tokens/cookies
  // 3. Setting up different user roles (lawyer, clerk, client)
  
  console.log('🔐 Setting up test authentication...')
  
  // For now, we'll prepare the authentication setup structure
  // In a real implementation, this would make API calls to create test users
  
  // Example structure for different user roles:
  const testUsers = {
    lawyer: {
      email: 'test.lawyer@example.com',
      password: 'TestPassword123!',
      role: 'lawyer'
    },
    clerk: {
      email: 'test.clerk@example.com', 
      password: 'TestPassword123!',
      role: 'clerk'
    },
    client: {
      email: 'test.client@example.com',
      password: 'TestPassword123!',
      role: 'client'
    }
  }
  
  // Store test user data for tests to use
  process.env.E2E_TEST_USERS = JSON.stringify(testUsers)
  
  console.log('✅ Test authentication setup completed')
}

/**
 * Initialize test data
 */
async function initializeTestData() {
  console.log('📊 Initializing test data...')
  
  // This would typically involve:
  // 1. Creating test legal matters
  // 2. Setting up test documents
  // 3. Preparing test client data
  // 4. Initializing Kanban board states
  
  // For now, we'll prepare the structure
  const testData = {
    matters: [
      {
        id: 'test-matter-1',
        title: 'Test Legal Matter 1',
        status: 'INTAKE',
        clientName: 'Test Client 1',
        priority: 'HIGH'
      },
      {
        id: 'test-matter-2', 
        title: 'Test Legal Matter 2',
        status: 'IN_PROGRESS',
        clientName: 'Test Client 2',
        priority: 'MEDIUM'
      }
    ]
  }
  
  // Store test data for tests to use
  process.env.E2E_TEST_DATA = JSON.stringify(testData)
  
  console.log('✅ Test data initialization completed')
}

export default globalSetup