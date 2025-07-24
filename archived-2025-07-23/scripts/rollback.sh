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