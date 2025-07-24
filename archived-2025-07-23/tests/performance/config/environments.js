// Environment configuration for performance tests
export const environments = {
  local: {
    baseUrl: 'http://localhost:8080',
    frontendUrl: 'http://localhost:3000',
    database: 'postgresql://localhost:5432/astermanagement_test'
  },
  staging: {
    baseUrl: 'https://staging-api.astermanagement.dev',
    frontendUrl: 'https://staging.astermanagement.dev',
    database: 'postgresql://staging-db:5432/astermanagement'
  },
  production: {
    baseUrl: 'https://api.astermanagement.com',
    frontendUrl: 'https://app.astermanagement.com',
    database: null // Production DB not accessible from tests
  }
};

// Get current environment from ENV var or default to local
export const currentEnv = environments[__ENV.ENVIRONMENT || 'local'];

// Common test configuration
export const testConfig = {
  // Authentication
  testUsers: {
    lawyer: {
      email: 'test.lawyer@example.com',
      password: 'TestPassword123!'
    },
    clerk: {
      email: 'test.clerk@example.com', 
      password: 'TestPassword123!'
    },
    client: {
      email: 'test.client@example.com',
      password: 'TestPassword123!'
    }
  },
  
  // Performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    http_reqs: ['rate>10'],           // At least 10 requests per second
    data_received: ['rate>1000'],     // At least 1KB/s received
    data_sent: ['rate>1000']          // At least 1KB/s sent
  },
  
  // Load test scenarios
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s'
    },
    light_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '3m', target: 5 },
        { duration: '1m', target: 0 }
      ]
    },
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 }
      ]
    },
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '10m', target: 0 }
      ]
    },
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '30s', target: 100 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 200 },
        { duration: '1m', target: 10 }
      ]
    }
  }
};