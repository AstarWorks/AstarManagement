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
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.context.jdbc.Sql
import java.time.Instant
import java.util.*

/**
 * Integration tests for Permission Evaluation logic.
 * 
 * Tests the core permission evaluation functionality including:
 * - GeneralRule evaluation (ALL/TEAM/OWN scopes)
 * - Action inclusion (MANAGE includes VIEW/EDIT)
 * - Scope hierarchy (ALL > TEAM > OWN)
 * - Basic permission checks
 * 
 * This test class was extracted from AuthorizationServiceIntegrationTest
 * to improve maintainability and focus on permission evaluation logic.
 */
@DisplayName("Permission Evaluation Integration Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class PermissionEvaluationIntegrationTest : IntegrationTestBase() {
    
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
    private lateinit var adminUser: User
    private lateinit var editorUser: User
    private lateinit var viewerUser: User
    private lateinit var adminRole: DynamicRole
    private lateinit var editorRole: DynamicRole
    private lateinit var viewerRole: DynamicRole
    private lateinit var adminMembership: TenantMembership
    private lateinit var editorMembership: TenantMembership
    private lateinit var viewerMembership: TenantMembership
    
    @BeforeEach
    fun setUp() {
        // Step 1: Clean up database (handled by @Sql annotation)
        
        // Step 2: Clear caches to ensure test isolation
        cacheEvictionService.evictAllPermissionCaches()
        
        // Step 3: Setup test scenario
        setupPermissionEvaluationScenario()
    }
    
    private fun setupPermissionEvaluationScenario() {
        // Create tenant
        tenantA = tenantRepository.save(
            Tenant(
                id = TenantId(IntegrationTestSetup.Companion.TestIds.TENANT_A),
                slug = "tenant-a",
                name = "Tenant A",
                auth0OrgId = "org_tenantA",
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create users
        adminUser = userRepository.save(
            User(
                id = UserId(IntegrationTestSetup.Companion.TestIds.ADMIN_USER),
                auth0Sub = "auth0|admin",
                email = "admin@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        editorUser = userRepository.save(
            User(
                id = UserId(IntegrationTestSetup.Companion.TestIds.REGULAR_USER),
                auth0Sub = "auth0|editor",
                email = "editor@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        viewerUser = userRepository.save(
            User(
                id = UserId(IntegrationTestSetup.Companion.TestIds.VIEWER_USER),
                auth0Sub = "auth0|viewer",
                email = "viewer@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create roles with specific permissions for testing
        adminRole = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(IntegrationTestSetup.Companion.TestIds.ADMIN_ROLE_A),
                tenantId = tenantA.id,
                name = "admin",
                displayName = "Admin",
                color = "#FF0000",
                position = 100,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        editorRole = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(IntegrationTestSetup.Companion.TestIds.USER_ROLE_A),
                tenantId = tenantA.id,
                name = "editor",
                displayName = "Editor",
                color = "#00FF00",
                position = 50,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        viewerRole = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(IntegrationTestSetup.Companion.TestIds.VIEWER_ROLE_A),
                tenantId = tenantA.id,
                name = "viewer",
                displayName = "Viewer",
                color = "#0000FF",
                position = 10,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Add permissions to roles
        // Admin: Full control (MANAGE with ALL scope)
        rolePermissionService.grantPermission(
            adminRole.id,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.MANAGE, Scope.ALL)
        )
        rolePermissionService.grantPermission(
            adminRole.id,
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.MANAGE, Scope.ALL)
        )
        
        // Editor: Edit capabilities with different scopes
        rolePermissionService.grantPermission(
            editorRole.id,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM)
        )
        rolePermissionService.grantPermission(
            editorRole.id,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
        )
        rolePermissionService.grantPermission(
            editorRole.id,
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.EDIT, Scope.OWN)
        )
        rolePermissionService.grantPermission(
            editorRole.id,
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.VIEW, Scope.TEAM)
        )
        
        // Viewer: Read-only access
        rolePermissionService.grantPermission(
            viewerRole.id,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
        )
        rolePermissionService.grantPermission(
            viewerRole.id,
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.VIEW, Scope.ALL)
        )
        
        // Create tenant memberships
        adminMembership = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A1),
                tenantId = tenantA.id,
                userId = adminUser.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
        )
        
        editorMembership = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A2),
                tenantId = tenantA.id,
                userId = editorUser.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
        )
        
        viewerMembership = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A3),
                tenantId = tenantA.id,
                userId = viewerUser.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
        )
        
        // Assign roles to users
        userRoleService.assignRole(adminMembership.id.value, adminRole.id.value)
        userRoleService.assignRole(editorMembership.id.value, editorRole.id.value)
        userRoleService.assignRole(viewerMembership.id.value, viewerRole.id.value)
    }
    
    @Nested
    @DisplayName("GeneralRule Evaluation")
    inner class GeneralRuleEvaluationTests {
        
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
        @DisplayName("Should deny permission when user lacks required scope")
        fun `should deny permission when user lacks required scope`() {
            // Given: Viewer user without EDIT permission
            val viewerTenantUserId = viewerMembership.id.value
            
            // When: Check for EDIT permission
            val hasPermission = authorizationService.hasPermission(
                viewerTenantUserId,
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.ALL)
            )
            
            // Then: Permission should be denied
            assertThat(hasPermission).isFalse()
        }
    }
    
    @Nested
    @DisplayName("Action Inclusion")
    inner class ActionInclusionTests {
        
        @Test
        @DisplayName("Should respect MANAGE includes VIEW action")
        fun `should respect MANAGE includes VIEW action`() {
            // Given: Admin user with MANAGE permission
            val adminTenantUserId = adminMembership.id.value
            
            // When: Check for VIEW action (which is included in MANAGE)
            val hasViewPermission = authorizationService.hasPermission(
                adminTenantUserId,
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
            )
            
            // Then: Permission should be granted
            assertThat(hasViewPermission).isTrue()
        }
        
        @Test
        @DisplayName("Should respect MANAGE includes EDIT action")
        fun `should respect MANAGE includes EDIT action`() {
            // Given: Admin user with MANAGE permission
            val adminTenantUserId = adminMembership.id.value
            
            // When: Check for EDIT action (which is included in MANAGE)
            val hasEditPermission = authorizationService.hasPermission(
                adminTenantUserId,
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.ALL)
            )
            
            // Then: Permission should be granted
            assertThat(hasEditPermission).isTrue()
        }
        
        @Test
        @DisplayName("Should respect MANAGE includes DELETE action")
        fun `should respect MANAGE includes DELETE action`() {
            // Given: Admin user with MANAGE permission
            val adminTenantUserId = adminMembership.id.value
            
            // When: Check for DELETE action (which is included in MANAGE)
            val hasDeletePermission = authorizationService.hasPermission(
                adminTenantUserId,
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.DELETE, Scope.ALL)
            )
            
            // Then: Permission should be granted
            assertThat(hasDeletePermission).isTrue()
        }
        
        @Test
        @DisplayName("Should not allow VIEW to grant EDIT permission")
        fun `should not allow VIEW to grant EDIT permission`() {
            // Given: Viewer user with only VIEW permission
            val viewerTenantUserId = viewerMembership.id.value
            
            // When: Check for EDIT action
            val hasEditPermission = authorizationService.hasPermission(
                viewerTenantUserId,
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.ALL)
            )
            
            // Then: Permission should be denied (VIEW doesn't include EDIT)
            assertThat(hasEditPermission).isFalse()
        }
    }
    
    @Nested
    @DisplayName("Scope Hierarchy")
    inner class ScopeHierarchyTests {
        
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
        
        @Test
        @DisplayName("Should not allow lower scope to access higher scope")
        fun `should not allow lower scope to access higher scope`() {
            // Given: Editor user with TEAM scope for TABLE.EDIT
            val editorTenantUserId = editorMembership.id.value
            
            // When: Check permissions
            val hasTeamScope = authorizationService.hasPermissionForResource(
                editorTenantUserId, ResourceType.TABLE, Action.EDIT, Scope.TEAM
            )
            val hasAllScope = authorizationService.hasPermissionForResource(
                editorTenantUserId, ResourceType.TABLE, Action.EDIT, Scope.ALL
            )
            
            // Then: TEAM scope should be granted, but not ALL scope
            assertThat(hasTeamScope).isTrue()
            assertThat(hasAllScope).isFalse()
        }
        
        @Test
        @DisplayName("Should correctly evaluate OWN scope permissions")
        fun `should correctly evaluate OWN scope permissions`() {
            // Given: Editor user with OWN scope for DOCUMENT.EDIT
            val editorTenantUserId = editorMembership.id.value
            
            // When: Check OWN scope permission
            val hasOwnScope = authorizationService.hasPermissionForResource(
                editorTenantUserId, ResourceType.DOCUMENT, Action.EDIT, Scope.OWN
            )
            
            // Then: OWN scope should be granted
            assertThat(hasOwnScope).isTrue()
        }
    }
    
    @Nested
    @DisplayName("Edge Cases")
    inner class EdgeCaseTests {
        
        @Test
        @DisplayName("Should handle permission check for non-existent resource type")
        fun `should handle permission check for non-existent resource type`() {
            // Given: Admin user
            val adminTenantUserId = adminMembership.id.value
            
            // When: Check permission for resource type not explicitly granted
            val hasPermission = authorizationService.hasPermission(
                adminTenantUserId,
                PermissionRule.GeneralRule(ResourceType.RECORD, Action.VIEW, Scope.ALL)
            )
            
            // Then: Permission should be denied (no explicit RECORD permission for admin)
            assertThat(hasPermission).isFalse()
        }
        
        @Test
        @DisplayName("Should handle mixed scope permissions correctly")
        fun `should handle mixed scope permissions correctly`() {
            // Given: Editor user with mixed scopes (TABLE.VIEW.ALL and TABLE.EDIT.TEAM)
            val editorTenantUserId = editorMembership.id.value
            
            // When: Check various combinations
            val canViewAll = authorizationService.hasPermissionForResource(
                editorTenantUserId, ResourceType.TABLE, Action.VIEW, Scope.ALL
            )
            val canEditAll = authorizationService.hasPermissionForResource(
                editorTenantUserId, ResourceType.TABLE, Action.EDIT, Scope.ALL
            )
            val canEditTeam = authorizationService.hasPermissionForResource(
                editorTenantUserId, ResourceType.TABLE, Action.EDIT, Scope.TEAM
            )
            
            // Then: Permissions should respect the granted scopes
            assertThat(canViewAll).isTrue()  // Has TABLE.VIEW.ALL
            assertThat(canEditAll).isFalse() // Only has TABLE.EDIT.TEAM, not ALL
            assertThat(canEditTeam).isTrue() // Has TABLE.EDIT.TEAM
        }
    }
}