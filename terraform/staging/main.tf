terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "gcs" {
    bucket = "aster-management-terraform-state"
    prefix = "staging"
  }
}

# Configure Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Configure Kubernetes Provider
provider "kubernetes" {
  host                   = "https://${google_container_cluster.primary.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth.0.cluster_ca_certificate)
}

# Configure Helm Provider
provider "helm" {
  kubernetes {
    host                   = "https://${google_container_cluster.primary.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth.0.cluster_ca_certificate)
  }
}

# Get client configuration
data "google_client_config" "default" {}

# Local values for common tags and naming
locals {
  environment = "staging"
  project     = "aster-management"
  
  common_labels = {
    environment = local.environment
    project     = local.project
    managed_by  = "terraform"
  }
  
  # Naming conventions
  name_prefix = "${local.project}-${local.environment}"
}