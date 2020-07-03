locals {
  location = "${var.region}-${var.zone}"
}

resource "google_container_cluster" "default" {
  provider    = google-beta
  name        = var.name
  project     = var.project
  description = var.description
  location    = local.location

  remove_default_node_pool = true
  initial_node_count       = var.initial_node_count
  enable_kubernetes_alpha  = false

  master_auth {
    username = ""
    password = ""

    client_certificate_config {
      issue_client_certificate = false
    }
  }

  timeouts {
    create = "2h"
    update = "2h"
    delete = "2h"
  }
}

resource "google_container_node_pool" "default" {
  name       = "${var.name}-node-pool"
  project    = var.project
  location   = local.location
  cluster    = google_container_cluster.default.name
  node_count = var.default_pool_node_count

  # initial_node_count = 1

  node_config {
    preemptible  = var.preemptible
    machine_type = var.machine_type

    metadata = {
      disable-legacy-endpoints = "true"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/compute", # is required for mounting persistent storage on your nodes.
      "https://www.googleapis.com/auth/devstorage.full_control" # Allows full control over data (buckets, gcr.io, etc)
    ]
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  # autoscaling {
  #   min_node_count = var.default_pool_min_nodes
  #   max_node_count = var.default_pool_max_nodes
  # }
}

locals {
  buckets = [for bucket in var.buckets : "${var.project}-${var.environment}-${bucket}"]
}

resource "google_storage_bucket" "bucket" {
  for_each = toset(local.buckets)

  name          = each.value
  location      = var.region
  project       = var.project
  storage_class = "REGIONAL"
}
