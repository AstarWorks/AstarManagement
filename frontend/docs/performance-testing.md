# Performance Testing Guide

This guide covers the comprehensive performance testing infrastructure for the Aster Management Nuxt.js application.

## Overview

The performance testing suite ensures the legal case management application meets or exceeds performance requirements for:
- Core Web Vitals (LCP, FID, CLS)
- Bundle size optimization
- Memory management
- Load handling capacity
- Runtime performance

## Testing Infrastructure

### 1. Lighthouse CI

Automated performance audits integrated into CI/CD pipeline.

#### Configuration
- **File**: `.lighthouserc.js`
- **URLs Tested**: Homepage, Kanban, Matters, Login, Matter Creation
- **Metrics**: Core Web Vitals, Performance Score, Accessibility

#### Running Lighthouse Tests
```bash
# Run all Lighthouse tests
bun run perf:lighthouse

# Mobile-specific tests
bun run perf:lighthouse:mobile

# Desktop-specific tests
bun run perf:lighthouse:desktop
```

#### Performance Budgets
- **LCP**: < 2.5s (desktop), < 3.0s (mobile)
- **FID**: < 100ms
- **CLS**: < 0.1
- **Performance Score**: > 85%
- **JavaScript Bundle**: < 200KB
- **Total Resources**: < 500KB

### 2. Bundle Analysis

Monitor and optimize bundle sizes using Nuxt's built-in analyzer.

#### Running Bundle Analysis
```bash
# Generate bundle analysis
bun run perf:bundle

# Open visual bundle analyzer
bun run perf:bundle:visualize
```

#### Bundle Size Targets
- **Total Size**: < 500KB
- **Gzipped Size**: < 200KB
- **JavaScript**: < 300KB
- **CSS**: < 100KB
- **Largest Chunk**: < 150KB

### 3. k6 Load Testing

Comprehensive load testing scenarios for the API and frontend.

#### Test Scenarios

##### Load Test (`k6/load-test.js`)
Simulates typical daily usage:
- Ramps up to 100 concurrent users
- Tests all critical user paths
- Monitors response times and error rates

```bash
bun run perf:k6
```

##### Stress Test (`k6/stress-test.js`)
Pushes system to its limits:
- Ramps up to 400 concurrent users
- Tests system breaking points
- Monitors recovery behavior

```bash
bun run perf:k6:stress
```

##### Spike Test (`k6/spike-test.js`)
Simulates sudden traffic surges:
- Instant spike to 500 users
- Tests system resilience
- Monitors graceful degradation

```bash
bun run perf:k6:spike
```

#### Performance Thresholds
- **API Response Time**: p95 < 200ms
- **Kanban Load Time**: p95 < 1000ms
- **Matter Creation**: p95 < 500ms
- **Search Response**: p95 < 500ms
- **Error Rate**: < 5%

### 4. Core Web Vitals Testing

Automated tests for Core Web Vitals using Playwright.

#### Test Coverage
- Homepage performance
- Kanban board interactions
- Form responsiveness
- Search performance
- Mobile performance

#### Running Tests
```bash
# Run all performance tests
bun run perf:test

# Run specific test suite
bun run vitest tests/performance/core-web-vitals.test.ts
```

### 5. Memory Profiling

Detect and prevent memory leaks in the application.

#### Memory Profiler Tool
Interactive memory profiling with user simulation:

```bash
# Run memory profiler
bun run perf:memory
```

Features:
- Real-time memory monitoring
- User interaction simulation
- Leak detection
- Performance reports

#### Memory Tests
Automated memory leak detection tests:
- Component mounting/unmounting
- Kanban drag-and-drop operations
- Form interactions
- Long-running sessions

### 6. Performance Monitoring in Production

#### Web Vitals Plugin
The application includes a Web Vitals plugin that reports real user metrics:

```typescript
// plugins/web-vitals.client.ts
// Automatically collects and reports:
// - LCP, FID, CLS
// - TTFB, FCP
// - Custom performance marks
```

#### Performance Dashboard
Access the performance monitoring dashboard:

```
http://localhost:3000/dev/performance-monitor
```

Features:
- Real-time metrics display
- Historical trends
- Performance alerts
- Optimization suggestions

## Performance Optimization Strategies

### 1. Bundle Optimization
- Code splitting by route
- Dynamic imports for heavy components
- Tree shaking unused code
- Compression and minification

### 2. Runtime Optimization
- Virtual scrolling for large lists
- Debouncing and throttling
- Memoization of expensive operations
- Efficient re-render strategies

### 3. Network Optimization
- HTTP/2 server push
- Resource prefetching
- Service worker caching
- API response compression

### 4. Critical Path Optimization
- Inline critical CSS
- Defer non-critical JavaScript
- Optimize web fonts loading
- Lazy load images

## CI/CD Integration

### GitHub Actions Workflow
```yaml
- name: Performance Tests
  run: |
    bun run build
    bun run perf:lighthouse
    bun run perf:test
```

### Performance Regression Detection
- Automatic performance budgets enforcement
- PR comments with performance impact
- Blocking deployments on performance regressions

## Troubleshooting

### Common Issues

#### High LCP
- Check image optimization
- Verify server response times
- Review critical rendering path

#### High CLS
- Add size attributes to images
- Avoid injecting content above existing content
- Use CSS transforms for animations

#### Memory Leaks
- Check event listener cleanup
- Review store subscriptions
- Verify component unmounting

### Debug Tools
```bash
# Enable performance debugging
NODE_ENV=development DEBUG=perf:* bun dev

# Chrome DevTools Performance tab
# Vue DevTools Profiler
# Lighthouse DevTools panel
```

## Best Practices

### 1. Regular Testing
- Run performance tests before each release
- Monitor production metrics continuously
- Set up alerts for performance degradation

### 2. Performance Budget
- Define and enforce performance budgets
- Review bundle size on each PR
- Track Core Web Vitals trends

### 3. Optimization Priority
1. Fix blocking issues first
2. Optimize critical user paths
3. Improve perceived performance
4. Enhance edge cases

## Reporting

Performance reports are generated in:
- `performance-reports/` - Memory profiling reports
- `.lighthouseci/` - Lighthouse CI reports
- `coverage/` - Test coverage reports

### Report Analysis
1. Review metric trends over time
2. Identify performance bottlenecks
3. Prioritize optimization efforts
4. Track improvement impact

## Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Lighthouse CI Guide](https://github.com/GoogleChrome/lighthouse-ci)
- [k6 Load Testing Guide](https://k6.io/docs/)
- [Vue Performance Guide](https://vuejs.org/guide/best-practices/performance.html)
- [Nuxt Performance Optimization](https://nuxt.com/docs/guide/concepts/rendering#performance)