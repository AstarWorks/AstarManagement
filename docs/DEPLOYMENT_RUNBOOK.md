# Aster Management - Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the Aster Management application to staging and production environments using our GitOps infrastructure.

## Prerequisites

### Required Tools
- `gcloud` CLI (authenticated)
- `kubectl` (configured for target cluster)
- `helm` (v3.x)
- `docker` (for local image building)
- `terraform` (for infrastructure management)

### Environment Variables
```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export DOMAIN_NAME="staging.astermanagement.com"
```

## Staging Deployment

### 1. Infrastructure Setup

Deploy the staging infrastructure using Terraform:

```bash
# Navigate to project root
cd /path/to/aster-management

# Deploy staging infrastructure
./scripts/deploy-staging.sh --project-id $PROJECT_ID --region $REGION --domain $DOMAIN_NAME
```

This script will:
- Create GCP resources (GKE cluster, Cloud SQL, Redis)
- Set up ArgoCD for GitOps deployment
- Configure monitoring and security
- Apply initial Kubernetes resources

### 2. Application Deployment

Applications are deployed automatically via ArgoCD once infrastructure is ready.

#### Backend Deployment
```bash
# Check backend deployment status
kubectl get pods -n aster-staging -l app=backend

# View backend logs
kubectl logs -n aster-staging -l app=backend -f

# Check backend health
kubectl port-forward -n aster-staging svc/aster-backend 8080:8080
curl http://localhost:8080/actuator/health
```

#### Frontend Deployment
```bash
# Check frontend deployment status
kubectl get pods -n aster-staging -l app=frontend

# View frontend logs
kubectl logs -n aster-staging -l app=frontend -f

# Check frontend accessibility
kubectl port-forward -n aster-staging svc/aster-frontend 3000:3000
curl http://localhost:3000
```

### 3. Database Migration

Apply database migrations:

```bash
# Get database credentials
export DB_PASSWORD=$(kubectl get secret aster-backend-secrets -n aster-staging -o jsonpath='{.data.database-password}' | base64 -d)

# Run migrations from backend directory
cd backend
./gradlew flywayMigrate \
  -Dflyway.url=jdbc:postgresql://aster-postgresql:5432/astermanagement \
  -Dflyway.user=astermanagement \
  -Dflyway.password=$DB_PASSWORD

# Verify migrations
./gradlew flywayInfo \
  -Dflyway.url=jdbc:postgresql://aster-postgresql:5432/astermanagement \
  -Dflyway.user=astermanagement \
  -Dflyway.password=$DB_PASSWORD
```

### 4. Smoke Tests

Run comprehensive smoke tests:

```bash
# Run smoke tests
./scripts/smoke-tests.sh \
  --api-url https://api-staging.astermanagement.com \
  --frontend-url https://staging.astermanagement.com

# Expected output:
# [SUCCESS] ✓ Backend health check
# [SUCCESS] ✓ Backend readiness check
# [SUCCESS] ✓ All tests passed!
```

## Production Deployment

### 1. Pre-deployment Checklist

- [ ] All staging tests passing
- [ ] Security scans completed
- [ ] Performance benchmarks met
- [ ] Backup strategy verified
- [ ] Rollback plan prepared

### 2. Blue-Green Deployment

```bash
# Deploy to production (blue environment)
./scripts/deploy-production.sh --environment blue

# Run production smoke tests
./scripts/smoke-tests.sh \
  --api-url https://api-blue.astermanagement.com \
  --frontend-url https://blue.astermanagement.com

# Switch traffic to blue environment
kubectl patch ingress production-ingress -n aster-production \
  --type='json' \
  -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value": "aster-frontend-blue"}]'

# Verify production health
./scripts/smoke-tests.sh \
  --api-url https://api.astermanagement.com \
  --frontend-url https://astermanagement.com
```

## Monitoring and Health Checks

### Application Health Endpoints

#### Backend Health Checks
- **Liveness**: `GET /actuator/health/liveness`
- **Readiness**: `GET /actuator/health/readiness`
- **Metrics**: `GET /actuator/metrics`
- **Info**: `GET /actuator/info`

#### Frontend Health Checks
- **Root**: `GET /` (returns 200 OK)
- **Health**: `GET /health` (application-specific)

### Monitoring Dashboard

Access Grafana dashboard:
```bash
# Get Grafana URL and password
terraform output grafana_url
terraform output -raw grafana_admin_password

# Port forward if needed
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

Key metrics to monitor:
- Response time (p95 < 500ms for API, < 3s for frontend)
- Error rate (< 1%)
- CPU/Memory usage (< 80%)
- Database connection pool

## Troubleshooting

### Common Issues

#### 1. Pod Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n <namespace>

# Check pod logs
kubectl logs <pod-name> -n <namespace> --previous

# Common causes:
# - Image pull errors (check registry access)
# - Resource limits (check requests/limits)
# - Configuration errors (check ConfigMaps/Secrets)
```

