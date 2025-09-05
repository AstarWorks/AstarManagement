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
 * Integration tests for Role Aggregation functionality.
 * 
 * Tests the role aggregation features including:
 * - Multiple role assignment and permission merging
 * - Dynamic role addition and removal
 * - Cache invalidation on role changes
 * - Permission deduplication
 * - Empty role handling
 * 
 * This test class was extracted from AuthorizationServiceIntegrationTest
 * to focus specifically on role aggregation behaviors.
 */
@DisplayName("Role Aggregation Integration Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class RoleAggregationIntegrationTest : IntegrationTestBase() {
    
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
    private lateinit var cacheEvictionService: CacheEvictionService
    
    // Test data references
    private lateinit var tenantA: Tenant
    private lateinit var editorRole: DynamicRole
    private lateinit var viewerRole: DynamicRole
    private lateinit var contributorRole: DynamicRole
    private lateinit var noRoleUser: User
    private lateinit var noRoleMembership: TenantMembership
    
    @BeforeEach
    fun setUp() {
        // Step 1: Clean up database (handled by @Sql annotation)
        
        // Step 2: Clear caches to ensure test isolation
        cacheEvictionService.evictAllPermissionCaches()
        
        // Step 3: Setup test scenario
        setupRoleAggregationScenario()
    }
    
    private fun setupRoleAggregationScenario() {
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
        
        // Create user without any roles initially
        noRoleUser = userRepository.save(
            User(
                id = UserId(UUID.randomUUID()),
                auth0Sub = "auth0|norole",
                email = "norole@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create roles for testing aggregation
        editorRole = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(UUID.randomUUID()),
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
                id = RoleId(UUID.randomUUID()),
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
        
        contributorRole = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(UUID.randomUUID()),
                tenantId = tenantA.id,
                name = "contributor",
                displayName = "Contributor",
                color = "#FFFF00",
                position = 30,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Add different permissions to each role
        // Editor: Can edit and view in different scopes
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
        
        // Viewer: Can only view
        rolePermissionService.grantPermission(
            viewerRole.id,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)  // Duplicate with Editor
        )
        rolePermissionService.grantPermission(
            viewerRole.id,
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.VIEW, Scope.ALL)
        )
        rolePermissionService.grantPermission(
            viewerRole.id,
            PermissionRule.GeneralRule(ResourceType.RECORD, Action.VIEW, Scope.ALL)
        )
        
        // Contributor: Can create and edit own resources
        rolePermissionService.grantPermission(
            contributorRole.id,
            PermissionRule.GeneralRule(ResourceType.TABLE, Action.CREATE, Scope.OWN)
        )
        rolePermissionService.grantPermission(
            contributorRole.id,
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.CREATE, Scope.OWN)
        )
        rolePermissionService.grantPermission(
            contributorRole.id,
            PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.EDIT, Scope.OWN)  // Duplicate with Editor
        )
        
        // Create tenant membership for user without roles
        noRoleMembership = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(UUID.randomUUID()),
                tenantId = tenantA.id,
                userId = noRoleUser.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
        )
    }
    
    @Nested
    @DisplayName("Multiple Role Assignment")
    inner class MultipleRoleAssignmentTests {
        
        @Test
        @DisplayName("Should aggregate permissions from multiple roles")
        fun `should aggregate permissions from multiple roles`() {
            // Given: Create a fresh user with multiple roles
            val multiRoleUser = userRepository.save(
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|multirole",
                    email = "multirole@test.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val multiRoleMembership = tenantMembershipRepository.save(
                TenantMembership(
                    id = TenantMembershipId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    userId = multiRoleUser.id,
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // Assign both editor and viewer roles
            userRoleService.assignRole(multiRoleMembership.id.value, editorRole.id.value)
            userRoleService.assignRole(multiRoleMembership.id.value, viewerRole.id.value)
            
            // When: Get all effective permissions
            val permissions = authorizationService.getUserEffectivePermissionRules(multiRoleMembership.id.value)
            
            // Then: Should have permissions from both roles (with deduplication)
            // Editor has 4 permissions, Viewer has 3, but TABLE.VIEW.ALL is duplicated
            assertThat(permissions).hasSize(6) // Editor(4) + Viewer(3) - 1 duplicate
            
            // Verify permissions from both roles are present
            assertThat(permissions).anyMatch { 
                it is PermissionRule.GeneralRule && 
                it.resourceType == ResourceType.TABLE && 
                it.action == Action.EDIT 
            }
            assertThat(permissions).anyMatch { 
                it is PermissionRule.GeneralRule && 
                it.resourceType == ResourceType.RECORD && 
                it.action == Action.VIEW 
            }
        }
        
        @Test
        @DisplayName("Should handle three or more roles correctly")
        fun `should handle three or more roles correctly`() {
            // Given: User with three roles
            val tripleRoleUser = userRepository.save(
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|triplerole",
                    email = "triplerole@test.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val tripleRoleMembership = tenantMembershipRepository.save(
                TenantMembership(
                    id = TenantMembershipId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    userId = tripleRoleUser.id,
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // Assign all three roles
            userRoleService.assignRole(tripleRoleMembership.id.value, editorRole.id.value)
            userRoleService.assignRole(tripleRoleMembership.id.value, viewerRole.id.value)
            userRoleService.assignRole(tripleRoleMembership.id.value, contributorRole.id.value)
            
            // When: Get effective permissions
            val permissions = authorizationService.getUserEffectivePermissionRules(tripleRoleMembership.id.value)
            
            // Then: Should have all unique permissions from three roles
            // Editor(4) + Viewer(3) + Contributor(3) - duplicates
            assertThat(permissions).hasSizeGreaterThanOrEqualTo(7)
            
            // Verify CREATE permission from Contributor role
            assertThat(permissions).anyMatch { 
                it is PermissionRule.GeneralRule && 
                it.action == Action.CREATE 
            }
        }
        
        @Test
        @DisplayName("Should deduplicate identical permissions from multiple roles")
        fun `should deduplicate identical permissions from multiple roles`() {
            // Given: User with roles that have overlapping permissions
            val overlapUser = userRepository.save(
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|overlap",
                    email = "overlap@test.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val overlapMembership = tenantMembershipRepository.save(
                TenantMembership(
                    id = TenantMembershipId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    userId = overlapUser.id,
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // Assign roles with overlapping permissions
            userRoleService.assignRole(overlapMembership.id.value, editorRole.id.value)
            userRoleService.assignRole(overlapMembership.id.value, contributorRole.id.value)
            
            // When: Get permissions
            val permissions = authorizationService.getUserEffectivePermissionRules(overlapMembership.id.value)
            
            // Then: DOCUMENT.EDIT.OWN should appear only once despite being in both roles
            val documentEditOwnCount = permissions.count { 
                it is PermissionRule.GeneralRule && 
                it.resourceType == ResourceType.DOCUMENT && 
                it.action == Action.EDIT && 
                it.scope == Scope.OWN 
            }
            assertThat(documentEditOwnCount).isEqualTo(1)
        }
    }
    
    @Nested
    @DisplayName("Dynamic Role Changes")
    inner class DynamicRoleChangeTests {
        
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
            // Given: Create a fresh user with no roles
            val testUser = userRepository.save(
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|testadd",
                    email = "testadd@test.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val testMembership = tenantMembershipRepository.save(
                TenantMembership(
                    id = TenantMembershipId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    userId = testUser.id,
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // Verify initially no permissions
            val initialPermissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
            assertThat(initialPermissions).isEmpty()
            
            // When: Add a role (UserRoleService will clear cache automatically)
            userRoleService.assignRole(testMembership.id.value, viewerRole.id.value)
            
            // Then: Permissions should be updated
            val permissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
            assertThat(permissions).hasSize(3) // Viewer role has 3 permissions
        }
        
        @Test
        @DisplayName("Should update permissions when role is removed")
        fun `should update permissions when role is removed`() {
            // Given: Create a user with a role
            val testUser = userRepository.save(
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|testremove",
                    email = "testremove@test.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val testMembership = tenantMembershipRepository.save(
                TenantMembership(
                    id = TenantMembershipId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    userId = testUser.id,
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // Assign a role first
            userRoleService.assignRole(testMembership.id.value, viewerRole.id.value)
            
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
        @DisplayName("Should update permissions when second role is added")
        fun `should update permissions when second role is added`() {
            // Given: User with one role
            val testUser = userRepository.save(
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|addsecond",
                    email = "addsecond@test.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val testMembership = tenantMembershipRepository.save(
                TenantMembership(
                    id = TenantMembershipId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    userId = testUser.id,
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // Start with viewer role
            userRoleService.assignRole(testMembership.id.value, viewerRole.id.value)
            val initialPermissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
            assertThat(initialPermissions).hasSize(3)
            
            // When: Add editor role
            userRoleService.assignRole(testMembership.id.value, editorRole.id.value)
            
            // Then: Should have combined permissions
            val combinedPermissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
            assertThat(combinedPermissions).hasSize(6) // 3 + 4 - 1 duplicate
        }
        
        @Test
        @DisplayName("Should handle partial role removal correctly")
        fun `should handle partial role removal correctly`() {
            // Given: User with multiple roles
            val testUser = userRepository.save(
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|removepartial",
                    email = "removepartial@test.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val testMembership = tenantMembershipRepository.save(
                TenantMembership(
                    id = TenantMembershipId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    userId = testUser.id,
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // Assign two roles
            userRoleService.assignRole(testMembership.id.value, editorRole.id.value)
            userRoleService.assignRole(testMembership.id.value, viewerRole.id.value)
            
            // When: Remove only one role
            userRoleService.removeRole(testMembership.id.value, editorRole.id.value)
            
            // Then: Should still have permissions from viewer role
            val permissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
            assertThat(permissions).hasSize(3) // Only viewer permissions remain
            assertThat(permissions).noneMatch { 
                it is PermissionRule.GeneralRule && it.action == Action.EDIT 
            }
        }
    }
    
    @Nested
    @DisplayName("Empty Role Handling")
    inner class EmptyRoleHandlingTests {
        
        @Test
        @DisplayName("Should handle role with no permissions")
        fun `should handle role with no permissions`() {
            // Given: Create a role with no permissions
            val emptyRole = dynamicRoleRepository.save(
                DynamicRole(
                    id = RoleId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    name = "empty",
                    displayName = "Empty Role",
                    color = "#808080",
                    position = 1,
                    isSystem = false,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val testUser = userRepository.save(
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|testempty",
                    email = "testempty@test.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val testMembership = tenantMembershipRepository.save(
                TenantMembership(
                    id = TenantMembershipId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    userId = testUser.id,
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // When: Assign empty role to user
            userRoleService.assignRole(testMembership.id.value, emptyRole.id.value)
            
            // Then: User should have no effective permissions
            val permissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
            assertThat(permissions).isEmpty()
        }
        
        @Test
        @DisplayName("Should handle mix of empty and non-empty roles")
        fun `should handle mix of empty and non-empty roles`() {
            // Given: Create an empty role
            val emptyRole = dynamicRoleRepository.save(
                DynamicRole(
                    id = RoleId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    name = "empty",
                    displayName = "Empty Role",
                    color = "#808080",
                    position = 1,
                    isSystem = false,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val testUser = userRepository.save(
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|mixempty",
                    email = "mixempty@test.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            val testMembership = tenantMembershipRepository.save(
                TenantMembership(
                    id = TenantMembershipId(UUID.randomUUID()),
                    tenantId = tenantA.id,
                    userId = testUser.id,
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // When: Assign both empty and non-empty roles
            userRoleService.assignRole(testMembership.id.value, emptyRole.id.value)
            userRoleService.assignRole(testMembership.id.value, viewerRole.id.value)
            
            // Then: Should have permissions from non-empty role only
            val permissions = authorizationService.getUserEffectivePermissionRules(testMembership.id.value)
            assertThat(permissions).hasSize(3) // Only viewer role permissions
        }
    }
}