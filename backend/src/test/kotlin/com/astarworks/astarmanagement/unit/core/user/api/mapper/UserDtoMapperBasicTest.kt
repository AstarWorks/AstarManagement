package com.astarworks.astarmanagement.unit.core.user.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.user.api.dto.UserResponse
import com.astarworks.astarmanagement.core.user.api.dto.UserUpdateRequest
import com.astarworks.astarmanagement.core.user.api.mapper.UserDtoMapper
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
 * Unit tests for UserDtoMapper basic conversion functionality.
 * Tests fundamental transformations between User domain model and DTOs.
 */
@UnitTest
@DisplayName("UserDtoMapper Basic Tests")
class UserDtoMapperBasicTest {
    
    private lateinit var mapper: UserDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = UserDtoMapper()
    }
    
    @Nested
    @DisplayName("User to UserResponse Conversion")
    inner class UserToResponseConversion {
        
        @Test
        @DisplayName("Should convert User to UserResponse with all fields")
        fun `should convert user to response with all fields`() {
            // Given
            val userId = UUID.randomUUID()
            val auth0Sub = "auth0|123456789"
            val email = "test@example.com"
            val createdAt = Instant.now().minusSeconds(3600)
            val updatedAt = Instant.now()
            
            val user = User(
                id = UserId(userId),
                auth0Sub = auth0Sub,
                email = email,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val response = mapper.toResponse(user)
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.id).isEqualTo(userId)
            assertThat(response.auth0Sub).isEqualTo(auth0Sub)
            assertThat(response.email).isEqualTo(email)
            assertThat(response.createdAt).isEqualTo(createdAt)
            assertThat(response.updatedAt).isEqualTo(updatedAt)
        }
        
        @Test
        @DisplayName("Should preserve exact timestamp precision")
        fun `should preserve exact timestamp precision`() {
            // Given
            val preciseTimestamp = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val user = createTestUser(
                createdAt = preciseTimestamp,
                updatedAt = preciseTimestamp
            )
            
            // When
            val response = mapper.toResponse(user)
            
            // Then
            assertThat(response.createdAt).isEqualTo(preciseTimestamp)
            assertThat(response.updatedAt).isEqualTo(preciseTimestamp)
        }
        
        @Test
        @DisplayName("Should handle special characters in email")
        fun `should handle special characters in email`() {
            // Given
            val specialEmail = "user+test@sub.example.co.jp"
            val user = createTestUser(email = specialEmail)
            
            // When
            val response = mapper.toResponse(user)
            
            // Then
            assertThat(response.email).isEqualTo(specialEmail)
        }
        
        @Test
        @DisplayName("Should handle various Auth0 sub formats")
        fun `should handle various auth0 sub formats`() {
            // Test different Auth0 sub formats
            val subFormats = listOf(
                "auth0|123456789",
                "google-oauth2|123456789",
                "github|12345",
                "email|5e9b8c2d3f1a2b3c4d5e6f7g"
            )
            
            subFormats.forEach { sub ->
                // Given
                val user = createTestUser(auth0Sub = sub)
                
                // When
                val response = mapper.toResponse(user)
                
                // Then
                assertThat(response.auth0Sub).isEqualTo(sub)
            }
        }
        
        @Test
        @DisplayName("Should convert user with minimum required fields")
        fun `should convert user with minimum required fields`() {
            // Given
            val user = User(
                id = UserId(UUID.randomUUID()),
                auth0Sub = "auth0|min",
                email = "min@test.com"
            )
            
            // When
            val response = mapper.toResponse(user)
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.id).isEqualTo(user.id.value)
            assertThat(response.auth0Sub).isEqualTo(user.auth0Sub)
            assertThat(response.email).isEqualTo(user.email)
            assertThat(response.createdAt).isEqualTo(user.createdAt)
            assertThat(response.updatedAt).isEqualTo(user.updatedAt)
        }
    }
    
    @Nested
    @DisplayName("Update Request Processing")
    inner class UpdateRequestProcessing {
        
        @Test
        @DisplayName("Should extract email from UserUpdateRequest")
        fun `should extract email from update request`() {
            // Given
            val newEmail = "updated@example.com"
            val request = UserUpdateRequest(email = newEmail)
            
            // When
            val extractedEmail = mapper.extractEmail(request)
            
            // Then
            assertThat(extractedEmail).isEqualTo(newEmail)
        }
        
        @Test
        @DisplayName("Should handle null email in UserUpdateRequest")
        fun `should handle null email in update request`() {
            // Given
            val request = UserUpdateRequest(email = null)
            
            // When
            val extractedEmail = mapper.extractEmail(request)
            
            // Then
            assertThat(extractedEmail).isNull()
        }
        
        @Test
        @DisplayName("Should handle empty email in UserUpdateRequest")
        fun `should handle empty email in update request`() {
            // Given
            val request = UserUpdateRequest(email = "")
            
            // When
            val extractedEmail = mapper.extractEmail(request)
            
            // Then
            assertThat(extractedEmail).isEmpty()
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
}