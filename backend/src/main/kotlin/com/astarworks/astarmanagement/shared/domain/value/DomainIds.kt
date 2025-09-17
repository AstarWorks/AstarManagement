package com.astarworks.astarmanagement.shared.domain.value

import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNode
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentRevision
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.domain.model.RolePermission
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceGroup
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceGroupMembership
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership

// Placeholder class for future Team domain
class Team

// Table domain
typealias TableId = EntityId<Table>
typealias RecordId = EntityId<Record>

// Editor domain
typealias DocumentNodeId = EntityId<DocumentNode>
typealias DocumentRevisionId = EntityId<DocumentRevision>

// User domain
typealias UserId = EntityId<User>
typealias UserProfileId = EntityId<UserProfile>

// Tenant domain
typealias TenantId = EntityId<Tenant>

// Workspace domain
typealias WorkspaceId = EntityId<Workspace>

// Auth domain
typealias RoleId = EntityId<DynamicRole>
typealias UserRoleId = EntityId<UserRole>
typealias RolePermissionId = EntityId<RolePermission>
typealias ResourceGroupId = EntityId<ResourceGroup>
typealias ResourceGroupMembershipId = EntityId<ResourceGroupMembership>

// Membership domain
typealias TenantMembershipId = EntityId<TenantMembership>
typealias TenantUserId = EntityId<TenantMembership>

// Team domain (future implementation)
typealias TeamId = EntityId<Team>
