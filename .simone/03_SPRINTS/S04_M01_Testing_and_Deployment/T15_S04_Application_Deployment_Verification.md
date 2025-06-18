---
task_id: T15_S04
sprint_sequence_id: S04
status: open
complexity: Low
last_updated: 2025-06-18T00:00:00Z
---

# Task: Application Deployment and Verification

## Description
Deploy the Matter Management MVP applications (frontend and backend) to the staging infrastructure and verify all functionality is working correctly. This includes building and deploying containers, applying database migrations, configuring environment variables, running smoke tests, and ensuring all MVP features are operational.

## Goal / Objectives
- Build and deploy frontend Next.js application
- Build and deploy backend Spring Boot application
- Apply database migrations successfully
- Configure all environment variables and secrets
- Verify all MVP features are functional
- Run smoke tests and performance checks
- Document deployment procedures

## Acceptance Criteria
- [ ] Backend API is deployed and all endpoints respond correctly
- [ ] Frontend application is accessible via HTTPS
- [ ] Database migrations are applied without errors
- [ ] Authentication and authorization work correctly
- [ ] All MVP features pass smoke tests
- [ ] Performance meets SLA (API p95 < 500ms, page load < 3s)
- [ ] Health checks are passing
- [ ] Deployment procedures are documented

## Subtasks
- [ ] Build backend Spring Boot Docker image
- [ ] Build frontend Next.js Docker image
- [ ] Deploy backend application to Kubernetes
- [ ] Deploy frontend application to Kubernetes
- [ ] Configure environment variables and secrets
- [ ] Apply Flyway database migrations
- [ ] Configure ingress routes for both applications
- [ ] Run smoke tests for all MVP features
- [ ] Verify performance metrics
- [ ] Create deployment runbook

## Technical Guidance

### Backend Deployment
```bash
# Build Spring Boot application
cd backend
./gradlew clean build

# Create Dockerfile if not exists
cat > Dockerfile << EOF
FROM eclipse-temurin:17-jre-alpine
RUN addgroup -g 1000 spring && adduser -u 1000 -G spring -s /bin/sh -D spring
USER spring:spring
ARG JAR_FILE=build/libs/*.jar
COPY \${JAR_FILE} app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]
EOF

# Build and push Docker image
docker build -t astermanagement-backend:staging .
docker tag astermanagement-backend:staging ${REGISTRY}/astermanagement-backend:staging
docker push ${REGISTRY}/astermanagement-backend:staging
```

### Backend Kubernetes Deployment
```yaml
# backend-deployment.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: staging
data:
  SPRING_PROFILES_ACTIVE: "staging"
  SPRING_DATASOURCE_URL: "jdbc:postgresql://postgres:5432/astermanagement"
  SPRING_JPA_HIBERNATE_DDL_AUTO: "validate"
  MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE: "health,info,metrics,prometheus"
---
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
  namespace: staging
type: Opaque
stringData:
  SPRING_DATASOURCE_USERNAME: "astermanagement"
  SPRING_DATASOURCE_PASSWORD: "${DB_PASSWORD}"
  JWT_SECRET: "${JWT_SECRET}"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ${REGISTRY}/astermanagement-backend:staging
        ports:
        - containerPort: 8080
        envFrom:
        - configMapRef:
            name: backend-config
        - secretRef:
            name: backend-secrets
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 20
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: staging
spec:
  selector:
    app: backend
  ports:
  - port: 8080
    targetPort: 8080
```

### Frontend Deployment
```bash
# Build Next.js application
cd frontend
npm install
npm run build

# Create optimized Dockerfile
cat > Dockerfile << EOF
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
EOF

# Build and push image
docker build -t astermanagement-frontend:staging .
docker tag astermanagement-frontend:staging ${REGISTRY}/astermanagement-frontend:staging
docker push ${REGISTRY}/astermanagement-frontend:staging
```

### Frontend Kubernetes Deployment
```yaml
# frontend-deployment.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  namespace: staging
data:
  NEXT_PUBLIC_API_URL: "https://api-staging.astermanagement.com"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: ${REGISTRY}/astermanagement-frontend:staging
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: frontend-config
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 20
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: staging
spec:
  selector:
    app: frontend
  ports:
  - port: 3000
    targetPort: 3000
```

