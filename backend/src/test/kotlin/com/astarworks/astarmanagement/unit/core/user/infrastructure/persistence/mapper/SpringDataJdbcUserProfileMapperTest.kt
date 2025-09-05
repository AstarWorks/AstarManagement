package com.astarworks.astarmanagement.unit.core.user.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.SpringDataJdbcUserProfileTable
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.mapper.SpringDataJdbcUserProfileMapper
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserProfileId
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

@DisplayName("SpringDataJdbcUserProfileMapper - UserProfile Entity Mapping")
class SpringDataJdbcUserProfileMapperTest : UnitTestBase() {
    
    private val mapper = SpringDataJdbcUserProfileMapper()
    
    @Nested
    @DisplayName("Domain to Entity Conversion")
    inner class DomainToEntityConversion {
        
        @Test
        @DisplayName("Should convert UserProfile domain to SpringDataJdbcUserProfileTable entity")
        fun shouldConvertUserProfileToTable() {
            // Given
            val profileId = UserProfileId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            val displayName = "John Doe"
            val avatarUrl = "https://example.com/avatar.jpg"
            val createdAt = Instant.now().minusSeconds(3600)
            val updatedAt = Instant.now()
            
            val userProfile = UserProfile(
                id = profileId,
                userId = userId,
                displayName = displayName,
                avatarUrl = avatarUrl,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val result = mapper.toTable(userProfile)
            
            // Then
            assertNotNull(result)
            assertEquals(profileId, result.id)
            assertEquals(userId, result.userId)
            assertEquals(displayName, result.displayName)
            assertEquals(avatarUrl, result.avatarUrl)
            assertEquals(createdAt, result.createdAt)
            assertEquals(updatedAt, result.updatedAt)
            assertNull(result.version) // New entity has null version
        }
        
        @Test
        @DisplayName("Should handle UserProfile with null displayName and avatarUrl")
        fun shouldHandleNullOptionalFields() {
            // Given
            val profileId = UserProfileId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            
            val userProfile = UserProfile(
                id = profileId,
                userId = userId,
                displayName = null,
                avatarUrl = null
            )
            
            // When
            val result = mapper.toTable(userProfile)
            
            // Then
            assertEquals(profileId, result.id)
            assertEquals(userId, result.userId)
            assertNull(result.displayName)
            assertNull(result.avatarUrl)
            assertNotNull(result.createdAt)
            assertNotNull(result.updatedAt)
            assertNull(result.version)
        }
        
        @Test
        @DisplayName("Should preserve Value Objects during conversion")
        fun shouldPreserveValueObjects() {
            // Given
            val profileId = UserProfileId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            
            val userProfile = UserProfile(
                id = profileId,
                userId = userId
            )
            
            // When
            val result = mapper.toTable(userProfile)
            
            // Then
            assertEquals(profileId, result.id)
            assertEquals(profileId.value, result.id.value)
            assertEquals(userId, result.userId)
            assertEquals(userId.value, result.userId.value)
        }
        
        @Test
        @DisplayName("Should convert list of UserProfiles to table entities")
        fun shouldConvertUserProfileListToTableList() {
            // Given
            val userProfiles = listOf(
                UserProfile(
                    userId = UserId(UUID.randomUUID()),
                    displayName = "User 1"
                ),
                UserProfile(
                    userId = UserId(UUID.randomUUID()),
                    displayName = "User 2"
                ),
                UserProfile(
                    userId = UserId(UUID.randomUUID()),
                    displayName = null
                )
            )
            
            // When
            val result = mapper.toTableList(userProfiles)
            
            // Then
            assertEquals(3, result.size)
            assertEquals("User 1", result[0].displayName)
            assertEquals("User 2", result[1].displayName)
            assertNull(result[2].displayName)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion to table")
        fun shouldHandleEmptyListToTable() {
            // Given
            val userProfiles = emptyList<UserProfile>()
            
            // When
            val result = mapper.toTableList(userProfiles)
            
            // Then
            assertTrue(result.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Entity to Domain Conversion")
    inner class EntityToDomainConversion {
        
        @Test
        @DisplayName("Should convert SpringDataJdbcUserProfileTable entity to UserProfile domain")
        fun shouldConvertTableToUserProfile() {
            // Given
            val profileId = UserProfileId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            val displayName = "Jane Smith"
            val avatarUrl = "https://example.com/jane.png"
            val createdAt = Instant.now().minusSeconds(7200)
            val updatedAt = Instant.now()
            
            val table = SpringDataJdbcUserProfileTable(
                id = profileId,
                version = 2L,
                userId = userId,
                displayName = displayName,
                avatarUrl = avatarUrl,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertEquals(profileId, result.id)
            assertEquals(userId, result.userId)
            assertEquals(displayName, result.displayName)
            assertEquals(avatarUrl, result.avatarUrl)
            assertEquals(createdAt, result.createdAt)
            assertEquals(updatedAt, result.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle entity with null optional fields")
        fun shouldHandleEntityWithNullFields() {
            // Given
            val table = SpringDataJdbcUserProfileTable(
                id = UserProfileId(UUID.randomUUID()),
                version = 0L,
                userId = UserId(UUID.randomUUID()),
                displayName = null,
                avatarUrl = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertNull(result.displayName)
            assertNull(result.avatarUrl)
        }
        
        @Test
        @DisplayName("Should preserve Value Objects from entity")
        fun shouldPreserveValueObjectsFromEntity() {
            // Given
            val profileId = UserProfileId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            
            val table = SpringDataJdbcUserProfileTable(
                id = profileId,
                version = null,
                userId = userId,
                displayName = "Test User",
                avatarUrl = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertEquals(profileId, result.id)
            assertEquals(profileId.value, result.id.value)
            assertEquals(userId, result.userId)
            assertEquals(userId.value, result.userId.value)
        }
        
        @Test
        @DisplayName("Should convert list of table entities to UserProfiles")
        fun shouldConvertTableListToUserProfileList() {
            // Given
            val tables = listOf(
                SpringDataJdbcUserProfileTable(
                    id = UserProfileId(UUID.randomUUID()),
                    version = 1L,
                    userId = UserId(UUID.randomUUID()),
                    displayName = "Entity 1",
                    avatarUrl = "https://example.com/1.jpg",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                ),
                SpringDataJdbcUserProfileTable(
                    id = UserProfileId(UUID.randomUUID()),
                    version = null,
                    userId = UserId(UUID.randomUUID()),
                    displayName = null,
                    avatarUrl = null,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertEquals(2, result.size)
            assertEquals("Entity 1", result[0].displayName)
            assertEquals("https://example.com/1.jpg", result[0].avatarUrl)
            assertNull(result[1].displayName)
            assertNull(result[1].avatarUrl)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion from table")
        fun shouldHandleEmptyListFromTable() {
            // Given
            val tables = emptyList<SpringDataJdbcUserProfileTable>()
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertTrue(result.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Bidirectional Conversion")
    inner class BidirectionalConversion {
        
        @Test
        @DisplayName("Should maintain data integrity in round-trip conversion (Domain -> Entity -> Domain)")
        fun shouldMaintainIntegrityDomainToEntityToDomain() {
            // Given
            val originalProfile = UserProfile(
                id = UserProfileId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                displayName = "Round Trip User",
                avatarUrl = "https://example.com/roundtrip.jpg",
                createdAt = Instant.now().minusSeconds(1000),
                updatedAt = Instant.now()
            )
            
            // When
            val table = mapper.toTable(originalProfile)
            val resultProfile = mapper.toDomain(table)
            
            // Then
            assertEquals(originalProfile.id, resultProfile.id)
            assertEquals(originalProfile.userId, resultProfile.userId)
            assertEquals(originalProfile.displayName, resultProfile.displayName)
            assertEquals(originalProfile.avatarUrl, resultProfile.avatarUrl)
            assertEquals(originalProfile.createdAt, resultProfile.createdAt)
            assertEquals(originalProfile.updatedAt, resultProfile.updatedAt)
        }
        
        @Test
        @DisplayName("Should maintain data integrity with null fields in round-trip")
        fun shouldMaintainIntegrityWithNullFields() {
            // Given
            val originalProfile = UserProfile(
                userId = UserId(UUID.randomUUID()),
                displayName = null,
                avatarUrl = null
            )
            
            // When
            val table = mapper.toTable(originalProfile)
            val resultProfile = mapper.toDomain(table)
            
            // Then
            assertEquals(originalProfile.id, resultProfile.id)
            assertEquals(originalProfile.userId, resultProfile.userId)
            assertNull(resultProfile.displayName)
            assertNull(resultProfile.avatarUrl)
        }
        
        @Test
        @DisplayName("Should handle UserProfile.updateDisplayName method")
        fun shouldHandleUpdateDisplayName() {
            // Given
            val originalProfile = UserProfile(
                userId = UserId(UUID.randomUUID()),
                displayName = "Old Name",
                avatarUrl = "https://example.com/avatar.jpg"
            )
            val updatedProfile = originalProfile.updateDisplayName("New Name")
            
            // When
            val table = mapper.toTable(updatedProfile)
            val resultProfile = mapper.toDomain(table)
            
            // Then
            assertEquals("New Name", resultProfile.displayName)
            assertEquals(originalProfile.avatarUrl, resultProfile.avatarUrl)
            assertEquals(originalProfile.id, resultProfile.id)
            assertEquals(originalProfile.userId, resultProfile.userId)
            assertTrue(resultProfile.updatedAt.isAfter(originalProfile.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle UserProfile.updateAvatarUrl method")
        fun shouldHandleUpdateAvatarUrl() {
            // Given
            val originalProfile = UserProfile(
                userId = UserId(UUID.randomUUID()),
                displayName = "User Name",
                avatarUrl = "https://example.com/old.jpg"
            )
            val updatedProfile = originalProfile.updateAvatarUrl("https://example.com/new.jpg")
            
            // When
            val table = mapper.toTable(updatedProfile)
            val resultProfile = mapper.toDomain(table)
            
            // Then
            assertEquals("https://example.com/new.jpg", resultProfile.avatarUrl)
            assertEquals(originalProfile.displayName, resultProfile.displayName)
            assertTrue(resultProfile.updatedAt.isAfter(originalProfile.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle UserProfile.updateProfile method")
        fun shouldHandleUpdateProfile() {
            // Given
            val originalProfile = UserProfile(
                userId = UserId(UUID.randomUUID()),
                displayName = "Old Name",
                avatarUrl = "https://example.com/old.jpg"
            )
            val updatedProfile = originalProfile.updateProfile(
                "New Name",
                "https://example.com/new.jpg"
            )
            
            // When
            val table = mapper.toTable(updatedProfile)
            val resultProfile = mapper.toDomain(table)
            
            // Then
            assertEquals("New Name", resultProfile.displayName)
            assertEquals("https://example.com/new.jpg", resultProfile.avatarUrl)
            assertTrue(resultProfile.updatedAt.isAfter(originalProfile.updatedAt))
        }
    }
    
    @Nested
    @DisplayName("Special Cases and Edge Cases")
    inner class SpecialCases {
        
        @Test
        @DisplayName("Should handle UserProfile with maximum length display name")
        fun shouldHandleMaxLengthDisplayName() {
            // Given
            val maxLengthName = "a".repeat(255)
            val userProfile = UserProfile(
                userId = UserId(UUID.randomUUID()),
                displayName = maxLengthName
            )
            
            // When
            val table = mapper.toTable(userProfile)
            val resultProfile = mapper.toDomain(table)
            
            // Then
            assertEquals(maxLengthName, resultProfile.displayName)
            assertEquals(255, resultProfile.displayName?.length)
        }
        
        @Test
        @DisplayName("Should handle UserProfile with very long avatar URL")
        fun shouldHandleVeryLongAvatarUrl() {
            // Given
            val longUrl = "https://example.com/path/to/avatar/" + "x".repeat(500) + ".jpg"
            val userProfile = UserProfile(
                userId = UserId(UUID.randomUUID()),
                avatarUrl = longUrl
            )
            
            // When
            val table = mapper.toTable(userProfile)
            val resultProfile = mapper.toDomain(table)
            
            // Then
            assertEquals(longUrl, resultProfile.avatarUrl)
        }
        
        @Test
        @DisplayName("Should preserve exact Instant timestamps")
        fun shouldPreserveExactTimestamps() {
            // Given
            val preciseCreatedAt = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val preciseUpdatedAt = Instant.parse("2024-01-15T14:25:30.987654321Z")
            
            val userProfile = UserProfile(
                userId = UserId(UUID.randomUUID()),
                displayName = "Timestamp Test",
                createdAt = preciseCreatedAt,
                updatedAt = preciseUpdatedAt
            )
            
            // When
            val table = mapper.toTable(userProfile)
            val resultProfile = mapper.toDomain(table)
            
            // Then
            assertEquals(preciseCreatedAt, resultProfile.createdAt)
            assertEquals(preciseUpdatedAt, resultProfile.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle clearing optional fields (setting to null)")
        fun shouldHandleClearingOptionalFields() {
            // Given
            val originalProfile = UserProfile(
                userId = UserId(UUID.randomUUID()),
                displayName = "Name to Clear",
                avatarUrl = "https://example.com/avatar.jpg"
            )
            val clearedProfile = originalProfile.updateProfile(null, null)
            
            // When
            val table = mapper.toTable(clearedProfile)
            val resultProfile = mapper.toDomain(table)
            
            // Then
            assertNull(resultProfile.displayName)
            assertNull(resultProfile.avatarUrl)
        }
        
        @Test
        @DisplayName("Should handle multiple conversions of the same object")
        fun shouldHandleMultipleConversions() {
            // Given
            val userProfile = UserProfile(
                userId = UserId(UUID.randomUUID()),
                displayName = "Multiple Test"
            )
            
            // When
            val table1 = mapper.toTable(userProfile)
            val table2 = mapper.toTable(userProfile)
            val table3 = mapper.toTable(userProfile)
            
            // Then
            assertEquals(table1.id, table2.id)
            assertEquals(table2.id, table3.id)
            assertEquals(table1.userId, table2.userId)
            assertEquals(table2.userId, table3.userId)
            assertEquals(table1.displayName, table2.displayName)
            assertEquals(table2.displayName, table3.displayName)
        }
    }
}