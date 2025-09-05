package com.astarworks.astarmanagement.unit.core.user.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.domain.value.UserId
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
@DisplayName("User Domain Model Tests")
class UserTest {
    
    companion object {
        @JvmStatic
        fun invalidEmailCases(): Stream<String> {
            return DomainModelTestBuilder.invalidEmails().stream()
        }
        
        @JvmStatic
        fun invalidAuth0SubCases(): Stream<String> {
            return Stream.of("", "   ", "\t", "\n")
        }
    }
    
    @Nested
    @DisplayName("Construction and Validation Tests")
    inner class ConstructionTests {
        
        @Test
        @DisplayName("Should create user with valid parameters")
        fun `should create user with valid parameters`() {
            // Given
            val auth0Sub = "auth0|test123"
            val email = "test@example.com"
            
            // When
            val user = DomainModelTestBuilder.user(
                auth0Sub = auth0Sub,
                email = email
            )
            
            // Then
            assertEquals(auth0Sub, user.auth0Sub)
            assertEquals(email, user.email)
            assertNotNull(user.id)
            assertNotNull(user.createdAt)
            assertNotNull(user.updatedAt)
        }
        
        @Test
        @DisplayName("Should generate unique ID automatically")
        fun `should generate unique ID automatically`() {
            // When
            val user1 = DomainModelTestBuilder.user()
            val user2 = DomainModelTestBuilder.user()
            
            // Then
            assertNotNull(user1.id)
            assertNotNull(user2.id)
            assertNotEquals(user1.id, user2.id)
        }
        
        @Test
        @DisplayName("Should set creation timestamp automatically")
        fun `should set creation timestamp automatically`() {
            // Given
            val beforeCreation = Instant.now()
            
            // When
            val user = DomainModelTestBuilder.user()
            
            // Then
            val afterCreation = Instant.now()
            assertTrue(user.createdAt.isAfter(beforeCreation) || user.createdAt.equals(beforeCreation))
            assertTrue(user.updatedAt.isBefore(afterCreation) || user.updatedAt.equals(afterCreation))
        }
        
        @ParameterizedTest(name = "Should reject blank auth0Sub: ''{0}''")
        @MethodSource("com.astarworks.astarmanagement.unit.core.user.domain.model.UserTest#invalidAuth0SubCases")
        fun `should reject blank auth0Sub`(invalidAuth0Sub: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.user(auth0Sub = invalidAuth0Sub)
            }
            assertEquals("Auth0 sub is required", exception.message)
        }
        
