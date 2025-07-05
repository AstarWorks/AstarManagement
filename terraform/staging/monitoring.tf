# Helm release for cert-manager
resource "helm_release" "cert_manager" {
  count = var.enable_ssl ? 1 : 0

  name       = "cert-manager"
  repository = "https://charts.jetstack.io"
  chart      = "cert-manager"
  version    = "v1.13.3"
  namespace  = kubernetes_namespace.cert_manager.metadata[0].name

  set {
    name  = "installCRDs"
    value = "true"
  }

  set {
    name  = "global.leaderElection.namespace"
    value = kubernetes_namespace.cert_manager.metadata[0].name
  }

  set {
    name  = "serviceAccount.annotations.iam\\.gke\\.io/gcp-service-account"
    value = google_service_account.cert_manager[0].email
  }

  depends_on = [
    google_container_cluster.primary,
    kubernetes_namespace.cert_manager
  ]
}

# Service account for cert-manager
resource "google_service_account" "cert_manager" {
  count = var.enable_ssl ? 1 : 0

  account_id   = "${local.name_prefix}-cert-manager"
  display_name = "Cert Manager Service Account"
  description  = "Service account for cert-manager to manage SSL certificates"
}

resource "google_project_iam_member" "cert_manager_dns_admin" {
  count = var.enable_ssl ? 1 : 0

  project = var.project_id
  role    = "roles/dns.admin"
  member  = "serviceAccount:${google_service_account.cert_manager[0].email}"
}

resource "google_service_account_iam_binding" "cert_manager_workload_identity" {
  count = var.enable_ssl ? 1 : 0

  service_account_id = google_service_account.cert_manager[0].name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[cert-manager/cert-manager]"
  ]
}

# Cluster Issuer for Let's Encrypt
resource "kubernetes_manifest" "letsencrypt_staging" {
  count = var.enable_ssl ? 1 : 0

  manifest = {
    apiVersion = "cert-manager.io/v1"
    kind       = "ClusterIssuer"
    metadata = {
      name = "letsencrypt-staging"
    }
    spec = {
      acme = {
        server = "https://acme-staging-v02.api.letsencrypt.org/directory"
        email  = "admin@example.com" # Replace with actual email
        privateKeySecretRef = {
          name = "letsencrypt-staging"
        }
        solvers = [
          {
            http01 = {
              ingress = {
                class = "nginx"
              }
            }
          }
        ]
      }
    }
  }

  depends_on = [helm_release.cert_manager]
}

resource "kubernetes_manifest" "letsencrypt_prod" {
  count = var.enable_ssl ? 1 : 0

  manifest = {
    apiVersion = "cert-manager.io/v1"
    kind       = "ClusterIssuer"
    metadata = {
      name = "letsencrypt-prod"
    }
    spec = {
      acme = {
        server = "https://acme-v02.api.letsencrypt.org/directory"
        email  = "admin@example.com" # Replace with actual email
        privateKeySecretRef = {
          name = "letsencrypt-prod"
        }
        solvers = [
          {
            http01 = {
              ingress = {
                class = "nginx"
              }
            }
          }
        ]
      }
    }
  }

  depends_on = [helm_release.cert_manager]
}

# Helm release for ingress-nginx
resource "helm_release" "ingress_nginx" {
  name       = "ingress-nginx"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  version    = "4.8.3"
  namespace  = "ingress-nginx"

  create_namespace = true

  set {
    name  = "controller.service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "controller.service.loadBalancerIP"
    value = google_compute_global_address.ingress_ip.address
  }

  set {
    name  = "controller.metrics.enabled"
    value = "true"
  }

  set {
    name  = "controller.metrics.serviceMonitor.enabled"
    value = "true"
  }

  set {
    name  = "controller.podSecurityContext.runAsUser"
    value = "101"
  }

  set {
    name  = "controller.podSecurityContext.runAsGroup"
    value = "82"
  }

  depends_on = [google_container_cluster.primary]
}

# Helm release for kube-prometheus-stack
resource "helm_release" "prometheus" {
  count = var.enable_monitoring ? 1 : 0

  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  version    = "55.5.0"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  values = [
    yamlencode({
      grafana = {
        adminPassword = random_password.grafana_password.result
        ingress = {
          enabled = true
          annotations = {
            "kubernetes.io/ingress.class"                = "nginx"
            "cert-manager.io/cluster-issuer"             = var.enable_ssl ? "letsencrypt-staging" : ""
            "nginx.ingress.kubernetes.io/auth-type"      = "basic"
            "nginx.ingress.kubernetes.io/auth-secret"    = "monitoring/grafana-auth"
          }
          hosts = ["grafana.${var.domain_name}"]
          tls = var.enable_ssl ? [
            {
              secretName = "grafana-tls"
              hosts      = ["grafana.${var.domain_name}"]
            }
          ] : []
        }
        serviceAccount = {
          annotations = {
            "iam.gke.io/gcp-service-account" = google_service_account.monitoring.email
          }
        }
      }
      prometheus = {
        prometheusSpec = {
          serviceAccountName = "prometheus"
          retention          = "30d"
          storageSpec = {
            volumeClaimTemplate = {
              spec = {
                storageClassName = "standard"
                accessModes      = ["ReadWriteOnce"]
                resources = {
                  requests = {
                    storage = "10Gi"
                  }
                }
              }
            }
          }
        }
        serviceAccount = {
          annotations = {
            "iam.gke.io/gcp-service-account" = google_service_account.monitoring.email
          }
        }
      }
      alertmanager = {
        alertmanagerSpec = {
          retention = "120h"
        }
      }
    })
  ]

  depends_on = [
    google_container_cluster.primary,
    kubernetes_namespace.monitoring
  ]
}

# Random password for Grafana admin
resource "random_password" "grafana_password" {
  length  = 16
  special = true
}

# Basic auth secret for Grafana
resource "kubernetes_secret" "grafana_auth" {
  count = var.enable_monitoring ? 1 : 0

  metadata {
    name      = "grafana-auth"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }

  data = {
    auth = base64encode("admin:${bcrypt(random_password.grafana_password.result)}")
  }

  type = "Opaque"
}