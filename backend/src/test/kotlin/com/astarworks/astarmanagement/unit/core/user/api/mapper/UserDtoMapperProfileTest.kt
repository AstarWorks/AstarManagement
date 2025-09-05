package com.astarworks.astarmanagement.unit.core.user.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.user.api.dto.UserProfileUpdateRequest
import com.astarworks.astarmanagement.core.user.api.mapper.UserDtoMapper
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
 * Unit tests for UserDtoMapper profile-related conversion functionality.
 * Tests transformations for UserProfile domain model and profile DTOs.
 */
@UnitTest
@DisplayName("UserDtoMapper Profile Tests")
class UserDtoMapperProfileTest {
    
    private lateinit var mapper: UserDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = UserDtoMapper()
    }
    
    @Nested
    @DisplayName("UserProfile to UserProfileResponse Conversion")
    inner class UserProfileToResponseConversion {
        
        @Test
        @DisplayName("Should convert UserProfile with all fields")
        fun `should convert user profile with all fields`() {
            // Given
            val profileId = UUID.randomUUID()
            val userId = UUID.randomUUID()
            val displayName = "John Doe"
            val avatarUrl = "https://example.com/avatar.jpg"
            val createdAt = Instant.now().minusSeconds(7200)
            val updatedAt = Instant.now()
            
            val profile = UserProfile(
                id = UserProfileId(profileId),
                userId = UserId(userId),
                displayName = displayName,
                avatarUrl = avatarUrl,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val response = mapper.toProfileResponse(profile)
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.id).isEqualTo(profileId)
            assertThat(response.userId).isEqualTo(userId)
            assertThat(response.displayName).isEqualTo(displayName)
            assertThat(response.avatarUrl).isEqualTo(avatarUrl)
            assertThat(response.createdAt).isEqualTo(createdAt)
            assertThat(response.updatedAt).isEqualTo(updatedAt)
        }
        
        @Test
        @DisplayName("Should handle null displayName")
        fun `should handle null display name`() {
            // Given
            val profile = createTestProfile(displayName = null)
            
            // When
            val response = mapper.toProfileResponse(profile)
            
            // Then
            assertThat(response.displayName).isNull()
        }
        
        @Test
        @DisplayName("Should handle null avatarUrl")
        fun `should handle null avatar url`() {
            // Given
            val profile = createTestProfile(avatarUrl = null)
            
            // When
            val response = mapper.toProfileResponse(profile)
            
            // Then
            assertThat(response.avatarUrl).isNull()
        }
        
        @Test
        @DisplayName("Should handle both nullable fields as null")
        fun `should handle both nullable fields as null`() {
            // Given
            val profile = createTestProfile(
                displayName = null,
                avatarUrl = null
            )
            
            // When
            val response = mapper.toProfileResponse(profile)
            
            // Then
            assertThat(response.displayName).isNull()
            assertThat(response.avatarUrl).isNull()
        }
        
        @Test
        @DisplayName("Should handle special characters in displayName")
        fun `should handle special characters in display name`() {
            // Given
            val specialNames = listOf(
                "山田太郎",
                "José García",
                "Marie-Claire O'Brien",
                "Müller & Sons",
                "🎉 Party Person 🎊"
            )
            
            specialNames.forEach { name ->
                val profile = createTestProfile(displayName = name)
                
                // When
                val response = mapper.toProfileResponse(profile)
                
                // Then
                assertThat(response.displayName).isEqualTo(name)
            }
        }
        
        @Test
        @DisplayName("Should handle various avatar URL formats")
        fun `should handle various avatar url formats`() {
            // Given
            val urls = listOf(
                "https://example.com/avatar.jpg",
                "http://localhost:8080/images/avatar.png",
                "https://cdn.example.com/user/123/avatar?size=200",
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
                "//example.com/avatar.webp"
            )
            
            urls.forEach { url ->
                val profile = createTestProfile(avatarUrl = url)
                
                // When
                val response = mapper.toProfileResponse(profile)
                
                // Then
                assertThat(response.avatarUrl).isEqualTo(url)
            }
        }
    }
    
    @Nested
    @DisplayName("Profile Update Request Processing")
    inner class ProfileUpdateRequestProcessing {
        
        @Test
        @DisplayName("Should extract displayName from UserProfileUpdateRequest")
        fun `should extract display name from update request`() {
            // Given
            val newDisplayName = "Updated Name"
            val request = UserProfileUpdateRequest(
                displayName = newDisplayName,
                avatarUrl = null
            )
            
            // When
            val extractedName = mapper.extractDisplayName(request)
            
            // Then
            assertThat(extractedName).isEqualTo(newDisplayName)
        }
        
        @Test
        @DisplayName("Should extract avatarUrl from UserProfileUpdateRequest")
        fun `should extract avatar url from update request`() {
            // Given
            val newAvatarUrl = "https://new.example.com/avatar.jpg"
            val request = UserProfileUpdateRequest(
                displayName = null,
                avatarUrl = newAvatarUrl
            )
            
            // When
            val extractedUrl = mapper.extractAvatarUrl(request)
            
            // Then
            assertThat(extractedUrl).isEqualTo(newAvatarUrl)
        }
        
        @Test
        @DisplayName("Should handle empty strings in update request")
        fun `should handle empty strings in update request`() {
            // Given
            val request = UserProfileUpdateRequest(
                displayName = "",
                avatarUrl = ""
            )
            
            // When
            val extractedName = mapper.extractDisplayName(request)
            val extractedUrl = mapper.extractAvatarUrl(request)
            
            // Then
            assertThat(extractedName).isEmpty()
            assertThat(extractedUrl).isEmpty()
        }
        
        @Test
        @DisplayName("Should handle all null values in update request")
        fun `should handle all null values in update request`() {
            // Given
            val request = UserProfileUpdateRequest(
                displayName = null,
                avatarUrl = null
            )
            
            // When
            val extractedName = mapper.extractDisplayName(request)
            val extractedUrl = mapper.extractAvatarUrl(request)
            
            // Then
            assertThat(extractedName).isNull()
            assertThat(extractedUrl).isNull()
        }
    }
    
    // Helper methods
    
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