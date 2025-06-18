---
task_id: T13_S04
sprint_sequence_id: S04
status: open
complexity: Medium
last_updated: 2025-06-18T10:00:00Z
---

# Task: CD Pipeline Configuration

## Description
Configure Continuous Deployment (CD) pipelines for automated deployment to staging environments using ArgoCD and GitOps principles. This includes setting up Docker image building and pushing to GCP Artifact Registry, ArgoCD application configurations, deployment safety checks, and rollback mechanisms for both backend and frontend services.

## Goal / Objectives
- Set up Docker image building with multi-stage optimization
- Configure automated pushing to GCP Artifact Registry
- Implement ArgoCD for GitOps-based deployments
- Establish deployment safety checks and health monitoring
- Create rollback mechanisms and deployment notifications
- Document deployment procedures and runbooks

## Acceptance Criteria
- [ ] Docker images are automatically built and pushed on main branch merges
- [ ] Images are scanned for vulnerabilities before deployment
- [ ] ArgoCD successfully syncs and deploys to staging environment
- [ ] Health checks verify successful deployment before marking as complete
- [ ] Rollback can be triggered with a single command
- [ ] Deployment notifications sent to team (Slack/Discord)
- [ ] Deployment documentation and runbooks are complete

## Subtasks
- [ ] Create optimized Dockerfiles with multi-stage builds
- [ ] Set up Artifact Registry authentication in GitHub Actions
- [ ] Configure image build and push workflows
- [ ] Install and configure ArgoCD in GKE cluster
- [ ] Create ArgoCD application manifests
- [ ] Implement deployment health checks
- [ ] Set up deployment notifications
- [ ] Create rollback procedures and documentation

## Technical Guidance

### Docker Multi-Stage Builds

#### Backend Dockerfile (backend/Dockerfile)
```dockerfile
# Build stage
FROM gradle:8.5-jdk17-alpine AS build
WORKDIR /app

# Copy gradle files for dependency caching
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle

# Download dependencies (cached layer)
RUN gradle dependencies --no-daemon

# Copy source code and build
COPY src ./src
RUN gradle bootJar --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy jar from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

#### Frontend Dockerfile (frontend/Dockerfile)
```dockerfile
# Dependencies stage
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the application
RUN bun run build

# Runtime stage
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["bun", "server.js"]
```

### CD Workflow Configuration

#### Build and Deploy Workflow (.github/workflows/deploy.yml)
```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production

env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GCP_REGION: us-central1
  ARTIFACT_REGISTRY: us-docker.pkg.dev
  REGISTRY_REPOSITORY: aster-management

