package com.astarworks.astarmanagement.integration.api.user

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.user.domain.repository.UserProfileRepository
import com.astarworks.astarmanagement.core.user.domain.service.UserProfileService
import com.astarworks.astarmanagement.core.user.domain.service.UserService
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import com.astarworks.astarmanagement.shared.domain.value.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Disabled
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.jdbc.Sql
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.result.MockMvcResultHandlers.*
import org.hamcrest.Matchers.*
import java.time.Instant
import java.util.*

/**
 * Integration tests for UserController.
 * 
 * Tests the user management API endpoints including:
 * - Current user information retrieval
 * - User profile management
 * - User search and listing
 * - Tenant membership handling
 * - Profile updates (display name, avatar)
 * 
 * Follows established patterns:
 * - 3-phase setup
 * - JWT authentication
 * - @Nested test organization
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("User Controller Integration Tests")
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class UserControllerIntegrationTest : IntegrationTestBase() {
    
    @Autowired
    private lateinit var json: Json
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    @Autowired
    private lateinit var userProfileRepository: UserProfileRepository
    
    @Autowired
    private lateinit var tenantRepository: TenantRepository
    
    @Autowired
    private lateinit var tenantMembershipRepository: TenantMembershipRepository
    
    @Autowired
    private lateinit var dynamicRoleRepository: DynamicRoleRepository
    
    @Autowired
    private lateinit var rolePermissionService: RolePermissionService
    
    @Autowired
    private lateinit var userRoleService: UserRoleService
    
    @Autowired
    private lateinit var userService: UserService
    
    @Autowired
    private lateinit var userProfileService: UserProfileService
    
    // Test data
    private lateinit var tenantA: Tenant
    private lateinit var tenantB: Tenant
    private lateinit var userWithProfile: User
    private lateinit var userWithoutProfile: User
    private lateinit var adminUser: User
    private lateinit var userProfile: UserProfile
    private lateinit var adminRole: DynamicRole
    private lateinit var viewerRole: DynamicRole
    private lateinit var membershipA1: TenantMembership
    private lateinit var membershipA2: TenantMembership
    private lateinit var membershipB1: TenantMembership
    private lateinit var adminMembership: TenantMembership
    private lateinit var userJwt: String
    private lateinit var noProfileJwt: String
    private lateinit var adminJwt: String
    
    @BeforeEach
    fun setUp() {
        // Step 1: Clean up database (handled by @Sql annotation)
        
        // Step 2: Clear caches (if needed)
        // No specific caches for user controller
        
        // Step 3: Setup test scenario
        setupUserTestScenario()
    }
    
    private fun setupUserTestScenario() {
        // Create tenants
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
        
        tenantB = tenantRepository.save(
            Tenant(
                id = TenantId(IntegrationTestSetup.Companion.TestIds.TENANT_B),
                slug = "tenant-b",
                name = "Tenant B",
                auth0OrgId = "org_tenantB",
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create users
        userWithProfile = userRepository.save(
            User(
                id = UserId(IntegrationTestSetup.Companion.TestIds.REGULAR_USER),
                auth0Sub = "auth0|user-with-profile",
                email = "profile@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        userWithoutProfile = userRepository.save(
            User(
                id = UserId(UUID.randomUUID()),
                auth0Sub = "auth0|user-without-profile",
                email = "noprofile@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        adminUser = userRepository.save(
            User(
                id = UserId(IntegrationTestSetup.Companion.TestIds.ADMIN_USER),
                auth0Sub = "auth0|admin",
                email = "admin@test.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create user profile
        userProfile = userProfileRepository.save(
            UserProfile(
                id = UserProfileId(UUID.randomUUID()),
                userId = userWithProfile.id,
                displayName = "John Doe",
                avatarUrl = "https://example.com/avatar.jpg",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create roles
        adminRole = dynamicRoleRepository.save(
            DynamicRole(
                id = RoleId(IntegrationTestSetup.Companion.TestIds.ADMIN_ROLE_A),
                tenantId = tenantA.id,
                name = "admin",
                displayName = "Administrator",
                color = "#FF0000",
                position = 100,
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
        
        // Add permissions
        rolePermissionService.grantPermission(
            adminRole.id,
            PermissionRule.GeneralRule(ResourceType.USER, Action.MANAGE, Scope.ALL)
        )
        rolePermissionService.grantPermission(
            adminRole.id,
            PermissionRule.GeneralRule(ResourceType.USER, Action.VIEW, Scope.ALL)
        )
        
        rolePermissionService.grantPermission(
            viewerRole.id,
            PermissionRule.GeneralRule(ResourceType.USER, Action.VIEW, Scope.OWN)
        )
        
        // Create tenant memberships
        // User with profile belongs to both tenants
        membershipA1 = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A1),
                tenantId = tenantA.id,
                userId = userWithProfile.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
        )
        
        membershipB1 = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(UUID.randomUUID()),
                tenantId = tenantB.id,
                userId = userWithProfile.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
        )
        
        // User without profile belongs to tenant A
        membershipA2 = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A2),
                tenantId = tenantA.id,
                userId = userWithoutProfile.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
        )
        
        // Admin belongs to tenant A
        adminMembership = tenantMembershipRepository.save(
            TenantMembership(
                id = TenantMembershipId(IntegrationTestSetup.Companion.TestIds.TENANT_MEMBERSHIP_A3),
                tenantId = tenantA.id,
                userId = adminUser.id,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
        )
        
        // Assign roles
        userRoleService.assignRole(membershipA1.id.value, viewerRole.id.value)
        userRoleService.assignRole(membershipA2.id.value, viewerRole.id.value)
        userRoleService.assignRole(adminMembership.id.value, adminRole.id.value)
        
        // Generate JWTs
        userJwt = JwtTestFixture.createValidJwt(
            subject = userWithProfile.auth0Sub,
            orgId = tenantA.auth0OrgId!!,
            email = userWithProfile.email
        )
        
        noProfileJwt = JwtTestFixture.createValidJwt(
            subject = userWithoutProfile.auth0Sub,
            orgId = tenantA.auth0OrgId!!,
            email = userWithoutProfile.email
        )
        
        adminJwt = JwtTestFixture.createValidJwt(
            subject = adminUser.auth0Sub,
            orgId = tenantA.auth0OrgId!!,
            email = adminUser.email
        )
    }
    
    @Nested
    @DisplayName("Current User")
    inner class CurrentUserTests {
        
        @Test
        @DisplayName("Should get current user with profile")
        fun `should get current user with profile`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/users/me")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.user.id").value(userWithProfile.id.value.toString()))
                .andExpect(jsonPath("$.user.email").value("profile@test.com"))
                .andExpect(jsonPath("$.user.profile.displayName").value("John Doe"))
                .andExpect(jsonPath("$.user.profile.avatarUrl").value("https://example.com/avatar.jpg"))
                .andExpect(jsonPath("$.currentTenantId").value(tenantA.id.value.toString()))
                .andExpect(jsonPath("$.user.tenantCount").value(2)) // Belongs to 2 tenants
        }
        
        @Test
        @DisplayName("Should get current user without profile")
        fun `should get current user without profile`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/users/me")
                    .header("Authorization", "Bearer $noProfileJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.user.id").value(userWithoutProfile.id.value.toString()))
                .andExpect(jsonPath("$.user.email").value("noprofile@test.com"))
                .andExpect(jsonPath("$.user.profile").doesNotExist()) // No profile
                .andExpect(jsonPath("$.currentTenantId").value(tenantA.id.value.toString()))
                .andExpect(jsonPath("$.user.tenantCount").value(1))
        }
        
        @Test
        @DisplayName("Should require authentication")
        fun `should require authentication`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/users/me")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Profile Management")
    inner class ProfileManagementTests {
        
        @Test
        @DisplayName("Should update user profile")
        fun `should update user profile`() {
            // Given
            val updateRequest = mapOf(
                "displayName" to "Jane Smith",
                "avatarUrl" to "https://example.com/new-avatar.jpg"
            )
            
            // When & Then
            mockMvc.perform(
                put("/api/v1/users/me/profile")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.displayName").value("Jane Smith"))
                .andExpect(jsonPath("$.avatarUrl").value("https://example.com/new-avatar.jpg"))
        }
        
        @Test
        @DisplayName("Should create profile for user without one")
        fun `should create profile for user without one`() {
            // Given
            val createRequest = mapOf(
                "displayName" to "New User",
                "avatarUrl" to "https://example.com/new-user.jpg"
            )
            
            // When & Then
            mockMvc.perform(
                put("/api/v1/users/me/profile")
                    .header("Authorization", "Bearer $noProfileJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(createRequest))
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.displayName").value("New User"))
                .andExpect(jsonPath("$.avatarUrl").value("https://example.com/new-user.jpg"))
        }
        
        @Test
        @DisplayName("Should allow partial profile updates")
        fun `should allow partial profile updates`() {
            // Given - Update only display name
            val updateRequest = mapOf(
                "displayName" to "Updated Name"
            )
            
            // When & Then
            mockMvc.perform(
                put("/api/v1/users/me/profile")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.displayName").value("Updated Name"))
                .andExpect(jsonPath("$.avatarUrl").doesNotExist()) // API returns null for unchanged fields in partial updates
        }
        
        @Test
        @DisplayName("Should validate display name length")
        fun `should validate display name length`() {
            // Given - Display name too long
            val updateRequest = mapOf(
                "displayName" to "A".repeat(256) // Exceeds 255 char limit
            )
            
            // When & Then
            mockMvc.perform(
                put("/api/v1/users/me/profile")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(updateRequest))
            )
                .andExpect(status().isBadRequest)
        }
    }
    
    @Nested
    @DisplayName("User Search")
    @Disabled("Phase 2 - Not implemented yet")
    inner class UserSearchTests {
        
        @Test
        @DisplayName("Admin should search users by email")
        fun `admin should search users by email`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/users/search")
                    .param("email", "profile")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$").isArray)
                .andExpect(jsonPath("$[0].email").value("profile@test.com"))
                .andExpect(jsonPath("$[0].displayName").value("John Doe"))
        }
        
        @Test
        @DisplayName("Admin should search users by display name")
        fun `admin should search users by display name`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/users/search")
                    .param("displayName", "John")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$").isArray)
                .andExpect(jsonPath("$[0].displayName").value("John Doe"))
        }
        
        @Test
        @DisplayName("Regular user should be denied user search")
        fun `regular user should be denied user search`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/users/search")
                    .param("email", "test")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("User Retrieval")
    inner class UserRetrievalTests {
        
        @Test
        @DisplayName("Admin should get user by ID")
        fun `admin should get user by ID`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/users/${userWithProfile.id.value}")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.id").value(userWithProfile.id.value.toString()))
                .andExpect(jsonPath("$.email").value("profile@test.com"))
                .andExpect(jsonPath("$.profile.displayName").value("John Doe"))
        }
        
        @Test
        @DisplayName("Should return 404 for non-existent user")
        fun `should return 404 for non-existent user`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/users/${UUID.randomUUID()}")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isNotFound)
        }
        
        @Test
        @DisplayName("Regular user can only get own information")
        fun `regular user can only get own information`() {
            // Can get own ID
            mockMvc.perform(
                get("/api/v1/users/${userWithProfile.id.value}")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
            
            // Cannot get other user's information
            mockMvc.perform(
                get("/api/v1/users/${adminUser.id.value}")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Tenant Membership")
    @Disabled("Phase 2 - Not implemented yet")
    inner class TenantMembershipTests {
        
        @Test
        @DisplayName("Should list user's tenant memberships")
        fun `should list user tenant memberships`() {
            // When & Then
            mockMvc.perform(
                get("/api/v1/users/me/tenants")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$").isArray)
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.tenantId == '${tenantA.id.value}')]").exists())
                .andExpect(jsonPath("$[?(@.tenantId == '${tenantB.id.value}')]").exists())
        }
        
        @Test
        @DisplayName("Should switch current tenant")
        fun `should switch current tenant`() {
            // Switch to tenant B
            val switchRequest = mapOf(
                "tenantId" to tenantB.id.value.toString()
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/users/me/switch-tenant")
                    .header("Authorization", "Bearer $userJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(switchRequest))
            )
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.currentTenantId").value(tenantB.id.value.toString()))
        }
        
        @Test
        @DisplayName("Should reject switch to non-member tenant")
        fun `should reject switch to non-member tenant`() {
            // Try to switch admin (who only belongs to tenant A) to tenant B
            val switchRequest = mapOf(
                "tenantId" to tenantB.id.value.toString()
            )
            
            // When & Then
            mockMvc.perform(
                post("/api/v1/users/me/switch-tenant")
                    .header("Authorization", "Bearer $adminJwt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.encodeToString(switchRequest))
            )
                .andExpect(status().isForbidden)
        }
    }
}