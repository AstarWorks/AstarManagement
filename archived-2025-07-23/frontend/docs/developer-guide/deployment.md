# Deployment Guide

This guide covers deployment strategies and CI/CD configuration for the Aster Management Nuxt.js application.

## Build Configuration

### Production Build Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Production optimizations
  nitro: {
    preset: 'node-server', // or 'docker', 'cloudflare', etc.
    minify: true,
    sourceMap: false,
    
    // Compression
    compressPublicAssets: {
      gzip: true,
      brotli: true
    },
    
    // Static asset handling
    publicAssets: [
      {
        baseURL: '/assets',
        dir: 'public/assets',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      }
    ]
  },
  
  // CSS optimization
  css: {
    postcss: {
      plugins: {
        'postcss-preset-env': {
          stage: 1
        },
        'cssnano': process.env.NODE_ENV === 'production' ? {} : false
      }
    }
  },
  
  // Environment-specific configuration
  runtimeConfig: {
    // Server-side environment variables
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    
    public: {
      // Client-side environment variables
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
      appEnv: process.env.NODE_ENV
    }
  }
})
```

### Build Scripts

```json
{
  "scripts": {
    "build": "nuxt build",
    "build:analyze": "nuxt build --analyze",
    "build:prerender": "nuxt generate",
    "preview": "nuxt preview",
    "typecheck": "nuxt typecheck",
    "lint:ci": "eslint . --format=github-actions",
    "test:ci": "vitest run --coverage --reporter=github-actions"
  }
}
```

## Docker Configuration

### Multi-stage Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# Install Bun
RUN npm install -g bun

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN bun run build

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxt

# Copy built application
COPY --from=builder --chown=nuxt:nodejs /app/.output /app/.output
COPY --from=builder --chown=nuxt:nodejs /app/package.json /app/package.json

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", ".output/server/index.mjs"]
```

### Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      target: builder
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - NUXT_PUBLIC_API_BASE=http://backend:8080
    depends_on:
      - backend
    command: bun dev
  
  backend:
    image: aster-backend:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/aster
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=aster
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '20'
  BUN_VERSION: '1.2.16'

jobs:
  # Code Quality & Testing
  quality:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ env.BUN_VERSION }}
      
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lock') }}
          restore-keys: |
            ${{ runner.os }}-bun-
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Type check
        run: bun run typecheck
      
      - name: Lint code
        run: bun run lint:ci
      
      - name: Run tests
        run: bun run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info
  
  # Performance Testing
  performance:
    runs-on: ubuntu-latest
    needs: quality
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ env.BUN_VERSION }}
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Build application
        run: bun run build
      
      - name: Start preview server
        run: |
          bun run preview &
          sleep 10
      
      - name: Run Lighthouse CI
        run: bun run perf:lighthouse
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
  
  # Security Scanning
  security:
    runs-on: ubuntu-latest
    needs: quality
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Audit dependencies
        run: |
          bun install --frozen-lockfile
          bun audit
  
  # Build and Deploy
  deploy:
    runs-on: ubuntu-latest
    needs: [quality, performance, security]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.REGISTRY_URL }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.REGISTRY_URL }}/aster-frontend:latest
            ${{ secrets.REGISTRY_URL }}/aster-frontend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Deploy to staging
        if: github.ref == 'refs/heads/develop'
        run: |
          # Deploy to staging environment
          kubectl --kubeconfig=${{ secrets.KUBECONFIG }} \
            set image deployment/aster-frontend \
            frontend=${{ secrets.REGISTRY_URL }}/aster-frontend:${{ github.sha }} \
            --namespace=staging
      
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: |
          # Deploy to production environment
          kubectl --kubeconfig=${{ secrets.KUBECONFIG }} \
            set image deployment/aster-frontend \
            frontend=${{ secrets.REGISTRY_URL }}/aster-frontend:${{ github.sha }} \
            --namespace=production
