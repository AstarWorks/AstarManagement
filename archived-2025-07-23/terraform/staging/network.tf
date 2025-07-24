# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "${local.name_prefix}-vpc"
  auto_create_subnetworks = false
  mtu                     = 1460

  # Enable deletion protection in production
  delete_default_routes_on_create = false

  depends_on = [
    google_project_service.compute
  ]
}

# Subnet for GKE cluster
resource "google_compute_subnetwork" "subnet" {
  name                     = "${local.name_prefix}-subnet"
  ip_cidr_range           = var.subnet_cidr
  region                  = var.region
  network                 = google_compute_network.vpc.id
  private_ip_google_access = true

  # Secondary IP ranges for GKE
  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = var.pod_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = var.service_cidr
  }

  log_config {
    aggregation_interval = "INTERVAL_10_MIN"
    flow_sampling        = 0.5
    metadata            = "INCLUDE_ALL_METADATA"
  }
}

# Cloud Router for NAT
resource "google_compute_router" "router" {
  name    = "${local.name_prefix}-router"
  region  = var.region
  network = google_compute_network.vpc.id

  bgp {
    asn = 64514
  }
}

# Cloud NAT for outbound internet access from private nodes
resource "google_compute_router_nat" "nat" {
  name                               = "${local.name_prefix}-nat"
  router                            = google_compute_router.router.name
  region                            = var.region
  nat_ip_allocate_option            = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Firewall rules
resource "google_compute_firewall" "allow_internal" {
  name    = "${local.name_prefix}-allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [
    var.vpc_cidr,
    var.pod_cidr,
    var.service_cidr
  ]

  direction = "INGRESS"
  priority  = 1000

  log_config {
    metadata = "INCLUDE_ALL_METADATA"
  }
}

# Allow health checks
resource "google_compute_firewall" "allow_health_checks" {
  name    = "${local.name_prefix}-allow-health-checks"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["8080", "80", "443"]
  }

  source_ranges = [
    "130.211.0.0/22",
    "35.191.0.0/16"
  ]

  target_tags = ["gke-node"]
  direction   = "INGRESS"
  priority    = 1000

  log_config {
    metadata = "INCLUDE_ALL_METADATA"
  }
}

# Allow SSH access (for debugging)
resource "google_compute_firewall" "allow_ssh" {
  name    = "${local.name_prefix}-allow-ssh"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  # Restrict to specific IP ranges for security
  source_ranges = [
    "35.235.240.0/20" # Google Cloud Shell
  ]

  target_tags = ["gke-node"]
  direction   = "INGRESS"
  priority    = 1000

  log_config {
    metadata = "INCLUDE_ALL_METADATA"
  }
}

# Deny all other traffic
resource "google_compute_firewall" "deny_all" {
  name    = "${local.name_prefix}-deny-all"
  network = google_compute_network.vpc.name

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
  direction     = "INGRESS"
  priority      = 65534

  log_config {
    metadata = "INCLUDE_ALL_METADATA"
  }
}

# Global external IP for ingress
resource "google_compute_global_address" "ingress_ip" {
  name         = "${local.name_prefix}-ingress-ip"
  address_type = "EXTERNAL"
}