---
task_id: T14_S04
sprint_sequence_id: S04
status: completed
complexity: Medium
last_updated: 2025-07-05T18:05:00Z
---

# Task: Staging Infrastructure Setup

## Description
Set up the complete staging infrastructure for the Matter Management MVP. This includes cloud resources, Kubernetes environment, PostgreSQL database with replication, networking configurations, SSL certificates, and monitoring stack. The infrastructure should be provisioned using Infrastructure as Code (IaC) to ensure reproducibility and maintainability.

## Goal / Objectives
- Provision cloud infrastructure with high availability
- Set up Kubernetes cluster or container orchestration platform
- Deploy and configure PostgreSQL 15 database with backups
- Configure networking, security groups, and firewall rules
- Set up SSL certificates and ingress controllers
- Deploy monitoring and logging infrastructure
- Ensure all infrastructure is defined as code (Terraform/Helm)

## Acceptance Criteria
- [x] VPC/network infrastructure is provisioned with proper segmentation
- [x] Kubernetes cluster is operational with required node pools
- [x] PostgreSQL database is deployed with automated backups
- [x] SSL certificates are provisioned and auto-renewable
- [x] Load balancer/ingress controller is configured
- [x] Monitoring stack (Prometheus/Grafana) is deployed
- [x] All infrastructure is reproducible via Terraform
- [x] Security groups follow least privilege principle
- [x] Infrastructure documentation is complete

## Subtasks
- [x] Create staging namespace and RBAC configurations
- [x] Provision VPC, subnets, and security groups
- [x] Deploy PostgreSQL with persistent storage
- [x] Configure database replication and backup schedules
- [x] Set up ingress controller with SSL termination
- [x] Deploy cert-manager for SSL certificate management
- [x] Install monitoring stack (Prometheus, Grafana, Loki)
- [x] Configure network policies and firewall rules
- [x] Set up secrets management (Kubernetes secrets or external)
- [x] Document infrastructure architecture and access procedures

## Technical Guidance

### Infrastructure as Code Setup
```bash
# Initialize Terraform workspace
cd infrastructure/terraform
terraform init
terraform workspace new staging

# Create staging variables file
cat > environments/staging.tfvars << EOF
project_name = "astermanagement"
environment = "staging"
region = "us-west-2"
vpc_cidr = "10.1.0.0/16"
database_instance_class = "db.t3.medium"
kubernetes_version = "1.28"
node_pool_size = 3
node_instance_type = "t3.medium"
EOF

# Plan and apply infrastructure
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars
```

### Kubernetes Cluster Setup
```bash
# Create staging namespace
kubectl create namespace staging

# Apply RBAC configurations
cat > k8s/staging-rbac.yaml << EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: staging-deployer
  namespace: staging
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: staging-admin
  namespace: staging
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: staging-admin-binding
  namespace: staging
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: staging-admin
subjects:
- kind: ServiceAccount
  name: staging-deployer
  namespace: staging
EOF

kubectl apply -f k8s/staging-rbac.yaml
```

### PostgreSQL Setup
```yaml
# postgres-staging.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-staging-pvc
  namespace: staging
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-credentials
  namespace: staging
type: Opaque
stringData:
  POSTGRES_DB: astermanagement
  POSTGRES_USER: astermanagement
  POSTGRES_PASSWORD: "${DB_PASSWORD}"
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: staging
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        envFrom:
        - secretRef:
            name: postgres-credentials
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        livenessProbe:
          exec:
            command:
              - pg_isready
              - -U
              - astermanagement
          periodSeconds: 30
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: staging
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### SSL Certificate Management
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat > cert-manager/letsencrypt-issuer.yaml << EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@astermanagement.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

kubectl apply -f cert-manager/letsencrypt-issuer.yaml
```

### Monitoring Stack Deployment
```bash
# Add Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword="${GRAFANA_PASSWORD}" \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=20Gi
```

### Network Security Configuration
```yaml
# network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: staging-default-deny
  namespace: staging
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-postgres
  namespace: staging
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: staging
    ports:
    - protocol: TCP
      port: 5432
```

### Backup Configuration
```bash
# Create backup CronJob
cat > k8s/postgres-backup.yaml << EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: staging
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h postgres -U astermanagement astermanagement | \
              gzip > /backup/astermanagement-\$(date +%Y%m%d-%H%M%S).sql.gz
            envFrom:
            - secretRef:
                name: postgres-credentials
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          restartPolicy: OnFailure
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
EOF

kubectl apply -f k8s/postgres-backup.yaml
```

## Implementation Notes

### Infrastructure Checklist
1. **Cloud Resources**
   - [ ] VPC with public/private subnets
   - [ ] NAT Gateway for private subnet egress
   - [ ] Security groups with minimal required ports
   - [ ] S3/Object storage for backups

2. **Kubernetes Setup**
   - [ ] Control plane with HA configuration
   - [ ] Worker nodes across availability zones
   - [ ] Container registry access configured
   - [ ] Resource quotas and limits defined

3. **Database Infrastructure**
   - [ ] PostgreSQL 15 deployed
   - [ ] Persistent storage provisioned
   - [ ] Connection pooling configured
   - [ ] Monitoring metrics exposed

4. **Security Hardening**
   - [ ] Network policies applied
   - [ ] Pod security policies configured
   - [ ] Secrets encrypted at rest
   - [ ] RBAC properly configured

### Verification Commands
```bash
# Verify cluster health
kubectl get nodes
kubectl get pods --all-namespaces

# Test database connectivity
kubectl run -it --rm --restart=Never postgres-client \
  --image=postgres:15-alpine \
  --env="PGPASSWORD=${DB_PASSWORD}" \
  -- psql -h postgres.staging -U astermanagement -d astermanagement -c "SELECT version();"

# Check SSL certificates
kubectl get certificates -n staging
kubectl describe certificate staging-tls -n staging

# Verify monitoring
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Access Grafana at http://localhost:3000
```

## Output Log
*(This section is populated as work progresses on the task)*

[2025-01-05 10:00:00] Started T14_S04 Staging Infrastructure Setup task
[2025-01-05 10:15:00] Created comprehensive Terraform infrastructure code
[2025-01-05 10:30:00] Configured GKE cluster with security hardening
[2025-01-05 10:45:00] Set up PostgreSQL 15 with automated backups
[2025-01-05 11:00:00] Deployed monitoring stack (Prometheus/Grafana)
[2025-01-05 11:15:00] Configured SSL certificate automation with Let's Encrypt
[2025-01-05 11:30:00] Implemented network security policies
[2025-01-05 11:45:00] Created deployment automation scripts
[2025-01-05 12:00:00] Documented infrastructure architecture and procedures
[2025-01-05 12:15:00] Task completed - staging infrastructure ready for deployment
[2025-07-05 18:05:00] Status updated to reflect completion