```

## Kubernetes Deployment

### Application Deployment

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aster-frontend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aster-frontend
  template:
    metadata:
      labels:
        app: aster-frontend
    spec:
      containers:
      - name: frontend
        image: registry.example.com/aster-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NUXT_PUBLIC_API_BASE
          valueFrom:
            configMapKeyRef:
              name: aster-config
              key: api-base-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: aster-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: aster-frontend-service
  namespace: production
spec:
  selector:
    app: aster-frontend
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aster-frontend-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - aster.example.com
    secretName: aster-tls
  rules:
  - host: aster.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: aster-frontend-service
            port:
              number: 80
```

### ConfigMap and Secrets

```yaml
# k8s/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: aster-config
  namespace: production
data:
  api-base-url: "https://api.aster.example.com"
  app-env: "production"
  log-level: "info"
---
apiVersion: v1
kind: Secret
metadata:
  name: aster-secrets
  namespace: production
type: Opaque
data:
  jwt-secret: <base64-encoded-secret>
  database-url: <base64-encoded-url>
  encryption-key: <base64-encoded-key>
```

## Environment Configuration

### Environment Variables

```bash
# .env.production
NODE_ENV=production
NUXT_PUBLIC_API_BASE=https://api.aster.example.com
NUXT_PUBLIC_APP_ENV=production

# Server-only variables
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=postgresql://user:pass@host:5432/db
ENCRYPTION_KEY=your-encryption-key-here
REDIS_URL=redis://redis:6379
```

### Runtime Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-side runtime config
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    encryptionKey: process.env.ENCRYPTION_KEY,
    redisUrl: process.env.REDIS_URL,
    
    public: {
      // Client-side runtime config
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || 'development',
      version: process.env.npm_package_version,
      buildDate: new Date().toISOString()
    }
  }
})
```

## Monitoring & Observability

### Health Checks

```typescript
// server/api/health.ts
export default defineEventHandler(async (event) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      memory: checkMemoryUsage(),
      api: await checkBackendAPI()
    }
  }
  
  const isHealthy = Object.values(checks.checks).every(check => 
    check.status === 'healthy'
  )
  
  setResponseStatus(event, isHealthy ? 200 : 503)
  return checks
})

