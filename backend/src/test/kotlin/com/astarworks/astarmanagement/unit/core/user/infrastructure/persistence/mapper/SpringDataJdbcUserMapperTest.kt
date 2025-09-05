package com.astarworks.astarmanagement.unit.core.user.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.SpringDataJdbcUserTable
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.mapper.SpringDataJdbcUserMapper
import com.astarworks.astarmanagement.fixture.TestFixtures
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

@DisplayName("SpringDataJdbcUserMapper - User Entity Mapping")
class SpringDataJdbcUserMapperTest : UnitTestBase() {
    
    private val mapper = SpringDataJdbcUserMapper()
    
    @Nested
    @DisplayName("Domain to Entity Conversion")
    inner class DomainToEntityConversion {
        
        @Test
        @DisplayName("Should convert User domain to SpringDataJdbcUserTable entity")
        fun shouldConvertUserToTable() {
            // Given
            val userId = UserId(UUID.randomUUID())
            val auth0Sub = "auth0|123456"
            val email = "user@example.com"
            val createdAt = Instant.now().minusSeconds(3600)
            val updatedAt = Instant.now()
            
            val user = User(
                id = userId,
                auth0Sub = auth0Sub,
                email = email,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val result = mapper.toTable(user)
            
            // Then
            assertNotNull(result)
            assertEquals(userId, result.id)
            assertEquals(auth0Sub, result.auth0Sub)
            assertEquals(email, result.email)
            assertEquals(createdAt, result.createdAt)
            assertEquals(updatedAt, result.updatedAt)
            assertNull(result.version) // New entity has null version
        }
        
        @Test
        @DisplayName("Should preserve Value Object UserId during conversion")
        fun shouldPreserveUserIdValueObject() {
            // Given
            val userId = UserId(UUID.randomUUID())
            val user = User(
                id = userId,
                auth0Sub = "auth0|test",
                email = "test@example.com"
            )
            
            // When
            val result = mapper.toTable(user)
            
            // Then
            assertEquals(userId, result.id) // Value Objects are equal if their values are equal
            assertEquals(userId.value, result.id.value)
        }
        
        @Test
        @DisplayName("Should handle minimal User with defaults")
        fun shouldHandleMinimalUser() {
            // Given
            val user = User(
                auth0Sub = "auth0|minimal",
                email = "minimal@example.com"
            )
            
            // When
            val result = mapper.toTable(user)
            
            // Then
            assertNotNull(result.id)
            assertEquals("auth0|minimal", result.auth0Sub)
            assertEquals("minimal@example.com", result.email)
            assertNotNull(result.createdAt)
            assertNotNull(result.updatedAt)
            assertNull(result.version)
        }
        
        @Test
        @DisplayName("Should convert list of Users to table entities")
        fun shouldConvertUserListToTableList() {
            // Given
            val users = listOf(
                User(auth0Sub = "auth0|user1", email = "user1@example.com"),
                User(auth0Sub = "auth0|user2", email = "user2@example.com"),
                User(auth0Sub = "auth0|user3", email = "user3@example.com")
            )
            
            // When
            val result = mapper.toTableList(users)
            
            // Then
            assertEquals(3, result.size)
            assertEquals("auth0|user1", result[0].auth0Sub)
            assertEquals("user1@example.com", result[0].email)
            assertEquals("auth0|user2", result[1].auth0Sub)
            assertEquals("user2@example.com", result[1].email)
            assertEquals("auth0|user3", result[2].auth0Sub)
            assertEquals("user3@example.com", result[2].email)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion to table")
        fun shouldHandleEmptyListToTable() {
            // Given
            val users = emptyList<User>()
            
            // When
            val result = mapper.toTableList(users)
            
            // Then
            assertTrue(result.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Entity to Domain Conversion")
    inner class EntityToDomainConversion {
        
        @Test
        @DisplayName("Should convert SpringDataJdbcUserTable entity to User domain")
        fun shouldConvertTableToUser() {
            // Given
            val userId = UserId(UUID.randomUUID())
            val auth0Sub = "auth0|789012"
            val email = "entity@example.com"
            val createdAt = Instant.now().minusSeconds(7200)
            val updatedAt = Instant.now()
            
            val table = SpringDataJdbcUserTable(
                id = userId,
                version = 1L,
                auth0Sub = auth0Sub,
                email = email,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertEquals(userId, result.id)
            assertEquals(auth0Sub, result.auth0Sub)
            assertEquals(email, result.email)
            assertEquals(createdAt, result.createdAt)
            assertEquals(updatedAt, result.updatedAt)
        }
        
        @Test
        @DisplayName("Should preserve UserId Value Object from entity")
        fun shouldPreserveUserIdFromEntity() {
            // Given
            val userId = UserId(UUID.randomUUID())
            val table = SpringDataJdbcUserTable(
                id = userId,
                version = 0L,
                auth0Sub = "auth0|preserve",
                email = "preserve@example.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertEquals(userId, result.id) // Value Objects are equal if their values are equal
            assertEquals(userId.value, result.id.value)
        }
        
        @Test
        @DisplayName("Should handle entity with null version (new entity)")
        fun shouldHandleEntityWithNullVersion() {
            // Given
            val table = SpringDataJdbcUserTable(
                id = UserId(UUID.randomUUID()),
                version = null,
                auth0Sub = "auth0|newentity",
                email = "new@example.com",
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertEquals("auth0|newentity", result.auth0Sub)
            assertEquals("new@example.com", result.email)
        }
        
        @Test
        @DisplayName("Should convert list of table entities to Users")
        fun shouldConvertTableListToUserList() {
            // Given
            val tables = listOf(
                SpringDataJdbcUserTable(
                    id = UserId(UUID.randomUUID()),
                    version = 1L,
                    auth0Sub = "auth0|entity1",
                    email = "entity1@example.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                ),
                SpringDataJdbcUserTable(
                    id = UserId(UUID.randomUUID()),
                    version = 2L,
                    auth0Sub = "auth0|entity2",
                    email = "entity2@example.com",
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertEquals(2, result.size)
            assertEquals("auth0|entity1", result[0].auth0Sub)
            assertEquals("entity1@example.com", result[0].email)
            assertEquals("auth0|entity2", result[1].auth0Sub)
            assertEquals("entity2@example.com", result[1].email)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion from table")
        fun shouldHandleEmptyListFromTable() {
            // Given
            val tables = emptyList<SpringDataJdbcUserTable>()
            
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
            val originalUser = User(
                id = UserId(UUID.randomUUID()),
                auth0Sub = "auth0|roundtrip",
                email = "roundtrip@example.com",
                createdAt = Instant.now().minusSeconds(1000),
                updatedAt = Instant.now()
            )
            
            // When
            val table = mapper.toTable(originalUser)
            val resultUser = mapper.toDomain(table)
            
            // Then
            assertEquals(originalUser.id, resultUser.id)
            assertEquals(originalUser.auth0Sub, resultUser.auth0Sub)
            assertEquals(originalUser.email, resultUser.email)
            assertEquals(originalUser.createdAt, resultUser.createdAt)
            assertEquals(originalUser.updatedAt, resultUser.updatedAt)
        }
        
        @Test
        @DisplayName("Should maintain data integrity in round-trip conversion (Entity -> Domain -> Entity)")
        fun shouldMaintainIntegrityEntityToDomainToEntity() {
            // Given
            val originalTable = SpringDataJdbcUserTable(
                id = UserId(UUID.randomUUID()),
                version = 5L,
                auth0Sub = "auth0|entitytrip",
                email = "entitytrip@example.com",
                createdAt = Instant.now().minusSeconds(2000),
                updatedAt = Instant.now()
            )
            
            // When
            val user = mapper.toDomain(originalTable)
            val resultTable = mapper.toTable(user)
            
            // Then
            assertEquals(originalTable.id, resultTable.id)
            assertEquals(originalTable.auth0Sub, resultTable.auth0Sub)
            assertEquals(originalTable.email, resultTable.email)
            assertEquals(originalTable.createdAt, resultTable.createdAt)
            assertEquals(originalTable.updatedAt, resultTable.updatedAt)
            // Note: version is not preserved (becomes null for new entity)
            assertNull(resultTable.version)
        }
        
        @Test
        @DisplayName("Should handle User.fromAuth0 factory method")
        fun shouldHandleUserFactoryMethod() {
            // Given
            val user = User.fromAuth0(
                auth0Sub = "auth0|factory",
                email = "factory@example.com"
            )
            
            // When
            val table = mapper.toTable(user)
            val resultUser = mapper.toDomain(table)
            
            // Then
            assertEquals(user.auth0Sub, resultUser.auth0Sub)
            assertEquals(user.email, resultUser.email)
            assertNotNull(resultUser.id)
            assertNotNull(resultUser.createdAt)
            assertNotNull(resultUser.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle User.updateEmail method")
        fun shouldHandleUserUpdateEmail() {
            // Given
            val originalUser = User(
                auth0Sub = "auth0|update",
                email = "old@example.com"
            )
            val updatedUser = originalUser.updateEmail("new@example.com")
            
            // When
            val table = mapper.toTable(updatedUser)
            val resultUser = mapper.toDomain(table)
            
            // Then
            assertEquals("new@example.com", resultUser.email)
            assertEquals(originalUser.auth0Sub, resultUser.auth0Sub)
            assertEquals(originalUser.id, resultUser.id)
            assertTrue(resultUser.updatedAt.isAfter(originalUser.updatedAt))
        }
    }
    
    @Nested
    @DisplayName("Special Cases and Edge Cases")
    inner class SpecialCases {
        
        @Test
        @DisplayName("Should handle User with long Auth0 sub string")
        fun shouldHandleLongAuth0Sub() {
            // Given
            val longAuth0Sub = "auth0|" + "a".repeat(100)
            val user = User(
                auth0Sub = longAuth0Sub,
                email = "long@example.com"
            )
            
            // When
            val table = mapper.toTable(user)
            val resultUser = mapper.toDomain(table)
            
            // Then
            assertEquals(longAuth0Sub, resultUser.auth0Sub)
        }
        
        @Test
        @DisplayName("Should handle User with complex email format")
        fun shouldHandleComplexEmail() {
            // Given
            val complexEmail = "user+tag.name@sub.example.co.jp"
            val user = User(
                auth0Sub = "auth0|complex",
                email = complexEmail
            )
            
            // When
            val table = mapper.toTable(user)
            val resultUser = mapper.toDomain(table)
            
            // Then
            assertEquals(complexEmail, resultUser.email)
        }
        
        @Test
        @DisplayName("Should preserve exact Instant timestamps")
        fun shouldPreserveExactTimestamps() {
            // Given
            val preciseCreatedAt = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val preciseUpdatedAt = Instant.parse("2024-01-15T14:25:30.987654321Z")
            
            val user = User(
                auth0Sub = "auth0|timestamp",
                email = "timestamp@example.com",
                createdAt = preciseCreatedAt,
                updatedAt = preciseUpdatedAt
            )
            
            // When
            val table = mapper.toTable(user)
            val resultUser = mapper.toDomain(table)
            
            // Then
            assertEquals(preciseCreatedAt, resultUser.createdAt)
            assertEquals(preciseUpdatedAt, resultUser.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle multiple conversions of the same object")
        fun shouldHandleMultipleConversions() {
            // Given
            val user = User(
                auth0Sub = "auth0|multiple",
                email = "multiple@example.com"
            )
            
            // When
            val table1 = mapper.toTable(user)
            val table2 = mapper.toTable(user)
            val table3 = mapper.toTable(user)
            
            // Then
            assertEquals(table1.id, table2.id)
            assertEquals(table2.id, table3.id)
            assertEquals(table1.auth0Sub, table2.auth0Sub)
            assertEquals(table2.auth0Sub, table3.auth0Sub)
        }
    }
}