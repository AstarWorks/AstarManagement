# Cluster information
output "cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.primary.name
}

output "cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "cluster_location" {
  description = "GKE cluster location"
  value       = google_container_cluster.primary.location
}

output "cluster_ca_certificate" {
  description = "GKE cluster CA certificate"
  value       = google_container_cluster.primary.master_auth.0.cluster_ca_certificate
  sensitive   = true
}

# Network information
output "vpc_name" {
  description = "VPC network name"
  value       = google_compute_network.vpc.name
}

output "subnet_name" {
  description = "Subnet name"
  value       = google_compute_subnetwork.subnet.name
}

output "ingress_ip" {
  description = "External IP address for ingress"
  value       = google_compute_global_address.ingress_ip.address
}

# Database information
output "database_instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.postgres.name
}

output "database_private_ip" {
  description = "Cloud SQL instance private IP"
  value       = google_sql_database_instance.postgres.private_ip_address
  sensitive   = true
}

output "database_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.postgres.connection_name
}

output "database_name" {
  description = "Database name"
  value       = google_sql_database.app_database.name
}

output "database_user" {
  description = "Database user name"
  value       = google_sql_user.app_user.name
}

output "database_password" {
  description = "Database user password"
  value       = google_sql_user.app_user.password
  sensitive   = true
}

# Redis information
output "redis_host" {
  description = "Redis instance host"
  value       = google_redis_instance.cache.host
}

output "redis_port" {
  description = "Redis instance port"
  value       = google_redis_instance.cache.port
}

output "redis_auth_string" {
  description = "Redis authentication string"
  value       = google_redis_instance.cache.auth_string
  sensitive   = true
}

# Service account information
output "backend_service_account_email" {
  description = "Backend service account email"
  value       = google_service_account.aster_backend.email
}

output "frontend_service_account_email" {
  description = "Frontend service account email"
  value       = google_service_account.aster_frontend.email
}

# Monitoring information
output "grafana_admin_password" {
  description = "Grafana admin password"
  value       = random_password.grafana_password.result
  sensitive   = true
}

output "grafana_url" {
  description = "Grafana URL"
  value       = var.enable_monitoring ? "https://grafana.${var.domain_name}" : "Monitoring not enabled"
}

# Kubernetes connection information
output "kubernetes_config_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --region ${google_container_cluster.primary.location} --project ${var.project_id}"
}

# Application URLs
output "application_urls" {
  description = "Application URLs"
  value = {
    frontend = "https://${var.domain_name}"
    backend  = "https://${var.domain_name}/api"
    grafana  = var.enable_monitoring ? "https://grafana.${var.domain_name}" : "Monitoring not enabled"
  }
}

# Connection strings
output "database_url" {
  description = "Database connection URL"
  value       = "postgresql://${google_sql_user.app_user.name}:${google_sql_user.app_user.password}@${google_sql_database_instance.postgres.private_ip_address}:5432/${google_sql_database.app_database.name}"
  sensitive   = true
}

output "redis_url" {
  description = "Redis connection URL"
  value       = "redis://:${google_redis_instance.cache.auth_string}@${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
  sensitive   = true
}

# Security information
output "jwt_secret" {
  description = "JWT secret for application"
  value       = random_password.jwt_secret.result
  sensitive   = true
}

# Environment configuration
output "environment_summary" {
  description = "Environment configuration summary"
  value = {
    environment     = local.environment
    project         = local.project
    region          = var.region
    cluster_name    = google_container_cluster.primary.name
    node_count      = var.node_count
    machine_type    = var.node_machine_type
    database_tier   = var.db_tier
    redis_tier      = var.redis_tier
    ssl_enabled     = var.enable_ssl
    monitoring_enabled = var.enable_monitoring
    network_policy_enabled = var.enable_network_policy
    private_nodes_enabled = var.enable_private_nodes
  }
}