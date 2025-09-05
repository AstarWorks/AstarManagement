package com.astarworks.astarmanagement.fixture.setup

import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.RolePermissionRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.UserRoleRepository
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.RolePermission
import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.shared.domain.value.*
import org.slf4j.LoggerFactory
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.*

/**
 * Integration test setup service for creating test data using domain objects and repositories.
 * This replaces SQL-based test data setup with type-safe Kotlin code.
 */
@Component
class IntegrationTestSetup(
    private val userRepository: UserRepository,
    private val tenantRepository: TenantRepository,
    private val dynamicRoleRepository: DynamicRoleRepository,
    private val rolePermissionRepository: RolePermissionRepository,
    private val userRoleRepository: UserRoleRepository,
    private val tenantMembershipRepository: TenantMembershipRepository,
    private val jdbcTemplate: JdbcTemplate
) {
    private val logger = LoggerFactory.getLogger(IntegrationTestSetup::class.java)

    companion object {
        // Fixed IDs for deterministic testing
        object TestIds {
            // Use AuthFixture constants for consistency
            val TENANT_A = UUID.fromString(com.astarworks.astarmanagement.fixture.AuthFixture.Tenants.TENANT_A)
            val TENANT_B = UUID.fromString(com.astarworks.astarmanagement.fixture.AuthFixture.Tenants.TENANT_B)
            
            val ADMIN_USER = UUID.fromString(com.astarworks.astarmanagement.fixture.AuthFixture.Users.ADMIN_ID)
            val REGULAR_USER = UUID.fromString(com.astarworks.astarmanagement.fixture.AuthFixture.Users.USER_ID)
            val VIEWER_USER = UUID.fromString(com.astarworks.astarmanagement.fixture.AuthFixture.Users.VIEWER_ID)
            val TENANT_B_ADMIN = UUID.fromString("44444444-4444-4444-4444-444444444444")
            val TENANT_B_USER = UUID.fromString("55555555-5555-5555-5555-555555555555")
            
            val ADMIN_ROLE_A = UUID.fromString("d1111111-1111-1111-1111-111111111111")
            val USER_ROLE_A = UUID.fromString("d2222222-2222-2222-2222-222222222222")
            val VIEWER_ROLE_A = UUID.fromString("d2333333-2333-3333-3333-333333333333")
            val ADMIN_ROLE_B = UUID.fromString("d3333333-3333-3333-3333-333333333333")
            val USER_ROLE_B = UUID.fromString("d4444444-4444-4444-4444-444444444444")
            
            val TENANT_MEMBERSHIP_A1 = UUID.fromString("a1111111-1111-1111-1111-111111111111")
            val TENANT_MEMBERSHIP_A2 = UUID.fromString("a2222222-2222-2222-2222-222222222222")
            val TENANT_MEMBERSHIP_A3 = UUID.fromString("a3333333-3333-3333-3333-333333333333")
            val TENANT_MEMBERSHIP_B1 = UUID.fromString("b1111111-1111-1111-1111-111111111111")
            val TENANT_MEMBERSHIP_B4 = UUID.fromString("b4444444-4444-4444-4444-444444444444")
            val TENANT_MEMBERSHIP_B5 = UUID.fromString("b5555555-5555-5555-5555-555555555555")
        }
        
        object TestData {
            const val TENANT_A_AUTH0_ORG = "org_tenant_a_test"
            const val TENANT_B_AUTH0_ORG = "org_tenant_b_test"
        }
    }

    /**
     * Clean up all test data in proper order to avoid foreign key constraints
     */
    fun cleanupTestData() {
        logger.info("Cleaning up test data")
        
        // Simply truncate all test data via SQL for cleaner approach
        // This approach is more reliable than trying to track all test data
        
        // Since we're using @Transactional on tests, another approach is to
        // let Spring handle rollback automatically
        
        // For now, we'll skip explicit cleanup and rely on:
        // 1. Unique IDs/slugs to avoid conflicts
        // 2. Transaction rollback in tests
        // 3. TestContainers for fresh database state
        
        logger.info("Test data cleanup skipped - using transaction rollback")
    }
    
    /**
     * Setup JWT-specific test scenario using repository pattern.
     * RLS is disabled by "SET LOCAL row_security = off" in IntegrationTestBase.
     */
    fun setupJwtTestScenario(
        auth0Sub: String = "auth0|jwt_test_${UUID.randomUUID()}",
        orgId: String = "org_jwt_test_${UUID.randomUUID()}",
        email: String = "jwt-test@example.com"
    ): JwtTestScenario {
        logger.info("Setting up JWT test scenario using repository pattern with RLS disabled")
        
        // Create unique test tenant
        val tenant = tenantRepository.save(
            Tenant(
                id = TenantId(UUID.randomUUID()),
                slug = "jwt-test-tenant-${UUID.randomUUID()}", 
                name = "JWT Test Tenant",
                auth0OrgId = orgId,
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create test user
        val user = userRepository.save(
            User(
                id = UserId(UUID.randomUUID()),
                auth0Sub = auth0Sub,
                email = email,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create admin role
        val adminRole = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(UUID.randomUUID()),
                tenantId = tenant.id,
                name = "admin",
                displayName = "Administrator",
                color = "#FF0000",
                position = 10,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create user role
        val userRole = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(UUID.randomUUID()),
                tenantId = tenant.id,
                name = "user",
                displayName = "User",
                color = "#00FF00",
                position = 5,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create admin permissions
        val adminPermissions = listOf(
            createPermission(adminRole.id, ResourceType.WORKSPACE, Action.CREATE, Scope.ALL),
            createPermission(adminRole.id, ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
            createPermission(adminRole.id, ResourceType.TABLE, Action.CREATE, Scope.ALL),
            createPermission(adminRole.id, ResourceType.TABLE, Action.VIEW, Scope.ALL),
            createPermission(adminRole.id, ResourceType.RECORD, Action.CREATE, Scope.ALL),
            createPermission(adminRole.id, ResourceType.RECORD, Action.VIEW, Scope.ALL)
        )
        
        adminPermissions.forEach { permission ->
            rolePermissionRepository.save(permission)
        }
        
        // Create user permissions
        val userPermissions = listOf(
            createPermission(userRole.id, ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
            createPermission(userRole.id, ResourceType.TABLE, Action.VIEW, Scope.ALL),
            createPermission(userRole.id, ResourceType.RECORD, Action.VIEW, Scope.ALL)
        )
        
        userPermissions.forEach { permission ->
            rolePermissionRepository.save(permission)
        }
        
        // Create tenant membership
        val membership = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(UUID.randomUUID()),
                tenantId = tenant.id,
                userId = user.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = null
            )
        )
        
        // Assign admin role to user
        userRoleRepository.save(
            UserRole.systemAssign(
                tenantUserId = TenantUserId(membership.id.value),
                roleId = adminRole.id
            )
        )
        
        logger.info("JWT test scenario setup complete using repository pattern")
        
        // Debug: Print created data details
        println("=== JWT TEST DATA CREATED (REPOSITORY PATTERN + SET LOCAL) ===")
        println("Tenant: id=${tenant.id.value}, slug=${tenant.slug}, auth0OrgId=${tenant.auth0OrgId}")
        println("User: id=${user.id.value}, auth0Sub=${user.auth0Sub}, email=${user.email}")
        println("AdminRole: id=${adminRole.id.value}, name=${adminRole.name}")
        println("UserRole: id=${userRole.id.value}, name=${userRole.name}")
        println("Membership: id=${membership.id.value}, tenantId=${membership.tenantId.value}, userId=${membership.userId.value}")
        println("================================================")
        
        return JwtTestScenario(
            tenant = tenant,
            user = user,
            adminRole = adminRole,
            userRole = userRole,
            membership = membership
        )
    }
    
    /**
     * Setup basic authentication scenario with two tenants and multiple users
     */
    fun setupBasicAuthenticationScenario(): TestScenario {
        logger.info("Setting up basic authentication test scenario")
        
        // Create users
        val users = createTestUsers()
        
        // Create tenants
        val tenants = createTestTenants()
        
        // Create roles and permissions
        val roles = createTestRoles(tenants)
        createTestPermissions(roles)
        
        // Create tenant memberships
        val memberships = createTestMemberships(users, tenants, roles)
        
        logger.info("Basic authentication scenario setup complete")
        
        return TestScenario(
            users = users,
            tenants = tenants,
            roles = roles,
            memberships = memberships
        )
    }
    
    private fun createTestUsers(): Map<String, User> {
        val users = mapOf(
            "admin" to User(
                id = UserId(TestIds.ADMIN_USER),
                auth0Sub = "auth0|test_${TestIds.ADMIN_USER}",
                email = "tenant1-admin@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ),
            "regular" to User(
                id = UserId(TestIds.REGULAR_USER),
                auth0Sub = "auth0|test_${TestIds.REGULAR_USER}",
                email = "tenant1-user@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ),
            "viewer" to User(
                id = UserId(TestIds.VIEWER_USER),
                auth0Sub = "auth0|test_${TestIds.VIEWER_USER}",
                email = "tenant1-viewer@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ),
            "tenant_b_admin" to User(
                id = UserId(TestIds.TENANT_B_ADMIN),
                auth0Sub = "auth0|test_${TestIds.TENANT_B_ADMIN}",
                email = "tenant2-admin@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ),
            "tenant_b_user" to User(
                id = UserId(TestIds.TENANT_B_USER),
                auth0Sub = "auth0|test_${TestIds.TENANT_B_USER}",
                email = "tenant2-user@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now(),
            )
        )
        
        users.values.forEach { user ->
            userRepository.save(user)
            logger.debug("Created test user: ${user.email}")
        }
        
        return users
    }
    
    private fun createTestTenants(): Map<String, Tenant> {
        val tenants = mapOf(
            "tenant_a" to Tenant(
                id = TenantId(TestIds.TENANT_A),
                slug = "tenant-a",
                name = "Tenant A",
                auth0OrgId = TestData.TENANT_A_AUTH0_ORG,
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ),
            "tenant_b" to Tenant(
                id = TenantId(TestIds.TENANT_B),
                slug = "tenant-b",
                name = "Tenant B",
                auth0OrgId = TestData.TENANT_B_AUTH0_ORG,
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now(),
            )
        )
        
        tenants.values.forEach { tenant ->
            tenantRepository.save(tenant)
            logger.debug("Created test tenant: ${tenant.name}")
        }
        
        return tenants
    }
    
    private fun createTestRoles(tenants: Map<String, Tenant>): Map<String, DynamicRole> {
        val tenantA = tenants["tenant_a"]!!
        val tenantB = tenants["tenant_b"]!!
        
        val roles = mapOf(
            "admin_a" to DynamicRole(
                id = RoleId(TestIds.ADMIN_ROLE_A),
                tenantId = tenantA.id,
                name = "admin",
                displayName = "Administrator",
                color = "#FF0000",
                position = 10,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ),
            "user_a" to DynamicRole(
                id = RoleId(TestIds.USER_ROLE_A),
                tenantId = tenantA.id,
                name = "user",
                displayName = "User",
                color = "#00FF00",
                position = 5,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ),
            "viewer_a" to DynamicRole(
                id = RoleId(TestIds.VIEWER_ROLE_A),
                tenantId = tenantA.id,
                name = "viewer",
                displayName = "Viewer",
                color = "#0000FF",
                position = 1,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ),
            "admin_b" to DynamicRole(
                id = RoleId(TestIds.ADMIN_ROLE_B),
                tenantId = tenantB.id,
                name = "admin",
                displayName = "Administrator",
                color = "#FF0000",
                position = 10,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ),
            "user_b" to DynamicRole(
                id = RoleId(TestIds.USER_ROLE_B),
                tenantId = tenantB.id,
                name = "user",
                displayName = "User",
                color = "#00FF00",
                position = 5,
                createdAt = Instant.now(),
                updatedAt = Instant.now(),
            )
        )
        
        roles.values.forEach { role ->
            dynamicRoleRepository.save(role)
            logger.debug("Created test role: ${role.name} for tenant ${role.tenantId}")
        }
        
        return roles
    }
    
    private fun createTestPermissions(roles: Map<String, DynamicRole>) {
        val adminRoleA = roles["admin_a"]!!
        val userRoleA = roles["user_a"]!!
        val viewerRoleA = roles["viewer_a"]!!
        val adminRoleB = roles["admin_b"]!!
        val userRoleB = roles["user_b"]!!
        
        // Admin permissions for Tenant A
        val adminPermissionsA = listOf(
            createPermission(adminRoleA.id, ResourceType.WORKSPACE, Action.CREATE, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.WORKSPACE, Action.EDIT, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.WORKSPACE, Action.DELETE, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.USER, Action.MANAGE, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.ROLE, Action.MANAGE, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.TABLE, Action.CREATE, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.TABLE, Action.EDIT, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.TABLE, Action.VIEW, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.TABLE, Action.DELETE, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.RECORD, Action.CREATE, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.RECORD, Action.EDIT, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.RECORD, Action.VIEW, Scope.ALL),
            createPermission(adminRoleA.id, ResourceType.RECORD, Action.DELETE, Scope.ALL)
        )
        
        // User permissions for Tenant A
        val userPermissionsA = listOf(
            createPermission(userRoleA.id, ResourceType.WORKSPACE, Action.CREATE, Scope.OWN),
            createPermission(userRoleA.id, ResourceType.WORKSPACE, Action.EDIT, Scope.ALL),
            createPermission(userRoleA.id, ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
            createPermission(userRoleA.id, ResourceType.TABLE, Action.CREATE, Scope.ALL),
            createPermission(userRoleA.id, ResourceType.TABLE, Action.EDIT, Scope.OWN),
            createPermission(userRoleA.id, ResourceType.TABLE, Action.VIEW, Scope.ALL),
            createPermission(userRoleA.id, ResourceType.RECORD, Action.CREATE, Scope.OWN),
            createPermission(userRoleA.id, ResourceType.RECORD, Action.EDIT, Scope.OWN),
            createPermission(userRoleA.id, ResourceType.RECORD, Action.VIEW, Scope.ALL)
        )
        
        // Viewer permissions for Tenant A
        val viewerPermissionsA = listOf(
            createPermission(viewerRoleA.id, ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
            createPermission(viewerRoleA.id, ResourceType.TABLE, Action.VIEW, Scope.ALL),
            createPermission(viewerRoleA.id, ResourceType.RECORD, Action.VIEW, Scope.ALL)
        )
        
        // Admin permissions for Tenant B
        val adminPermissionsB = listOf(
            createPermission(adminRoleB.id, ResourceType.WORKSPACE, Action.CREATE, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.WORKSPACE, Action.EDIT, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.USER, Action.MANAGE, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.TABLE, Action.CREATE, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.TABLE, Action.EDIT, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.TABLE, Action.VIEW, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.TABLE, Action.DELETE, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.RECORD, Action.CREATE, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.RECORD, Action.EDIT, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.RECORD, Action.VIEW, Scope.ALL),
            createPermission(adminRoleB.id, ResourceType.RECORD, Action.DELETE, Scope.ALL)
        )
        
        // User permissions for Tenant B
        val userPermissionsB = listOf(
            createPermission(userRoleB.id, ResourceType.WORKSPACE, Action.VIEW, Scope.ALL),
            createPermission(userRoleB.id, ResourceType.TABLE, Action.VIEW, Scope.ALL),
            createPermission(userRoleB.id, ResourceType.RECORD, Action.VIEW, Scope.ALL)
        )
        
        // Save all permissions
        (adminPermissionsA + userPermissionsA + viewerPermissionsA + adminPermissionsB + userPermissionsB)
            .forEach { permission ->
                rolePermissionRepository.save(permission)
            }
        
        logger.debug("Created test permissions for all roles")
    }
    
    private fun createPermission(roleId: RoleId, resourceType: ResourceType, action: Action, scope: Scope): RolePermission {
        return RolePermission(
            roleId = roleId,
            permissionRule = PermissionRule.GeneralRule(resourceType, action, scope),
            createdAt = Instant.now()
        )
    }
    
    private fun createTestMemberships(
        users: Map<String, User>,
        tenants: Map<String, Tenant>,
        roles: Map<String, DynamicRole>
    ): List<TenantMembership> {
        val memberships = listOf(
            // Tenant A memberships
            TenantMembership(
                id = TenantMembershipId(TestIds.TENANT_MEMBERSHIP_A1),
                tenantId = tenants["tenant_a"]!!.id,
                userId = users["admin"]!!.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = null,
            ),
            TenantMembership(
                id = TenantMembershipId(TestIds.TENANT_MEMBERSHIP_A2),
                tenantId = tenants["tenant_a"]!!.id,
                userId = users["regular"]!!.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = null,
            ),
            TenantMembership(
                id = TenantMembershipId(TestIds.TENANT_MEMBERSHIP_A3),
                tenantId = tenants["tenant_a"]!!.id,
                userId = users["viewer"]!!.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = null,
            ),
            // Tenant B memberships
            TenantMembership(
                id = TenantMembershipId(TestIds.TENANT_MEMBERSHIP_B4),
                tenantId = tenants["tenant_b"]!!.id,
                userId = users["tenant_b_admin"]!!.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = null,
            ),
            TenantMembership(
                id = TenantMembershipId(TestIds.TENANT_MEMBERSHIP_B5),
                tenantId = tenants["tenant_b"]!!.id,
                userId = users["tenant_b_user"]!!.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = null,
            ),
            // Multi-tenant user: admin user also has access to Tenant B
            TenantMembership(
                id = TenantMembershipId(TestIds.TENANT_MEMBERSHIP_B1),
                tenantId = tenants["tenant_b"]!!.id,
                userId = users["admin"]!!.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = null,
            )
        )
        
        memberships.forEach { membership ->
            tenantMembershipRepository.save(membership)
            logger.debug("Created tenant membership: ${membership.userId} -> ${membership.tenantId}")
        }
        
        // Create user role assignments
        createTestUserRoleAssignments(memberships, roles)
        
        return memberships
    }
    
    private fun createTestUserRoleAssignments(
        memberships: List<TenantMembership>,
        roles: Map<String, DynamicRole>
    ) {
        val userRoleAssignments = listOf(
            // Tenant A: Admin user gets admin role
            UserRole.systemAssign(
                tenantUserId = TenantUserId(TestIds.TENANT_MEMBERSHIP_A1),
                roleId = roles["admin_a"]!!.id
            ),
            // Tenant A: Regular user gets user role
            UserRole.systemAssign(
                tenantUserId = TenantUserId(TestIds.TENANT_MEMBERSHIP_A2),
                roleId = roles["user_a"]!!.id
            ),
            // Tenant A: Viewer user gets viewer role
            UserRole.systemAssign(
                tenantUserId = TenantUserId(TestIds.TENANT_MEMBERSHIP_A3),
                roleId = roles["viewer_a"]!!.id
            ),
            // Tenant B: Admin user gets admin role
            UserRole.systemAssign(
                tenantUserId = TenantUserId(TestIds.TENANT_MEMBERSHIP_B4),
                roleId = roles["admin_b"]!!.id
            ),
            // Tenant B: Regular user gets user role
            UserRole.systemAssign(
                tenantUserId = TenantUserId(TestIds.TENANT_MEMBERSHIP_B5),
                roleId = roles["user_b"]!!.id
            ),
            // Multi-tenant: Admin user also gets admin role in Tenant B
            UserRole.systemAssign(
                tenantUserId = TenantUserId(TestIds.TENANT_MEMBERSHIP_B1),
                roleId = roles["admin_b"]!!.id
            )
        )
        
        userRoleAssignments.forEach { userRole ->
            userRoleRepository.save(userRole)
            logger.debug("Created user role assignment: ${userRole.tenantUserId} -> ${userRole.roleId}")
        }
    }
}

/**
 * Container for test scenario data
 */
data class TestScenario(
    val users: Map<String, User>,
    val tenants: Map<String, Tenant>,
    val roles: Map<String, DynamicRole>,
    val memberships: List<TenantMembership>
)

/**
 * Container for JWT test scenario data
 */
data class JwtTestScenario(
    val tenant: Tenant,
    val user: User,
    val adminRole: DynamicRole,
    val userRole: DynamicRole?,
    val membership: TenantMembership
)