#### 2. Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it <backend-pod> -n <namespace> -- bash
pg_isready -h aster-postgresql -p 5432

# Check database secrets
kubectl get secret aster-backend-secrets -n <namespace> -o yaml

# Common causes:
# - Wrong credentials
# - Network policies blocking access
# - Database not ready
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
kubectl get certificates -n <namespace>

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Common causes:
# - DNS not pointing to ingress IP
# - Let's Encrypt rate limits
# - Ingress configuration errors
```

#### 4. Performance Issues
```bash
# Check resource usage
kubectl top pods -n <namespace>

# Check application metrics
curl https://api.astermanagement.com/actuator/metrics

# Check database performance
kubectl exec -it aster-postgresql-0 -n <namespace> -- \
  psql -U astermanagement -c "SELECT * FROM pg_stat_activity;"
```

## Rollback Procedures

### Application Rollback
```bash
# Rollback backend deployment
kubectl rollout undo deployment/aster-backend -n <namespace>

# Rollback frontend deployment
kubectl rollout undo deployment/aster-frontend -n <namespace>

# Check rollback status
kubectl rollout status deployment/aster-backend -n <namespace>
kubectl rollout status deployment/aster-frontend -n <namespace>
```

### Database Rollback
```bash
# Rollback to specific migration (if needed)
cd backend
./gradlew flywayUndo \
  -Dflyway.url=jdbc:postgresql://aster-postgresql:5432/astermanagement \
  -Dflyway.user=astermanagement \
  -Dflyway.password=$DB_PASSWORD \
  -Dflyway.target=<target-version>
```

### Infrastructure Rollback
```bash
# Rollback Terraform changes
cd terraform/staging
terraform plan -destroy
terraform apply -destroy # (if complete rollback needed)

# Or revert to previous state
terraform apply -var-file=previous.tfvars
```

## Security Considerations

### Secrets Management
- All secrets stored in Kubernetes Secrets
- Database passwords rotated monthly
- JWT secrets unique per environment
- API keys stored in Google Secret Manager

### Network Security
- Network policies restrict pod-to-pod communication
- Ingress with SSL termination only
- Database accessible only from backend pods
- Redis accessible only from backend pods

### Image Security
- Base images scanned for vulnerabilities
- Images signed with cosign
- Registry access controlled by IAM
- Regular base image updates

## Performance Targets

### Response Time SLAs
- API endpoints: p95 < 500ms
- Frontend pages: p95 < 3000ms
- Database queries: p95 < 100ms

### Availability Targets
- Staging: 99% uptime
- Production: 99.9% uptime
- Database: 99.95% uptime

### Scaling Targets
- Backend: 2-10 replicas (CPU-based)
- Frontend: 2-10 replicas (CPU-based)
- Database: Single instance with read replicas

## Maintenance Windows

### Scheduled Maintenance
- **Staging**: Daily 2:00-4:00 AM JST
- **Production**: Sunday 2:00-6:00 AM JST
- **Database**: Monthly during production window

### Emergency Maintenance
- Coordinate with operations team
- Update status page
- Follow incident response procedures

## Contact Information

### On-Call Rotation
- **Primary**: Platform Team
- **Secondary**: Development Team
- **Escalation**: Engineering Manager

### Emergency Contacts
- Platform Team: platform@astermanagement.com
- Development Team: dev@astermanagement.com
- Operations: ops@astermanagement.com

---

## Appendix

### Useful Commands

```bash
# Quick health check
kubectl get pods -A | grep -E "(aster|argocd)"

# Check all services
kubectl get svc -A | grep aster

# View all ingresses
kubectl get ingress -A

# Check persistent volumes
kubectl get pv,pvc -A | grep aster

# ArgoCD status
kubectl get applications -n argocd

# Certificate status
kubectl get certificates -A
```

### Configuration Files

- Infrastructure: `terraform/staging/`
- Kubernetes: `k8s/staging/`
- Helm charts: `helm/backend/`, `helm/frontend/`
- ArgoCD apps: `argocd/applications/`
- Monitoring: `monitoring/`

### Log Aggregation

```bash
# Backend logs
kubectl logs -n aster-staging -l app=backend --tail=100

# Frontend logs
kubectl logs -n aster-staging -l app=frontend --tail=100

# Database logs
kubectl logs -n aster-staging -l app=postgresql --tail=100

# Ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=100
```