import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Stress test configuration - push the system to its limits
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 300 },   // Ramp up to 300 users
    { duration: '5m', target: 300 },   // Stay at 300 users (stress level)
    { duration: '2m', target: 400 },   // Push to 400 users (breaking point)
    { duration: '5m', target: 400 },   // Stay at 400 users
    { duration: '10m', target: 0 },    // Recovery phase - ramp down to 0
  ],
  thresholds: {
    // Relaxed thresholds for stress testing
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // Allow slower responses
    http_req_failed: ['rate<0.10'], // Allow up to 10% failure rate
    
    // Custom thresholds for stress conditions
    'http_req_duration{status:200}': ['p(95)<500'], // Successful requests should still be reasonably fast
    'http_req_duration{status:500}': ['count<100'], // Limit server errors
    
    // Connection and waiting time
    http_req_blocked: ['avg<500'], // Higher threshold for connection blocking
    http_req_waiting: ['avg<800'], // Higher threshold for TTFB
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:8080/api';

// Custom metrics for stress monitoring
const systemErrors = new Counter('system_errors');
const timeouts = new Counter('request_timeouts');
const connectionErrors = new Counter('connection_errors');
const recoveryTime = new Trend('recovery_time', true);

// Batch operations to stress the system
export default function () {
  const authToken = 'stress-test-token'; // Simplified auth for stress test
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    timeout: '30s', // 30 second timeout for stress conditions
  };

  // Test 1: Concurrent matter creation (stress database)
  const batchSize = 10;
  const batch = [];
  
  for (let i = 0; i < batchSize; i++) {
    batch.push([
      'POST',
      `${API_URL}/matters`,
      JSON.stringify({
        title: `Stress Test Matter ${__VU}-${__ITER}-${i}`,
        description: 'Created during stress test',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'HIGH',
      }),
      params,
    ]);
  }

  const startTime = new Date();
  const responses = http.batch(batch);
  const batchTime = new Date() - startTime;

  responses.forEach((res) => {
    if (res.status === 0) {
      connectionErrors.add(1);
    } else if (res.status >= 500) {
      systemErrors.add(1);
    } else if (res.timings.duration > 30000) {
      timeouts.add(1);
    }
    
    check(res, {
      'matter created or acceptable error': (r) => 
        r.status === 201 || r.status === 429 || r.status === 503,
    });
  });

  sleep(0.5);

  // Test 2: Heavy search queries (stress search functionality)
  const complexSearchQueries = [
    'contract AND litigation AND (urgent OR high-priority)',
    'client:"John Doe" OR client:"Jane Smith" AND status:active',
    'created:[2024-01-01 TO 2024-12-31] AND priority:HIGH',
    'title:* AND description:* AND tags:*', // Wildcard search
  ];

  complexSearchQueries.forEach((query) => {
    const searchRes = http.get(
      `${API_URL}/matters/search?q=${encodeURIComponent(query)}`,
      params
    );
    
    if (searchRes.status === 0) {
      connectionErrors.add(1);
    }
    
    check(searchRes, {
      'search handles load': (r) => 
        r.status === 200 || r.status === 429 || r.status === 503,
    });
  });

  sleep(0.5);

  // Test 3: Rapid drag-drop operations (stress real-time updates)
  const statuses = ['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
  const rapidMoves = [];
  
  for (let i = 0; i < 5; i++) {
    rapidMoves.push([
      'PATCH',
      `${API_URL}/matters/bulk-move`,
      JSON.stringify({
        moves: Array(5).fill().map((_, idx) => ({
          matterId: `stress-${__VU}-${idx}`,
          fromStatus: statuses[idx % 4],
          toStatus: statuses[(idx + 1) % 4],
        })),
      }),
      params,
    ]);
  }

  const moveResponses = http.batch(rapidMoves);
  
  moveResponses.forEach((res) => {
    if (res.status === 0) {
      connectionErrors.add(1);
    }
    
    check(res, {
      'bulk move handles load': (r) => 
        r.status === 200 || r.status === 429 || r.status === 503,
    });
  });

  sleep(0.5);

  // Test 4: Large data requests (stress memory and bandwidth)
  const largeDataRequests = [
    `${API_URL}/matters?limit=1000`, // Request many matters
    `${API_URL}/matters/export?format=pdf&includeAll=true`, // Heavy export
    `${API_URL}/matters/statistics?groupBy=all&detailed=true`, // Complex aggregation
  ];

  largeDataRequests.forEach((url) => {
    const largeRes = http.get(url, params);
    
    if (largeRes.status === 0) {
      connectionErrors.add(1);
    }
    
    check(largeRes, {
      'large request handled': (r) => 
        r.status === 200 || r.status === 429 || r.status === 503,
      'response time acceptable': (r) => r.timings.duration < 5000,
    });
  });

  sleep(1);

  // Test 5: WebSocket connection stress (if applicable)
  // This simulates multiple WebSocket connections for real-time updates
  const wsUrl = BASE_URL.replace('http', 'ws') + '/ws';
  
  try {
    const ws = http.ws(wsUrl, params, function (socket) {
      socket.on('open', () => {
        socket.send(JSON.stringify({
          type: 'subscribe',
          channels: ['matters', 'notifications', 'updates'],
        }));
      });

      socket.on('message', (data) => {
        // Handle real-time updates
      });

      socket.on('error', (e) => {
        connectionErrors.add(1);
      });

      socket.setTimeout(() => {
        socket.close();
      }, 5000);
    });
  } catch (e) {
    connectionErrors.add(1);
  }

  // Test 6: Recovery monitoring
  if (__ITER % 100 === 0) {
    const recoveryStart = new Date();
    const healthCheck = http.get(`${API_URL}/health`, { timeout: '5s' });
    
    if (healthCheck.status === 200) {
      const recoveryDuration = new Date() - recoveryStart;
      recoveryTime.add(recoveryDuration);
    }
  }

  sleep(1);
}

// Teardown function to check system recovery
export function teardown(data) {
  console.log('Stress test completed. Checking system recovery...');
  
  // Give system time to recover
  sleep(30);
  
  // Check if system is responsive
  const healthCheck = http.get(`${API_URL}/health`);
  
  check(healthCheck, {
    'system recovered': (r) => r.status === 200,
    'response time normal': (r) => r.timings.duration < 100,
  });
}