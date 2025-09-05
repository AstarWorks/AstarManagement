package com.astarworks.astarmanagement.core.auth.api.dto

import kotlinx.serialization.Serializable

/**
 * Response for listing user's accessible workspaces/tenants.
 * 
 * Contains a list of workspaces the authenticated user can access,
 * along with summary statistics for convenient UI display.
 * 
 * Used by both /my-workspaces and /my-tenants endpoints to support
 * Slack/Discord-style multi-tenant workspace switching.
 * 
 * @property workspaces List of accessible workspaces with basic info
 * @property totalCount Total number of workspaces user has access to
 * @property activeCount Number of active workspace memberships
 */
@Serializable
data class MyWorkspacesResponse(
    val workspaces: List<WorkspaceDto>,
    val totalCount: Int,
    val activeCount: Int
)