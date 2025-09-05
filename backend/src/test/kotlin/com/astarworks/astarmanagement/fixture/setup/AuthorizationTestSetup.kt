package com.astarworks.astarmanagement.fixture.setup

import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.*
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.fixture.builder.PermissionTestDataBuilder
import com.astarworks.astarmanagement.fixture.builder.RoleTestDataBuilder
import com.astarworks.astarmanagement.shared.domain.value.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Authorization test setup service for creating complex permission scenarios.
 * 
 * This class sets up various test scenarios for authorization testing,
 * including role hierarchies, permission combinations, resource ownership,
 * and team-based access control.
 */
@Component
class AuthorizationTestSetup(
    private val userRepository: UserRepository,
    private val tenantRepository: TenantRepository,
    private val dynamicRoleRepository: DynamicRoleRepository,
    private val rolePermissionRepository: RolePermissionRepository,
    private val userRoleRepository: UserRoleRepository,
    private val tenantMembershipRepository: TenantMembershipRepository
) {
    private val logger = LoggerFactory.getLogger(AuthorizationTestSetup::class.java)
    
    private val permissionBuilder = PermissionTestDataBuilder()
    private val roleBuilder = RoleTestDataBuilder()
    
    /**
     * Sets up a complex permission scenario with multiple roles and permissions.
     * 
     * Creates:
     * - 3 tenants
     * - 5 users with different role combinations
     * - Multiple roles with varying permission levels
     * - Cross-tenant access scenarios
     */
    @Transactional
    fun setupComplexPermissionScenario(): PermissionTestScenario {
        logger.info("Setting up complex permission test scenario")
        
        // Create tenants
        val tenantA = createTestTenant("tenant-a", "Tenant A")
        val tenantB = createTestTenant("tenant-b", "Tenant B")
        val tenantC = createTestTenant("tenant-c", "Tenant C")
        
        // Create roles for each tenant
        val rolesA = createRolesForTenant(tenantA.id)
        val rolesB = createRolesForTenant(tenantB.id)
        val rolesC = createRolesForTenant(tenantC.id)
        
        // Create users
        val adminUser = createTestUser("admin@test.com", "Admin User")
        val userWithMultipleRoles = createTestUser("multi-role@test.com", "Multi Role User")
        val standardUser = createTestUser("user@test.com", "Standard User")
        val viewerUser = createTestUser("viewer@test.com", "Viewer User")
        val crossTenantUser = createTestUser("cross-tenant@test.com", "Cross Tenant User")
        
        // Create tenant memberships first
        val adminMembershipA = createTenantMembership(adminUser.id, tenantA.id)
        val multiRoleMembershipA = createTenantMembership(userWithMultipleRoles.id, tenantA.id)
        val standardMembershipA = createTenantMembership(standardUser.id, tenantA.id)
        val viewerMembershipA = createTenantMembership(viewerUser.id, tenantA.id)
        val crossTenantMembershipA = createTenantMembership(crossTenantUser.id, tenantA.id)
        val crossTenantMembershipB = createTenantMembership(crossTenantUser.id, tenantB.id)
        val crossTenantMembershipC = createTenantMembership(crossTenantUser.id, tenantC.id)
        
        // Assign roles using membership IDs
        // Admin has admin role in Tenant A
        assignUserRole(adminMembershipA.id, rolesA.admin.id)
        
        // User with multiple roles in Tenant A
        assignUserRole(multiRoleMembershipA.id, rolesA.user.id)
        assignUserRole(multiRoleMembershipA.id, rolesA.custom.id)
        
        // Standard user in Tenant A
        assignUserRole(standardMembershipA.id, rolesA.user.id)
        
        // Viewer in Tenant A
        assignUserRole(viewerMembershipA.id, rolesA.viewer.id)
        
        // Cross-tenant user has roles in multiple tenants
        assignUserRole(crossTenantMembershipA.id, rolesA.user.id)
        assignUserRole(crossTenantMembershipB.id, rolesB.admin.id)
        assignUserRole(crossTenantMembershipC.id, rolesC.viewer.id)
        
        return PermissionTestScenario(
            tenants = mapOf(
                "tenantA" to tenantA,
                "tenantB" to tenantB,
                "tenantC" to tenantC
            ),
            users = mapOf(
                "admin" to adminUser,
                "multiRole" to userWithMultipleRoles,
                "standard" to standardUser,
                "viewer" to viewerUser,
                "crossTenant" to crossTenantUser
            ),
            roles = mapOf(
                "tenantA" to rolesA,
                "tenantB" to rolesB,
                "tenantC" to rolesC
            )
        )
    }
    
    /**
     * Sets up a resource ownership scenario for testing OWN scope permissions.
     * 
     * Creates users who own specific resources and tests access control.
     */
    @Transactional
    fun setupResourceOwnershipScenario(): ResourceOwnershipScenario {
        logger.info("Setting up resource ownership test scenario")
        
        val tenant = createTestTenant("ownership-test", "Ownership Test Tenant")
        
        // Create users
        val owner = createTestUser("owner@test.com", "Resource Owner")
        val nonOwner = createTestUser("non-owner@test.com", "Non-Owner")
        val adminUser = createTestUser("admin-owner@test.com", "Admin")
        
        // Create roles with OWN scope permissions
        val ownerRole = roleBuilder.buildCustomRole(
            name = "content_owner",
            displayName = "Content Owner",
            tenantId = tenant.id
        )
        dynamicRoleRepository.save(ownerRole)
        
        // Add OWN scope permissions
        val ownPermissions = listOf(
            permissionBuilder.buildOwnScopePermission(ResourceType.TABLE, Action.EDIT),
            permissionBuilder.buildOwnScopePermission(ResourceType.TABLE, Action.DELETE),
            permissionBuilder.buildOwnScopePermission(ResourceType.DOCUMENT, Action.EDIT),
            permissionBuilder.buildOwnScopePermission(ResourceType.DOCUMENT, Action.DELETE)
        )
        
        ownPermissions.forEach { permission ->
            rolePermissionRepository.save(
                RolePermission(
                    roleId = ownerRole.id,
                    permissionRule = permission,
                    createdAt = Instant.now()
                )
            )
        }
        
        // Admin role with ALL scope
        val adminRole = roleBuilder.buildAdminRole(tenant.id)
        dynamicRoleRepository.save(adminRole)
        roleBuilder.buildAdminPermissions(adminRole.id).forEach {
            rolePermissionRepository.save(it)
        }
        
        // Create memberships first
        val ownerMembership = createTenantMembership(owner.id, tenant.id)
        val nonOwnerMembership = createTenantMembership(nonOwner.id, tenant.id)
        val adminMembership = createTenantMembership(adminUser.id, tenant.id)
        
        // Assign roles using membership IDs
        assignUserRole(ownerMembership.id, ownerRole.id)
        assignUserRole(nonOwnerMembership.id, ownerRole.id)
        assignUserRole(adminMembership.id, adminRole.id)
        
        // Create test resource IDs
        val ownedResourceId = UUID.randomUUID()
        val unownedResourceId = UUID.randomUUID()
        
        return ResourceOwnershipScenario(
            tenant = tenant,
            owner = owner,
            nonOwner = nonOwner,
            admin = adminUser,
            ownedResourceId = ownedResourceId,
            unownedResourceId = unownedResourceId,
            ownerRole = ownerRole,
            adminRole = adminRole
        )
    }
    
    /**
     * Sets up a team access scenario for testing TEAM scope permissions.
     */
    @Transactional
    fun setupTeamAccessScenario(): TeamAccessScenario {
        logger.info("Setting up team access test scenario")
        
        val tenant = createTestTenant("team-test", "Team Test Tenant")
        
        // Create team members
        val teamMember1 = createTestUser("team1@test.com", "Team Member 1")
        val teamMember2 = createTestUser("team2@test.com", "Team Member 2")
        val outsider = createTestUser("outsider@test.com", "Outsider")
        
        // Create role with TEAM scope permissions
        val teamRole = roleBuilder.buildCustomRole(
            name = "team_member",
            displayName = "Team Member",
            tenantId = tenant.id
        )
        dynamicRoleRepository.save(teamRole)
        
        // Add TEAM scope permissions
        val teamPermissions = listOf(
            permissionBuilder.buildTeamScopePermission(ResourceType.TABLE, Action.VIEW),
            permissionBuilder.buildTeamScopePermission(ResourceType.TABLE, Action.EDIT),
            permissionBuilder.buildTeamScopePermission(ResourceType.DOCUMENT, Action.VIEW),
            permissionBuilder.buildTeamScopePermission(ResourceType.DOCUMENT, Action.EDIT)
        )
        
        teamPermissions.forEach { permission ->
            rolePermissionRepository.save(
                RolePermission(
                    roleId = teamRole.id,
                    permissionRule = permission,
                    createdAt = Instant.now()
                )
            )
        }
        
        // Create memberships first
        val teamMember1Membership = createTenantMembership(teamMember1.id, tenant.id)
        val teamMember2Membership = createTenantMembership(teamMember2.id, tenant.id)
        val outsiderMembership = createTenantMembership(outsider.id, tenant.id)
        
        // Assign roles using membership IDs
        assignUserRole(teamMember1Membership.id, teamRole.id)
        assignUserRole(teamMember2Membership.id, teamRole.id)
        assignUserRole(outsiderMembership.id, teamRole.id)
        
        // Create team resource ID
        val teamResourceId = UUID.randomUUID()
        
        return TeamAccessScenario(
            tenant = tenant,
            teamMember1 = teamMember1,
            teamMember2 = teamMember2,
            outsider = outsider,
            teamResourceId = teamResourceId,
            teamRole = teamRole
        )
    }
    
    /**
     * Sets up a resource group scenario for testing ResourceGroupRule permissions.
     */
    @Transactional
    fun setupResourceGroupScenario(): ResourceGroupScenario {
        logger.info("Setting up resource group test scenario")
        
        val tenant = createTestTenant("group-test", "Resource Group Test Tenant")
        
        // Create resource groups
        val projectAGroupId = UUID.randomUUID()
        val projectBGroupId = UUID.randomUUID()
        
        // Create users
        val projectAMember = createTestUser("project-a@test.com", "Project A Member")
        val projectBMember = createTestUser("project-b@test.com", "Project B Member")
        val noGroupMember = createTestUser("no-group@test.com", "No Group Member")
        
        // Create roles with ResourceGroupRule permissions
        val projectARole = roleBuilder.buildCustomRole(
            name = "project_a_member",
            displayName = "Project A Member",
            tenantId = tenant.id
        )
        dynamicRoleRepository.save(projectARole)
        
        // Add ResourceGroup permissions for Project A
        val projectAPermissions = listOf(
            permissionBuilder.buildResourceGroupPermission(
                ResourceType.TABLE,
                Action.EDIT,
                projectAGroupId
            ),
            permissionBuilder.buildResourceGroupPermission(
                ResourceType.DOCUMENT,
                Action.MANAGE,
                projectAGroupId
            )
        )
        
        projectAPermissions.forEach { permission ->
            rolePermissionRepository.save(
                RolePermission(
                    roleId = projectARole.id,
                    permissionRule = permission,
                    createdAt = Instant.now()
                )
            )
        }
        
        // Similar for Project B
        val projectBRole = roleBuilder.buildCustomRole(
            name = "project_b_member",
            displayName = "Project B Member",
            tenantId = tenant.id
        )
        dynamicRoleRepository.save(projectBRole)
        
        val projectBPermissions = listOf(
            permissionBuilder.buildResourceGroupPermission(
                ResourceType.TABLE,
                Action.VIEW,
                projectBGroupId
            )
        )
        
        projectBPermissions.forEach { permission ->
            rolePermissionRepository.save(
                RolePermission(
                    roleId = projectBRole.id,
                    permissionRule = permission,
                    createdAt = Instant.now()
                )
            )
        }
        
        // Create memberships first
        val projectAMembership = createTenantMembership(projectAMember.id, tenant.id)
        val projectBMembership = createTenantMembership(projectBMember.id, tenant.id)
        createTenantMembership(noGroupMember.id, tenant.id)
        
        // Assign roles using membership IDs
        assignUserRole(projectAMembership.id, projectARole.id)
        assignUserRole(projectBMembership.id, projectBRole.id)
        
        return ResourceGroupScenario(
            tenant = tenant,
            projectAMember = projectAMember,
            projectBMember = projectBMember,
            noGroupMember = noGroupMember,
            projectAGroupId = projectAGroupId,
            projectBGroupId = projectBGroupId,
            projectARole = projectARole,
            projectBRole = projectBRole
        )
    }
    
    // Helper methods
    
    private fun createTestTenant(slug: String, name: String): Tenant {
        val tenant = Tenant(
            id = TenantId(UUID.randomUUID()),
            slug = slug,
            name = name,
            auth0OrgId = "org_$slug",
            isActive = true
        )
        return tenantRepository.save(tenant)
    }
    
    private fun createTestUser(email: String, name: String): User {
        val user = User(
            id = UserId(UUID.randomUUID()),
            auth0Sub = "auth0|${UUID.randomUUID()}",
            email = email,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        return userRepository.save(user)
    }
    
    private fun createRolesForTenant(tenantId: TenantId): TenantRoles {
        val admin = roleBuilder.buildAdminRole(tenantId)
        val user = roleBuilder.buildUserRole(tenantId)
        val viewer = roleBuilder.buildViewerRole(tenantId)
        val custom = roleBuilder.buildCustomRole(
            name = "custom_role",
            displayName = "Custom Role",
            color = "#FFA500",
            position = 60,
            tenantId = tenantId
        )
        
        // Save roles
        dynamicRoleRepository.save(admin)
        dynamicRoleRepository.save(user)
        dynamicRoleRepository.save(viewer)
        dynamicRoleRepository.save(custom)
        
        // Create permissions
        roleBuilder.buildAdminPermissions(admin.id).forEach {
            rolePermissionRepository.save(it)
        }
        roleBuilder.buildUserPermissions(user.id).forEach {
            rolePermissionRepository.save(it)
        }
        roleBuilder.buildViewerPermissions(viewer.id).forEach {
            rolePermissionRepository.save(it)
        }
        
        // Custom role gets a mix of permissions
        val customPermissions = listOf(
            permissionBuilder.buildAllScopePermission(ResourceType.TABLE, Action.VIEW),
            permissionBuilder.buildTeamScopePermission(ResourceType.DOCUMENT, Action.EDIT),
            permissionBuilder.buildOwnScopePermission(ResourceType.WORKSPACE, Action.CREATE)
        )
        customPermissions.forEach { permission ->
            rolePermissionRepository.save(
                RolePermission(
                    roleId = custom.id,
                    permissionRule = permission,
                    createdAt = Instant.now()
                )
            )
        }
        
        return TenantRoles(admin, user, viewer, custom)
    }
    
    private fun assignUserRole(tenantMembershipId: TenantMembershipId, roleId: RoleId) {
        userRoleRepository.save(
            UserRole(
                tenantUserId = TenantUserId(tenantMembershipId.value),
                roleId = roleId,
                assignedAt = Instant.now(),
                assignedBy = null
            )
        )
    }
    
    private fun createTenantMembership(userId: UserId, tenantId: TenantId): TenantMembership {
        return tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(UUID.randomUUID()),
                tenantId = tenantId,
                userId = userId,
                isActive = true,
                joinedAt = Instant.now()
            )
        )
    }
    
    // Data classes for test scenarios
    
    data class PermissionTestScenario(
        val tenants: Map<String, Tenant>,
        val users: Map<String, User>,
        val roles: Map<String, TenantRoles>
    )
    
    data class TenantRoles(
        val admin: DynamicRole,
        val user: DynamicRole,
        val viewer: DynamicRole,
        val custom: DynamicRole
    )
    
    data class ResourceOwnershipScenario(
        val tenant: Tenant,
        val owner: User,
        val nonOwner: User,
        val admin: User,
        val ownedResourceId: UUID,
        val unownedResourceId: UUID,
        val ownerRole: DynamicRole,
        val adminRole: DynamicRole
    )
    
    data class TeamAccessScenario(
        val tenant: Tenant,
        val teamMember1: User,
        val teamMember2: User,
        val outsider: User,
        val teamResourceId: UUID,
        val teamRole: DynamicRole
    )
    
    data class ResourceGroupScenario(
        val tenant: Tenant,
        val projectAMember: User,
        val projectBMember: User,
        val noGroupMember: User,
        val projectAGroupId: UUID,
        val projectBGroupId: UUID,
        val projectARole: DynamicRole,
        val projectBRole: DynamicRole
    )
}