# PostgreSQL Database Instance
resource "google_sql_database_instance" "postgres" {
  name             = "${local.name_prefix}-postgres"
  database_version = var.db_version
  region           = var.region

  # Deletion protection
  deletion_protection = false # Set to true for production

  settings {
    tier                        = var.db_tier
    availability_type          = "ZONAL" # Use REGIONAL for production
    disk_size                  = var.db_storage_size
    disk_type                  = var.db_storage_type
    disk_autoresize           = true
    disk_autoresize_limit     = 100

    # Backup configuration
    backup_configuration {
      enabled                        = var.db_backup_enabled
      start_time                    = var.db_backup_start_time
      location                      = var.region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = var.backup_retention_days

      backup_retention_settings {
        retained_backups = var.backup_retention_days
        retention_unit   = "COUNT"
      }
    }

    # IP configuration
    ip_configuration {
      ipv4_enabled                                  = true
      private_network                              = google_compute_network.vpc.id
      enable_private_path_for_google_cloud_services = true
      require_ssl                                   = true

      # Authorized networks
      dynamic "authorized_networks" {
        for_each = var.authorized_networks
        content {
          name  = authorized_networks.value.name
          value = authorized_networks.value.value
        }
      }
    }

    # Database flags for optimization
    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    database_flags {
      name  = "log_lock_waits"
      value = "on"
    }

    database_flags {
      name  = "log_temp_files"
      value = "0"
    }

    database_flags {
      name  = "log_min_duration_statement"
      value = "1000" # Log queries taking more than 1 second
    }

    # Insights configuration
    insights_config {
      query_insights_enabled  = true
      query_string_length    = 1024
      record_application_tags = true
      record_client_address  = true
    }

    # Maintenance window
    maintenance_window {
      day          = 7    # Sunday
      hour         = 3    # 3 AM
      update_track = "stable"
    }

    # User labels
    user_labels = local.common_labels
  }

  depends_on = [
    google_project_service.sqladmin,
    google_service_networking_connection.private_vpc_connection
  ]

  timeouts {
    create = "20m"
    update = "20m"
    delete = "20m"
  }
}

# Database
resource "google_sql_database" "app_database" {
  name     = "aster_management"
  instance = google_sql_database_instance.postgres.name
}

# Database user
resource "google_sql_user" "app_user" {
  name     = "aster_app_user"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# Random password for database user
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Private service networking for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "${local.name_prefix}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]

  depends_on = [google_project_service.servicenetworking]
}

# Redis Instance
resource "google_redis_instance" "cache" {
  name           = "${local.name_prefix}-redis"
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_size
  region         = var.region

  location_id             = var.zone
  alternative_location_id = "${substr(var.region, 0, length(var.region)-1)}b"

  authorized_network = google_compute_network.vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  redis_version     = "REDIS_7_0"
  display_name      = "${local.name_prefix} Redis Cache"
  reserved_ip_range = "10.3.0.0/29"

  # Maintenance policy
  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 3
        minutes = 0
        seconds = 0
        nanos   = 0
      }
    }
  }

  # Auth and transit encryption
  auth_enabled            = true
  transit_encryption_mode = "SERVER_AUTHENTICATION"

  labels = local.common_labels

  depends_on = [
    google_project_service.redis,
    google_service_networking_connection.private_vpc_connection
  ]

  timeouts {
    create = "20m"
    update = "20m"
    delete = "20m"
  }
}