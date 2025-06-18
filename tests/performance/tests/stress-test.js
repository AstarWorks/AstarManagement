import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { currentEnv, testConfig } from '../config/environments.js';
import { setupAuthentication, getAuthHeaders } from '../utils/auth.js';
import { createTestMatters, cleanupTestData } from '../utils/test-data.js';

// Stress test specific metrics
const systemBreakingPoint = new Trend('system_breaking_point');
const resourceExhaustion = new Rate('resource_exhaustion_rate');
const recoveryTime = new Trend('system_recovery_time');
const failureRate = new Rate('failure_rate');

export const options = {
  scenarios: {
    stress_test: testConfig.scenarios.stress_test
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // More lenient for stress test
    http_req_failed: ['rate<0.05'],   // Allow up to 5% failure rate during stress
    failure_rate: ['rate<0.1'],       // Overall failure rate should be under 10%
    system_recovery_time: ['p(95)<1000'] // System should recover within 1 second
  }
};

export function setup() {
  console.log('💥 Starting Stress Test - Finding System Breaking Point');
  console.log('⚠️  This test will push the system beyond normal operating conditions');
  
  const tokens = setupAuthentication();
  
  // Create larger test data pool for stress testing
  console.log('Creating extended test data pool for stress testing...');
  const testMatters = createTestMatters(tokens.lawyer, 100); // More test data for stress
  
  console.log(`✅ Created ${testMatters.length} test matters for stress testing`);
  
  return {
    tokens,
    testMatters: testMatters.map(m => m.id),
    stressStartTime: Date.now()
  };
}

export default function(data) {
  const { tokens, testMatters } = data;
  
  // Simulate aggressive user behavior under stress
  simulateStressScenario(tokens, testMatters);
  
  // Minimal sleep to maximize load
  sleep(0.1);
}

/**
 * Simulate aggressive stress scenario
 */
function simulateStressScenario(tokens, testMatters) {
  const scenario = Math.floor(Math.random() * 4);
  
  switch (scenario) {
    case 0:
      heavyDashboardLoad(tokens.lawyer);
      break;
    case 1:
      rapidStatusUpdates(tokens.lawyer, testMatters);
      break;
    case 2:
      intensiveSearchOperations(tokens.lawyer);
      break;
    case 3:
      massiveConcurrentCreation(tokens.lawyer);
      break;
  }
}

/**
 * Heavy dashboard loading - simulate users rapidly refreshing
 */
function heavyDashboardLoad(token) {
  const startTime = Date.now();
  
  // Rapid successive requests
  const requests = [];
  for (let i = 0; i < 5; i++) {
    requests.push([
      'GET',
      `${currentEnv.baseUrl}/v1/matters?page=${i}&size=50`,
      null,
      { headers: getAuthHeaders(token) }
    ]);
  }
  
  const responses = http.batch(requests);
  const endTime = Date.now();
  
  let successCount = 0;
  responses.forEach((response, index) => {
    const success = check(response, {
      [`batch request ${index} successful`]: (r) => r.status === 200
    });
    
    if (success) successCount++;
  });
  
  const successRate = successCount / responses.length;
  failureRate.add(1 - successRate);
  
  if (successRate < 0.8) {
    resourceExhaustion.add(1);
    systemBreakingPoint.add(endTime - startTime);
  } else {
    resourceExhaustion.add(0);
  }
}

/**
 * Rapid status updates - stress the database
 */
function rapidStatusUpdates(token, testMatters) {
  const startTime = Date.now();
  const statuses = ['INTAKE', 'RESEARCH', 'DRAFTING', 'REVIEW', 'FILED'];
  
  // Select multiple matters for rapid updates
  const selectedMatters = testMatters.slice(0, 5);
  const requests = [];
  
  selectedMatters.forEach(matterId => {
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    requests.push([
      'PUT',
      `${currentEnv.baseUrl}/v1/matters/${matterId}/status`,
      JSON.stringify({
        status: newStatus,
        notes: `Stress test rapid update to ${newStatus}`
      }),
      { headers: getAuthHeaders(token) }
    ]);
  });
  
  const responses = http.batch(requests);
  const endTime = Date.now();
  
  let successCount = 0;
  responses.forEach((response, index) => {
    const success = check(response, {
      [`status update ${index} successful`]: (r) => r.status === 200,
      [`status update ${index} not too slow`]: (r) => r.timings.duration < 1000
    });
    
    if (success) successCount++;
  });
  
  const successRate = successCount / responses.length;
  failureRate.add(1 - successRate);
  
  if (successRate < 0.7) {
    resourceExhaustion.add(1);
    systemBreakingPoint.add(endTime - startTime);
  } else {
    resourceExhaustion.add(0);
  }
}

