# Enable required Google Cloud APIs
resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "container" {
  service = "container.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "sqladmin" {
  service = "sqladmin.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "redis" {
  service = "redis.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "servicenetworking" {
  service = "servicenetworking.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "iam" {
  service = "iam.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "iamcredentials" {
  service = "iamcredentials.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "logging" {
  service = "logging.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "monitoring" {
  service = "monitoring.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "cloudtrace" {
  service = "cloudtrace.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "storage" {
  service = "storage.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "artifactregistry" {
  service = "artifactregistry.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "dns" {
  service = "dns.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "certificatemanager" {
  service = "certificatemanager.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "secretmanager" {
  service = "secretmanager.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "binaryauthorization" {
  service = "binaryauthorization.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "cloudbuild" {
  service = "cloudbuild.googleapis.com"
  
  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}