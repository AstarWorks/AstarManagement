package com.astarworks.astarmanagement.unit.core.user.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.user.api.mapper.UserDtoMapper
import com.astarworks.astarmanagement.core.user.api.dto.UserProfileCreateRequest
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

/**
 * Unit tests for UserDtoMapper list operations and edge cases.
 * Tests batch transformations and validation scenarios.
 */
@UnitTest
@DisplayName("UserDtoMapper List Tests")
class UserDtoMapperListTest {
    
    private lateinit var mapper: UserDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = UserDtoMapper()
    }
    
    @Nested
    @DisplayName("Batch User Conversion")
    inner class BatchUserConversion {
        
        @Test
        @DisplayName("Should convert heterogeneous user list")
        fun `should convert heterogeneous user list`() {
            // Given
            val diverseUsers = listOf(
                createTestUser(
                    auth0Sub = "auth0|standard",
                    email = "standard@example.com"
                ),
                createTestUser(
                    auth0Sub = "google-oauth2|123456",
                    email = "google@gmail.com"
                ),
                createTestUser(
                    auth0Sub = "github|789012",
                    email = "developer@github.com"
                ),
                createTestUser(
                    auth0Sub = "email|abcdef",
                    email = "passwordless@example.com"
                )
            )
            
            // When
            val responses = mapper.toResponseList(diverseUsers)
            
            // Then
            assertThat(responses).hasSize(4)
            assertThat(responses.map { it.auth0Sub }).containsExactly(
                "auth0|standard",
                "google-oauth2|123456",
                "github|789012",
                "email|abcdef"
            )
            assertThat(responses.map { it.email }).containsExactly(
                "standard@example.com",
                "google@gmail.com",
                "developer@github.com",
                "passwordless@example.com"
            )
        }
        
        @Test
        @DisplayName("Should handle users with identical timestamps")
        fun `should handle users with identical timestamps`() {
            // Given
            val sharedTimestamp = Instant.now()
            val users = (1..5).map { index ->
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|user$index",
                    email = "user$index@example.com",
                    createdAt = sharedTimestamp,
                    updatedAt = sharedTimestamp
                )
            }
            
            // When
            val responses = mapper.toResponseList(users)
            
            // Then
            assertThat(responses).hasSize(5)
            assertThat(responses.all { it.createdAt == sharedTimestamp }).isTrue
            assertThat(responses.all { it.updatedAt == sharedTimestamp }).isTrue
        }
        
        @Test
        @DisplayName("Should maintain distinct IDs for all users")
        fun `should maintain distinct ids for all users`() {
            // Given
            val users = (1..100).map {
                createTestUser()
            }
            
            // When
            val responses = mapper.toResponseList(users)
            
            // Then
            val uniqueIds = responses.map { it.id }.toSet()
            assertThat(uniqueIds).hasSize(100)
        }
        
        @Test
        @DisplayName("Should handle users with special characters in email")
        fun `should handle users with special characters in email`() {
            // Given
            val specialEmailUsers = listOf(
                createTestUser(email = "user+tag@example.com"),
                createTestUser(email = "first.last@example.co.uk"),
                createTestUser(email = "user@subdomain.example.com"),
                createTestUser(email = "user_name@example-domain.com"),
                createTestUser(email = "123456@numeric.com")
            )
            
            // When
            val responses = mapper.toResponseList(specialEmailUsers)
            
            // Then
            assertThat(responses).hasSize(5)
            assertThat(responses[0].email).isEqualTo("user+tag@example.com")
            assertThat(responses[1].email).isEqualTo("first.last@example.co.uk")
            assertThat(responses[2].email).isEqualTo("user@subdomain.example.com")
            assertThat(responses[3].email).isEqualTo("user_name@example-domain.com")
            assertThat(responses[4].email).isEqualTo("123456@numeric.com")
        }
    }
    
    @Nested
    @DisplayName("Profile Create Request Processing")
    inner class ProfileCreateRequestProcessing {
        
        @Test
        @DisplayName("Should process UserProfileCreateRequest fields")
        fun `should process user profile create request fields`() {
            // Given
            val createRequest = UserProfileCreateRequest(
                displayName = "New User",
                avatarUrl = "https://example.com/new-avatar.jpg"
            )
            
            // When - Using reflection to verify the structure matches update request
            val displayName = createRequest.displayName
            val avatarUrl = createRequest.avatarUrl
            
            // Then
            assertThat(displayName).isEqualTo("New User")
            assertThat(avatarUrl).isEqualTo("https://example.com/new-avatar.jpg")
        }
        
        @Test
        @DisplayName("Should handle null fields in profile create request")
        fun `should handle null fields in profile create request`() {
            // Given
            val createRequest = UserProfileCreateRequest(
                displayName = null,
                avatarUrl = null
            )
            
            // When
            val displayName = createRequest.displayName
            val avatarUrl = createRequest.avatarUrl
            
            // Then
            assertThat(displayName).isNull()
            assertThat(avatarUrl).isNull()
        }
        
        @Test
        @DisplayName("Should handle partial profile create request")
        fun `should handle partial profile create request`() {
            // Given
            val onlyNameRequest = UserProfileCreateRequest(
                displayName = "Name Only",
                avatarUrl = null
            )
            val onlyAvatarRequest = UserProfileCreateRequest(
                displayName = null,
                avatarUrl = "https://example.com/avatar.jpg"
            )
            
            // When & Then
            assertThat(onlyNameRequest.displayName).isEqualTo("Name Only")
            assertThat(onlyNameRequest.avatarUrl).isNull()
            
            assertThat(onlyAvatarRequest.displayName).isNull()
            assertThat(onlyAvatarRequest.avatarUrl).isEqualTo("https://example.com/avatar.jpg")
        }
    }
    
    @Nested
    @DisplayName("Performance and Scale Tests")
    inner class PerformanceAndScaleTests {
        
        @Test
        @DisplayName("Should handle very large batch conversions")
        fun `should handle very large batch conversions`() {
            // Given
            val veryLargeList = (1..10000).map { index ->
                createTestUser(
                    email = "bulk$index@example.com",
                    auth0Sub = "auth0|bulk$index"
                )
            }
            
            // When
            val responses = mapper.toResponseList(veryLargeList)
            
            // Then
            assertThat(responses).hasSize(10000)
            // Spot check
            assertThat(responses[0].email).isEqualTo("bulk1@example.com")
            assertThat(responses[4999].email).isEqualTo("bulk5000@example.com")
            assertThat(responses[9999].email).isEqualTo("bulk10000@example.com")
        }
        
        @Test
        @DisplayName("Should handle rapid sequential conversions")
        fun `should handle rapid sequential conversions`() {
            // Given
            val user = createTestUser()
            
            // When - Simulate rapid calls
            val responses = (1..100).map {
                mapper.toResponse(user)
            }
            
            // Then - All responses should be identical
            assertThat(responses).allMatch { response ->
                response.id == user.id.value &&
                response.auth0Sub == user.auth0Sub &&
                response.email == user.email
            }
        }
        
        @Test
        @DisplayName("Should convert mixed size lists consistently")
        fun `should convert mixed size lists consistently`() {
            // Given
            val emptyList = emptyList<User>()
            val singleList = listOf(createTestUser())
            val smallList = (1..10).map { createTestUser() }
            val mediumList = (1..100).map { createTestUser() }
            
            // When
            val emptyResponse = mapper.toResponseList(emptyList)
            val singleResponse = mapper.toResponseList(singleList)
            val smallResponse = mapper.toResponseList(smallList)
            val mediumResponse = mapper.toResponseList(mediumList)
            
            // Then
            assertThat(emptyResponse).hasSize(0)
            assertThat(singleResponse).hasSize(1)
            assertThat(smallResponse).hasSize(10)
            assertThat(mediumResponse).hasSize(100)
        }
    }
    
    @Nested
    @DisplayName("Edge Cases and Boundary Conditions")
    inner class EdgeCasesAndBoundaryConditions {
        
        @Test
        @DisplayName("Should handle users created at exact same instant")
        fun `should handle users created at exact same instant`() {
            // Given
            val preciseInstant = Instant.parse("2024-01-01T00:00:00.000000000Z")
            val users = (1..3).map { index ->
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|concurrent$index",
                    email = "concurrent$index@example.com",
                    createdAt = preciseInstant,
                    updatedAt = preciseInstant
                )
            }
            
            // When
            val responses = mapper.toResponseList(users)
            
            // Then
            assertThat(responses).allMatch {
                it.createdAt == preciseInstant && it.updatedAt == preciseInstant
            }
        }
        
        @Test
        @DisplayName("Should handle maximum length email addresses")
        fun `should handle maximum length email addresses`() {
            // Given - Create email at max reasonable length (254 chars per RFC)
            val longLocalPart = "a".repeat(64) // Max local part
            val longDomain = "subdomain." + "a".repeat(50) + ".com"
            val maxEmail = "$longLocalPart@$longDomain"
            
            val user = createTestUser(email = maxEmail)
            
            // When
            val response = mapper.toResponse(user)
            
            // Then
            assertThat(response.email).isEqualTo(maxEmail)
            assertThat(response.email.length).isLessThanOrEqualTo(254)
        }
        
        @Test
        @DisplayName("Should handle Auth0 sub with maximum segments")
        fun `should handle auth0 sub with maximum segments`() {
            // Given
            val complexAuth0Sub = "waad|AzureAD|tenant-id|directory-id|user-object-id|extra-segment"
            val user = createTestUser(auth0Sub = complexAuth0Sub)
            
            // When
            val response = mapper.toResponse(user)
            
            // Then
            assertThat(response.auth0Sub).isEqualTo(complexAuth0Sub)
        }
        
        @Test
        @DisplayName("Should maintain precision for nanosecond timestamps in lists")
        fun `should maintain precision for nanosecond timestamps in lists`() {
            // Given
            val nanoTimestamps = listOf(
                Instant.parse("2024-01-01T00:00:00.000000001Z"),
                Instant.parse("2024-01-01T00:00:00.999999999Z"),
                Instant.parse("2024-01-01T00:00:00.123456789Z")
            )
            
            val users = nanoTimestamps.mapIndexed { index, timestamp ->
                User(
                    id = UserId(UUID.randomUUID()),
                    auth0Sub = "auth0|nano$index",
                    email = "nano$index@example.com",
                    createdAt = timestamp,
                    updatedAt = timestamp
                )
            }
            
            // When
            val responses = mapper.toResponseList(users)
            
            // Then
            responses.forEachIndexed { index, response ->
                assertThat(response.createdAt).isEqualTo(nanoTimestamps[index])
                assertThat(response.updatedAt).isEqualTo(nanoTimestamps[index])
            }
        }
    }
    
    // Helper methods
    
    private fun createTestUser(
        id: UUID = UUID.randomUUID(),
        auth0Sub: String = "auth0|test${UUID.randomUUID().toString().take(8)}",
        email: String = "test${UUID.randomUUID().toString().take(8)}@example.com",
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
}