const checkDatabase = async () => {
  try {
    // Test database connection
    await $fetch('/api/db/ping')
    return { status: 'healthy', responseTime: Date.now() }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

const checkMemoryUsage = () => {
  const usage = process.memoryUsage()
  const threshold = 512 * 1024 * 1024 // 512MB
  
  return {
    status: usage.heapUsed < threshold ? 'healthy' : 'warning',
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`
  }
}
```

### Application Metrics

```typescript
// plugins/metrics.server.ts
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client'

export default defineNitroPlugin(async (nitroApp) => {
  // Collect default metrics
  collectDefaultMetrics()
  
  // Custom metrics
  const httpRequestTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  })
  
  const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  })
  
  // Hook into requests
  nitroApp.hooks.hook('request', (event) => {
    event.context.startTime = Date.now()
  })
  
  nitroApp.hooks.hook('afterResponse', (event, { body }) => {
    const duration = (Date.now() - event.context.startTime) / 1000
    const route = event.node.req.url
    const method = event.node.req.method
    const statusCode = event.node.res.statusCode
    
    httpRequestTotal.inc({
      method,
      route,
      status_code: statusCode
    })
    
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    )
  })
  
  // Metrics endpoint
  nitroApp.hooks.hook('render:route', async (url, result, context) => {
    if (url === '/metrics') {
      const metrics = await register.metrics()
      context.event.node.res.setHeader('Content-Type', register.contentType)
      context.event.node.res.end(metrics)
      return false
    }
  })
})
```

## Deployment Strategies

### Blue-Green Deployment

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

set -e

NAMESPACE="production"
APP_NAME="aster-frontend"
IMAGE_TAG="$1"

if [ -z "$IMAGE_TAG" ]; then
  echo "Usage: $0 <image-tag>"
  exit 1
fi

# Get current active deployment
ACTIVE_COLOR=$(kubectl get service $APP_NAME -n $NAMESPACE -o jsonpath='{.spec.selector.color}')

if [ "$ACTIVE_COLOR" = "blue" ]; then
  INACTIVE_COLOR="green"
else
  INACTIVE_COLOR="blue"
fi

echo "Current active: $ACTIVE_COLOR"
echo "Deploying to: $INACTIVE_COLOR"

# Deploy to inactive environment
kubectl set image deployment/$APP_NAME-$INACTIVE_COLOR \
  frontend=registry.example.com/$APP_NAME:$IMAGE_TAG \
  -n $NAMESPACE

# Wait for rollout to complete
kubectl rollout status deployment/$APP_NAME-$INACTIVE_COLOR -n $NAMESPACE

# Run health checks
echo "Running health checks..."
for i in {1..30}; do
  if kubectl exec deployment/$APP_NAME-$INACTIVE_COLOR -n $NAMESPACE -- \
     curl -f http://localhost:3000/api/health; then
    echo "Health check passed"
    break
  fi
  
  if [ $i -eq 30 ]; then
    echo "Health check failed after 30 attempts"
    exit 1
  fi
  
  sleep 10
done

# Switch traffic
echo "Switching traffic to $INACTIVE_COLOR"
kubectl patch service $APP_NAME -n $NAMESPACE -p \
  '{"spec":{"selector":{"color":"'$INACTIVE_COLOR'"}}}'

echo "Deployment complete!"
```

### Canary Deployment

```yaml
# k8s/canary-deployment.yml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: aster-frontend
  namespace: production
spec:
  replicas: 5
  strategy:
    canary:
      steps:
      - setWeight: 20
      - pause: {}
      - setWeight: 40
      - pause: { duration: 10m }
      - setWeight: 60
      - pause: { duration: 10m }
      - setWeight: 80
      - pause: { duration: 10m }
      canaryService: aster-frontend-canary
      stableService: aster-frontend-stable
      trafficRouting:
        nginx:
          stableIngress: aster-frontend-stable
          annotationPrefix: nginx.ingress.kubernetes.io
          additionalIngressAnnotations:
            canary-by-header: X-Canary
  selector:
    matchLabels:
      app: aster-frontend
  template:
    metadata:
      labels:
        app: aster-frontend
    spec:
      containers:
      - name: frontend
        image: registry.example.com/aster-frontend:latest
        ports:
        - containerPort: 3000
```

## Performance Optimization

### CDN Configuration

```nginx
# nginx.conf for CDN
server {
    listen 80;
    server_name cdn.aster.example.com;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }
    
    # Cache HTML with shorter duration
    location ~* \.(html|htm)$ {
        expires 1h;
        add_header Cache-Control "public";
        add_header Vary "Accept-Encoding";
    }
    
    # Proxy to application
    location / {
        proxy_pass http://aster-frontend-service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# scripts/backup-database.sh

DATABASE_URL="$1"
BACKUP_PATH="/backups/$(date +%Y%m%d_%H%M%S).sql"

# Create backup
pg_dump "$DATABASE_URL" > "$BACKUP_PATH"

# Compress backup
gzip "$BACKUP_PATH"

# Upload to cloud storage
aws s3 cp "$BACKUP_PATH.gz" "s3://aster-backups/database/"

# Clean up local backup
rm "$BACKUP_PATH.gz"

# Keep only last 30 days of backups
aws s3 ls s3://aster-backups/database/ | \
  awk '{print $4}' | \
  sort -r | \
  tail -n +31 | \
  xargs -I {} aws s3 rm s3://aster-backups/database/{}

echo "Backup completed: $BACKUP_PATH.gz"
```

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   ```bash
   # Check build logs
   docker logs <container-id>
   
   # Debug locally
   docker run -it --rm <image> sh
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   kubectl top pods -n production
   
   # Increase memory limits
   kubectl patch deployment aster-frontend -p \
     '{"spec":{"template":{"spec":{"containers":[{"name":"frontend","resources":{"limits":{"memory":"1Gi"}}}]}}}}'
   ```

3. **Network Issues**
   ```bash
   # Test connectivity
   kubectl exec -it <pod-name> -- curl http://backend-service:8080/health
   
   # Check DNS resolution
   kubectl exec -it <pod-name> -- nslookup backend-service
   ```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Secrets properly encrypted
- [ ] Health checks working
- [ ] Database migrations applied
- [ ] SSL certificates valid
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested
- [ ] Rollback plan documented
- [ ] Performance tests passed
- [ ] Security scans completed