# Google Service Accounts for Workload Identity
resource "google_service_account" "aster_backend" {
  account_id   = "${local.name_prefix}-backend"
  display_name = "Aster Management Backend Service Account"
  description  = "Service account for Aster Management backend application"
}

resource "google_service_account" "aster_frontend" {
  account_id   = "${local.name_prefix}-frontend"
  display_name = "Aster Management Frontend Service Account"
  description  = "Service account for Aster Management frontend application"
}

# IAM bindings for backend service account
resource "google_project_iam_member" "backend_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.aster_backend.email}"
}

resource "google_project_iam_member" "backend_storage_viewer" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.aster_backend.email}"
}

resource "google_project_iam_member" "backend_storage_creator" {
  project = var.project_id
  role    = "roles/storage.objectCreator"
  member  = "serviceAccount:${google_service_account.aster_backend.email}"
}

resource "google_project_iam_member" "backend_logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.aster_backend.email}"
}

resource "google_project_iam_member" "backend_monitoring_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.aster_backend.email}"
}

resource "google_project_iam_member" "backend_trace_agent" {
  project = var.project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.aster_backend.email}"
}

# IAM bindings for frontend service account
resource "google_project_iam_member" "frontend_storage_viewer" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.aster_frontend.email}"
}

resource "google_project_iam_member" "frontend_logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.aster_frontend.email}"
}

resource "google_project_iam_member" "frontend_monitoring_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.aster_frontend.email}"
}

# Workload Identity bindings
resource "google_service_account_iam_binding" "backend_workload_identity" {
  service_account_id = google_service_account.aster_backend.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[aster-staging/aster-backend]"
  ]
}

resource "google_service_account_iam_binding" "frontend_workload_identity" {
  service_account_id = google_service_account.aster_frontend.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[aster-staging/aster-frontend]"
  ]
}

# Custom IAM role for application-specific permissions
resource "google_project_iam_custom_role" "aster_app_role" {
  role_id     = "asterManagementApp"
  title       = "Aster Management Application Role"
  description = "Custom role for Aster Management application with specific permissions"

  permissions = [
    "cloudsql.instances.connect",
    "storage.objects.create",
    "storage.objects.delete",
    "storage.objects.get",
    "storage.objects.list",
    "storage.objects.update",
    "logging.logEntries.create",
    "monitoring.timeSeries.create",
    "cloudtrace.traces.patch"
  ]
}

# Bind custom role to backend service account
resource "google_project_iam_member" "backend_custom_role" {
  project = var.project_id
  role    = google_project_iam_custom_role.aster_app_role.name
  member  = "serviceAccount:${google_service_account.aster_backend.email}"
}

# Service account for ArgoCD (if needed)
resource "google_service_account" "argocd" {
  account_id   = "${local.name_prefix}-argocd"
  display_name = "ArgoCD Service Account"
  description  = "Service account for ArgoCD GitOps deployments"
}

resource "google_project_iam_member" "argocd_container_developer" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.argocd.email}"
}

resource "google_service_account_iam_binding" "argocd_workload_identity" {
  service_account_id = google_service_account.argocd.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[argocd/argocd-application-controller]",
    "serviceAccount:${var.project_id}.svc.id.goog[argocd/argocd-server]"
  ]
}

# Service account for monitoring
resource "google_service_account" "monitoring" {
  account_id   = "${local.name_prefix}-monitoring"
  display_name = "Monitoring Service Account"
  description  = "Service account for monitoring stack (Prometheus, Grafana)"
}

resource "google_project_iam_member" "monitoring_viewer" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.monitoring.email}"
}

resource "google_project_iam_member" "monitoring_metadata_viewer" {
  project = var.project_id
  role    = "roles/compute.viewer"
  member  = "serviceAccount:${google_service_account.monitoring.email}"
}

resource "google_service_account_iam_binding" "monitoring_workload_identity" {
  service_account_id = google_service_account.monitoring.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[monitoring/prometheus]",
    "serviceAccount:${var.project_id}.svc.id.goog[monitoring/grafana]"
  ]
}