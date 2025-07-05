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
curl -f "http://${FRONTEND_URL}:3000/" || exit 1
echo "Frontend health check passed"

echo "Deployment completed successfully!"