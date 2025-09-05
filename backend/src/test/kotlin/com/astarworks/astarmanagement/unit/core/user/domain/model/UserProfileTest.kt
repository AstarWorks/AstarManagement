package com.astarworks.astarmanagement.unit.core.user.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserProfileId
import java.util.UUID
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.junit.jupiter.params.provider.ValueSource
import java.time.Instant
import java.util.stream.Stream

@UnitTest
@DisplayName("UserProfile Domain Model Tests")
class UserProfileTest {
    
    companion object {
        @JvmStatic
        fun invalidDisplayNameCases(): Stream<String> {
            return Stream.of("", "   ", "\t", "\n")
        }
        
        @JvmStatic
        fun invalidAvatarUrlCases(): Stream<String> {
            return Stream.of("", "   ", "\t", "\n")
        }
        
        @JvmStatic
        fun longDisplayNameCases(): Stream<String> {
            return Stream.of(
                "a".repeat(255),  // exactly at limit
                "a".repeat(256)   // over limit
            )
        }
    }
    
    @Nested
    @DisplayName("Construction and Validation Tests")
    inner class ConstructionTests {
        
        @Test
        @DisplayName("Should create user profile with valid parameters")
        fun `should create user profile with valid parameters`() {
            // Given
            val userId = UserId(UUID.randomUUID())
            val displayName = "John Doe"
            val avatarUrl = "https://example.com/avatar.jpg"
            
            // When
            val userProfile = DomainModelTestBuilder.userProfile(
                userId = userId,
                displayName = displayName,
                avatarUrl = avatarUrl
            )
            
            // Then
            assertEquals(userId, userProfile.userId)
            assertEquals(displayName, userProfile.displayName)
            assertEquals(avatarUrl, userProfile.avatarUrl)
            assertNotNull(userProfile.id)
            assertNotNull(userProfile.createdAt)
            assertNotNull(userProfile.updatedAt)
        }
        
        @Test
        @DisplayName("Should create user profile with null optional fields")
        fun `should create user profile with null optional fields`() {
            // Given
            val userId = UserId(UUID.randomUUID())
            
            // When
            val userProfile = DomainModelTestBuilder.userProfile(
                userId = userId,
                displayName = null,
                avatarUrl = null
            )
            
            // Then
            assertEquals(userId, userProfile.userId)
            assertNull(userProfile.displayName)
            assertNull(userProfile.avatarUrl)
        }
        
        @Test
        @DisplayName("Should generate unique ID automatically")
        fun `should generate unique ID automatically`() {
            // When
            val profile1 = DomainModelTestBuilder.userProfile()
            val profile2 = DomainModelTestBuilder.userProfile()
            
            // Then
            assertNotNull(profile1.id)
            assertNotNull(profile2.id)
            assertNotEquals(profile1.id, profile2.id)
        }
        
        @ParameterizedTest(name = "Should reject blank display name: ''{0}''")
        @MethodSource("com.astarworks.astarmanagement.unit.core.user.domain.model.UserProfileTest#invalidDisplayNameCases")
        fun `should reject blank display name`(invalidDisplayName: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.userProfile(displayName = invalidDisplayName)
            }
            assertEquals("Display name cannot be blank if provided", exception.message)
        }
        
