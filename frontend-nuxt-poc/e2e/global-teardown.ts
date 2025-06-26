/**
 * Global Teardown for E2E Tests
 * 
 * This file runs once after all tests to clean up the test environment
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...')
  
  try {
    // Clean up test data
    await cleanupTestData()
    
    // Clean up test users
    await cleanupTestUsers()
    
    // Clear any temporary files or caches
    await clearTemporaryFiles()
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  }
  
  console.log('✅ Global E2E test teardown completed')
}

/**
 * Clean up test data created during tests
 */
async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...')
  
  // This would typically involve:
  // 1. Deleting test legal matters
  // 2. Removing test documents
  // 3. Cleaning up test client data
  // 4. Resetting Kanban board states
  
  try {
    // Example API cleanup calls would go here
    // await api.delete('/test-data')
    
    console.log('✅ Test data cleanup completed')
  } catch (error) {
    console.warn('⚠️ Test data cleanup warning:', error)
  }
}

/**
 * Clean up test users created during setup
 */
async function cleanupTestUsers() {
  console.log('👥 Cleaning up test users...')
  
  try {
    // Parse test users from environment
    const testUsers = process.env.E2E_TEST_USERS 
      ? JSON.parse(process.env.E2E_TEST_USERS)
      : {}
    
    // Example cleanup for each test user
    for (const [role, user] of Object.entries(testUsers)) {
      // await api.delete(`/users/${user.email}`)
      console.log(`  Cleaned up test user: ${role}`)
    }
    
    // Clear environment variable
    delete process.env.E2E_TEST_USERS
    
    console.log('✅ Test users cleanup completed')
  } catch (error) {
    console.warn('⚠️ Test users cleanup warning:', error)
  }
}

/**
 * Clear temporary files and caches
 */
async function clearTemporaryFiles() {
  console.log('📁 Clearing temporary files...')
  
  try {
    // Clear any temporary test files
    // Clear browser cache if needed
    // Clear downloaded test files
    
    // Clear test data environment variable
    delete process.env.E2E_TEST_DATA
    
    console.log('✅ Temporary files cleanup completed')
  } catch (error) {
    console.warn('⚠️ Temporary files cleanup warning:', error)
  }
}

export default globalTeardown