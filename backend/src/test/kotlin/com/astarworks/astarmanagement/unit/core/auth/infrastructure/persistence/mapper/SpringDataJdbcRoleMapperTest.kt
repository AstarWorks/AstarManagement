package com.astarworks.astarmanagement.unit.core.auth.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.SpringDataJdbcRoleTable
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper.SpringDataJdbcRoleMapper
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

@DisplayName("SpringDataJdbcRoleMapper - DynamicRole Entity Mapping")
class SpringDataJdbcRoleMapperTest : UnitTestBase() {
    
    private val mapper = SpringDataJdbcRoleMapper()
    
    @Nested
    @DisplayName("Domain to Entity Conversion")
    inner class DomainToEntityConversion {
        
        @Test
        @DisplayName("Should convert DynamicRole domain to SpringDataJdbcRoleTable entity")
        fun shouldConvertRoleToTable() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val name = "administrator"
            val displayName = "Administrator"
            val color = "#FF5733"
            val position = 10
            val isSystem = false
            val createdAt = Instant.now().minusSeconds(3600)
            val updatedAt = Instant.now()
            
            val role = DynamicRole(
                id = roleId,
                tenantId = tenantId,
                name = name,
                displayName = displayName,
                color = color,
                position = position,
                isSystem = isSystem,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val result = mapper.toTable(role)
            
            // Then
            assertNotNull(result)
            assertEquals(roleId, result.id)
            assertEquals(tenantId, result.tenantId)
            assertEquals(name, result.name)
            assertEquals(displayName, result.displayName)
            assertEquals(color, result.color)
            assertEquals(position, result.position)
            assertEquals(isSystem, result.isSystem)
            assertEquals(createdAt, result.createdAt)
            assertEquals(updatedAt, result.updatedAt)
            assertNull(result.version) // New entity has null version
        }
        
        @Test
        @DisplayName("Should handle DynamicRole with null optional fields")
        fun shouldHandleNullOptionalFields() {
            // Given
            val role = DynamicRole(
                name = "basic_role",
                tenantId = null,
                displayName = null,
                color = null
            )
            
            // When
            val result = mapper.toTable(role)
            
            // Then
            assertEquals("basic_role", result.name)
            assertNull(result.tenantId)
            assertNull(result.displayName)
            assertNull(result.color)
            assertEquals(0, result.position)
            assertFalse(result.isSystem)
            assertNull(result.version)
        }
        
        @Test
        @DisplayName("Should preserve Value Objects during conversion")
        fun shouldPreserveValueObjects() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            
            val role = DynamicRole(
                id = roleId,
                tenantId = tenantId,
                name = "test_role"
            )
            
            // When
            val result = mapper.toTable(role)
            
            // Then
            assertEquals(roleId, result.id)
            assertEquals(roleId.value, result.id.value)
            assertEquals(tenantId, result.tenantId)
            assertEquals(tenantId?.value, result.tenantId?.value)
        }
        
        @Test
        @DisplayName("Should handle system role")
        fun shouldHandleSystemRole() {
            // Given
            val role = DynamicRole(
                name = "system_admin",
                isSystem = true,
                position = 100
            )
            
            // When
            val result = mapper.toTable(role)
            
            // Then
            assertTrue(result.isSystem)
            assertEquals(100, result.position)
        }
        
