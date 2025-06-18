import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { currentEnv, testConfig } from '../config/environments.js';
import { setupAuthentication, getAuthHeaders } from '../utils/auth.js';
import { createTestMatters, updateMatterStatus, cleanupTestData } from '../utils/test-data.js';

// Custom metrics
const concurrentOperations = new Counter('concurrent_operations_total');
const statusTransitions = new Counter('status_transitions_total');
const kanbanUpdates = new Rate('kanban_update_success_rate');
const concurrentUserLatency = new Trend('concurrent_user_latency');

export const options = {
  scenarios: {
    load_test: testConfig.scenarios.normal_load
  },
  thresholds: {
    ...testConfig.thresholds,
    concurrent_user_latency: ['p(95)<200'],
    kanban_update_success_rate: ['rate>0.95'], // 95% success rate for updates
    status_transitions_total: ['count>100'],   // At least 100 status transitions
    http_req_duration: ['p(95)<200', 'p(99)<500'] // Stricter thresholds for load test
  }
};

export function setup() {
  console.log('🔥 Starting Load Test - Normal Traffic Simulation');
  console.log(`Target: ${testConfig.scenarios.normal_load.stages.map(s => s.target).join(' → ')} concurrent users`);
  
  const tokens = setupAuthentication();
  
  // Create test data pool for concurrent operations
  console.log('Creating test data pool for load testing...');
  const testMatters = createTestMatters(tokens.lawyer, 50); // Create 50 matters for load testing
  
  console.log(`✅ Created ${testMatters.length} test matters for load testing`);
  
  return {
    tokens,
    testMatters: testMatters.map(m => m.id)
  };
}

export default function(data) {
  const { tokens, testMatters } = data;
  
  // Simulate realistic user behavior patterns
  const userType = Math.random() < 0.7 ? 'lawyer' : 'clerk'; // 70% lawyers, 30% clerks
  const token = tokens[userType];
  
  // Different behavior patterns based on user type
  if (userType === 'lawyer') {
    simulateLawyerWorkflow(token, testMatters);
  } else {
    simulateClerkWorkflow(token, testMatters);
  }
  
  // Random think time between operations (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

/**
 * Simulate typical lawyer workflow
 */
function simulateLawyerWorkflow(token, testMatters) {
  const startTime = Date.now();
  
  // 1. Check matter dashboard (high frequency)
  loadMatterDashboard(token);
  
  // 2. Drill into specific matters (medium frequency)
  if (Math.random() < 0.6) {
    const matterId = testMatters[Math.floor(Math.random() * testMatters.length)];
    viewMatterDetails(token, matterId);
  }
  
  // 3. Update matter status (lower frequency, high impact)
  if (Math.random() < 0.3) {
    const matterId = testMatters[Math.floor(Math.random() * testMatters.length)];
    performStatusUpdate(token, matterId);
  }
  
  // 4. Search for matters (periodic)
  if (Math.random() < 0.4) {
    performMatterSearch(token);
  }
  
  // 5. Create new matter (infrequent but important)
  if (Math.random() < 0.1) {
    createNewMatter(token);
  }
  
  const totalLatency = Date.now() - startTime;
  concurrentUserLatency.add(totalLatency);
  concurrentOperations.add(1);
}

/**
 * Simulate typical clerk workflow
 */
function simulateClerkWorkflow(token, testMatters) {
  const startTime = Date.now();
  
  // 1. Check assigned matters (high frequency)
  loadMatterDashboard(token);
  
  // 2. Administrative updates (medium frequency)
  if (Math.random() < 0.5) {
    const matterId = testMatters[Math.floor(Math.random() * testMatters.length)];
    viewMatterDetails(token, matterId);
  }
  
  // 3. Status updates (frequent for clerks)
  if (Math.random() < 0.4) {
    const matterId = testMatters[Math.floor(Math.random() * testMatters.length)];
    performStatusUpdate(token, matterId);
  }
  
  // 4. Search and review (periodic)
  if (Math.random() < 0.3) {
    performMatterSearch(token);
  }
  
  const totalLatency = Date.now() - startTime;
  concurrentUserLatency.add(totalLatency);
  concurrentOperations.add(1);
}

/**
 * Load matter dashboard - most frequent operation
 */
function loadMatterDashboard(token) {
  const response = http.get(
    `${currentEnv.baseUrl}/v1/matters?page=0&size=20&sort=updatedAt,desc`,
    { headers: getAuthHeaders(token) }
  );
  
  check(response, {
    'dashboard loaded successfully': (r) => r.status === 200,
    'dashboard response time acceptable': (r) => r.timings.duration < 200
  });
}

/**
 * View matter details
 */
function viewMatterDetails(token, matterId) {
  const response = http.get(
    `${currentEnv.baseUrl}/v1/matters/${matterId}`,
    { headers: getAuthHeaders(token) }
  );
  
  check(response, {
    'matter details loaded': (r) => r.status === 200,
    'matter has required fields': (r) => {
      try {
        const matter = r.json();
        return matter.id && matter.title && matter.status;
      } catch {
        return false;
      }
    }
  });
}

/**
 * Perform status update - critical operation
 */
function performStatusUpdate(token, matterId) {
  const statuses = ['INTAKE', 'RESEARCH', 'DRAFTING', 'REVIEW', 'FILED'];
  const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  const updatePayload = JSON.stringify({
    status: newStatus,
    notes: `Status updated during load test to ${newStatus}`
  });
  
  const response = http.put(
    `${currentEnv.baseUrl}/v1/matters/${matterId}/status`,
    updatePayload,
    { headers: getAuthHeaders(token) }
  );
  
  const success = check(response, {
    'status update successful': (r) => r.status === 200,
    'status update response time acceptable': (r) => r.timings.duration < 150
  });
  
  if (success) {
    kanbanUpdates.add(1);
    statusTransitions.add(1);
  } else {
    kanbanUpdates.add(0);
  }
}

/**
 * Perform matter search
 */
function performMatterSearch(token) {
  const searchTerms = [
    'contract', 'Smith', 'litigation', 'review', 'urgent',
    'property', 'merger', 'compliance', 'Johnson', 'draft'
  ];
  
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  const response = http.get(
    `${currentEnv.baseUrl}/v1/matters/search?q=${encodeURIComponent(searchTerm)}&limit=10`,
    { headers: getAuthHeaders(token) }
  );
  
  check(response, {
    'search completed successfully': (r) => r.status === 200,
    'search response time acceptable': (r) => r.timings.duration < 300
  });
}

/**
 * Create new matter
 */
function createNewMatter(token) {
  const newMatter = {
    caseNumber: `LOAD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: `Load Test Matter ${Date.now()}`,
    clientName: `Load Test Client ${Math.floor(Math.random() * 1000)}`,
    status: 'INTAKE',
    priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
    description: 'Matter created during load testing'
  };
  
  const response = http.post(
    `${currentEnv.baseUrl}/v1/matters`,
    JSON.stringify(newMatter),
    { headers: getAuthHeaders(token) }
  );
  
  check(response, {
    'matter created successfully': (r) => r.status === 201,
    'matter creation response time acceptable': (r) => r.timings.duration < 250
  });
}

export function teardown(data) {
  console.log('🧹 Load test cleanup starting...');
  
  const { tokens, testMatters } = data;
  
  // Clean up test data created during load testing
  cleanupTestData(tokens.lawyer, testMatters);
  
  console.log('✅ Load test completed and cleaned up');
}