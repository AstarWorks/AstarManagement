package com.astarworks.astarmanagement.integration.auth

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.RolePermissionRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.UserRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.service.AuthorizationService
import com.astarworks.astarmanagement.core.auth.domain.service.CacheEvictionService
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import com.astarworks.astarmanagement.shared.domain.value.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.context.jdbc.Sql
import java.time.Instant
import java.util.*

/**
 * Integration tests for AuthorizationService.
 * Tests permission evaluation, role aggregation, scope hierarchy, and action inclusion.
 * 
 * Uses @BeforeEach cleanup strategy for proper test isolation.
 */
@DisplayName("Authorization Service Integration Tests")
class AuthorizationServiceIntegrationTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var authorizationService: AuthorizationService
    
    @Autowired
    private lateinit var userRoleService: UserRoleService
    
    @Autowired
    private lateinit var rolePermissionService: RolePermissionService
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    @Autowired
    private lateinit var tenantRepository: TenantRepository
    
    @Autowired
    private lateinit var dynamicRoleRepository: DynamicRoleRepository
    
    @Autowired
    private lateinit var rolePermissionRepository: RolePermissionRepository
    
    @Autowired
    private lateinit var userRoleRepository: UserRoleRepository
    
    @Autowired
    private lateinit var tenantMembershipRepository: TenantMembershipRepository
    
    @Autowired
    private lateinit var integrationTestSetup: IntegrationTestSetup
    
    @Autowired
    private lateinit var cacheEvictionService: CacheEvictionService
    
    // Test data references
    private lateinit var tenantA: Tenant
    private lateinit var tenantB: Tenant
    private lateinit var adminUser: User
    private lateinit var editorUser: User
    private lateinit var viewerUser: User
    private lateinit var noRoleUser: User
    private lateinit var adminRole: DynamicRole
    private lateinit var editorRole: DynamicRole
    private lateinit var viewerRole: DynamicRole
    private lateinit var adminMembership: TenantMembership
    private lateinit var editorMembership: TenantMembership
    private lateinit var viewerMembership: TenantMembership
    private lateinit var noRoleMembership: TenantMembership
    
    @BeforeEach
    fun setupCompleteTestEnvironment() {
        // Step 1: Clean up any existing test data
        cleanupDatabase()
        
        // Step 2: Clear any caches that might affect tests
        clearCaches()
        
        // Step 3: Setup the authorization test scenario
        setupAuthorizationScenario()
    }
    
    override fun clearCaches() {
        // Clear all permission-related caches to ensure test isolation
        cacheEvictionService.evictAllPermissionCaches()
    }
    
    private fun setupAuthorizationScenario() {
        // Create tenants
        tenantA = createTenant(IntegrationTestSetup.Companion.TestIds.TENANT_A, "tenant-a", "Tenant A")
        tenantB = createTenant(IntegrationTestSetup.Companion.TestIds.TENANT_B, "tenant-b", "Tenant B")
        
        // Create users
        adminUser = createUser(
            IntegrationTestSetup.Companion.TestIds.ADMIN_USER,
            "auth0|admin",
            "admin@test.com"
        )
        editorUser = createUser(
            IntegrationTestSetup.Companion.TestIds.REGULAR_USER,
            "auth0|editor",
            "editor@test.com"
        )
        viewerUser = createUser(
            IntegrationTestSetup.Companion.TestIds.VIEWER_USER,
            "auth0|viewer",
            "viewer@test.com"
        )
        noRoleUser = createUser(
            UUID.fromString("66666666-6666-6666-6666-666666666666"),
            "auth0|norole",
            "norole@test.com"
        )
        
        // Create roles with permissions
        adminRole = createRoleWithPermissions(
            IntegrationTestSetup.Companion.TestIds.ADMIN_ROLE_A,
            tenantA.id.value,
            "Admin",
            listOf(
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.MANAGE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.MANAGE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.ROLE, Action.MANAGE, Scope.ALL)
            )
        )
        
        editorRole = createRoleWithPermissions(
            IntegrationTestSetup.Companion.TestIds.USER_ROLE_A,
            tenantA.id.value,
            "Editor",
            listOf(
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM),
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.EDIT, Scope.OWN),
                PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.VIEW, Scope.TEAM)
            )
        )
        
        viewerRole = createRoleWithPermissions(
            IntegrationTestSetup.Companion.TestIds.VIEWER_ROLE_A,
            tenantA.id.value,
            "Viewer",
            listOf(
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.VIEW, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.RECORD, Action.VIEW, Scope.ALL)
            )
        )
        
        // Create tenant memberships
        adminMembership = createTenantMembership(
            IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A1,
            adminUser,
            tenantA
        )
        editorMembership = createTenantMembership(
            IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A2,
            editorUser,
            tenantA
        )
        viewerMembership = createTenantMembership(
            IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A3,
            viewerUser,
            tenantA
        )
        noRoleMembership = createTenantMembership(
            UUID.fromString("a4444444-4444-4444-4444-444444444444"),
            noRoleUser,
            tenantA
        )
        
        // Assign roles to users via tenant membership
        assignRoleToMember(adminMembership.id.value, adminRole.id.value)
        assignRoleToMember(editorMembership.id.value, editorRole.id.value)
        assignRoleToMember(viewerMembership.id.value, viewerRole.id.value)
        // noRoleUser gets no roles
    }
    
    // ==================== Permission Evaluation Tests ====================
    
    @Test
    @DisplayName("Should evaluate GeneralRule with ALL scope correctly")
    fun `should evaluate GeneralRule with ALL scope correctly`() {
        // Given: Admin user with ALL scope permission
        val adminTenantUserId = adminMembership.id.value
        
        // When: Check permission with ALL scope
        val hasPermission = authorizationService.hasPermission(
            adminTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
        )
        
        // Then: Permission should be granted (MANAGE includes VIEW)
        assertThat(hasPermission).isTrue()
    }
    
    @Test
    @DisplayName("Should evaluate GeneralRule with TEAM scope correctly")
    fun `should evaluate GeneralRule with TEAM scope correctly`() {
        // Given: Editor user with TEAM scope permission
        val editorTenantUserId = editorMembership.id.value
        
        // When: Check permission with TEAM scope
        val hasTeamPermission = authorizationService.hasPermission(
            editorTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM)
        )
        
        // Then: Permission should be granted
        assertThat(hasTeamPermission).isTrue()
    }
    
    @Test
    @DisplayName("Should evaluate GeneralRule with OWN scope correctly")
    fun `should evaluate GeneralRule with OWN scope correctly`() {
        // Given: Editor user with OWN scope permission
        val editorTenantUserId = editorMembership.id.value
        
        // When: Check permission with OWN scope
        val hasOwnPermission = authorizationService.hasPermission(
            editorTenantUserId,
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.EDIT, Scope.OWN)
        )
        
        // Then: Permission should be granted
        assertThat(hasOwnPermission).isTrue()
    }
    
    @Test
    @DisplayName("Should respect scope hierarchy ALL > TEAM > OWN")
    fun `should respect scope hierarchy ALL greater than TEAM greater than OWN`() {
        // Given: Admin user with ALL scope permission
        val adminTenantUserId = adminMembership.id.value
        
        // When: Check if ALL scope includes lower scopes
        val hasAllScope = authorizationService.hasPermissionForResource(
            adminTenantUserId, ResourceType.TABLE, Action.VIEW, Scope.ALL
        )
        val hasTeamScope = authorizationService.hasPermissionForResource(
            adminTenantUserId, ResourceType.TABLE, Action.VIEW, Scope.TEAM
        )
        val hasOwnScope = authorizationService.hasPermissionForResource(
            adminTenantUserId, ResourceType.TABLE, Action.VIEW, Scope.OWN
        )
        
        // Then: ALL scope should include all lower scopes
        assertThat(hasAllScope).isTrue()
        assertThat(hasTeamScope).isTrue()
        assertThat(hasOwnScope).isTrue()
    }
    
    // ==================== Role Aggregation Tests ====================
    
    @Test
    @DisplayName("Should aggregate permissions from multiple roles")
    fun `should aggregate permissions from multiple roles`() {
        // Given: Create a fresh user with multiple roles to avoid contamination
        val multiRoleUser = createUser(
            UUID.randomUUID(),
            "auth0|multirole",
            "multirole@test.com"
        )
        val multiRoleMembership = createTenantMembership(
            UUID.randomUUID(),
            multiRoleUser,
            tenantA
        )
        
        // Assign both editor and viewer roles
        assignRoleToMember(multiRoleMembership.id.value, editorRole.id.value)
        assignRoleToMember(multiRoleMembership.id.value, viewerRole.id.value)
        
        // When: Get all effective permissions
        val permissions = authorizationService.getUserEffectivePermissionRules(multiRoleMembership.id.value)
        
        // Then: Should have permissions from both roles (with deduplication)
        // Editor has 4 permissions, Viewer has 3, but TABLE.VIEW.ALL is duplicated
        assertThat(permissions).hasSize(6) // Editor(4) + Viewer(3) - 1 duplicate
        assertThat(permissions).anyMatch { 
            it is PermissionRule.GeneralRule && it.action == Action.EDIT 
        }
        assertThat(permissions).anyMatch { 
            it is PermissionRule.GeneralRule && it.action == Action.VIEW 
        }
    }
    
    @Test
    @DisplayName("Should return empty permissions for user without roles")
    fun `should return empty permissions for user without roles`() {
        // Given: User with no roles
        val noRoleTenantUserId = noRoleMembership.id.value
        
        // When: Get effective permissions
        val permissions = authorizationService.getUserEffectivePermissionRules(noRoleTenantUserId)
        
        // Then: Should have no permissions
        assertThat(permissions).isEmpty()
    }
    
    @Test
    @DisplayName("Should update permissions when role is added")
    fun `should update permissions when role is added`() {
        // Given: Create a fresh user with no roles to avoid contamination
        val testUser = createUser(
            UUID.randomUUID(),
            "auth0|testadd",
            "testadd@test.com"
        )
        val testMembership = createTenantMembership(
            UUID.randomUUID(),
            testUser,
            tenantA
        )
        
        // Verify initially no permissions
        val initialPermissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
        assertThat(initialPermissions).isEmpty()
        
        // When: Add a role (UserRoleService will clear cache automatically)
        assignRoleToMember(testMembership.id.value, viewerRole.id.value)
        
        // Then: Permissions should be updated
        val permissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
        assertThat(permissions).hasSize(3) // Viewer role has 3 permissions
    }
    
    @Test
    @DisplayName("Should update permissions when role is removed")
    fun `should update permissions when role is removed`() {
        // Given: Create a fresh user with a role to test removal
        val testUser = createUser(
            UUID.randomUUID(),
            "auth0|testremove",
            "testremove@test.com"
        )
        val testMembership = createTenantMembership(
            UUID.randomUUID(),
            testUser,
            tenantA
        )
        
        // Assign a role first
        assignRoleToMember(testMembership.id.value, viewerRole.id.value)
        
        // Verify role was assigned
        val initialPermissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
        assertThat(initialPermissions).hasSize(3)
        
        // When: Remove the role
        userRoleService.removeRole(testMembership.id.value, viewerRole.id.value)
        
        // Then: Permissions should be empty
        val permissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
        assertThat(permissions).isEmpty()
    }
    
    @Test
    @DisplayName("Should handle role with no permissions")
    fun `should handle role with no permissions`() {
        // Given: Create a fresh user and a role with no permissions
        val testUser = createUser(
            UUID.randomUUID(),
            "auth0|testempty",
            "testempty@test.com"
        )
        val testMembership = createTenantMembership(
            UUID.randomUUID(),
            testUser,
            tenantA
        )
        
        val emptyRole = createRoleWithPermissions(
            UUID.randomUUID(),
            tenantA.id.value,
            "Empty Role",
            emptyList()
        )
        
        // When: Assign empty role to user
        assignRoleToMember(testMembership.id.value, emptyRole.id.value)
        
        // Then: User should have no effective permissions
        val permissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
        assertThat(permissions).isEmpty()
    }
    
    // ==================== Action Inclusion Tests ====================
    
    @Test
    @DisplayName("MANAGE action should include all other actions")
    fun `MANAGE action should include all other actions`() {
        // Given: Admin user with MANAGE permission
        val adminTenantUserId = adminMembership.id.value
        
        // When: Check various actions
        val canView = authorizationService.hasPermission(
            adminTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
        )
        val canCreate = authorizationService.hasPermission(
            adminTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.CREATE, Scope.ALL)
        )
        val canEdit = authorizationService.hasPermission(
            adminTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.ALL)
        )
        val canDelete = authorizationService.hasPermission(
            adminTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.DELETE, Scope.ALL)
        )
        val canExport = authorizationService.hasPermission(
            adminTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.EXPORT, Scope.ALL)
        )
        val canImport = authorizationService.hasPermission(
            adminTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.IMPORT, Scope.ALL)
        )
        
        // Then: MANAGE should include all actions
        assertThat(canView).isTrue()
        assertThat(canCreate).isTrue()
        assertThat(canEdit).isTrue()
        assertThat(canDelete).isTrue()
        assertThat(canExport).isTrue()
        assertThat(canImport).isTrue()
    }
    
    @Test
    @DisplayName("VIEW action should not include CREATE action")
    fun `VIEW action should not include CREATE action`() {
        // Given: Viewer user with only VIEW permission
        val viewerTenantUserId = viewerMembership.id.value
        
        // When: Check if VIEW includes CREATE
        val canView = authorizationService.hasPermission(
            viewerTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
        )
        val canCreate = authorizationService.hasPermission(
            viewerTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.CREATE, Scope.ALL)
        )
        
        // Then: VIEW should not include CREATE
        assertThat(canView).isTrue()
        assertThat(canCreate).isFalse()
    }
    
    @Test
    @DisplayName("Should evaluate action inclusion in permission check")
    fun `should evaluate action inclusion in permission check`() {
        // Given: Admin with MANAGE and Editor with EDIT
        val adminTenantUserId = adminMembership.id.value
        val editorTenantUserId = editorMembership.id.value
        
        // When: Check if MANAGE includes EDIT
        val adminCanEdit = authorizationService.hasPermission(
            adminTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM)
        )
        
        // When: Check if EDIT includes DELETE
        val editorCanDelete = authorizationService.hasPermission(
            editorTenantUserId,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.DELETE, Scope.TEAM)
        )
        
        // Then: MANAGE includes EDIT, but EDIT doesn't include DELETE
        assertThat(adminCanEdit).isTrue()
        assertThat(editorCanDelete).isFalse()
    }
    
    // ==================== Special Cases Tests ====================
    
    @Test
    @DisplayName("Should deny access when required scope is higher than granted")
    fun `should deny access when required scope is higher than granted`() {
        // Given: Editor with TEAM scope trying to access ALL scope
        val editorTenantUserId = editorMembership.id.value
        
        // When: Check permission requiring ALL scope (editor only has TEAM)
        val hasPermission = authorizationService.hasPermissionForResource(
            editorTenantUserId, ResourceType.TABLE, Action.EDIT, Scope.ALL
        )
        
        // Then: Should be denied
        assertThat(hasPermission).isFalse()
    }
    
    @Test
    @DisplayName("Should handle permission check for non-existent resource type")
    fun `should handle permission check for non-existent resource type`() {
        // Given: Admin user
        val adminTenantUserId = adminMembership.id.value
        
        // When: Check permission for WORKSPACE (admin only has TABLE and DOCUMENT)
        val hasPermission = authorizationService.hasPermission(
            adminTenantUserId,
            PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.VIEW, Scope.ALL)
        )
        
        // Then: Should be denied (no WORKSPACE permission granted)
        assertThat(hasPermission).isFalse()
    }
    
    @Test
    @DisplayName("Should get all effective roles for a user")
    fun `should get all effective roles for a user`() {
        // Given: Create a fresh user with multiple roles
        val testUser = createUser(
            UUID.randomUUID(),
            "auth0|testroles",
            "testroles@test.com"
        )
        val testMembership = createTenantMembership(
            UUID.randomUUID(),
            testUser,
            tenantA
        )
        
        // Assign both editor and viewer roles
        assignRoleToMember(testMembership.id.value, editorRole.id.value)
        assignRoleToMember(testMembership.id.value, viewerRole.id.value)
        
        // When: Get all effective roles
        val roles = authorizationService.getUserEffectiveRoles(testMembership.id.value)
        
        // Then: Should have both roles
        assertThat(roles).hasSize(2)
        assertThat(roles).anyMatch { it.name == "editor" } // Roles are stored with lowercase names
        assertThat(roles).anyMatch { it.name == "viewer" } // Roles are stored with lowercase names
    }
    
    // ==================== Helper Methods ====================
    
    private fun createTenant(id: UUID, slug: String, name: String): Tenant {
        return tenantRepository.save(
            Tenant(
                id = TenantId(id),
                slug = slug,
                name = name,
                auth0OrgId = "org_$slug",
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
    }
    
    private fun createUser(id: UUID, auth0Sub: String, email: String): User {
        return userRepository.save(
            User(
                id = UserId(id),
                auth0Sub = auth0Sub,
                email = email,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
    }
    
    private fun createRoleWithPermissions(
        roleId: UUID,
        tenantId: UUID,
        roleName: String,
        permissions: List<PermissionRule>
    ): DynamicRole {
        // Create role
        val role = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(roleId),
                tenantId = TenantId(tenantId),
                name = roleName.lowercase().replace(" ", "_"), // Ensure name follows constraints
                displayName = roleName,
                color = "#FF0000",
                position = 1,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Add permissions to role
        permissions.forEach { permission ->
            rolePermissionRepository.save(
                RolePermission(
                    roleId = role.id,
                    permissionRule = permission,
                    createdAt = Instant.now()
                )
            )
        }
        
        return role
    }
    
    private fun createTenantMembership(id: UUID, user: User, tenant: Tenant): TenantMembership {
        return tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(id),
                userId = user.id,
                tenantId = tenant.id,
                isActive = true,
                joinedAt = Instant.now()
            )
        )
    }
    
    private fun assignRoleToMember(tenantMembershipId: UUID, roleId: UUID) {
        userRoleService.assignRole(tenantMembershipId, roleId)
    }
}