### Ingress Configuration
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: staging-ingress
  namespace: staging
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - staging.astermanagement.com
    - api-staging.astermanagement.com
    secretName: staging-tls
  rules:
  - host: staging.astermanagement.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
  - host: api-staging.astermanagement.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8080
```

### Database Migration
```bash
# Apply Flyway migrations
cd backend
./gradlew flywayMigrate \
  -Dflyway.url=jdbc:postgresql://staging-db:5432/astermanagement \
  -Dflyway.user=astermanagement \
  -Dflyway.password=${DB_PASSWORD}

# Verify migrations
./gradlew flywayInfo \
  -Dflyway.url=jdbc:postgresql://staging-db:5432/astermanagement \
  -Dflyway.user=astermanagement \
  -Dflyway.password=${DB_PASSWORD}
```

### Deployment Script
```bash
#!/bin/bash
# deploy-staging.sh
set -euo pipefail

echo "Deploying to staging environment..."

# Apply all Kubernetes resources
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Wait for deployments to be ready
kubectl rollout status deployment/backend -n staging
kubectl rollout status deployment/frontend -n staging

echo "Deployment complete!"
```

### Smoke Tests
```bash
# Create smoke test script
cat > scripts/smoke-tests.sh << 'EOF'
#!/bin/bash
set -euo pipefail

API_URL="https://api-staging.astermanagement.com"
FRONTEND_URL="https://staging.astermanagement.com"

echo "Running smoke tests..."

# Test backend health
echo "Testing backend health..."
curl -f ${API_URL}/actuator/health || exit 1

# Test authentication
echo "Testing authentication..."
TOKEN=$(curl -s -X POST ${API_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password"}' \
  | jq -r '.token')

if [ -z "$TOKEN" ]; then
  echo "Authentication failed"
  exit 1
fi

# Test matter API
echo "Testing matter API..."
curl -f -H "Authorization: Bearer ${TOKEN}" ${API_URL}/api/matters || exit 1

# Test frontend
echo "Testing frontend..."
curl -f ${FRONTEND_URL} || exit 1

# Performance test
echo "Running basic performance test..."
ab -n 100 -c 10 -H "Authorization: Bearer ${TOKEN}" ${API_URL}/api/matters | grep "Requests per second"

echo "All smoke tests passed!"
EOF

chmod +x scripts/smoke-tests.sh
./scripts/smoke-tests.sh
```

## Implementation Notes

### Deployment Checklist
1. **Pre-deployment Verification**
   - [ ] Infrastructure is ready (from T14_S04)
   - [ ] Container registry is accessible
   - [ ] Database is running and accessible
   - [ ] Secrets are configured in Kubernetes

2. **Application Deployment**
   - [ ] Backend image built and pushed
   - [ ] Frontend image built and pushed
   - [ ] Kubernetes deployments applied
   - [ ] Services and ingress configured
   - [ ] SSL certificates validated

3. **Post-deployment Verification**
   - [ ] Health endpoints responding
   - [ ] Authentication working
   - [ ] All API endpoints functional
   - [ ] Frontend loads correctly
   - [ ] Performance within SLA

### Feature Verification Checklist
- [ ] **Authentication**: Login, logout, token refresh
- [ ] **Matter Management**: CRUD operations, Kanban board
- [ ] **Document Management**: Upload, view, OCR functionality
- [ ] **Memo System**: Create and search memos
- [ ] **Expense Tracking**: Record and export expenses
- [ ] **Search**: Full-text search functionality
- [ ] **Notifications**: Due date reminders working

### Troubleshooting Guide
1. **Pod not starting**
   ```bash
   kubectl describe pod <pod-name> -n staging
   kubectl logs <pod-name> -n staging
   ```

2. **Database connection issues**
   - Verify database service is running
   - Check credentials in secrets
   - Test connectivity from pod

3. **Ingress not working**
   - Check ingress controller logs
   - Verify DNS records
   - Check SSL certificate status

4. **Performance issues**
   - Check resource limits
   - Review application logs
   - Monitor database queries

### Rollback Procedure
```bash
# Rollback to previous version
kubectl rollout undo deployment/backend -n staging
kubectl rollout undo deployment/frontend -n staging

# Check rollback status
kubectl rollout status deployment/backend -n staging
kubectl rollout status deployment/frontend -n staging
```

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Modified files: k8s/, scripts/
[YYYY-MM-DD HH:MM:SS] Completed subtask: Backend deployment
[YYYY-MM-DD HH:MM:SS] Task completed