/**
 * Intensive search operations - stress search infrastructure
 */
function intensiveSearchOperations(token) {
  const startTime = Date.now();
  
  // Multiple complex search queries
  const searchQueries = [
    'contract AND litigation',
    'Smith OR Johnson',
    'status:REVIEW priority:HIGH',
    '"intellectual property"',
    'client:*Corp*',
    'created:2024 status:FILED',
    'urgent AND merger',
    '"software license"'
  ];
  
  const requests = [];
  searchQueries.forEach(query => {
    requests.push([
      'GET',
      `${currentEnv.baseUrl}/v1/matters/search?q=${encodeURIComponent(query)}&limit=50`,
      null,
      { headers: getAuthHeaders(token) }
    ]);
  });
  
  const responses = http.batch(requests);
  const endTime = Date.now();
  
  let successCount = 0;
  responses.forEach((response, index) => {
    const success = check(response, {
      [`search query ${index} successful`]: (r) => r.status === 200,
      [`search query ${index} reasonable time`]: (r) => r.timings.duration < 2000
    });
    
    if (success) successCount++;
  });
  
  const successRate = successCount / responses.length;
  failureRate.add(1 - successRate);
  
  if (successRate < 0.6) {
    resourceExhaustion.add(1);
    systemBreakingPoint.add(endTime - startTime);
  } else {
    resourceExhaustion.add(0);
  }
}

/**
 * Massive concurrent creation - stress creation endpoints
 */
function massiveConcurrentCreation(token) {
  const startTime = Date.now();
  
  // Create multiple matters simultaneously
  const requests = [];
  for (let i = 0; i < 10; i++) {
    const newMatter = {
      caseNumber: `STRESS-${Date.now()}-${i}`,
      title: `Stress Test Concurrent Matter ${i}`,
      clientName: `Stress Client ${i}`,
      status: 'INTAKE',
      priority: 'MEDIUM',
      description: `Created during stress test batch ${i}`
    };
    
    requests.push([
      'POST',
      `${currentEnv.baseUrl}/v1/matters`,
      JSON.stringify(newMatter),
      { headers: getAuthHeaders(token) }
    ]);
  }
  
  const responses = http.batch(requests);
  const endTime = Date.now();
  
  let successCount = 0;
  const createdMatterIds = [];
  
  responses.forEach((response, index) => {
    const success = check(response, {
      [`matter creation ${index} successful`]: (r) => r.status === 201,
      [`matter creation ${index} has ID`]: (r) => r.json('id') !== undefined
    });
    
    if (success) {
      successCount++;
      try {
        createdMatterIds.push(response.json('id'));
      } catch (e) {
        // Ignore parsing errors during stress test
      }
    }
  });
  
  const successRate = successCount / requests.length;
  failureRate.add(1 - successRate);
  
  if (successRate < 0.5) {
    resourceExhaustion.add(1);
    systemBreakingPoint.add(endTime - startTime);
  } else {
    resourceExhaustion.add(0);
  }
  
  // Try to clean up created matters if possible
  if (createdMatterIds.length > 0) {
    setTimeout(() => {
      cleanupTestData(token, createdMatterIds);
    }, 1000);
  }
}

export function teardown(data) {
  console.log('🧹 Stress test cleanup and analysis...');
  
  const { tokens, testMatters, stressStartTime } = data;
  const testDuration = Date.now() - stressStartTime;
  
  console.log(`⏱️  Total stress test duration: ${Math.round(testDuration / 1000)} seconds`);
  
  // Measure system recovery time
  const recoveryStartTime = Date.now();
  
  // Test if system has recovered with a simple request
  const recoveryResponse = http.get(
    `${currentEnv.baseUrl}/v1/matters?page=0&size=1`,
    { headers: getAuthHeaders(tokens.lawyer) }
  );
  
  const recoveryDuration = Date.now() - recoveryStartTime;
  recoveryTime.add(recoveryDuration);
  
  const recovered = check(recoveryResponse, {
    'system recovered successfully': (r) => r.status === 200,
    'system recovery time acceptable': (r) => recoveryDuration < 1000
  });
  
  if (recovered) {
    console.log(`✅ System recovered in ${recoveryDuration}ms`);
  } else {
    console.log(`⚠️  System may need more time to recover`);
  }
  
  // Clean up test data
  cleanupTestData(tokens.lawyer, testMatters);
  
  console.log('💥 Stress test completed - Check metrics for breaking points');
}