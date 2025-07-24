import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { currentEnv, testConfig } from '../config/environments.js';
import { setupAuthentication, getAuthHeaders } from '../utils/auth.js';
import { createTestMatter, getSearchQueries } from '../utils/test-data.js';

// Custom metrics
const matterListingDuration = new Trend('matter_listing_duration');
const matterCreationDuration = new Trend('matter_creation_duration');
const matterUpdateDuration = new Trend('matter_update_duration');
const searchDuration = new Trend('search_duration');
const errorRate = new Rate('errors');

export const options = {
  scenarios: {
    baseline: testConfig.scenarios.baseline
  },
  thresholds: {
    ...testConfig.thresholds,
    matter_listing_duration: ['p(95)<150'], // Matter listing should be fast
    matter_creation_duration: ['p(95)<200'], // Matter creation under 200ms
    matter_update_duration: ['p(95)<100'],   // Updates should be very fast
    search_duration: ['p(95)<300'],          // Search under 300ms
    errors: ['rate<0.01']                    // Error rate under 1%
  }
};

// Setup function - runs once before all iterations
export function setup() {
  console.log('🚀 Starting Performance Baseline Tests');
  console.log(`Environment: ${__ENV.ENVIRONMENT || 'local'}`);
  console.log(`Base URL: ${currentEnv.baseUrl}`);
  
  // Authenticate and get tokens
  const tokens = setupAuthentication();
  
  // Create some test data for consistent baseline measurements
  console.log('Creating baseline test data...');
  const testMatters = [];
  
  for (let i = 0; i < 5; i++) {
    const matter = createTestMatter(tokens.lawyer, {
      title: `Baseline Test Matter ${i + 1}`,
      clientName: `Baseline Client ${i + 1}`
    });
    testMatters.push(matter);
  }
  
  console.log(`Created ${testMatters.length} baseline test matters`);
  
  return {
    tokens,
    testMatters
  };
}

// Main test function - runs for each virtual user
export default function(data) {
  const { tokens, testMatters } = data;
  
  // Test 1: Matter Listing Performance
  testMatterListing(tokens.lawyer);
  
  // Test 2: Matter Creation Performance  
  testMatterCreation(tokens.lawyer);
  
  // Test 3: Matter Status Update Performance
  if (testMatters.length > 0) {
    testMatterStatusUpdate(tokens.lawyer, testMatters[0].id);
  }
  
  // Test 4: Search Performance
  testSearchFunctionality(tokens.lawyer);
  
  // Test 5: Authentication Performance
  testAuthenticationPerformance();
  
  // Small delay between iterations
  sleep(1);
}

/**
 * Test matter listing endpoint performance
 */
function testMatterListing(token) {
  const startTime = Date.now();
  
  const response = http.get(
    `${currentEnv.baseUrl}/v1/matters`,
    { headers: getAuthHeaders(token) }
  );
  
  const duration = Date.now() - startTime;
  matterListingDuration.add(duration);
  
  const success = check(response, {
    'matter listing status 200': (r) => r.status === 200,
    'matter listing has matters array': (r) => {
      try {
        const body = r.json();
        return Array.isArray(body.matters) || Array.isArray(body.content);
      } catch {
        return false;
      }
    },
    'matter listing response time < 150ms': (r) => duration < 150
  });
  
  if (!success) {
    errorRate.add(1);
    console.error(`Matter listing failed: ${response.status} ${response.body}`);
  } else {
    errorRate.add(0);
  }
}

/**
 * Test matter creation performance
 */
function testMatterCreation(token) {
  const startTime = Date.now();
  
  const newMatter = {
    caseNumber: `PERF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: `Performance Test Matter ${Date.now()}`,
    clientName: 'Performance Test Client',
    status: 'INTAKE',
    priority: 'MEDIUM',
    description: 'Created during performance testing'
  };
  
  const response = http.post(
    `${currentEnv.baseUrl}/v1/matters`,
    JSON.stringify(newMatter),
    { headers: getAuthHeaders(token) }
  );
  
  const duration = Date.now() - startTime;
  matterCreationDuration.add(duration);
  
  const success = check(response, {
    'matter creation status 201': (r) => r.status === 201,
    'matter creation returns ID': (r) => r.json('id') !== undefined,
    'matter creation response time < 200ms': (r) => duration < 200
  });
  
  if (!success) {
    errorRate.add(1);
    console.error(`Matter creation failed: ${response.status} ${response.body}`);
  } else {
    errorRate.add(0);
  }
}

/**
 * Test matter status update performance
 */
function testMatterStatusUpdate(token, matterId) {
  const startTime = Date.now();
  
  const statusUpdate = {
    status: 'RESEARCH',
    notes: 'Updated during performance test'
  };
  
  const response = http.put(
    `${currentEnv.baseUrl}/v1/matters/${matterId}/status`,
    JSON.stringify(statusUpdate),
    { headers: getAuthHeaders(token) }
  );
  
  const duration = Date.now() - startTime;
  matterUpdateDuration.add(duration);
  
  const success = check(response, {
    'matter update status 200': (r) => r.status === 200,
    'matter update response time < 100ms': (r) => duration < 100
  });
  
  if (!success) {
    errorRate.add(1);
    console.error(`Matter update failed: ${response.status} ${response.body}`);
  } else {
    errorRate.add(0);
  }
}

/**
 * Test search functionality performance
 */
function testSearchFunctionality(token) {
  const queries = getSearchQueries();
  const query = queries[Math.floor(Math.random() * queries.length)];
  
  const startTime = Date.now();
  
  const response = http.get(
    `${currentEnv.baseUrl}/v1/matters/search?q=${encodeURIComponent(query.q)}`,
    { headers: getAuthHeaders(token) }
  );
  
  const duration = Date.now() - startTime;
  searchDuration.add(duration);
  
  const success = check(response, {
    'search status 200': (r) => r.status === 200,
    'search returns results': (r) => {
      try {
        const body = r.json();
        return Array.isArray(body.results) || Array.isArray(body.matters);
      } catch {
        return false;
      }
    },
    'search response time < 300ms': (r) => duration < 300
  });
  
  if (!success) {
    errorRate.add(1);
    console.error(`Search failed: ${response.status} ${response.body}`);
  } else {
    errorRate.add(0);
  }
}

/**
 * Test authentication endpoint performance
 */
function testAuthenticationPerformance() {
  const startTime = Date.now();
  
  const loginPayload = JSON.stringify({
    email: testConfig.testUsers.lawyer.email,
    password: testConfig.testUsers.lawyer.password
  });
  
  const response = http.post(
    `${currentEnv.baseUrl}/v1/auth/login`,
    loginPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const duration = Date.now() - startTime;
  
  const success = check(response, {
    'auth status 200': (r) => r.status === 200,
    'auth returns token': (r) => r.json('access_token') !== undefined,
    'auth response time < 200ms': (r) => duration < 200
  });
  
  if (!success) {
    errorRate.add(1);
    console.error(`Authentication failed: ${response.status} ${response.body}`);
  } else {
    errorRate.add(0);
  }
}

// Teardown function - runs once after all iterations
export function teardown(data) {
  console.log('🧹 Cleaning up baseline test data...');
  
  // Note: In a real scenario, we might want to clean up test data
  // For baseline tests, we'll leave the data for consistency
  
  console.log('✅ Baseline performance tests completed');
}