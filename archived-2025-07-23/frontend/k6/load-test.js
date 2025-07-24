import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics for legal case management app
const kanbanLoadTime = new Trend('kanban_load_time', true);
const matterCreateTime = new Trend('matter_create_time', true);
const dragDropTime = new Trend('drag_drop_time', true);
const searchTime = new Trend('search_time', true);
const errors = new Counter('custom_errors');
const errorRate = new Rate('error_rate');

// Load test configuration - simulate typical daily usage
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '3m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users (peak load)
    { duration: '2m', target: 50 },   // Ramp down to 50 users
    { duration: '3m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    // API response time thresholds
    http_req_duration: ['p(95)<200', 'p(99)<500'], // 95% of requests under 200ms
    
    // Custom metric thresholds
    kanban_load_time: ['p(95)<1000', 'p(99)<2000'], // Kanban board loads under 1s
    matter_create_time: ['p(95)<500', 'p(99)<1000'], // Matter creation under 500ms
    drag_drop_time: ['p(95)<300', 'p(99)<500'],      // Drag-drop under 300ms
    search_time: ['p(95)<500', 'p(99)<1000'],        // Search under 500ms
    
    // Error thresholds
    error_rate: ['rate<0.05'], // Less than 5% error rate
    http_req_failed: ['rate<0.05'], // Less than 5% failed requests
    
    // Performance thresholds
    http_req_blocked: ['avg<20', 'max<100'], // Connection time
    http_req_connecting: ['avg<20', 'max<100'], // TCP connection time
    http_req_receiving: ['avg<50', 'max<200'], // Response receiving time
    http_req_sending: ['avg<50', 'max<200'], // Request sending time
    http_req_waiting: ['avg<100', 'max<500'], // Time to first byte (TTFB)
  },
  ext: {
    loadimpact: {
      projectID: 'aster-management',
      name: 'Legal Case Management Load Test',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:8080/api';

// Helper function to handle errors
function handleError(response, operation) {
  if (response.status !== 200 && response.status !== 201) {
    errors.add(1);
    errorRate.add(1);
    console.error(`${operation} failed: ${response.status} - ${response.body}`);
  } else {
    errorRate.add(0);
  }
}

// Simulate user authentication
function authenticateUser() {
  const loginPayload = JSON.stringify({
    email: `lawyer${__VU}@example.com`, // Virtual user ID
    password: 'password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${API_URL}/auth/login`, loginPayload, params);
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'auth token received': (r) => r.json('token') !== undefined,
  });

  handleError(loginRes, 'Login');

  if (loginRes.status === 200) {
    return loginRes.json('token');
  }
  return null;
}

// Load Kanban board
function loadKanbanBoard(authToken) {
  const startTime = new Date();
  
  const params = {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  // Load the kanban page
  const kanbanRes = http.get(`${BASE_URL}/kanban`, params);
  
  // Load matters data
  const mattersRes = http.get(`${API_URL}/matters`, params);
  
  const loadTime = new Date() - startTime;
  kanbanLoadTime.add(loadTime);

  check(kanbanRes, {
    'kanban page loaded': (r) => r.status === 200,
    'kanban page has content': (r) => r.body.includes('kanban'),
  });

  check(mattersRes, {
    'matters loaded': (r) => r.status === 200,
    'matters is array': (r) => Array.isArray(r.json()),
  });

  handleError(kanbanRes, 'Load Kanban');
  handleError(mattersRes, 'Load Matters');

  return mattersRes.json();
}

// Create a new matter
function createMatter(authToken) {
  const startTime = new Date();
  
  const matterPayload = JSON.stringify({
    title: `Legal Case ${__VU}-${__ITER}`,
    description: 'Test case created by k6 load test',
    clientId: '123e4567-e89b-12d3-a456-426614174000',
    priority: ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)],
    status: 'DRAFT',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  };

  const response = http.post(`${API_URL}/matters`, matterPayload, params);
  
  const createTime = new Date() - startTime;
  matterCreateTime.add(createTime);

  check(response, {
    'matter created': (r) => r.status === 201,
    'matter has id': (r) => r.json('id') !== undefined,
  });

  handleError(response, 'Create Matter');

  return response.json();
}

// Simulate drag and drop operation
function simulateDragDrop(authToken, matterId, fromStatus, toStatus) {
  const startTime = new Date();
  
  const movePayload = JSON.stringify({
    matterId,
    fromStatus,
    toStatus,
    fromPosition: 0,
    toPosition: 1,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  };

  const response = http.patch(`${API_URL}/matters/${matterId}/move`, movePayload, params);
  
  const moveTime = new Date() - startTime;
  dragDropTime.add(moveTime);

  check(response, {
    'drag drop successful': (r) => r.status === 200,
    'matter status updated': (r) => r.json('status') === toStatus,
  });

  handleError(response, 'Drag Drop');
}

// Search for matters
function searchMatters(authToken, query) {
  const startTime = new Date();
  
  const params = {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  const searchRes = http.get(`${API_URL}/matters/search?q=${query}`, params);
  
  const searchDuration = new Date() - startTime;
  searchTime.add(searchDuration);

  check(searchRes, {
    'search successful': (r) => r.status === 200,
    'search returns array': (r) => Array.isArray(r.json()),
    'search completed quickly': (r) => searchDuration < 500,
  });

  handleError(searchRes, 'Search');

  return searchRes.json();
}

// Main test scenario
export default function () {
  // Authenticate user
  const authToken = authenticateUser();
  if (!authToken) {
    console.error('Authentication failed');
    return;
  }

  sleep(1);

  // Load Kanban board
  const matters = loadKanbanBoard(authToken);
  sleep(2);

  // Create a new matter
  const newMatter = createMatter(authToken);
  sleep(1);

  // Simulate drag and drop if matter was created
  if (newMatter && newMatter.id) {
    simulateDragDrop(authToken, newMatter.id, 'DRAFT', 'IN_PROGRESS');
    sleep(1);
    
    simulateDragDrop(authToken, newMatter.id, 'IN_PROGRESS', 'REVIEW');
    sleep(1);
  }

  // Search for matters
  const searchTerms = ['contract', 'litigation', 'client', 'urgent'];
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  searchMatters(authToken, randomTerm);
  sleep(2);

  // Simulate reading matter details
  if (matters && matters.length > 0) {
    const randomMatter = matters[Math.floor(Math.random() * matters.length)];
    const detailsRes = http.get(`${API_URL}/matters/${randomMatter.id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    check(detailsRes, {
      'matter details loaded': (r) => r.status === 200,
    });
    
    handleError(detailsRes, 'Load Matter Details');
  }

  sleep(3);

  // Simulate form interactions
  const formsPages = ['/matters/new', '/documents/upload', '/settings'];
  const randomForm = formsPages[Math.floor(Math.random() * formsPages.length)];
  
  const formRes = http.get(`${BASE_URL}${randomForm}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  
  check(formRes, {
    'form page loaded': (r) => r.status === 200,
  });
  
  handleError(formRes, 'Load Form');

  sleep(2);
}