jobs:
  build-backend:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v2
      with:
        workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
        service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
    
    - name: Configure Docker for Artifact Registry
      run: |
        gcloud auth configure-docker ${{ env.ARTIFACT_REGISTRY }}
    
    - name: Build and push Backend Docker image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: |
          ${{ env.ARTIFACT_REGISTRY }}/${{ env.GCP_PROJECT_ID }}/${{ env.REGISTRY_REPOSITORY }}/api:${{ github.sha }}
          ${{ env.ARTIFACT_REGISTRY }}/${{ env.GCP_PROJECT_ID }}/${{ env.REGISTRY_REPOSITORY }}/api:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
        platforms: linux/amd64
    
    - name: Scan image with Trivy
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.ARTIFACT_REGISTRY }}/${{ env.GCP_PROJECT_ID }}/${{ env.REGISTRY_REPOSITORY }}/api:${{ github.sha }}
        format: 'sarif'
        output: 'trivy-backend.sarif'
        severity: 'CRITICAL,HIGH'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: 'trivy-backend.sarif'

  build-frontend:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v2
      with:
        workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
        service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
    
    - name: Configure Docker for Artifact Registry
      run: |
        gcloud auth configure-docker ${{ env.ARTIFACT_REGISTRY }}
    
    - name: Build and push Frontend Docker image
      uses: docker/build-push-action@v5
      with:
        context: ./frontend
        push: true
        tags: |
          ${{ env.ARTIFACT_REGISTRY }}/${{ env.GCP_PROJECT_ID }}/${{ env.REGISTRY_REPOSITORY }}/web:${{ github.sha }}
          ${{ env.ARTIFACT_REGISTRY }}/${{ env.GCP_PROJECT_ID }}/${{ env.REGISTRY_REPOSITORY }}/web:latest
        build-args: |
          NEXT_PUBLIC_API_URL=${{ secrets.STAGING_API_URL }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        platforms: linux/amd64

  deploy:
    needs: [build-backend, build-frontend]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Update deployment manifests
      run: |
        # Update image tags in Helm values
        sed -i "s|tag: .*|tag: ${{ github.sha }}|g" helm/backend/values-staging.yaml
        sed -i "s|tag: .*|tag: ${{ github.sha }}|g" helm/frontend/values-staging.yaml
    
    - name: Commit and push manifest updates
      uses: EndBug/add-and-commit@v9
      with:
        add: 'helm/'
        message: 'chore: update image tags to ${{ github.sha }}'
        default_author: github_actions
    
    - name: Trigger ArgoCD sync
      run: |
        curl -X POST ${{ secrets.ARGOCD_SERVER }}/api/v1/applications/aster-backend-staging/sync \
          -H "Authorization: Bearer ${{ secrets.ARGOCD_TOKEN }}" \
          -H "Content-Type: application/json" \
          -d '{"revision":"main","prune":true,"dryRun":false}'
        
        curl -X POST ${{ secrets.ARGOCD_SERVER }}/api/v1/applications/aster-frontend-staging/sync \
          -H "Authorization: Bearer ${{ secrets.ARGOCD_TOKEN }}" \
          -H "Content-Type: application/json" \
          -d '{"revision":"main","prune":true,"dryRun":false}'
    
    - name: Wait for deployment
      run: |
        # Script to check deployment status
        bash scripts/wait-for-deployment.sh staging 300
    
    - name: Send deployment notification
      if: always()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: |
          Deployment to staging: ${{ job.status }}
          Commit: ${{ github.event.head_commit.message }}
          Author: ${{ github.actor }}
          SHA: ${{ github.sha }}
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### ArgoCD Configuration

#### ArgoCD Installation (argocd/install.sh)
```bash
#!/usr/bin/env bash
set -euo pipefail

# Install ArgoCD
kubectl create namespace argocd || true
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

# Configure ArgoCD for insecure mode (for internal access)
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Install ArgoCD CLI
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd

echo "ArgoCD installed successfully"
```

#### Backend Application (argocd/applications/backend-staging.yaml)
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: aster-backend-staging
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/aster-management
    targetRevision: main
    path: helm/backend
    helm:
      valueFiles:
        - values-staging.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: aster-staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - Validate=true
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
```

#### Frontend Application (argocd/applications/frontend-staging.yaml)
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: aster-frontend-staging
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/aster-management
    targetRevision: main
    path: helm/frontend
    helm:
      valueFiles:
        - values-staging.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: aster-staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - Validate=true
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
```

### Deployment Health Checks

#### Wait for Deployment Script (scripts/wait-for-deployment.sh)
```bash
#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=${1:-staging}
TIMEOUT=${2:-300}
NAMESPACE="aster-${ENVIRONMENT}"

echo "Waiting for deployments in namespace: $NAMESPACE"

# Function to check deployment status
check_deployment() {
    local deployment=$1
    kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=${TIMEOUT}s
}

# Wait for backend deployment
echo "Checking backend deployment..."
check_deployment "aster-backend"

# Wait for frontend deployment
echo "Checking frontend deployment..."
check_deployment "aster-frontend"

# Verify pod health
echo "Verifying pod health..."
kubectl wait --for=condition=ready pod -l app=aster-backend -n $NAMESPACE --timeout=60s
kubectl wait --for=condition=ready pod -l app=aster-frontend -n $NAMESPACE --timeout=60s

# Run smoke tests
echo "Running smoke tests..."
BACKEND_URL=$(kubectl get svc aster-backend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
FRONTEND_URL=$(kubectl get svc aster-frontend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test backend health
curl -f "http://${BACKEND_URL}:8080/actuator/health" || exit 1
echo "Backend health check passed"

# Test frontend health
curl -f "http://${FRONTEND_URL}:3000/api/health" || exit 1
echo "Frontend health check passed"

echo "Deployment completed successfully!"
```

### Rollback Procedures

#### Manual Rollback Script (scripts/rollback.sh)
```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: ./rollback.sh <environment> <revision>
ENVIRONMENT=${1:-staging}
REVISION=${2:-}

if [ -z "$REVISION" ]; then
    echo "Usage: $0 <environment> <revision>"
    echo "Example: $0 staging 5"
    exit 1
fi

echo "Rolling back to revision $REVISION in $ENVIRONMENT environment"

# Rollback using ArgoCD
argocd app rollback aster-backend-${ENVIRONMENT} $REVISION
argocd app rollback aster-frontend-${ENVIRONMENT} $REVISION

# Wait for rollback to complete
argocd app wait aster-backend-${ENVIRONMENT} --health
argocd app wait aster-frontend-${ENVIRONMENT} --health

echo "Rollback completed successfully"
```

#### Emergency Rollback GitHub Action
```yaml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to rollback'
        required: true
        type: choice
        options:
          - staging
          - production
      revision:
        description: 'ArgoCD revision number'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Install ArgoCD CLI
      run: |
        curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
        chmod +x argocd
        sudo mv argocd /usr/local/bin/
    
    - name: Perform rollback
      env:
        ARGOCD_SERVER: ${{ secrets.ARGOCD_SERVER }}
        ARGOCD_AUTH_TOKEN: ${{ secrets.ARGOCD_TOKEN }}
      run: |
        argocd app rollback aster-backend-${{ github.event.inputs.environment }} ${{ github.event.inputs.revision }} --grpc-web
        argocd app rollback aster-frontend-${{ github.event.inputs.environment }} ${{ github.event.inputs.revision }} --grpc-web
    
    - name: Notify rollback
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: |
          Emergency rollback initiated for ${{ github.event.inputs.environment }}
          Revision: ${{ github.event.inputs.revision }}
          Initiated by: ${{ github.actor }}
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deployment Best Practices

1. **Progressive Rollouts**
   - Use canary deployments for critical changes
   - Implement feature flags for gradual rollout
   - Monitor metrics during deployment

2. **Security Considerations**
   - Never expose ArgoCD publicly
   - Use RBAC for deployment permissions
   - Rotate tokens regularly
   - Scan images before deployment

3. **Monitoring and Alerts**
   - Set up deployment failure alerts
   - Monitor application metrics post-deployment
   - Track deployment frequency and success rate

4. **Documentation Requirements**
   - Maintain deployment runbooks
   - Document rollback procedures
   - Keep emergency contact list updated

## Implementation Notes

### Step 1: Docker Setup
1. Create optimized Dockerfiles
2. Test multi-stage builds locally
3. Verify security scanning integration

### Step 2: ArgoCD Installation
1. Install ArgoCD in GKE cluster
2. Configure RBAC and access controls
3. Set up repository credentials

### Step 3: GitOps Configuration
1. Create Helm charts for applications
2. Set up ArgoCD applications
3. Configure automated sync policies

### Step 4: Deployment Automation
1. Update GitHub Actions workflows
2. Test deployment pipeline end-to-end
3. Verify rollback procedures

### Step 5: Monitoring Setup
1. Configure deployment notifications
2. Set up health check endpoints
3. Create deployment dashboards

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Created Dockerfiles with multi-stage builds
[YYYY-MM-DD HH:MM:SS] Configured Artifact Registry authentication
[YYYY-MM-DD HH:MM:SS] Installed ArgoCD in cluster
[YYYY-MM-DD HH:MM:SS] Created ArgoCD applications
[YYYY-MM-DD HH:MM:SS] Tested deployment pipeline
[YYYY-MM-DD HH:MM:SS] Task completed