        @ParameterizedTest(name = "Should reject blank avatar URL: ''{0}''")
        @MethodSource("com.astarworks.astarmanagement.unit.core.user.domain.model.UserProfileTest#invalidAvatarUrlCases")
        fun `should reject blank avatar URL`(invalidAvatarUrl: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.userProfile(avatarUrl = invalidAvatarUrl)
            }
            assertEquals("Avatar URL cannot be blank if provided", exception.message)
        }
        
        @Test
        @DisplayName("Should accept display name at character limit")
        fun `should accept display name at character limit`() {
            // Given
            val displayNameAt255 = "a".repeat(255)
            
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.userProfile(displayName = displayNameAt255)
            }
        }
        
        @Test
        @DisplayName("Should reject display name over character limit")
        fun `should reject display name over character limit`() {
            // Given
            val displayNameOver255 = "a".repeat(256)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.userProfile(displayName = displayNameOver255)
            }
            assertEquals("Display name cannot exceed 255 characters", exception.message)
        }
    }
    
    @Nested
    @DisplayName("Update Display Name Tests")
    inner class UpdateDisplayNameTests {
        
        @Test
        @DisplayName("Should update display name and timestamp")
        fun `should update display name and timestamp`() {
            // Given
            val originalProfile = DomainModelTestBuilder.userProfile(displayName = "Original Name")
            val originalUpdatedAt = originalProfile.updatedAt
            val newDisplayName = "Updated Name"
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedProfile = originalProfile.updateDisplayName(newDisplayName)
            
            // Then
            assertEquals(newDisplayName, updatedProfile.displayName)
            assertEquals(originalProfile.id, updatedProfile.id)
            assertEquals(originalProfile.userId, updatedProfile.userId)
            assertEquals(originalProfile.avatarUrl, updatedProfile.avatarUrl)
            assertEquals(originalProfile.createdAt, updatedProfile.createdAt)
            assertTrue(updatedProfile.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should update display name to null")
        fun `should update display name to null`() {
            // Given
            val originalProfile = DomainModelTestBuilder.userProfile(displayName = "Original Name")
            
            // When
            val updatedProfile = originalProfile.updateDisplayName(null)
            
            // Then
            assertNull(updatedProfile.displayName)
            assertEquals(originalProfile.avatarUrl, updatedProfile.avatarUrl) // Other fields preserved
        }
        
        @Test
        @DisplayName("Should reject blank display name in update")
        fun `should reject blank display name in update`() {
            // Given
            val profile = DomainModelTestBuilder.userProfile()
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                profile.updateDisplayName("")
            }
            assertEquals("Display name cannot be blank if provided", exception.message)
        }
        
        @Test
        @DisplayName("Should reject too long display name in update")
        fun `should reject too long display name in update`() {
            // Given
            val profile = DomainModelTestBuilder.userProfile()
            val tooLongName = "a".repeat(256)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                profile.updateDisplayName(tooLongName)
            }
            assertEquals("Display name cannot exceed 255 characters", exception.message)
        }
        
        @Test
        @DisplayName("Should preserve immutability when updating display name")
        fun `should preserve immutability when updating display name`() {
            // Given
            val originalProfile = DomainModelTestBuilder.userProfile(displayName = "Original")
            val originalDisplayName = originalProfile.displayName
            
            // When
            val updatedProfile = originalProfile.updateDisplayName("Updated")
            
            // Then
            assertEquals(originalDisplayName, originalProfile.displayName) // Original unchanged
            assertEquals("Updated", updatedProfile.displayName)
            assertNotSame(originalProfile, updatedProfile) // Different instances
        }
    }
    
    @Nested
    @DisplayName("Update Avatar URL Tests")
    inner class UpdateAvatarUrlTests {
        
        @Test
        @DisplayName("Should update avatar URL and timestamp")
        fun `should update avatar URL and timestamp`() {
            // Given
            val originalProfile = DomainModelTestBuilder.userProfile(avatarUrl = "https://example.com/old.jpg")
            val originalUpdatedAt = originalProfile.updatedAt
            val newAvatarUrl = "https://example.com/new.jpg"
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedProfile = originalProfile.updateAvatarUrl(newAvatarUrl)
            
            // Then
            assertEquals(newAvatarUrl, updatedProfile.avatarUrl)
            assertEquals(originalProfile.displayName, updatedProfile.displayName) // Other fields preserved
            assertTrue(updatedProfile.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should update avatar URL to null")
        fun `should update avatar URL to null`() {
            // Given
            val originalProfile = DomainModelTestBuilder.userProfile(avatarUrl = "https://example.com/avatar.jpg")
            
            // When
            val updatedProfile = originalProfile.updateAvatarUrl(null)
            
            // Then
            assertNull(updatedProfile.avatarUrl)
            assertEquals(originalProfile.displayName, updatedProfile.displayName) // Other fields preserved
        }
        
        @Test
        @DisplayName("Should reject blank avatar URL in update")
        fun `should reject blank avatar URL in update`() {
            // Given
            val profile = DomainModelTestBuilder.userProfile()
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                profile.updateAvatarUrl("")
            }
            assertEquals("Avatar URL cannot be blank if provided", exception.message)
        }
    }
    
    @Nested
    @DisplayName("Update Profile Tests")
    inner class UpdateProfileTests {
        
        @Test
        @DisplayName("Should update both display name and avatar URL")
        fun `should update both display name and avatar URL`() {
            // Given
            val originalProfile = DomainModelTestBuilder.userProfile(
                displayName = "Original Name",
                avatarUrl = "https://example.com/old.jpg"
            )
            val originalUpdatedAt = originalProfile.updatedAt
            val newDisplayName = "New Name"
            val newAvatarUrl = "https://example.com/new.jpg"
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedProfile = originalProfile.updateProfile(newDisplayName, newAvatarUrl)
            
            // Then
            assertEquals(newDisplayName, updatedProfile.displayName)
            assertEquals(newAvatarUrl, updatedProfile.avatarUrl)
            assertTrue(updatedProfile.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should update profile with null values")
        fun `should update profile with null values`() {
            // Given
            val originalProfile = DomainModelTestBuilder.userProfile(
                displayName = "Original Name",
                avatarUrl = "https://example.com/avatar.jpg"
            )
            
            // When
            val updatedProfile = originalProfile.updateProfile(null, null)
            
            // Then
            assertNull(updatedProfile.displayName)
            assertNull(updatedProfile.avatarUrl)
        }
        
        @Test
        @DisplayName("Should validate both parameters in updateProfile")
        fun `should validate both parameters in updateProfile`() {
            // Given
            val profile = DomainModelTestBuilder.userProfile()
            
            // When & Then - Invalid display name
            assertThrows(IllegalArgumentException::class.java) {
                profile.updateProfile("", "https://example.com/avatar.jpg")
            }
            
            // When & Then - Invalid avatar URL
            assertThrows(IllegalArgumentException::class.java) {
                profile.updateProfile("Valid Name", "")
            }
            
            // When & Then - Both invalid
            assertThrows(IllegalArgumentException::class.java) {
                profile.updateProfile("", "")
            }
        }
        
        @Test
        @DisplayName("Should handle partial updates with updateProfile")
        fun `should handle partial updates with updateProfile`() {
            // Given
            val originalProfile = DomainModelTestBuilder.userProfile(
                displayName = "Original Name",
                avatarUrl = "https://example.com/old.jpg"
            )
            
            // When - Update only display name
            val updatedProfile1 = originalProfile.updateProfile("New Name", originalProfile.avatarUrl)
            
            // When - Update only avatar URL
            val updatedProfile2 = originalProfile.updateProfile(originalProfile.displayName, "https://example.com/new.jpg")
            
            // Then
            assertEquals("New Name", updatedProfile1.displayName)
            assertEquals(originalProfile.avatarUrl, updatedProfile1.avatarUrl)
            
            assertEquals(originalProfile.displayName, updatedProfile2.displayName)
            assertEquals("https://example.com/new.jpg", updatedProfile2.avatarUrl)
        }
    }
    
    @Nested
    @DisplayName("Data Class Behavior Tests")
    inner class DataClassBehaviorTests {
        
        @Test
        @DisplayName("Should implement equals and hashCode correctly")
        fun `should implement equals and hashCode correctly`() {
            // Given
            val id = UserProfileId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            val displayName = "Same Name"
            val avatarUrl = "https://example.com/same.jpg"
            val timestamp = Instant.now()
            
            val profile1 = DomainModelTestBuilder.userProfile(
                id = id,
                userId = userId,
                displayName = displayName,
                avatarUrl = avatarUrl,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            val profile2 = DomainModelTestBuilder.userProfile(
                id = id,
                userId = userId,
                displayName = displayName,
                avatarUrl = avatarUrl,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            
            // Then
            assertEquals(profile1, profile2)
            assertEquals(profile1.hashCode(), profile2.hashCode())
        }
        
        @Test
        @DisplayName("Should support copy with parameter changes")
        fun `should support copy with parameter changes`() {
            // Given
            val originalProfile = DomainModelTestBuilder.userProfile(
                displayName = "Original Name",
                avatarUrl = "https://example.com/old.jpg"
            )
            
            // When
            val copiedProfile = originalProfile.copy(
                displayName = "Copied Name",
                avatarUrl = "https://example.com/new.jpg"
            )
            
            // Then
            assertEquals("Copied Name", copiedProfile.displayName)
            assertEquals("https://example.com/new.jpg", copiedProfile.avatarUrl)
            assertEquals(originalProfile.id, copiedProfile.id) // ID preserved
            assertEquals(originalProfile.userId, copiedProfile.userId) // User ID preserved
        }
    }
    
    @Nested
    @DisplayName("Edge Cases and Integration Tests")
    inner class EdgeCasesTests {
        
        @Test
        @DisplayName("Should handle Unicode characters in display name")
        fun `should handle Unicode characters in display name`() {
            // Given
            val unicodeDisplayName = "田中太郎 🎉 José María"
            
            // When & Then
            val profile = DomainModelTestBuilder.userProfile(displayName = unicodeDisplayName)
            
            assertEquals(unicodeDisplayName, profile.displayName)
        }
        
        @Test
        @DisplayName("Should handle different URL formats for avatar")
        fun `should handle different URL formats for avatar`() {
            // Given
            val validUrls = listOf(
                "https://example.com/avatar.jpg",
                "http://example.com/avatar.png",
                "https://cdn.example.com/path/to/avatar.gif",
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ",
                "/relative/path/to/avatar.jpg"
            )
            
            // When & Then
            validUrls.forEach { url ->
                assertDoesNotThrow {
                    DomainModelTestBuilder.userProfile(avatarUrl = url)
                }
            }
        }
        
        @Test
        @DisplayName("Should handle rapid successive updates")
        fun `should handle rapid successive updates`() {
            // Given
            val profile = DomainModelTestBuilder.userProfile()
            
            // When
            var currentProfile = profile
            repeat(10) { i ->
                currentProfile = currentProfile.updateDisplayName("Name $i")
            }
            
            // Then
            assertEquals("Name 9", currentProfile.displayName)
            assertTrue(currentProfile.updatedAt.isAfter(profile.updatedAt))
        }
        
        @Test
        @DisplayName("Should maintain relationship to User entity")
        fun `should maintain relationship to User entity`() {
            // Given
            val userId = UserId(UUID.randomUUID())
            val profile = DomainModelTestBuilder.userProfile(userId = userId)
            
            // When - Various operations
            val updatedProfile = profile
                .updateDisplayName("New Name")
                .updateAvatarUrl("https://example.com/new.jpg")
                .updateProfile("Final Name", "https://example.com/final.jpg")
            
            // Then - User ID should be preserved through all operations
            assertEquals(userId, updatedProfile.userId)
        }
    }
}