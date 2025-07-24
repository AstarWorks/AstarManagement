#!/usr/bin/env bash
set -euo pipefail

# Aster Management - Staging Infrastructure Deployment Script
# This script deploys the complete staging infrastructure for Aster Management

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly TERRAFORM_DIR="$PROJECT_ROOT/terraform/staging"
readonly K8S_DIR="$PROJECT_ROOT/k8s/staging"

# Default values
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-us-central1}"
DOMAIN_NAME="${DOMAIN_NAME:-staging.aster-management.example.com}"
SKIP_TERRAFORM="${SKIP_TERRAFORM:-false}"
SKIP_K8S="${SKIP_K8S:-false}"
DRY_RUN="${DRY_RUN:-false}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v gcloud >/dev/null 2>&1 || missing_tools+=("gcloud")
    command -v terraform >/dev/null 2>&1 || missing_tools+=("terraform")
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v helm >/dev/null 2>&1 || missing_tools+=("helm")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install the missing tools and try again"
        exit 1
    fi
    
    # Check gcloud authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
        log_error "No active gcloud authentication found"
        log_error "Please run: gcloud auth login"
        exit 1
    fi
    
    # Check project ID
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
        if [ -z "$PROJECT_ID" ]; then
            log_error "PROJECT_ID not set and no default project configured"
            log_error "Please set PROJECT_ID environment variable or run: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        fi
    fi
    
    log_success "Prerequisites check completed"
    log_info "Using project: $PROJECT_ID"
    log_info "Using region: $REGION"
    log_info "Using domain: $DOMAIN_NAME"
}

setup_terraform_backend() {
    log_info "Setting up Terraform backend..."
    
    local bucket_name="aster-management-terraform-state"
    
    # Check if bucket exists
    if ! gsutil ls "gs://$bucket_name" >/dev/null 2>&1; then
        log_info "Creating Terraform state bucket: $bucket_name"
        gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$bucket_name"
        
        # Enable versioning
        gsutil versioning set on "gs://$bucket_name"
        
        log_success "Terraform state bucket created"
    else
        log_info "Terraform state bucket already exists"
    fi
}

deploy_terraform() {
    if [ "$SKIP_TERRAFORM" = "true" ]; then
        log_warning "Skipping Terraform deployment"
        return 0
    fi
    
    log_info "Deploying Terraform infrastructure..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init
    
    # Create terraform.tfvars if it doesn't exist
    if [ ! -f "terraform.tfvars" ]; then
        log_info "Creating terraform.tfvars from example..."
        cp terraform.tfvars.example terraform.tfvars
        
        # Update with actual values
        sed -i.bak "s/your-gcp-project-id/$PROJECT_ID/g" terraform.tfvars
        sed -i.bak "s/your-project-id/$PROJECT_ID/g" terraform.tfvars
        sed -i.bak "s/staging.aster-management.example.com/$DOMAIN_NAME/g" terraform.tfvars
        sed -i.bak "s/us-central1/$REGION/g" terraform.tfvars
        
        log_warning "terraform.tfvars created. Please review and update as needed."
        log_warning "Press Enter to continue or Ctrl+C to exit and modify the file..."
        read -r
    fi
    
    # Plan deployment
    log_info "Planning Terraform deployment..."
    terraform plan -var="project_id=$PROJECT_ID" -var="region=$REGION" -var="domain_name=$DOMAIN_NAME"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "Dry run mode - stopping before apply"
        return 0
    fi
    
    # Confirm deployment
    log_warning "This will create infrastructure in GCP project: $PROJECT_ID"
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    # Apply deployment
    log_info "Applying Terraform configuration..."
    terraform apply -var="project_id=$PROJECT_ID" -var="region=$REGION" -var="domain_name=$DOMAIN_NAME" -auto-approve
    
    log_success "Terraform infrastructure deployed successfully"
    
    # Get cluster credentials
    log_info "Configuring kubectl..."
    local cluster_name
    cluster_name=$(terraform output -raw cluster_name)
    local cluster_location
    cluster_location=$(terraform output -raw cluster_location)
    
    gcloud container clusters get-credentials "$cluster_name" --region "$cluster_location" --project "$PROJECT_ID"
    
    log_success "kubectl configured for cluster: $cluster_name"
}

