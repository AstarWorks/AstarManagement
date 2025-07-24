# Performance Testing Suite

This directory contains the performance testing infrastructure for Aster Management using k6 load testing framework.

## 🎯 Overview

The performance testing suite is designed to:
- Establish baseline performance metrics
- Validate system performance under load
- Identify breaking points and bottlenecks
- Ensure performance regression detection
- Support continuous performance monitoring

## 📁 Structure

```
tests/performance/
├── config/
│   └── environments.js         # Environment configurations
├── utils/
│   ├── auth.js                # Authentication utilities
│   └── test-data.js           # Test data management
├── tests/
│   ├── baseline.js            # Baseline performance tests
│   ├── load-test.js           # Load testing scenarios
│   └── stress-test.js         # Stress testing scenarios
├── results/                   # Test results output
├── Dockerfile                 # Docker configuration for k6
├── docker-compose.yml         # Full testing environment
├── init-db.sql               # Database setup for tests
└── package.json              # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- k6 installed locally or Docker
- Backend application running
- Test database configured

### Install k6

#### Linux/Ubuntu
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### macOS
```bash
brew install k6
```

#### Docker
```bash
docker pull grafana/k6:latest
```

### Run Tests

#### Baseline Tests (Single User)
```bash
cd tests/performance
k6 run tests/baseline.js
```

#### Load Tests (Multiple Users)
```bash
k6 run tests/load-test.js
```

#### Stress Tests (High Load)
```bash
k6 run tests/stress-test.js
```

#### Using Docker
```bash
docker run --rm -i grafana/k6:latest run - < tests/baseline.js
```

#### With Output Files
```bash
k6 run --out json=results/baseline.json tests/baseline.js
k6 run --out csv=results/load-test.csv tests/load-test.js
```

## 🔧 Configuration

### Environment Setup

Tests can run against different environments:

```bash
# Local development (default)
ENVIRONMENT=local k6 run tests/baseline.js

# Staging environment
ENVIRONMENT=staging k6 run tests/baseline.js
```

### Environment Configuration

Edit `config/environments.js` to modify:
- Base URLs for different environments
- Test user credentials
- Performance thresholds
- Test scenarios parameters

### Test Users

Default test users (configure in your test database):
- `test.lawyer@example.com` - Lawyer role
- `test.clerk@example.com` - Clerk role  
- `test.client@example.com` - Client role

Password: `TestPassword123!`

## 📊 Test Scenarios

### Baseline Tests
- **Purpose**: Establish performance baseline
- **Load**: 1 virtual user for 30 seconds
- **Tests**: All critical endpoints
- **Thresholds**: p95 < 200ms, errors < 1%

### Load Tests
- **Purpose**: Simulate normal traffic
- **Load**: Ramp up to 20 concurrent users
- **Duration**: ~16 minutes total
- **Tests**: Realistic user workflows
- **Thresholds**: p95 < 200ms, errors < 1%

### Stress Tests
- **Purpose**: Find breaking points
- **Load**: Ramp up to 100 concurrent users
- **Duration**: ~30 minutes total
- **Tests**: Aggressive usage patterns
- **Thresholds**: p95 < 500ms, errors < 5%

## 📈 Metrics & Monitoring

### Key Metrics Tracked

1. **Response Times**
   - Average, median, p95, p99
   - Per-endpoint breakdown
   - Custom metrics for critical operations

2. **Error Rates**
   - HTTP errors (4xx, 5xx)
   - Business logic failures
   - Custom error tracking

3. **Throughput**
   - Requests per second
   - Data transfer rates
   - Concurrent operations

4. **System Resources**
   - CPU utilization
   - Memory consumption
   - Database connections

### Performance Thresholds

| Metric | Baseline | Load Test | Stress Test |
|--------|----------|-----------|-------------|
| p95 Response Time | < 200ms | < 200ms | < 500ms |
| Error Rate | < 1% | < 1% | < 5% |
| Throughput | > 5 RPS | > 10 RPS | Variable |

## 🔄 CI/CD Integration

### GitHub Actions

Performance tests run automatically:
- On pull requests affecting backend/frontend
- Daily scheduled runs (2 AM UTC)
- Manual workflow dispatch

### Workflow Configuration

See `.github/workflows/performance-tests.yml` for:
- Environment setup
- Test execution
- Results reporting
- Threshold validation

### Results Artifacts

Test results are uploaded as artifacts including:
- JSON/CSV output files
- Performance reports
- Trend analysis data

## 🐳 Docker Setup

### Full Environment

Run complete testing environment with Docker Compose:

```bash
docker-compose up
```

This includes:
- Backend application
- PostgreSQL database  
- Redis cache
- k6 test runner
- InfluxDB (metrics storage)
- Grafana (visualization)

### Custom Test Runs

```bash
# Run specific test with Docker
docker-compose run k6 run /performance-tests/tests/load-test.js

