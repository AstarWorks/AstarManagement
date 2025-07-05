# Kubernetes Namespaces
resource "kubernetes_namespace" "aster_staging" {
  metadata {
    name = "aster-staging"
    labels = local.common_labels
  }

  depends_on = [google_container_cluster.primary]
}

resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
    labels = merge(local.common_labels, {
      purpose = "monitoring"
    })
  }

  depends_on = [google_container_cluster.primary]
}

resource "kubernetes_namespace" "cert_manager" {
  metadata {
    name = "cert-manager"
    labels = merge(local.common_labels, {
      purpose = "cert-manager"
    })
  }

  depends_on = [google_container_cluster.primary]
}

# Service Accounts
resource "kubernetes_service_account" "aster_backend" {
  metadata {
    name      = "aster-backend"
    namespace = kubernetes_namespace.aster_staging.metadata[0].name
    labels    = local.common_labels
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.aster_backend.email
    }
  }
}

resource "kubernetes_service_account" "aster_frontend" {
  metadata {
    name      = "aster-frontend"
    namespace = kubernetes_namespace.aster_staging.metadata[0].name
    labels    = local.common_labels
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.aster_frontend.email
    }
  }
}

# Secrets
resource "kubernetes_secret" "aster_backend_secrets" {
  metadata {
    name      = "aster-backend-secrets"
    namespace = kubernetes_namespace.aster_staging.metadata[0].name
    labels    = local.common_labels
  }

  type = "Opaque"

  data = {
    database-url = "postgresql://${google_sql_user.app_user.name}:${google_sql_user.app_user.password}@${google_sql_database_instance.postgres.private_ip_address}:5432/${google_sql_database.app_database.name}"
    redis-url    = "redis://:${google_redis_instance.cache.auth_string}@${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
    jwt-secret   = random_password.jwt_secret.result
  }
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# ConfigMaps
resource "kubernetes_config_map" "aster_backend_config" {
  metadata {
    name      = "aster-backend-config"
    namespace = kubernetes_namespace.aster_staging.metadata[0].name
    labels    = local.common_labels
  }

  data = {
    "SPRING_PROFILES_ACTIVE" = "staging"
    "LOGGING_LEVEL_ROOT"     = "INFO"
    "MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE" = "health,info,metrics,prometheus"
    "MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS"   = "always"
  }
}

resource "kubernetes_config_map" "aster_frontend_config" {
  metadata {
    name      = "aster-frontend-config"
    namespace = kubernetes_namespace.aster_staging.metadata[0].name
    labels    = local.common_labels
  }

  data = {
    "NODE_ENV"        = "production"
    "NUXT_ENV_STAGE" = "staging"
    "API_BASE_URL"   = "https://${var.domain_name}/api"
  }
}

# Network Policies (if enabled)
resource "kubernetes_network_policy" "aster_staging_default_deny" {
  count = var.enable_network_policy ? 1 : 0

  metadata {
    name      = "default-deny-all"
    namespace = kubernetes_namespace.aster_staging.metadata[0].name
    labels    = local.common_labels
  }

  spec {
    pod_selector {}
    policy_types = ["Ingress", "Egress"]
  }
}

resource "kubernetes_network_policy" "aster_backend_policy" {
  count = var.enable_network_policy ? 1 : 0

  metadata {
    name      = "aster-backend-policy"
    namespace = kubernetes_namespace.aster_staging.metadata[0].name
    labels    = local.common_labels
  }

  spec {
    pod_selector {
      match_labels = {
        app = "aster-backend"
      }
    }

    policy_types = ["Ingress", "Egress"]

    # Allow ingress from frontend and ingress controller
    ingress {
      from {
        pod_selector {
          match_labels = {
            app = "aster-frontend"
          }
        }
      }
      from {
        namespace_selector {
          match_labels = {
            name = "ingress-nginx"
          }
        }
      }
      ports {
        protocol = "TCP"
        port     = "8080"
      }
    }

    # Allow egress to database and redis
    egress {
      to {}
      ports {
        protocol = "TCP"
        port     = "5432" # PostgreSQL
      }
      ports {
        protocol = "TCP"
        port     = "6379" # Redis
      }
    }

    # Allow DNS resolution
    egress {
      to {}
      ports {
        protocol = "UDP"
        port     = "53"
      }
      ports {
        protocol = "TCP"
        port     = "53"
      }
    }

    # Allow HTTPS for external APIs
    egress {
      to {}
      ports {
        protocol = "TCP"
        port     = "443"
      }
    }
  }
}

resource "kubernetes_network_policy" "aster_frontend_policy" {
  count = var.enable_network_policy ? 1 : 0

  metadata {
    name      = "aster-frontend-policy"
    namespace = kubernetes_namespace.aster_staging.metadata[0].name
    labels    = local.common_labels
  }

  spec {
    pod_selector {
      match_labels = {
        app = "aster-frontend"
      }
    }

    policy_types = ["Ingress", "Egress"]

    # Allow ingress from ingress controller
    ingress {
      from {
        namespace_selector {
          match_labels = {
            name = "ingress-nginx"
          }
        }
      }
      ports {
        protocol = "TCP"
        port     = "3000"
      }
    }

    # Allow egress to backend
    egress {
      to {
        pod_selector {
          match_labels = {
            app = "aster-backend"
          }
        }
      }
      ports {
        protocol = "TCP"
        port     = "8080"
      }
    }

    # Allow DNS resolution
    egress {
      to {}
      ports {
        protocol = "UDP"
        port     = "53"
      }
      ports {
        protocol = "TCP"
        port     = "53"
      }
    }
  }
}

# Resource Quotas
resource "kubernetes_resource_quota" "aster_staging_quota" {
  metadata {
    name      = "aster-staging-quota"
    namespace = kubernetes_namespace.aster_staging.metadata[0].name
    labels    = local.common_labels
  }

  spec {
    hard = {
      "requests.cpu"    = "4"
      "requests.memory" = "8Gi"
      "limits.cpu"      = "8"
      "limits.memory"   = "16Gi"
      "pods"            = "20"
      "services"        = "10"
      "secrets"         = "20"
      "configmaps"      = "20"
      "persistentvolumeclaims" = "10"
    }
  }
}

# Limit Ranges
resource "kubernetes_limit_range" "aster_staging_limits" {
  metadata {
    name      = "aster-staging-limits"
    namespace = kubernetes_namespace.aster_staging.metadata[0].name
    labels    = local.common_labels
  }

  spec {
    limit {
      type = "Container"
      default = {
        "cpu"    = "500m"
        "memory" = "512Mi"
      }
      default_request = {
        "cpu"    = "100m"
        "memory" = "128Mi"
      }
      max = {
        "cpu"    = "2"
        "memory" = "4Gi"
      }
      min = {
        "cpu"    = "50m"
        "memory" = "64Mi"
      }
    }

    limit {
      type = "Pod"
      max = {
        "cpu"    = "4"
        "memory" = "8Gi"
      }
    }
  }
}