deploy_kubernetes() {
    if [ "$SKIP_K8S" = "true" ]; then
        log_warning "Skipping Kubernetes deployment"
        return 0
    fi
    
    log_info "Deploying Kubernetes resources..."
    
    # Wait for cluster to be ready
    log_info "Waiting for cluster to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=300s
    
    # Apply RBAC
    log_info "Applying RBAC configuration..."
    sed "s/PROJECT_ID/$PROJECT_ID/g" "$K8S_DIR/rbac.yaml" | kubectl apply -f -
    
    # Apply network policies (if cluster supports them)
    if kubectl get networkpolicies >/dev/null 2>&1; then
        log_info "Applying network policies..."
        kubectl apply -f "$K8S_DIR/network-policies.yaml"
    else
        log_warning "Network policies not supported - skipping"
    fi
    
    # Apply monitoring configuration
    log_info "Applying monitoring configuration..."
    kubectl apply -f "$K8S_DIR/monitoring-config.yaml"
    
    # Apply backup configuration
    log_info "Applying backup configuration..."
    sed "s/PROJECT_ID/$PROJECT_ID/g" "$K8S_DIR/postgresql-backup.yaml" | kubectl apply -f -
    
    # Apply ingress configuration
    log_info "Applying ingress configuration..."
    kubectl apply -f "$K8S_DIR/ingress.yaml"
    
    log_success "Kubernetes resources deployed successfully"
}

setup_argocd() {
    log_info "Setting up ArgoCD applications..."
    
    # Check if ArgoCD is installed
    if ! kubectl get namespace argocd >/dev/null 2>&1; then
        log_info "ArgoCD namespace not found - it will be installed by Terraform"
        log_info "Waiting for ArgoCD to be ready..."
        
        # Wait for ArgoCD namespace to exist
        local count=0
        while ! kubectl get namespace argocd >/dev/null 2>&1 && [ $count -lt 60 ]; do
            sleep 5
            count=$((count + 1))
        done
        
        if [ $count -eq 60 ]; then
            log_error "ArgoCD namespace not created after 5 minutes"
            return 1
        fi
    fi
    
    # Wait for ArgoCD to be ready
    log_info "Waiting for ArgoCD to be ready..."
    kubectl wait --for=condition=Available --timeout=300s deployment/argocd-server -n argocd
    
    # Apply ArgoCD applications
    log_info "Applying ArgoCD applications..."
    kubectl apply -f "$PROJECT_ROOT/argocd/applications/"
    
    log_success "ArgoCD applications configured"
}

display_outputs() {
    log_info "Deployment completed! Here are the important details:"
    
    cd "$TERRAFORM_DIR"
    
    echo
    echo "=== Infrastructure Information ==="
    terraform output environment_summary
    
    echo
    echo "=== Access Information ==="
    echo "Application URL: https://$DOMAIN_NAME"
    echo "Grafana URL: $(terraform output grafana_url)"
    echo "Grafana Password: $(terraform output -raw grafana_admin_password)"
    
    echo
    echo "=== Database Information ==="
    echo "Database Instance: $(terraform output -raw database_instance_name)"
    echo "Database Connection: $(terraform output -raw kubernetes_config_command)"
    
    echo
    echo "=== Next Steps ==="
    echo "1. Configure your DNS to point $DOMAIN_NAME to $(terraform output -raw ingress_ip)"
    echo "2. Wait for SSL certificates to be issued (may take a few minutes)"
    echo "3. Deploy your applications using ArgoCD"
    echo "4. Access Grafana for monitoring"
    
    log_success "All deployment information displayed above"
}

cleanup_on_error() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code $exit_code"
        log_error "Check the logs above for details"
        
        if [ "$SKIP_TERRAFORM" != "true" ]; then
            log_warning "You may want to run 'terraform destroy' to clean up partial infrastructure"
        fi
    fi
    exit $exit_code
}

main() {
    # Set up error handling
    trap cleanup_on_error ERR
    
    echo "=== Aster Management - Staging Infrastructure Deployment ==="
    echo
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --project-id)
                PROJECT_ID="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --domain)
                DOMAIN_NAME="$2"
                shift 2
                ;;
            --skip-terraform)
                SKIP_TERRAFORM="true"
                shift
                ;;
            --skip-k8s)
                SKIP_K8S="true"
                shift
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo
                echo "Options:"
                echo "  --project-id ID     GCP project ID"
                echo "  --region REGION     GCP region (default: us-central1)"
                echo "  --domain DOMAIN     Domain name for the application"
                echo "  --skip-terraform    Skip Terraform deployment"
                echo "  --skip-k8s          Skip Kubernetes deployment"
                echo "  --dry-run           Plan only, don't apply changes"
                echo "  --help              Show this help message"
                echo
                echo "Environment variables:"
                echo "  PROJECT_ID          GCP project ID"
                echo "  REGION              GCP region"
                echo "  DOMAIN_NAME         Domain name"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    check_prerequisites
    setup_terraform_backend
    deploy_terraform
    deploy_kubernetes
    setup_argocd
    display_outputs
    
    log_success "Staging infrastructure deployment completed successfully!"
}

# Run main function
main "$@"