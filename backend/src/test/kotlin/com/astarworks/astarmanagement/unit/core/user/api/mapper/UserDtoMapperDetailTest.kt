package com.astarworks.astarmanagement.unit.core.user.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.user.api.mapper.UserDtoMapper
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserProfileId
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

/**
 * Unit tests for UserDtoMapper detail response conversion functionality.
 * Tests transformations that combine User and UserProfile with additional metadata.
 */
@UnitTest
@DisplayName("UserDtoMapper Detail Tests")
class UserDtoMapperDetailTest {
    
    private lateinit var mapper: UserDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = UserDtoMapper()
    }
    
    @Nested
    @DisplayName("User to UserDetailResponse Conversion")
    inner class UserToDetailResponseConversion {
        
        @Test
        @DisplayName("Should convert User to UserDetailResponse with full profile")
        fun `should convert user to detail response with full profile`() {
            // Given
            val userId = UUID.randomUUID()
            val user = createTestUser(id = userId)
            val profile = createTestProfile(userId = userId)
            val tenantCount = 3
            val roleCount = 5
            
            // When
            val response = mapper.toDetailResponse(
                user = user,
                profile = profile,
                tenantCount = tenantCount,
                roleCount = roleCount
            )
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.id).isEqualTo(user.id.value)
            assertThat(response.auth0Sub).isEqualTo(user.auth0Sub)
            assertThat(response.email).isEqualTo(user.email)
            assertThat(response.createdAt).isEqualTo(user.createdAt)
            assertThat(response.updatedAt).isEqualTo(user.updatedAt)
            
            // Profile assertions
            assertThat(response.profile).isNotNull
            assertThat(response.profile?.id).isEqualTo(profile.id.value)
            assertThat(response.profile?.userId).isEqualTo(profile.userId.value)
            assertThat(response.profile?.displayName).isEqualTo(profile.displayName)
            assertThat(response.profile?.avatarUrl).isEqualTo(profile.avatarUrl)
            
            // Count assertions
            assertThat(response.tenantCount).isEqualTo(tenantCount)
            assertThat(response.roleCount).isEqualTo(roleCount)
        }
        
        @Test
        @DisplayName("Should handle null profile in detail response")
        fun `should handle null profile in detail response`() {
            // Given
            val user = createTestUser()
            
            // When
            val response = mapper.toDetailResponse(
                user = user,
                profile = null,
                tenantCount = 1,
                roleCount = 2
            )
            
            // Then
            assertThat(response.profile).isNull()
            assertThat(response.tenantCount).isEqualTo(1)
            assertThat(response.roleCount).isEqualTo(2)
        }
        
        @Test
        @DisplayName("Should handle null counts in detail response")
        fun `should handle null counts in detail response`() {
            // Given
            val user = createTestUser()
            val profile = createTestProfile()
            
            // When
            val response = mapper.toDetailResponse(
                user = user,
                profile = profile,
                tenantCount = null,
                roleCount = null
            )
            
            // Then
            assertThat(response.profile).isNotNull
            assertThat(response.tenantCount).isNull()
            assertThat(response.roleCount).isNull()
        }
        
        @Test
        @DisplayName("Should handle all optional fields as null")
        fun `should handle all optional fields as null`() {
            // Given
            val user = createTestUser()
            
            // When
            val response = mapper.toDetailResponse(
                user = user,
                profile = null,
                tenantCount = null,
                roleCount = null
            )
            
            // Then
            assertThat(response.profile).isNull()
            assertThat(response.tenantCount).isNull()
            assertThat(response.roleCount).isNull()
            // Required fields should still be present
            assertThat(response.id).isEqualTo(user.id.value)
            assertThat(response.email).isNotNull
        }
        
        @Test
        @DisplayName("Should handle zero counts")
        fun `should handle zero counts`() {
            // Given
            val user = createTestUser()
            
            // When
            val response = mapper.toDetailResponse(
                user = user,
                profile = null,
                tenantCount = 0,
                roleCount = 0
            )
            
            // Then
            assertThat(response.tenantCount).isEqualTo(0)
            assertThat(response.roleCount).isEqualTo(0)
        }
        
        @Test
        @DisplayName("Should handle large count values")
        fun `should handle large count values`() {
            // Given
            val user = createTestUser()
            val largeCount = Int.MAX_VALUE
            
            // When
            val response = mapper.toDetailResponse(
                user = user,
                profile = null,
                tenantCount = largeCount,
                roleCount = largeCount
            )
            
            // Then
            assertThat(response.tenantCount).isEqualTo(largeCount)
            assertThat(response.roleCount).isEqualTo(largeCount)
        }
        
        @Test
        @DisplayName("Should correctly map profile with nullable fields")
        fun `should correctly map profile with nullable fields`() {
            // Given
            val userId = UUID.randomUUID()
            val user = createTestUser(id = userId)
            val profile = UserProfile(
                id = UserProfileId(UUID.randomUUID()),
                userId = UserId(userId),
                displayName = null,
                avatarUrl = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val response = mapper.toDetailResponse(user, profile, 1, 1)
            
            // Then
            assertThat(response.profile).isNotNull
            assertThat(response.profile?.displayName).isNull()
            assertThat(response.profile?.avatarUrl).isNull()
            assertThat(response.profile?.userId).isEqualTo(userId)
        }
        
        @Test
        @DisplayName("Should preserve timestamp precision in detail response")
        fun `should preserve timestamp precision in detail response`() {
            // Given
            val preciseTimestamp = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val user = createTestUser(
                createdAt = preciseTimestamp,
                updatedAt = preciseTimestamp
            )
            val profile = createTestProfile(
                createdAt = preciseTimestamp,
                updatedAt = preciseTimestamp
            )
            
            // When
            val response = mapper.toDetailResponse(user, profile)
            
            // Then
            assertThat(response.createdAt).isEqualTo(preciseTimestamp)
            assertThat(response.updatedAt).isEqualTo(preciseTimestamp)
            assertThat(response.profile?.createdAt).isEqualTo(preciseTimestamp)
            assertThat(response.profile?.updatedAt).isEqualTo(preciseTimestamp)
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