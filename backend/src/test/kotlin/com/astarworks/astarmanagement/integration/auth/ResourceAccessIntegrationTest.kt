package com.astarworks.astarmanagement.integration.auth

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.service.CacheEvictionService
import com.astarworks.astarmanagement.core.auth.domain.service.ResourceAccessEvaluator
import com.astarworks.astarmanagement.core.auth.infrastructure.ownership.WorkspaceOwnershipStrategy
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.workspace.domain.repository.WorkspaceRepository
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.TeamId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import java.time.Instant
import java.util.UUID

/**
 * Integration tests for Resource Access control.
 * 
 * Tests resource ownership and team-based access control including:
 * - OWN scope: Access to owned resources only
 * - TEAM scope: Access to team resources (currently limited)
 * - ResourceIdRule: Direct access to specific resources
 * - ResourceGroupRule: Group-based resource access (not yet implemented)
 * - Strategy pattern for different resource types
 */
@DisplayName("Resource Access Integration Tests")
class ResourceAccessIntegrationTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var resourceAccessEvaluator: ResourceAccessEvaluator
    
    @Autowired
    private lateinit var workspaceRepository: WorkspaceRepository
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    @Autowired
    private lateinit var tenantRepository: TenantRepository
    
    @Autowired
    private lateinit var tenantMembershipRepository: TenantMembershipRepository
    
    @Autowired
    private lateinit var cacheEvictionService: CacheEvictionService
    
    @Autowired
    private lateinit var workspaceOwnershipStrategy: WorkspaceOwnershipStrategy
    
    @Autowired
    private lateinit var integrationTestSetup: IntegrationTestSetup
    
    // Test data references
    private lateinit var testTenant: Tenant
    private lateinit var ownerUser: User
    private lateinit var nonOwnerUser: User
    private lateinit var teamMemberUser: User
    private lateinit var ownerMembership: TenantMembership
    private lateinit var nonOwnerMembership: TenantMembership
    private lateinit var teamMemberMembership: TenantMembership
    private lateinit var ownedWorkspace: Workspace
    private lateinit var teamWorkspace: Workspace
    private lateinit var otherWorkspace: Workspace
    private lateinit var noOwnerWorkspace: Workspace
    
    @BeforeEach
    fun setupResourceAccessTestData() {
        // Clean up and clear caches
        cleanupDatabase()
        clearAllCaches()
        
        // Create tenant
        testTenant = createTenant(
            UUID.randomUUID(),
            "test-tenant",
            "Test Tenant"
        )
        
        // Create users
        ownerUser = createUser(
            UUID.randomUUID(),
            "auth0|owner",
            "owner@test.com"
        )
        nonOwnerUser = createUser(
            UUID.randomUUID(),
            "auth0|nonowner",
            "nonowner@test.com"
        )
        teamMemberUser = createUser(
            UUID.randomUUID(),
            "auth0|teammember",
            "teammember@test.com"
        )
        
        // Create tenant memberships
        ownerMembership = createTenantMembership(
            UUID.randomUUID(),
            ownerUser,
            testTenant
        )
        nonOwnerMembership = createTenantMembership(
            UUID.randomUUID(),
            nonOwnerUser,
            testTenant
        )
        teamMemberMembership = createTenantMembership(
            UUID.randomUUID(),
            teamMemberUser,
            testTenant
        )
        
        // Create workspaces with different ownership configurations
        ownedWorkspace = createWorkspace(
            UUID.randomUUID(),
            "Owned Workspace",
            testTenant.id.value,
            ownerUser.id.value,
            null // no team
        )
        
        teamWorkspace = createWorkspace(
            UUID.randomUUID(),
            "Team Workspace",
            testTenant.id.value,
            ownerUser.id.value,
            UUID.randomUUID() // has team
        )
        
        otherWorkspace = createWorkspace(
            UUID.randomUUID(),
            "Other User's Workspace",
            testTenant.id.value,
            nonOwnerUser.id.value,
            null
        )
        
        noOwnerWorkspace = createWorkspace(
            UUID.randomUUID(),
            "No Owner Workspace",
            testTenant.id.value,
            null, // no owner
            null
        )
    }
    
    private fun clearAllCaches() {
        cacheEvictionService.evictAllPermissionCaches()
    }
    
    // ==================== Resource Ownership Tests (OWN scope) ====================
    
    @Test
    @DisplayName("Should allow access to own workspace")
    fun `should allow access to own workspace`() {
        // When: Check if owner can access their workspace
        val hasAccess = resourceAccessEvaluator.evaluateAccess(
            ownerMembership.id.value,
            ownedWorkspace.id.value,
            ResourceType.WORKSPACE,
            Action.EDIT,
            Scope.OWN
        )
        
        // Then: Access should be granted
        assertThat(hasAccess).isTrue()
    }
    
    @Test
    @DisplayName("Should deny access to workspace owned by others")
    fun `should deny access to workspace owned by others`() {
        // When: Check if non-owner can access owner's workspace
        val hasAccess = resourceAccessEvaluator.evaluateAccess(
            nonOwnerMembership.id.value,
            ownedWorkspace.id.value,
            ResourceType.WORKSPACE,
            Action.EDIT,
            Scope.OWN
        )
        
        // Then: Access should be denied
        assertThat(hasAccess).isFalse()
    }
    
    @Test
    @DisplayName("Should check ownership through tenant membership conversion")
    fun `should check ownership through tenant membership conversion`() {
        // Given: Workspace owned by a user (stored as users.id)
        // The ownership strategy should convert it to tenant_users.id
        
        // When: Get the owner of the workspace
        val owner = resourceAccessEvaluator.getResourceOwner(
            ownedWorkspace.id.value,
            ResourceType.WORKSPACE
        )
        
        // Then: Owner should be the tenant membership ID, not the user ID
        assertThat(owner).isNotNull()
        assertThat(owner).isEqualTo(ownerMembership.id.value)
        assertThat(owner).isNotEqualTo(ownerUser.id.value)
    }
    
    @Test
    @DisplayName("Should handle workspace without owner")
    fun `should handle workspace without owner`() {
        // When: Check ownership of workspace without owner
        val owner = resourceAccessEvaluator.getResourceOwner(
            noOwnerWorkspace.id.value,
            ResourceType.WORKSPACE
        )
        
        // Then: Owner should be null
        assertThat(owner).isNull()
        
        // And: Access with OWN scope should be denied for everyone
        val hasAccess = resourceAccessEvaluator.evaluateAccess(
            ownerMembership.id.value,
            noOwnerWorkspace.id.value,
            ResourceType.WORKSPACE,
            Action.EDIT,
            Scope.OWN
        )
        assertThat(hasAccess).isFalse()
    }
    
    // ==================== Team Access Tests (TEAM scope) ====================
    
    @Test
    @DisplayName("Should evaluate team scope correctly (currently returns false)")
    fun `should evaluate team scope correctly`() {
        // Given: Current implementation of TeamMembershipService always returns false
        
        // When: Check team access
        val hasAccess = resourceAccessEvaluator.evaluateAccess(
            teamMemberMembership.id.value,
            teamWorkspace.id.value,
            ResourceType.WORKSPACE,
            Action.VIEW,
            Scope.TEAM
        )
        
        // Then: Should be false (TeamMembershipService not implemented)
        assertThat(hasAccess).isFalse()
    }
    
    @Test
    @DisplayName("Should handle workspace with explicit team assignment")
    fun `should handle workspace with explicit team assignment`() {
        // When: Get team of workspace with team
        val team = resourceAccessEvaluator.getResourceTeam(
            teamWorkspace.id.value,
            ResourceType.WORKSPACE
        )
        
        // Then: Team should be returned
        assertThat(team).isNotNull()
        assertThat(team).isEqualTo(teamWorkspace.teamId?.value)
    }
    
    @Test
    @DisplayName("Should use tenant as fallback team in MVP")
    fun `should use tenant as fallback team in MVP`() {
        // Given: Workspace without explicit team but with tenant
        
        // When: Get team of workspace without explicit team
        val team = resourceAccessEvaluator.getResourceTeam(
            ownedWorkspace.id.value,
            ResourceType.WORKSPACE
        )
        
        // Then: Should return tenant ID as fallback (MVP approach)
        assertThat(team).isNotNull()
        assertThat(team).isEqualTo(testTenant.id.value)
    }
    
    // ==================== Resource ID Rule Tests ====================
    
    @Test
    @DisplayName("Should handle direct resource ID permissions")
    fun `should handle direct resource ID permissions`() {
        // Given: RESOURCE_ID scope (direct resource access)
        
        // When: Evaluate access with RESOURCE_ID scope
        val hasAccess = resourceAccessEvaluator.evaluateAccess(
            ownerMembership.id.value,
            ownedWorkspace.id.value,
            ResourceType.WORKSPACE,
            Action.VIEW,
            Scope.RESOURCE_ID
        )
        
        // Then: Should return false (delegated to permission system)
        assertThat(hasAccess).isFalse()
    }
    
    @Test
    @DisplayName("Should check resource existence before granting access")
    fun `should check resource existence before granting access`() {
        // Given: Random non-existent workspace ID
        val nonExistentId = UUID.randomUUID()
        
        // When: Check if resource exists
        val exists = resourceAccessEvaluator.resourceExists(
            nonExistentId,
            ResourceType.WORKSPACE
        )
        
        // Then: Should return false
        assertThat(exists).isFalse()
    }
    
    // ==================== Resource Group Tests ====================
    
    @Test
    @DisplayName("Should return false for RESOURCE_GROUP scope (not implemented)")
    fun `should return false for RESOURCE_GROUP scope`() {
        // Given: RESOURCE_GROUP scope (not yet implemented)
        
        // When: Evaluate access with RESOURCE_GROUP scope
        val hasAccess = resourceAccessEvaluator.evaluateAccess(
            ownerMembership.id.value,
            ownedWorkspace.id.value,
            ResourceType.WORKSPACE,
            Action.VIEW,
            Scope.RESOURCE_GROUP
        )
        
        // Then: Should return false (not implemented)
        assertThat(hasAccess).isFalse()
    }
    
    // ==================== Strategy Pattern Tests ====================
    
    @Test
    @DisplayName("Should use correct strategy for workspace resources")
    fun `should use correct strategy for workspace resources`() {
        // When: Get owner using workspace strategy
        val owner = workspaceOwnershipStrategy.getOwner(ownedWorkspace.id.value)
        
        // Then: Should return the correct owner (tenant membership ID)
        assertThat(owner).isNotNull()
        assertThat(owner).isEqualTo(ownerMembership.id.value)
    }
    
    @Test
    @DisplayName("Should handle table resources with table strategy")
    fun `should handle table resources with table strategy`() {
        // Given: Table resource type (strategy returns null as it's not implemented)
        
        // When: Get owner of a table resource
        val tableId = UUID.randomUUID()
        val owner = resourceAccessEvaluator.getResourceOwner(
            tableId,
            ResourceType.TABLE
        )
        
        // Then: Should return null (TableOwnershipStrategy not implemented)
        assertThat(owner).isNull()
    }
    
    @Test
    @DisplayName("Should grant access with ALL scope regardless of ownership")
    fun `should grant access with ALL scope regardless of ownership`() {
        // When: Evaluate access with ALL scope for non-owned resource
        val hasAccess = resourceAccessEvaluator.evaluateAccess(
            nonOwnerMembership.id.value,
            ownedWorkspace.id.value,
            ResourceType.WORKSPACE,
            Action.VIEW,
            Scope.ALL
        )
        
        // Then: Should be granted (ALL scope grants universal access)
        assertThat(hasAccess).isTrue()
    }
    
    // ==================== Error Handling Tests ====================
    
    @Test
    @DisplayName("Should handle missing resource gracefully")
    fun `should handle missing resource gracefully`() {
        // Given: Non-existent workspace
        val nonExistentId = UUID.randomUUID()
        
        // When: Try to get owner of non-existent resource
        val owner = resourceAccessEvaluator.getResourceOwner(
            nonExistentId,
            ResourceType.WORKSPACE
        )
        
        // Then: Should return null (resource doesn't exist)
        assertThat(owner).isNull()
    }
    
    @Test
    @DisplayName("Should verify workspace existence correctly")
    fun `should verify workspace existence correctly`() {
        // When: Check existing workspace
        val existsValid = resourceAccessEvaluator.resourceExists(
            ownedWorkspace.id.value,
            ResourceType.WORKSPACE
        )
        
        // Then: Should return true
        assertThat(existsValid).isTrue()
        
        // When: Check non-existent workspace
        val existsInvalid = resourceAccessEvaluator.resourceExists(
            UUID.randomUUID(),
            ResourceType.WORKSPACE
        )
        
        // Then: Should return false
        assertThat(existsInvalid).isFalse()
    }
    
    // ==================== Helper Methods ====================
    
    private fun createTenant(id: UUID, slug: String, name: String): Tenant {
        val tenant = Tenant(
            id = TenantId(id),
            slug = slug,
            name = name,
            auth0OrgId = "org_${slug}",
            isActive = true,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        return tenantRepository.save(tenant)
    }
    
    private fun createUser(id: UUID, auth0Sub: String, email: String): User {
        val user = User(
            id = UserId(id),
            auth0Sub = auth0Sub,
            email = email,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        return userRepository.save(user)
    }
    
    private fun createTenantMembership(id: UUID, user: User, tenant: Tenant): TenantMembership {
        val membership = TenantMembership(
            id = TenantMembershipId(id),
            userId = user.id,
            tenantId = tenant.id,
            isActive = true,
            joinedAt = Instant.now(),
            lastAccessedAt = Instant.now()
        )
        return tenantMembershipRepository.save(membership)
    }
    
    private fun createWorkspace(
        id: UUID,
        name: String,
        tenantId: UUID,
        createdBy: UUID?,
        teamId: UUID?
    ): Workspace {
        val workspace = Workspace(
            id = WorkspaceId(id),
            tenantId = TenantId(tenantId),
            name = name,
            createdBy = createdBy?.let { UserId(it) },
            teamId = teamId?.let { TeamId(it) },
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        
        return workspaceRepository.save(workspace)
    }
}