import http from 'k6/http';
import { check } from 'k6';
import { currentEnv } from '../config/environments.js';
import { getAuthHeaders } from './auth.js';

/**
 * Create test matter data
 * @param {string} token - JWT access token
 * @param {object} overrides - Optional property overrides
 * @returns {object} Created matter data
 */
export function createTestMatter(token, overrides = {}) {
  const defaultMatter = {
    caseNumber: `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: `Performance Test Matter ${Date.now()}`,
    clientName: 'Test Client Corporation',
    status: 'INTAKE',
    priority: 'MEDIUM',
    description: 'This is a test matter created for performance testing purposes.',
    assignedLawyerId: null, // Will be set by backend based on authenticated user
    ...overrides
  };

  const response = http.post(
    `${currentEnv.baseUrl}/v1/matters`,
    JSON.stringify(defaultMatter),
    { headers: getAuthHeaders(token) }
  );

  const success = check(response, {
    'matter created successfully': (r) => r.status === 201,
    'matter has valid ID': (r) => r.json('id') !== undefined
  });

  if (!success) {
    throw new Error(`Failed to create test matter: ${response.status} ${response.body}`);
  }

  return response.json();
}

/**
 * Create multiple test matters
 * @param {string} token - JWT access token
 * @param {number} count - Number of matters to create
 * @returns {Array} Array of created matter objects
 */
export function createTestMatters(token, count = 10) {
  const matters = [];
  const statuses = ['INTAKE', 'RESEARCH', 'DRAFTING', 'REVIEW', 'FILED'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  
  for (let i = 0; i < count; i++) {
    const matter = createTestMatter(token, {
      title: `Bulk Test Matter ${i + 1}`,
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length],
      clientName: `Test Client ${i + 1}`
    });
    matters.push(matter);
  }
  
  return matters;
}

/**
 * Update matter status
 * @param {string} token - JWT access token
 * @param {string} matterId - Matter ID to update
 * @param {string} newStatus - New status to set
 * @returns {object} Updated matter data
 */
export function updateMatterStatus(token, matterId, newStatus) {
  const updatePayload = JSON.stringify({
    status: newStatus,
    notes: `Status updated to ${newStatus} during performance test`
  });

  const response = http.put(
    `${currentEnv.baseUrl}/v1/matters/${matterId}/status`,
    updatePayload,
    { headers: getAuthHeaders(token) }
  );

  const success = check(response, {
    'status updated successfully': (r) => r.status === 200,
    'status matches expected': (r) => r.json('status') === newStatus
  });

  if (!success) {
    throw new Error(`Failed to update matter status: ${response.status} ${response.body}`);
  }

  return response.json();
}

/**
 * Clean up test data
 * @param {string} token - JWT access token
 * @param {Array} matterIds - Array of matter IDs to delete
 */
export function cleanupTestData(token, matterIds) {
  console.log(`Cleaning up ${matterIds.length} test matters...`);
  
  let deletedCount = 0;
  
  for (const matterId of matterIds) {
    try {
      const response = http.del(
        `${currentEnv.baseUrl}/v1/matters/${matterId}`,
        null,
        { headers: getAuthHeaders(token) }
      );
      
      if (response.status === 204 || response.status === 200) {
        deletedCount++;
      }
    } catch (error) {
      console.warn(`Failed to delete matter ${matterId}:`, error.message);
    }
  }
  
  console.log(`Successfully deleted ${deletedCount}/${matterIds.length} test matters`);
}

/**
 * Generate realistic search queries for testing
 * @returns {Array} Array of search query objects
 */
export function getSearchQueries() {
  return [
    { q: 'contract', type: 'title' },
    { q: 'Smith', type: 'client' },
    { q: 'INTAKE', type: 'status' },
    { q: 'urgent', type: 'priority' },
    { q: '2024', type: 'year' },
    { q: 'litigation', type: 'general' },
    { q: 'intellectual property', type: 'general' },
    { q: 'merger', type: 'title' },
    { q: 'Johnson', type: 'client' },
    { q: 'REVIEW', type: 'status' }
  ];
}