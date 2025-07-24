import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Spike test configuration - sudden traffic surge simulation
export const options = {
  stages: [
    { duration: '10s', target: 10 },    // Baseline load
    { duration: '1m', target: 10 },     // Stay at baseline
    { duration: '10s', target: 500 },   // Spike to 500 users!
    { duration: '3m', target: 500 },    // Stay at spike level
    { duration: '10s', target: 10 },    // Scale down to baseline
    { duration: '3m', target: 10 },     // Recovery period
    { duration: '10s', target: 0 },     // Ramp down
  ],
  thresholds: {
    // During spike, we expect some degradation but system should survive
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s even during spike
    http_req_failed: ['rate<0.20'], // Allow up to 20% failure during spike
    
    // Critical operations should still work
    'http_req_duration{operation:critical}': ['p(95)<1000'], // Critical ops under 1s
    
    // Recovery metrics
    'recovery_health_check': ['p(95)<100'], // Health checks should recover quickly
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:8080/api';

// Metrics for spike behavior
const spikeErrors = new Counter('spike_errors');
const queueDepth = new Trend('queue_depth');
const circuitBreakerTrips = new Counter('circuit_breaker_trips');

// Simulate different user behaviors during spike
export default function () {
  const scenario = Math.random();
  
  // 60% of users during spike are viewing the kanban board
  if (scenario < 0.6) {
    viewKanbanBoard();
  }
  // 20% are searching
  else if (scenario < 0.8) {
    performSearch();
  }
  // 15% are creating/editing matters
  else if (scenario < 0.95) {
    createOrEditMatter();
  }
  // 5% are performing heavy operations
  else {
    performHeavyOperation();
  }
}

function viewKanbanBoard() {
  const params = {
    headers: {
      Authorization: 'Bearer spike-test-token',
    },
    tags: { operation: 'view' },
    timeout: '10s',
  };

  // Simulate realistic page load
  const responses = http.batch([
    ['GET', `${BASE_URL}/kanban`, null, params],
    ['GET', `${API_URL}/matters?status=all&limit=50`, null, params],
    ['GET', `${API_URL}/matters/status-counts`, null, params],
  ]);

  responses.forEach((res) => {
    if (res.status === 503) {
      circuitBreakerTrips.add(1);
    } else if (res.status === 429) {
      // Rate limited - expected during spike
      spikeErrors.add(1);
    } else if (res.status >= 500) {
      spikeErrors.add(1);
    }
    
    check(res, {
      'kanban view accessible': (r) => 
        r.status === 200 || r.status === 429 || r.status === 503,
    });
  });

  // Check if we get queue depth header
  const queueHeader = responses[0].headers['X-Queue-Depth'];
  if (queueHeader) {
    queueDepth.add(parseInt(queueHeader));
  }

  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function performSearch() {
  const searchTerms = [
    'urgent',
    'contract review',
    'due this week',
    'high priority client',
  ];
  
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  const params = {
    headers: {
      Authorization: 'Bearer spike-test-token',
    },
    tags: { operation: 'search' },
    timeout: '10s',
  };

  const searchRes = http.get(
    `${API_URL}/matters/search?q=${encodeURIComponent(term)}`,
    params
  );

  check(searchRes, {
    'search available during spike': (r) => 
      r.status === 200 || r.status === 429 || r.status === 503,
    'search reasonably fast': (r) => r.timings.duration < 3000,
  });

  if (searchRes.status >= 500) {
    spikeErrors.add(1);
  }

  sleep(Math.random() * 1 + 0.5); // 0.5-1.5 seconds
}

function createOrEditMatter() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer spike-test-token',
    },
    tags: { operation: 'critical' }, // Mark as critical operation
    timeout: '15s',
  };

  const matterData = {
    title: `Spike Test Matter ${__VU}-${__ITER}`,
    description: 'Created during traffic spike',
    clientId: '123e4567-e89b-12d3-a456-426614174000',
    priority: 'HIGH',
    status: 'DRAFT',
  };

  const createRes = http.post(
    `${API_URL}/matters`,
    JSON.stringify(matterData),
    params
  );

  check(createRes, {
    'critical operation succeeds': (r) => 
      r.status === 201 || r.status === 429,
    'no data corruption': (r) => 
      r.status !== 201 || (r.json('id') && r.json('title') === matterData.title),
  });

  if (createRes.status >= 500) {
    spikeErrors.add(1);
  }

  // If creation succeeded, try an update
  if (createRes.status === 201) {
    sleep(0.5);
    
    const matterId = createRes.json('id');
    const updateRes = http.patch(
      `${API_URL}/matters/${matterId}`,
      JSON.stringify({ status: 'IN_PROGRESS' }),
      params
    );

    check(updateRes, {
      'update during spike': (r) => 
        r.status === 200 || r.status === 429,
    });
  }

  sleep(Math.random() * 2 + 1);
}

function performHeavyOperation() {
  const params = {
    headers: {
      Authorization: 'Bearer spike-test-token',
    },
    tags: { operation: 'heavy' },
    timeout: '30s',
  };

  // Try to export data or generate report
  const heavyOps = [
    `${API_URL}/matters/export?format=pdf&all=true`,
    `${API_URL}/reports/monthly?detailed=true`,
    `${API_URL}/matters/bulk-update`,
  ];

  const selectedOp = heavyOps[Math.floor(Math.random() * heavyOps.length)];
  
  const res = http.get(selectedOp, params);

  check(res, {
    'heavy operation handled': (r) => 
      r.status === 200 || r.status === 429 || r.status === 503,
    'graceful degradation': (r) => 
      r.status !== 500, // Should not cause server errors
  });

  if (res.status === 503 && res.headers['Retry-After']) {
    // Respect retry-after header
    sleep(parseInt(res.headers['Retry-After']));
  } else {
    sleep(Math.random() * 3 + 2); // 2-5 seconds
  }
}

// Monitor system health during spike
export function setup() {
  console.log('Starting spike test - monitoring system health...');
}

export function teardown(data) {
  console.log('Spike test completed. Verifying system recovery...');
  
  // Wait for system to stabilize
  sleep(10);
  
  // Perform health checks
  const healthChecks = http.batch([
    ['GET', `${API_URL}/health`, null, { tags: { name: 'recovery_health_check' } }],
    ['GET', `${API_URL}/metrics`, null, { tags: { name: 'recovery_health_check' } }],
    ['GET', `${BASE_URL}/`, null, { tags: { name: 'recovery_health_check' } }],
  ]);

  healthChecks.forEach((res) => {
    check(res, {
      'system recovered after spike': (r) => r.status === 200,
      'response times normalized': (r) => r.timings.duration < 200,
    });
  });
  
  // Check for any lingering issues
  const testMatter = http.post(
    `${API_URL}/matters`,
    JSON.stringify({
      title: 'Post-spike test matter',
      clientId: '123e4567-e89b-12d3-a456-426614174000',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer spike-test-token',
      },
    }
  );

  check(testMatter, {
    'normal operations resumed': (r) => r.status === 201,
  });
}