        @ParameterizedTest(name = "Should reject invalid email: ''{0}''")
        @MethodSource("com.astarworks.astarmanagement.unit.core.user.domain.model.UserTest#invalidEmailCases")
        fun `should reject blank email`(invalidEmail: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.user(email = invalidEmail)
            }
            assertEquals("Email is required", exception.message)
        }
    }
    
    @Nested
    @DisplayName("Factory Method Tests")
    inner class FactoryMethodTests {
        
        @Test
        @DisplayName("Should create user from Auth0 with fromAuth0 factory method")
        fun `should create user from Auth0 with fromAuth0 factory method`() {
            // Given
            val auth0Sub = "auth0|auth0123"
            val email = "auth0user@example.com"
            
            // When
            val user = User.fromAuth0(auth0Sub, email)
            
            // Then
            assertEquals(auth0Sub, user.auth0Sub)
            assertEquals(email, user.email)
            assertNotNull(user.id)
            assertNotNull(user.createdAt)
            assertNotNull(user.updatedAt)
        }
        
        @Test
        @DisplayName("Should validate parameters in fromAuth0 factory method")
        fun `should validate parameters in fromAuth0 factory method`() {
            // When & Then - blank auth0Sub
            assertThrows(IllegalArgumentException::class.java) {
                User.fromAuth0("", "valid@example.com")
            }
            
            // When & Then - blank email
            assertThrows(IllegalArgumentException::class.java) {
                User.fromAuth0("auth0|valid", "")
            }
        }
    }
    
    @Nested
    @DisplayName("Business Logic Tests")
    inner class BusinessLogicTests {
        
        @Test
        @DisplayName("Should update email and timestamp")
        fun `should update email and timestamp`() {
            // Given
            val originalUser = DomainModelTestBuilder.user(email = "original@example.com")
            val originalUpdatedAt = originalUser.updatedAt
            val newEmail = "updated@example.com"
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedUser = originalUser.updateEmail(newEmail)
            
            // Then
            assertEquals(newEmail, updatedUser.email)
            assertEquals(originalUser.id, updatedUser.id)
            assertEquals(originalUser.auth0Sub, updatedUser.auth0Sub)
            assertEquals(originalUser.createdAt, updatedUser.createdAt)
            assertTrue(updatedUser.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should reject blank email in updateEmail")
        fun `should reject blank email in updateEmail`() {
            // Given
            val user = DomainModelTestBuilder.user()
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                user.updateEmail("")
            }
            assertEquals("Email is required", exception.message)
        }
        
        @Test
        @DisplayName("Should preserve immutability when updating email")
        fun `should preserve immutability when updating email`() {
            // Given
            val originalUser = DomainModelTestBuilder.user(email = "original@example.com")
            val originalEmail = originalUser.email
            
            // When
            val updatedUser = originalUser.updateEmail("new@example.com")
            
            // Then
            assertEquals(originalEmail, originalUser.email) // Original unchanged
            assertEquals("new@example.com", updatedUser.email)
            assertNotSame(originalUser, updatedUser) // Different instances
        }
    }
    
    @Nested
    @DisplayName("Data Class Behavior Tests")
    inner class DataClassBehaviorTests {
        
        @Test
        @DisplayName("Should implement equals and hashCode correctly")
        fun `should implement equals and hashCode correctly`() {
            // Given
            val id = UserId(UUID.randomUUID())
            val auth0Sub = "auth0|same"
            val email = "same@example.com"
            val timestamp = Instant.now()
            
            val user1 = DomainModelTestBuilder.user(
                id = id,
                auth0Sub = auth0Sub,
                email = email,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            val user2 = DomainModelTestBuilder.user(
                id = id,
                auth0Sub = auth0Sub,
                email = email,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            
            // Then
            assertEquals(user1, user2)
            assertEquals(user1.hashCode(), user2.hashCode())
        }
        
        @Test
        @DisplayName("Should not be equal with different properties")
        fun `should not be equal with different properties`() {
            // Given
            val baseUser = DomainModelTestBuilder.user()
            val differentIdUser = baseUser.copy(id = UserId(UUID.randomUUID()))
            val differentAuth0SubUser = baseUser.copy(auth0Sub = "auth0|different")
            val differentEmailUser = baseUser.copy(email = "different@example.com")
            
            // Then
            assertNotEquals(baseUser, differentIdUser)
            assertNotEquals(baseUser, differentAuth0SubUser)
            assertNotEquals(baseUser, differentEmailUser)
        }
        
        @Test
        @DisplayName("Should implement toString with all properties")
        fun `should implement toString with all properties`() {
            // Given
            val user = DomainModelTestBuilder.user(
                auth0Sub = "auth0|test123",
                email = "test@example.com"
            )
            
            // When
            val toString = user.toString()
            
            // Then
            assertTrue(toString.contains("auth0|test123"))
            assertTrue(toString.contains("test@example.com"))
            assertTrue(toString.contains(user.id.toString()))
        }
        
        @Test
        @DisplayName("Should support copy with parameter changes")
        fun `should support copy with parameter changes`() {
            // Given
            val originalUser = DomainModelTestBuilder.user(
                auth0Sub = "auth0|original",
                email = "original@example.com"
            )
            
            // When
            val copiedUser = originalUser.copy(
                auth0Sub = "auth0|copied",
                email = "copied@example.com"
            )
            
            // Then
            assertEquals("auth0|copied", copiedUser.auth0Sub)
            assertEquals("copied@example.com", copiedUser.email)
            assertEquals(originalUser.id, copiedUser.id) // ID preserved
            assertEquals(originalUser.createdAt, copiedUser.createdAt) // Timestamps preserved
            assertEquals(originalUser.updatedAt, copiedUser.updatedAt)
        }
    }
    
    @Nested
    @DisplayName("Edge Cases and Error Handling")
    inner class EdgeCasesTests {
        
        @Test
        @DisplayName("Should handle extremely long but valid email")
        fun `should handle extremely long but valid email`() {
            // Given - Email with very long local part (but still valid)
            val longLocalPart = "a".repeat(64) // Max local part length
            val longEmail = "$longLocalPart@example.com"
            
            // When & Then - Should not throw
            assertDoesNotThrow {
                DomainModelTestBuilder.user(email = longEmail)
            }
        }
        
        @Test
        @DisplayName("Should handle special characters in Auth0 sub")
        fun `should handle special characters in Auth0 sub`() {
            // Given
            val auth0SubWithSpecialChars = "auth0|user-id.with+special_chars@domain"
            
            // When & Then - Should not throw
            val user = DomainModelTestBuilder.user(auth0Sub = auth0SubWithSpecialChars)
            
            assertEquals(auth0SubWithSpecialChars, user.auth0Sub)
        }
        
        @Test
        @DisplayName("Should handle concurrent timestamp updates")
        fun `should handle concurrent timestamp updates`() {
            // Given
            val user = DomainModelTestBuilder.user()
            
            // When - Multiple rapid updates
            val updated1 = user.updateEmail("email1@example.com")
            Thread.sleep(1)
            val updated2 = user.updateEmail("email2@example.com")
            
            // Then
            assertNotEquals(updated1.updatedAt, updated2.updatedAt)
            assertTrue(updated2.updatedAt.isAfter(updated1.updatedAt))
        }
    }
}