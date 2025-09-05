package com.astarworks.astarmanagement.unit.core.user.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.user.api.mapper.UserDtoMapper
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserProfileId
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

/**
 * Unit tests for UserDtoMapper current user response conversion functionality.
 * Tests transformations that combine user information with authentication context.
 */
@UnitTest
@DisplayName("UserDtoMapper CurrentUser Tests")
class UserDtoMapperCurrentUserTest {
    
    private lateinit var mapper: UserDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = UserDtoMapper()
    }
    
    @Nested
    @DisplayName("Current User Response Conversion")
    inner class CurrentUserResponseConversion {
        
        @Test
        @DisplayName("Should convert to CurrentUserResponse with all context")
        fun `should convert to current user response with all context`() {
            // Given
            val userId = UUID.randomUUID()
            val user = createTestUser(id = userId)
            val profile = createTestProfile(userId = userId)
            val currentTenantId = UUID.randomUUID()
            val permissions = listOf(
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    scope = Scope.ALL
                ),
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.DOCUMENT,
                    action = Action.EDIT,
                    scope = Scope.OWN
                )
            )
            val tenantCount = 3
            val roleCount = 5
            
            // When
            val response = mapper.toCurrentUserResponse(
                user = user,
                profile = profile,
                currentTenantId = currentTenantId,
                permissions = permissions,
                tenantCount = tenantCount,
                roleCount = roleCount
            )
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.currentTenantId).isEqualTo(currentTenantId)
            assertThat(response.permissions).isEqualTo(permissions)
            
            // Verify user details
            assertThat(response.user.id).isEqualTo(user.id.value)
            assertThat(response.user.auth0Sub).isEqualTo(user.auth0Sub)
            assertThat(response.user.email).isEqualTo(user.email)
            assertThat(response.user.profile).isNotNull
            assertThat(response.user.tenantCount).isEqualTo(tenantCount)
            assertThat(response.user.roleCount).isEqualTo(roleCount)
        }
        
        @Test
        @DisplayName("Should handle null profile in current user response")
        fun `should handle null profile in current user response`() {
            // Given
            val user = createTestUser()
            val currentTenantId = UUID.randomUUID()
            
            // When
            val response = mapper.toCurrentUserResponse(
                user = user,
                profile = null,
                currentTenantId = currentTenantId
            )
            
            // Then
            assertThat(response.user.profile).isNull()
            assertThat(response.currentTenantId).isEqualTo(currentTenantId)
        }
        
        @Test
        @DisplayName("Should handle null tenant ID in current user response")
        fun `should handle null tenant id in current user response`() {
            // Given
            val user = createTestUser()
            val profile = createTestProfile()
            
            // When
            val response = mapper.toCurrentUserResponse(
                user = user,
                profile = profile,
                currentTenantId = null
            )
            
            // Then
            assertThat(response.currentTenantId).isNull()
            assertThat(response.user.profile).isNotNull
        }
        
        @Test
        @DisplayName("Should handle null permissions in current user response")
        fun `should handle null permissions in current user response`() {
            // Given
            val user = createTestUser()
            
            // When
            val response = mapper.toCurrentUserResponse(
                user = user,
                permissions = null
            )
            
            // Then
            assertThat(response.permissions).isNull()
        }
        
        @Test
        @DisplayName("Should handle empty permissions list")
        fun `should handle empty permissions list`() {
            // Given
            val user = createTestUser()
            val emptyPermissions = emptyList<PermissionRule>()
            
            // When
            val response = mapper.toCurrentUserResponse(
                user = user,
                permissions = emptyPermissions
            )
            
            // Then
            assertThat(response.permissions).isEmpty()
        }
        
        @Test
        @DisplayName("Should handle all optional fields as null")
        fun `should handle all optional fields as null`() {
            // Given
            val user = createTestUser()
            
            // When
            val response = mapper.toCurrentUserResponse(
                user = user,
                profile = null,
                currentTenantId = null,
                permissions = null,
                tenantCount = null,
                roleCount = null
            )
            
            // Then
            assertThat(response.user.profile).isNull()
            assertThat(response.currentTenantId).isNull()
            assertThat(response.permissions).isNull()
            assertThat(response.user.tenantCount).isNull()
            assertThat(response.user.roleCount).isNull()
            // Required fields should still be present
            assertThat(response.user.id).isEqualTo(user.id.value)
            assertThat(response.user.email).isNotNull
        }
        
        @Test
        @DisplayName("Should handle complex permission rules")
        fun `should handle complex permission rules`() {
            // Given
            val user = createTestUser()
            val resourceGroupId = UUID.randomUUID()
            val tableResourceId = UUID.randomUUID()
            val recordResourceId = UUID.randomUUID()
            
            val complexPermissions = listOf(
                // General rule
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.CREATE,
                    scope = Scope.ALL
                ),
                // Resource group rule
                PermissionRule.ResourceGroupRule(
                    resourceType = ResourceType.DOCUMENT,
                    action = Action.EDIT,
                    groupId = resourceGroupId
                ),
                // Resource ID rule (for Table)
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.DELETE,
                    resourceId = tableResourceId
                ),
                // Resource ID rule (for Record)
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.RECORD,
                    action = Action.VIEW,
                    resourceId = recordResourceId
                )
            )
            
            // When
            val response = mapper.toCurrentUserResponse(
                user = user,
                permissions = complexPermissions
            )
            
            // Then
            assertThat(response.permissions).hasSize(4)
            assertThat(response.permissions).containsExactlyElementsOf(complexPermissions)
            
            // Verify specific permission types
            val generalRule = response.permissions?.filterIsInstance<PermissionRule.GeneralRule>()?.first()
            assertThat(generalRule?.resourceType).isEqualTo(ResourceType.TABLE)
            assertThat(generalRule?.action).isEqualTo(Action.CREATE)
            assertThat(generalRule?.scope).isEqualTo(Scope.ALL)
            
            val resourceGroupRule = response.permissions?.filterIsInstance<PermissionRule.ResourceGroupRule>()?.first()
            assertThat(resourceGroupRule?.groupId).isEqualTo(resourceGroupId)
            
            val resourceIdRules = response.permissions?.filterIsInstance<PermissionRule.ResourceIdRule>()
            val tableRule = resourceIdRules?.find { it.resourceType == ResourceType.TABLE }
            assertThat(tableRule?.resourceId).isEqualTo(tableResourceId)
            
            val recordRule = resourceIdRules?.find { it.resourceType == ResourceType.RECORD }
            assertThat(recordRule?.resourceId).isEqualTo(recordResourceId)
        }
        
        @Test
        @DisplayName("Should preserve exact values in nested UserDetailResponse")
        fun `should preserve exact values in nested user detail response`() {
            // Given
            val userId = UUID.randomUUID()
            val profileId = UUID.randomUUID()
            val preciseTimestamp = Instant.parse("2024-01-15T10:30:45.123456789Z")
            
            val user = User(
                id = UserId(userId),
                auth0Sub = "auth0|precise123",
                email = "precise@example.com",
                createdAt = preciseTimestamp,
                updatedAt = preciseTimestamp
            )
            
            val profile = UserProfile(
                id = UserProfileId(profileId),
                userId = UserId(userId),
                displayName = "Precise User",
                avatarUrl = "https://example.com/precise.jpg",
                createdAt = preciseTimestamp,
                updatedAt = preciseTimestamp
            )
            
            val currentTenantId = UUID.randomUUID()
            
            // When
            val response = mapper.toCurrentUserResponse(
                user = user,
                profile = profile,
                currentTenantId = currentTenantId,
                tenantCount = 42,
                roleCount = 7
            )
            
            // Then
            // Check nested user detail
            assertThat(response.user.id).isEqualTo(userId)
            assertThat(response.user.auth0Sub).isEqualTo("auth0|precise123")
            assertThat(response.user.email).isEqualTo("precise@example.com")
            assertThat(response.user.createdAt).isEqualTo(preciseTimestamp)
            assertThat(response.user.updatedAt).isEqualTo(preciseTimestamp)
            assertThat(response.user.tenantCount).isEqualTo(42)
            assertThat(response.user.roleCount).isEqualTo(7)
            
            // Check nested profile
            assertThat(response.user.profile).isNotNull
            assertThat(response.user.profile?.id).isEqualTo(profileId)
            assertThat(response.user.profile?.userId).isEqualTo(userId)
            assertThat(response.user.profile?.displayName).isEqualTo("Precise User")
            assertThat(response.user.profile?.avatarUrl).isEqualTo("https://example.com/precise.jpg")
            assertThat(response.user.profile?.createdAt).isEqualTo(preciseTimestamp)
            assertThat(response.user.profile?.updatedAt).isEqualTo(preciseTimestamp)
            
            // Check top-level fields
            assertThat(response.currentTenantId).isEqualTo(currentTenantId)
        }
        
        @Test
        @DisplayName("Should handle large permission lists efficiently")
        fun `should handle large permission lists efficiently`() {
            // Given
            val user = createTestUser()
            val largePermissionsList = (1..100).map { index ->
                when (index % 3) {
                    0 -> PermissionRule.GeneralRule(
                        resourceType = ResourceType.TABLE,
                        action = Action.values()[index % Action.values().size],
                        scope = Scope.ALL
                    )
                    1 -> PermissionRule.ResourceGroupRule(
                        resourceType = ResourceType.DOCUMENT,
                        action = Action.values()[index % Action.values().size],
                        groupId = UUID.randomUUID()
                    )
                    else -> PermissionRule.ResourceIdRule(
                        resourceType = ResourceType.TABLE,
                        action = Action.values()[index % Action.values().size],
                        resourceId = UUID.randomUUID()
                    )
                }
            }
            
            // When
            val response = mapper.toCurrentUserResponse(
                user = user,
                permissions = largePermissionsList
            )
            
            // Then
            assertThat(response.permissions).hasSize(100)
            assertThat(response.permissions).containsExactlyElementsOf(largePermissionsList)
        }
    }
    
    // Helper methods
    
    private fun createTestUser(
        id: UUID = UUID.randomUUID(),
        auth0Sub: String = "auth0|test123",
        email: String = "test@example.com",
        createdAt: Instant = Instant.now().minusSeconds(3600),
        updatedAt: Instant = Instant.now()
    ): User {
        return User(
            id = UserId(id),
            auth0Sub = auth0Sub,
            email = email,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    private fun createTestProfile(
        id: UUID = UUID.randomUUID(),
        userId: UUID = UUID.randomUUID(),
        displayName: String? = "Test User",
        avatarUrl: String? = "https://example.com/avatar.jpg",
        createdAt: Instant = Instant.now().minusSeconds(3600),
        updatedAt: Instant = Instant.now()
    ): UserProfile {
        return UserProfile(
            id = UserProfileId(id),
            userId = UserId(userId),
            displayName = displayName,
            avatarUrl = avatarUrl,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}