# Aster Management - Staging Infrastructure

This directory contains Terraform configuration for provisioning the staging infrastructure for the Aster Management legal case management system.

## Architecture Overview

The staging infrastructure includes:

- **GKE Cluster**: Managed Kubernetes cluster with autoscaling
- **PostgreSQL**: Cloud SQL instance with automated backups
- **Redis**: Managed Redis instance for caching and sessions
- **VPC Network**: Private network with NAT gateway
- **Monitoring**: Prometheus and Grafana stack
- **SSL Certificates**: Automated SSL with Let's Encrypt
- **Security**: Network policies, IAM, and Workload Identity

## Prerequisites

1. **Google Cloud SDK**: Install and configure `gcloud`
2. **Terraform**: Version >= 1.5
3. **kubectl**: For Kubernetes management
4. **Helm**: For package management
5. **GCP Project**: With billing enabled

## Quick Start

### 1. Setup Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"

# Set default project
gcloud config set project $PROJECT_ID

# Enable required APIs (done automatically by Terraform)
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

### 2. Create Terraform State Bucket

```bash
# Create bucket for Terraform state
gsutil mb gs://aster-management-terraform-state

# Enable versioning
gsutil versioning set on gs://aster-management-terraform-state
```

### 3. Configure Variables

```bash
# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit variables
vim terraform.tfvars
```

Required variables to set:
- `project_id`: Your GCP project ID
- `domain_name`: Your staging domain
- Update container image URLs with your project ID

### 4. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply configuration
terraform apply
```

### 5. Configure kubectl

```bash
# Get cluster credentials
gcloud container clusters get-credentials aster-staging-cluster \
  --region us-central1 --project $PROJECT_ID

# Verify connection
kubectl get nodes
```

## Infrastructure Components

### Network Architecture

```
Internet
    │
    ▼
[Load Balancer] ──► [Ingress Controller]
    │                      │
    ▼                      ▼
[Frontend Pods]    [Backend Pods]
    │                      │
    ▼                      ▼
[Shared Services]  [Database Layer]
                          │
                          ▼
                   [Cloud SQL + Redis]
```

### Security Features

- **Private GKE Nodes**: No public IPs on worker nodes
- **Network Policies**: Microsegmentation between pods
- **Workload Identity**: Secure access to GCP services
- **SSL/TLS**: Automated certificate management
- **Firewall Rules**: Restricted network access
- **Binary Authorization**: Container image security

### Monitoring Stack

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Cloud Logging**: Centralized log management
- **Cloud Monitoring**: Infrastructure monitoring

## Post-Deployment Setup

### 1. Configure DNS

Point your domain to the ingress IP:

```bash
# Get ingress IP
terraform output ingress_ip

# Create DNS A record
# staging.aster-management.example.com → <ingress_ip>
```

### 2. Deploy Applications

Applications are deployed via ArgoCD GitOps:

```bash
# Install ArgoCD (if not using existing cluster)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Apply ArgoCD applications
kubectl apply -f ../../argocd/applications/
```

### 3. Access Grafana

```bash
# Get Grafana admin password
terraform output grafana_admin_password

# Access Grafana at https://grafana.your-domain.com
```

## Database Management

### Connect to Database

```bash
# Get database connection details
terraform output database_connection_name
terraform output database_password

# Connect via Cloud SQL Proxy
gcloud sql connect aster-staging-postgres --user=aster_app_user
```

### Backup Management

Automated backups are configured:
- Daily backups at 3:00 AM UTC
- 7-day retention (configurable)
- Point-in-time recovery enabled

## Monitoring and Alerts

### Key Metrics Dashboard

Access Grafana to monitor:
- Application performance
- Database metrics
- Kubernetes cluster health
- Resource utilization

### Log Analysis

```bash
# View application logs
kubectl logs -f deployment/aster-backend -n aster-staging

# View all logs in namespace
kubectl logs -l app=aster-backend -n aster-staging --tail=100
```

## Scaling

### Horizontal Pod Autoscaling

Configured for both frontend and backend:
- CPU target: 70%
- Min replicas: 2
- Max replicas: 10

### Cluster Autoscaling

Node pool autoscaling:
- Min nodes: 1
- Max nodes: 10
- Machine type: e2-standard-2

## Security Hardening

### Network Policies

Network policies restrict pod-to-pod communication:
- Default deny all traffic
- Explicit allow rules for necessary communication
- Ingress and egress filtering

### Workload Identity

Service accounts mapped to Google service accounts:
- Principle of least privilege
- No service account keys stored in cluster

## Troubleshooting

### Common Issues

1. **Cluster creation fails**
   ```bash
   # Check API enablement
   gcloud services list --enabled
   
   # Check quotas
   gcloud compute project-info describe --project=$PROJECT_ID
   ```

2. **Database connection issues**
   ```bash
   # Check private service connection
   gcloud services vpc-peerings list --network=aster-staging-vpc
   
   # Test connectivity from pod
   kubectl run -it --rm debug --image=postgres:15 -- psql $DATABASE_URL
   ```

3. **SSL certificate issues**
   ```bash
   # Check cert-manager status
   kubectl get certificaterequests -A
   kubectl describe certificate -n aster-staging
   ```

### Debug Commands

```bash
# Check cluster status
kubectl get nodes
kubectl get pods -A

# Check ingress
kubectl get ingress -A
kubectl describe ingress -n aster-staging

# Check certificates
kubectl get certificates -A
```

## Cost Optimization

### Development vs Production

Current configuration is optimized for staging:
- Single zone deployment
- Smaller instance sizes
- Basic Redis tier
- Micro database tier

For production, consider:
- Regional deployment for high availability
- Larger instance sizes
- Standard Redis tier with replica
- Higher database tier

### Resource Monitoring

Monitor costs:
- GKE cluster ($150-300/month)
- Database ($50-100/month)
- Load balancer ($18/month)
- Storage and networking

## Cleanup

To destroy the infrastructure:

```bash
# Destroy all resources
terraform destroy

# Confirm deletion
# Note: This will permanently delete all data
```

## Support

For issues with this infrastructure:

1. Check Terraform state: `terraform show`
2. Review logs: `kubectl logs -n kube-system`
3. Check Google Cloud Console for detailed error messages
4. Refer to troubleshooting section above

## Security Considerations

- Keep Terraform state secure (use remote backend)
- Rotate database passwords regularly
- Monitor access logs
- Apply security patches regularly
- Review IAM permissions periodically