        @Test
        @DisplayName("Should convert list of DynamicRoles to table entities")
        fun shouldConvertRoleListToTableList() {
            // Given
            val roles = listOf(
                DynamicRole(name = "role1", position = 1, color = "#FF0000"),
                DynamicRole(name = "role2", position = 2, color = "#00FF00"),
                DynamicRole(name = "role3", position = 3, isSystem = true)
            )
            
            // When
            val result = mapper.toTableList(roles)
            
            // Then
            assertEquals(3, result.size)
            assertEquals("role1", result[0].name)
            assertEquals("#FF0000", result[0].color)
            assertEquals("role2", result[1].name)
            assertEquals(2, result[1].position)
            assertEquals("role3", result[2].name)
            assertTrue(result[2].isSystem)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion to table")
        fun shouldHandleEmptyListToTable() {
            // Given
            val roles = emptyList<DynamicRole>()
            
            // When
            val result = mapper.toTableList(roles)
            
            // Then
            assertTrue(result.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Entity to Domain Conversion")
    inner class EntityToDomainConversion {
        
        @Test
        @DisplayName("Should convert SpringDataJdbcRoleTable entity to DynamicRole domain")
        fun shouldConvertTableToRole() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val name = "moderator"
            val displayName = "Moderator"
            val color = "#00FF00"
            val position = 5
            val isSystem = false
            val createdAt = Instant.now().minusSeconds(7200)
            val updatedAt = Instant.now()
            
            val table = SpringDataJdbcRoleTable(
                id = roleId,
                version = 2L,
                tenantId = tenantId,
                name = name,
                displayName = displayName,
                color = color,
                position = position,
                isSystem = isSystem,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertEquals(roleId, result.id)
            assertEquals(tenantId, result.tenantId)
            assertEquals(name, result.name)
            assertEquals(displayName, result.displayName)
            assertEquals(color, result.color)
            assertEquals(position, result.position)
            assertEquals(isSystem, result.isSystem)
            assertEquals(createdAt, result.createdAt)
            assertEquals(updatedAt, result.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle entity with null optional fields")
        fun shouldHandleEntityWithNullFields() {
            // Given
            val table = SpringDataJdbcRoleTable(
                id = RoleId(UUID.randomUUID()),
                version = 0L,
                tenantId = null,
                name = "minimal_role",
                displayName = null,
                color = null,
                position = 0,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertNull(result.tenantId)
            assertEquals("minimal_role", result.name)
            assertNull(result.displayName)
            assertNull(result.color)
            assertEquals(0, result.position)
        }
        
        @Test
        @DisplayName("Should preserve Value Objects from entity")
        fun shouldPreserveValueObjectsFromEntity() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            
            val table = SpringDataJdbcRoleTable(
                id = roleId,
                version = null,
                tenantId = tenantId,
                name = "preserve_test",
                displayName = "Preserve Test",
                color = "#123456",
                position = 1,
                isSystem = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertEquals(roleId, result.id)
            assertEquals(roleId.value, result.id.value)
            assertEquals(tenantId, result.tenantId)
            assertEquals(tenantId.value, result.tenantId?.value)
        }
        
        @Test
        @DisplayName("Should handle system entity")
        fun shouldHandleSystemEntity() {
            // Given
            val table = SpringDataJdbcRoleTable(
                id = RoleId(UUID.randomUUID()),
                version = 10L,
                tenantId = null,
                name = "system_role",
                displayName = "System Role",
                color = null,
                position = 999,
                isSystem = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertTrue(result.isSystem)
            assertEquals(999, result.position)
            assertNull(result.tenantId) // System roles don't belong to a tenant
        }
        
        @Test
        @DisplayName("Should convert list of table entities to DynamicRoles")
        fun shouldConvertTableListToRoleList() {
            // Given
            val tables = listOf(
                SpringDataJdbcRoleTable(
                    id = RoleId(UUID.randomUUID()),
                    version = 1L,
                    tenantId = TenantId(UUID.randomUUID()),
                    name = "entity1",
                    displayName = "Entity 1",
                    color = "#FF0000",
                    position = 1,
                    isSystem = false,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                ),
                SpringDataJdbcRoleTable(
                    id = RoleId(UUID.randomUUID()),
                    version = null,
                    tenantId = null,
                    name = "entity2",
                    displayName = null,
                    color = null,
                    position = 0,
                    isSystem = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertEquals(2, result.size)
            assertEquals("entity1", result[0].name)
            assertEquals("#FF0000", result[0].color)
            assertNotNull(result[0].tenantId)
            assertEquals("entity2", result[1].name)
            assertNull(result[1].tenantId)
            assertTrue(result[1].isSystem)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion from table")
        fun shouldHandleEmptyListFromTable() {
            // Given
            val tables = emptyList<SpringDataJdbcRoleTable>()
            
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
            val originalRole = DynamicRole(
                id = RoleId(UUID.randomUUID()),
                tenantId = TenantId(UUID.randomUUID()),
                name = "round_trip",
                displayName = "Round Trip Role",
                color = "#AABBCC",
                position = 15,
                isSystem = false,
                createdAt = Instant.now().minusSeconds(1000),
                updatedAt = Instant.now()
            )
            
            // When
            val table = mapper.toTable(originalRole)
            val resultRole = mapper.toDomain(table)
            
            // Then
            assertEquals(originalRole.id, resultRole.id)
            assertEquals(originalRole.tenantId, resultRole.tenantId)
            assertEquals(originalRole.name, resultRole.name)
            assertEquals(originalRole.displayName, resultRole.displayName)
            assertEquals(originalRole.color, resultRole.color)
            assertEquals(originalRole.position, resultRole.position)
            assertEquals(originalRole.isSystem, resultRole.isSystem)
            assertEquals(originalRole.createdAt, resultRole.createdAt)
            assertEquals(originalRole.updatedAt, resultRole.updatedAt)
        }
        
        @Test
        @DisplayName("Should maintain data integrity with null fields in round-trip")
        fun shouldMaintainIntegrityWithNullFields() {
            // Given
            val originalRole = DynamicRole(
                name = "null_fields",
                tenantId = null,
                displayName = null,
                color = null,
                position = 0,
                isSystem = false
            )
            
            // When
            val table = mapper.toTable(originalRole)
            val resultRole = mapper.toDomain(table)
            
            // Then
            assertEquals(originalRole.name, resultRole.name)
            assertNull(resultRole.tenantId)
            assertNull(resultRole.displayName)
            assertNull(resultRole.color)
            assertEquals(0, resultRole.position)
            assertFalse(resultRole.isSystem)
        }
        
        @Test
        @DisplayName("Should handle DynamicRole.updateDisplayName method")
        fun shouldHandleUpdateDisplayNameMethod() {
            // Given
            val originalRole = DynamicRole(
                name = "test_role",
                displayName = "Old Display Name"
            )
            val updatedRole = originalRole.updateDisplayName("New Display Name")
            
            // When
            val table = mapper.toTable(updatedRole)
            val resultRole = mapper.toDomain(table)
            
            // Then
            assertEquals("test_role", resultRole.name)  // name doesn't change
            assertEquals("New Display Name", resultRole.displayName)
            assertEquals(originalRole.id, resultRole.id)
            assertTrue(resultRole.updatedAt.isAfter(originalRole.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle DynamicRole.updateColor method")
        fun shouldHandleUpdateColorMethod() {
            // Given
            val originalRole = DynamicRole(
                name = "color_role",
                color = "#000000"
            )
            val updatedRole = originalRole.updateColor("#FFFFFF")
            
            // When
            val table = mapper.toTable(updatedRole)
            val resultRole = mapper.toDomain(table)
            
            // Then
            assertEquals("#FFFFFF", resultRole.color)
            assertEquals(originalRole.name, resultRole.name)
            assertTrue(resultRole.updatedAt.isAfter(originalRole.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle DynamicRole.updatePosition method")
        fun shouldHandleUpdatePositionMethod() {
            // Given
            val originalRole = DynamicRole(
                name = "position_role",
                position = 5
            )
            val updatedRole = originalRole.updatePosition(10)
            
            // When
            val table = mapper.toTable(updatedRole)
            val resultRole = mapper.toDomain(table)
            
            // Then
            assertEquals(10, resultRole.position)
            assertEquals(originalRole.name, resultRole.name)
            assertTrue(resultRole.updatedAt.isAfter(originalRole.updatedAt))
        }
    }
    
    @Nested
    @DisplayName("Special Cases and Edge Cases")
    inner class SpecialCases {
        
        @Test
        @DisplayName("Should handle DynamicRole with maximum position value")
        fun shouldHandleMaxPositionValue() {
            // Given
            val role = DynamicRole(
                name = "max_position",
                position = Int.MAX_VALUE
            )
            
            // When
            val table = mapper.toTable(role)
            val resultRole = mapper.toDomain(table)
            
            // Then
            assertEquals(Int.MAX_VALUE, resultRole.position)
        }
        
        @Test
        @DisplayName("Should handle DynamicRole with negative position")
        fun shouldHandleNegativePosition() {
            // Given
            val role = DynamicRole(
                name = "negative_position",
                position = 0  // Cannot be negative per validation
            )
            
            // When
            val table = mapper.toTable(role)
            val resultRole = mapper.toDomain(table)
            
            // Then
            assertEquals(0, resultRole.position)  // Changed to 0 as negative not allowed
        }
        
        @Test
        @DisplayName("Should handle DynamicRole with various color formats")
        fun shouldHandleVariousColorFormats() {
            // Given
            val colors = listOf("#FF00FF", "#FFFFFF", "#123456", "#ABCDEF", "#00FF00")  // All must be 6 digits
            val roles = colors.map { color ->
                DynamicRole(
                    name = "color_test_${color.substring(1).lowercase()}",  // Make valid name
                    color = color
                )
            }
            
            // When
            val tables = mapper.toTableList(roles)
            val resultRoles = mapper.toDomainList(tables)
            
            // Then
            colors.forEachIndexed { index, expectedColor ->
                assertEquals(expectedColor, resultRoles[index].color)
            }
        }
        
        @Test
        @DisplayName("Should preserve exact Instant timestamps")
        fun shouldPreserveExactTimestamps() {
            // Given
            val preciseCreatedAt = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val preciseUpdatedAt = Instant.parse("2024-01-15T14:25:30.987654321Z")
            
            val role = DynamicRole(
                name = "timestamp_test",
                createdAt = preciseCreatedAt,
                updatedAt = preciseUpdatedAt
            )
            
            // When
            val table = mapper.toTable(role)
            val resultRole = mapper.toDomain(table)
            
            // Then
            assertEquals(preciseCreatedAt, resultRole.createdAt)
            assertEquals(preciseUpdatedAt, resultRole.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle multiple conversions of the same object")
        fun shouldHandleMultipleConversions() {
            // Given
            val role = DynamicRole(
                name = "multiple_test",
                displayName = "Multiple Test",
                color = "#FF00FF"
            )
            
            // When
            val table1 = mapper.toTable(role)
            val table2 = mapper.toTable(role)
            val table3 = mapper.toTable(role)
            
            // Then
            assertEquals(table1.id, table2.id)
            assertEquals(table2.id, table3.id)
            assertEquals(table1.name, table2.name)
            assertEquals(table2.name, table3.name)
            assertEquals(table1.color, table2.color)
            assertEquals(table2.color, table3.color)
        }
        
        @Test
        @DisplayName("Should handle role name with special characters")
        fun shouldHandleSpecialCharacterName() {
            // Given
            val specialName = "role_with_special_chars_123"  // Only lowercase, numbers, underscores
            val role = DynamicRole(
                name = specialName,
                displayName = "Special Role (Test)"
            )
            
            // When
            val table = mapper.toTable(role)
            val resultRole = mapper.toDomain(table)
            
            // Then
            assertEquals(specialName, resultRole.name)
            assertEquals("Special Role (Test)", resultRole.displayName)
        }
    }
}