# With environment override
ENVIRONMENT=staging docker-compose run k6 run /performance-tests/tests/baseline.js
```

## 📝 Writing Custom Tests

### Basic Test Structure

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { currentEnv } from '../config/environments.js';
import { getAuthHeaders } from '../utils/auth.js';

const errorRate = new Rate('errors');

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    errors: ['rate<0.01']
  }
};

export function setup() {
  // Setup code (authentication, test data)
  return { token: 'your-auth-token' };
}

export default function(data) {
  // Main test function
  const response = http.get(
    `${currentEnv.baseUrl}/v1/your-endpoint`,
    { headers: getAuthHeaders(data.token) }
  );
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200
  });
  
  errorRate.add(!success);
  sleep(1);
}

export function teardown(data) {
  // Cleanup code
}
```

### Custom Metrics

```javascript
import { Rate, Trend, Counter } from 'k6/metrics';

const customLatency = new Trend('custom_operation_duration');
const customSuccess = new Rate('custom_operation_success_rate');
const customCounter = new Counter('custom_operations_total');

// In your test function
const startTime = Date.now();
// ... perform operation
customLatency.add(Date.now() - startTime);
customSuccess.add(operationSucceeded ? 1 : 0);
customCounter.add(1);
```

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify test user credentials
   - Check user roles and permissions
   - Ensure users exist in test database

2. **Connection Refused**
   - Verify backend is running on correct port
   - Check firewall/network settings
   - Ensure database is accessible

3. **High Error Rates**
   - Check backend logs for errors
   - Verify test data setup
   - Review database constraints

4. **Slow Performance**
   - Check database indexes
   - Review connection pool settings
   - Monitor resource utilization

### Debug Mode

Run tests with verbose output:

```bash
k6 run --verbose tests/baseline.js
```

### Test Data Cleanup

Manual cleanup of test data:

```sql
-- Connect to test database
DELETE FROM matters WHERE title LIKE '%Test%' OR case_number LIKE 'PERF-%';
DELETE FROM performance_tests.test_data_cleanup WHERE cleanup_status = 'pending';
```

## 📚 References

- [k6 Documentation](https://k6.io/docs/)
- [k6 JavaScript API](https://k6.io/docs/javascript-api/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/)
- [Grafana k6 Examples](https://github.com/grafana/k6/tree/master/examples)

## 🤝 Contributing

When adding new performance tests:

1. Follow existing naming conventions
2. Include proper setup/teardown
3. Add appropriate thresholds
4. Document test scenarios
5. Update this README if needed
6. Test locally before committing

## 📋 Performance Test Checklist

- [ ] Test users configured in database
- [ ] Backend application running
- [ ] Database migrations applied
- [ ] Test data cleanup implemented
- [ ] Appropriate thresholds set
- [ ] Results output configured
- [ ] CI/CD integration tested
- [ ] Documentation updated