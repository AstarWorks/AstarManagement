# Deployment Guide - Aster Management

This guide covers deployment strategies, CI/CD pipelines, and production considerations for the Nuxt.js frontend application.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Build Configuration](#build-configuration)
3. [Environment Management](#environment-management)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Cloud Deployment](#cloud-deployment)
6. [On-Premise Deployment](#on-premise-deployment)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Security Considerations](#security-considerations)

## Deployment Overview

### Deployment Architecture

The Aster Management frontend supports multiple deployment strategies:

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Options                       │
├─────────────────────────────────────────────────────────────┤
│  Cloud Deployment          │  On-Premise Deployment        │
│  ├── Vercel/Netlify       │  ├── Docker + Kubernetes      │
│  ├── Google Cloud Run     │  ├── Traditional Servers      │
│  ├── AWS Amplify          │  ├── k3s (Lightweight K8s)    │
│  └── Azure Static Apps    │  └── Docker Compose           │
├─────────────────────────────────────────────────────────────┤
│                    CI/CD Pipeline                           │
│  ├── GitHub Actions                                        │
│  ├── GitLab CI/CD                                         │
│  ├── Jenkins                                              │
│  └── ArgoCD (GitOps)                                      │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Modes

#### 1. Static Site Generation (SSG)
- Pre-rendered at build time
- Fastest performance
- Good for content-heavy pages

#### 2. Server-Side Rendering (SSR)
- Rendered on each request
- Better for dynamic content
- SEO optimized

#### 3. Single Page Application (SPA)
- Client-side rendered
- Fastest development
- Requires API for all data

## Build Configuration

### Production Build Setup

Configure Nuxt for production builds:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Production optimizations
  nitro: {
    preset: 'node-server', // or 'static' for SSG
    compressPublicAssets: true,
    minify: true
  },
  
  // Build optimizations
  build: {
    analyze: process.env.ANALYZE === 'true'
  },
  
  // CSS optimization
  css: [
    '~/assets/css/main.css'
  ],
  
  // Runtime config
  runtimeConfig: {
    // Private keys (server-side only)
    jwtSecret: process.env.JWT_SECRET,
    
    // Public keys (exposed to client)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      wsUrl: process.env.NUXT_PUBLIC_WS_URL,
      environment: process.env.NODE_ENV
    }
  },
  
  // SEO and meta
  app: {
    head: {
      title: 'Aster Management',
      meta: [
        { name: 'description', content: 'Legal case management system' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  
  // Performance optimizations
  experimental: {
    payloadExtraction: false,
    inlineSSRStyles: false
  }
})
```

### Build Scripts

Configure package.json build scripts:

```json
{
  "scripts": {
    "build": "nuxt build",
    "build:analyze": "ANALYZE=true nuxt build",
    "build:staging": "NUXT_PUBLIC_API_BASE=https://staging-api.example.com nuxt build",
    "build:production": "NUXT_PUBLIC_API_BASE=https://api.example.com nuxt build",
    "preview": "nuxt preview",
    "generate": "nuxt generate",
    "prepack": "nuxt build",
    "postinstall": "nuxt prepare"
  }
}
```

### Dockerfile

Create production-ready Docker image:

```dockerfile
# Dockerfile
FROM oven/bun:1.2.16-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Build the app
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install all dependencies (including devDependencies)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# Copy built application
COPY --from=builder --chown=nuxtjs:nodejs /app/.output /app/.output

# Switch to non-root user
USER nuxtjs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Start the application
CMD ["bun", "run", ".output/server/index.mjs"]
```

### Multi-stage Build with Optimization

```dockerfile
# Dockerfile.optimized
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build application
RUN npm run build

# Runtime stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# Copy built app
COPY --from=builder --chown=nuxtjs:nodejs /app/.output /app/.output

USER nuxtjs

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

## Environment Management

### Environment Variables

Organize environment variables by environment:

```bash
# .env.local (development)
NUXT_PUBLIC_API_BASE=http://localhost:8080/api
NUXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NODE_ENV=development
NUXT_DEVTOOLS=true

# .env.staging
NUXT_PUBLIC_API_BASE=https://staging-api.example.com/api
NUXT_PUBLIC_WS_URL=wss://staging-api.example.com/ws
NODE_ENV=production
JWT_SECRET=staging-secret-key

# .env.production
NUXT_PUBLIC_API_BASE=https://api.example.com/api
NUXT_PUBLIC_WS_URL=wss://api.example.com/ws
NODE_ENV=production
JWT_SECRET=production-secret-key
```

### Environment-Specific Configuration

```typescript
// config/environments.ts
interface EnvironmentConfig {
  apiBase: string
  wsUrl: string
  enableAnalytics: boolean
  enableDevtools: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    apiBase: 'http://localhost:8080/api',
    wsUrl: 'ws://localhost:8080/ws',
    enableAnalytics: false,
    enableDevtools: true,
    logLevel: 'debug'
  },
  staging: {
    apiBase: 'https://staging-api.example.com/api',
    wsUrl: 'wss://staging-api.example.com/ws',
    enableAnalytics: true,
    enableDevtools: true,
    logLevel: 'info'
  },
  production: {
    apiBase: 'https://api.example.com/api',
    wsUrl: 'wss://api.example.com/ws',
    enableAnalytics: true,
    enableDevtools: false,
    logLevel: 'error'
  }
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || 'development'
  return environments[env] || environments.development
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create comprehensive CI/CD pipeline:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  BUN_VERSION: '1.2.16'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
          
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
          restore-keys: |
            ${{ runner.os }}-bun-
            
      - name: Install dependencies
        run: bun install --frozen-lockfile
        
      - name: Run type checking
        run: bun run typecheck
        
      - name: Run linting
        run: bun run lint
        
      - name: Run unit tests
        run: bun run test:unit
        
      - name: Run E2E tests
        run: bun run test:e2e
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    
    strategy:
      matrix:
        environment: [staging, production]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
          
      - name: Install dependencies
        run: bun install --frozen-lockfile
        
      - name: Build application
        run: bun run build:${{ matrix.environment }}
        env:
          NUXT_PUBLIC_API_BASE: ${{ secrets[format('API_BASE_{0}', matrix.environment)] }}
          
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-${{ matrix.environment }}
          path: .output/
          retention-days: 7

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-staging
          path: .output/
          
      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          echo "Deploying to staging..."
          
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-production
          path: .output/
          
      - name: Deploy to production
        run: |
          # Deploy to production environment
          echo "Deploying to production..."

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    
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
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

### Docker Build and Push

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Cloud Deployment

### Vercel Deployment

```json
// vercel.json
{
  "builds": [
    {
      "src": "nuxt.config.ts",
      "use": "@nuxtjs/vercel-builder"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "env": {
    "NUXT_PUBLIC_API_BASE": "@api_base"
  },
  "build": {
    "env": {
      "NUXT_PUBLIC_API_BASE": "@api_base"
    }
  }
}
```

### Google Cloud Run

```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/aster-frontend:$COMMIT_SHA', '.']
    
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/aster-frontend:$COMMIT_SHA']
    
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'aster-frontend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/aster-frontend:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/aster-frontend:$COMMIT_SHA'
```

### AWS Amplify

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - curl -fsSL https://bun.sh/install | bash
        - export PATH="$HOME/.bun/bin:$PATH"
        - bun install --frozen-lockfile
    build:
      commands:
        - bun run build
  artifacts:
    baseDirectory: .output/public
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .nuxt/**/*
```

## On-Premise Deployment

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aster-frontend
  labels:
    app: aster-frontend
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
        image: aster-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NUXT_PUBLIC_API_BASE
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: api-base
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: aster-frontend-service
spec:
  selector:
    app: aster-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  api-base: "https://api.example.com/api"
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NUXT_PUBLIC_API_BASE=http://backend:8080/api
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
    restart: unless-stopped

  backend:
    image: aster-backend:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=production
    restart: unless-stopped
```

### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:8080;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name example.com www.example.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name example.com www.example.com;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Static assets with caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Monitoring and Maintenance

### Health Checks

Implement health check endpoints:

```typescript
// server/api/health.get.ts
export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  
  try {
    // Check external dependencies
    const apiHealth = await $fetch('/health', {
      baseURL: useRuntimeConfig().public.apiBase,
      timeout: 5000
    })
    
    const responseTime = Date.now() - startTime
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      dependencies: {
        api: apiHealth.status || 'unknown'
      },
      version: process.env.npm_package_version
    }
  } catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      data: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    })
  }
})
```

### Logging Configuration

```typescript
// plugins/logging.server.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const startTime = event.context.startTime || Date.now()
    const duration = Date.now() - startTime
    
    console.log({
      method: event.node.req.method,
      url: event.node.req.url,
      statusCode: response.statusCode,
      duration,
      userAgent: getHeader(event, 'user-agent'),
      ip: getClientIP(event),
      timestamp: new Date().toISOString()
    })
  })
  
  nitroApp.hooks.hook('error', (error, { event }) => {
    console.error({
      error: error.message,
      stack: error.stack,
      url: event?.node?.req?.url,
      method: event?.node?.req?.method,
      timestamp: new Date().toISOString()
    })
  })
})
```

### Performance Monitoring

```typescript
// plugins/analytics.client.ts
export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV === 'production') {
    // Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(sendToAnalytics)
      getFID(sendToAnalytics)
      getFCP(sendToAnalytics)
      getLCP(sendToAnalytics)
      getTTFB(sendToAnalytics)
    })
    
    // Navigation timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      sendToAnalytics({
        name: 'navigation',
        value: navigation.loadEventEnd - navigation.fetchStart,
        delta: navigation.loadEventEnd - navigation.fetchStart
      })
    })
  }
})

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log('Web Vital:', metric)
}
```

## Security Considerations

### Content Security Policy

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self' wss:",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
          ].join('; ')
        }
      }
    }
  }
})
```

### Security Headers

```typescript
// middleware/security.global.ts
export default defineNuxtRouteMiddleware((to) => {
  if (process.server) {
    const headers = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
    
    Object.entries(headers).forEach(([key, value]) => {
      setHeader(key, value)
    })
  }
})
```

### Environment Secrets

```bash
# Use secret management systems
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=api-key=your-api-key

# Or use cloud secret managers
gcloud secrets create jwt-secret --data-file=secret.txt
aws secretsmanager create-secret --name jwt-secret --secret-string "your-secret"
```

This deployment guide provides comprehensive coverage for deploying the Aster Management frontend in various environments with proper security, monitoring, and maintenance practices.