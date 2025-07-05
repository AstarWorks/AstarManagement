# Project Configuration
variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "CIDR block for subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "pod_cidr" {
  description = "CIDR block for pods"
  type        = string
  default     = "10.1.0.0/16"
}

variable "service_cidr" {
  description = "CIDR block for services"
  type        = string
  default     = "10.2.0.0/16"
}

# GKE Configuration
variable "cluster_name" {
  description = "Name of the GKE cluster"
  type        = string
  default     = "aster-staging-cluster"
}

variable "node_count" {
  description = "Number of nodes in the cluster"
  type        = number
  default     = 3
}

variable "node_machine_type" {
  description = "Machine type for cluster nodes"
  type        = string
  default     = "e2-standard-2"
}

variable "node_disk_size" {
  description = "Disk size for cluster nodes (GB)"
  type        = number
  default     = 50
}

variable "node_disk_type" {
  description = "Disk type for cluster nodes"
  type        = string
  default     = "pd-standard"
}

variable "min_node_count" {
  description = "Minimum number of nodes in the cluster"
  type        = number
  default     = 1
}

variable "max_node_count" {
  description = "Maximum number of nodes in the cluster"
  type        = number
  default     = 10
}

# Database Configuration
variable "db_tier" {
  description = "Database instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "db_storage_size" {
  description = "Database storage size (GB)"
  type        = number
  default     = 20
}

variable "db_storage_type" {
  description = "Database storage type"
  type        = string
  default     = "PD_SSD"
}

variable "db_backup_enabled" {
  description = "Enable database backups"
  type        = bool
  default     = true
}

variable "db_backup_start_time" {
  description = "Database backup start time (HH:MM format)"
  type        = string
  default     = "03:00"
}

# Redis Configuration
variable "redis_memory_size" {
  description = "Redis memory size (GB)"
  type        = number
  default     = 1
}

variable "redis_tier" {
  description = "Redis service tier"
  type        = string
  default     = "BASIC"
}

# Security Configuration
variable "authorized_networks" {
  description = "List of authorized networks for database access"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "enable_private_nodes" {
  description = "Enable private GKE nodes"
  type        = bool
  default     = true
}

variable "enable_network_policy" {
  description = "Enable Kubernetes network policy"
  type        = bool
  default     = true
}

# SSL Configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "staging.aster-management.example.com"
}

variable "enable_ssl" {
  description = "Enable SSL certificates"
  type        = bool
  default     = true
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable Google Cloud monitoring"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable Google Cloud logging"
  type        = bool
  default     = true
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

# Application Configuration
variable "backend_image" {
  description = "Backend container image"
  type        = string
  default     = "us-docker.pkg.dev/PROJECT_ID/aster-management/api:latest"
}

variable "frontend_image" {
  description = "Frontend container image"
  type        = string
  default     = "us-docker.pkg.dev/PROJECT_ID/aster-management/web:latest"
}

variable "backend_replicas" {
  description = "Number of backend replicas"
  type        = number
  default     = 2
}

variable "frontend_replicas" {
  description = "Number of frontend replicas"
  type        = number
  default     = 2
}

# Resource Limits
variable "backend_cpu_request" {
  description = "Backend CPU request"
  type        = string
  default     = "500m"
}

variable "backend_memory_request" {
  description = "Backend memory request"
  type        = string
  default     = "512Mi"
}

variable "backend_cpu_limit" {
  description = "Backend CPU limit"
  type        = string
  default     = "1000m"
}

variable "backend_memory_limit" {
  description = "Backend memory limit"
  type        = string
  default     = "1Gi"
}

variable "frontend_cpu_request" {
  description = "Frontend CPU request"
  type        = string
  default     = "100m"
}

variable "frontend_memory_request" {
  description = "Frontend memory request"
  type        = string
  default     = "128Mi"
}

variable "frontend_cpu_limit" {
  description = "Frontend CPU limit"
  type        = string
  default     = "500m"
}

variable "frontend_memory_limit" {
  description = "Frontend memory limit"
  type        = string
  default     = "512Mi"
}