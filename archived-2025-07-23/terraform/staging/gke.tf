# GKE Cluster
resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.region

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  # Enable IP aliases for better performance and security
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Network policy configuration
  network_policy {
    enabled  = var.enable_network_policy
    provider = var.enable_network_policy ? "CALICO" : null
  }

  # Enable network policy addon
  addons_config {
    network_policy_config {
      disabled = !var.enable_network_policy
    }

    http_load_balancing {
      disabled = false
    }

    horizontal_pod_autoscaling {
      disabled = false
    }

    gce_persistent_disk_csi_driver_config {
      enabled = true
    }

    gcs_fuse_csi_driver_config {
      enabled = true
    }
  }

  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = var.enable_private_nodes
    enable_private_endpoint = false # Keep public endpoint for easier management
    master_ipv4_cidr_block  = "172.16.0.0/28"

    master_global_access_config {
      enabled = true
    }
  }

  # Authorized networks (restrict master access)
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "All networks (staging environment)"
    }
  }

  # Enable workload identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Cluster-level security settings
  enable_shielded_nodes = true
  
  # Release channel for automatic updates
  release_channel {
    channel = "REGULAR"
  }

  # Logging and monitoring
  logging_service    = var.enable_logging ? "logging.googleapis.com/kubernetes" : "none"
  monitoring_service = var.enable_monitoring ? "monitoring.googleapis.com/kubernetes" : "none"

  # Maintenance policy
  maintenance_policy {
    recurring_window {
      start_time = "2023-01-01T01:00:00Z"
      end_time   = "2023-01-01T05:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA"
    }
  }

  # Binary authorization
  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  # Deletion protection
  deletion_protection = false # Set to true for production

  depends_on = [
    google_project_service.container,
    google_compute_subnetwork.subnet
  ]

  timeouts {
    create = "30m"
    update = "40m"
    delete = "40m"
  }
}

# Primary node pool
resource "google_container_node_pool" "primary_nodes" {
  name       = "${var.cluster_name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.node_count

  # Autoscaling configuration
  autoscaling {
    min_node_count = var.min_node_count
    max_node_count = var.max_node_count
  }

  # Management configuration
  management {
    auto_repair  = true
    auto_upgrade = true
  }

  # Upgrade settings
  upgrade_settings {
    strategy        = "BLUE_GREEN"
    max_surge       = 1
    max_unavailable = 0

    blue_green_settings {
      standard_rollout_policy {
        batch_percentage    = 100
        batch_node_count    = 1
        batch_soak_duration = "10s"
      }
    }
  }

  node_config {
    preemptible  = false # Use regular instances for staging
    machine_type = var.node_machine_type
    disk_size_gb = var.node_disk_size
    disk_type    = var.node_disk_type
    image_type   = "COS_CONTAINERD"

    # Scopes for node pool
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/service.management.readonly",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/trace.append",
    ]

    # Labels
    labels = merge(local.common_labels, {
      node_pool = "primary"
    })

    # Node taints for workload separation
    # taint {
    #   key    = "node_pool"
    #   value  = "primary"
    #   effect = "NO_SCHEDULE"
    # }

    tags = ["gke-node", "${var.cluster_name}-node"]

    # Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    # Shielded instance configuration
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    # Resource reservations
    reservation_affinity {
      consume_reservation_type = "ANY_RESERVATION"
    }

    # Metadata
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }

  # Network configuration
  network_config {
    create_pod_range     = false
    enable_private_nodes = var.enable_private_nodes
  }
}