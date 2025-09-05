package com.astarworks.astarmanagement.unit.core.auth.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.SpringDataJdbcUserRoleTable
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.UserRoleId
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper.SpringDataJdbcUserRoleMapper
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.TenantUserId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Duration
import java.time.Instant
import java.util.UUID

@DisplayName("SpringDataJdbcUserRoleMapper - UserRole Entity Mapping with Composite Key")
class SpringDataJdbcUserRoleMapperTest : UnitTestBase() {
    
    private val mapper = SpringDataJdbcUserRoleMapper()
    
    @Nested
    @DisplayName("Domain to Entity Conversion")
    inner class DomainToEntityConversion {
        
        @Test
        @DisplayName("Should convert UserRole domain to SpringDataJdbcUserRoleTable entity with composite key")
        fun shouldConvertUserRoleToTableWithCompositeKey() {
            // Given
            val tenantUserId = TenantUserId(UUID.randomUUID())
            val roleId = RoleId(UUID.randomUUID())
            val assignedAt = Instant.now().minusSeconds(3600)
            val assignedBy = UserId(UUID.randomUUID())
            
            val userRole = UserRole(
                tenantUserId = tenantUserId,
                roleId = roleId,
                assignedAt = assignedAt,
                assignedBy = assignedBy
            )
            
            // When
            val result = mapper.toTable(userRole)
            
            // Then
            assertNotNull(result)
            assertNotNull(result.id)
            assertEquals(tenantUserId, result.id.tenantUserId)
            assertEquals(roleId, result.id.roleId)
            assertEquals(assignedAt, result.assignedAt)
            assertEquals(assignedBy, result.assignedBy)
            assertNull(result.version) // New entity has null version
        }
        
        @Test
        @DisplayName("Should handle UserRole with null assignedBy (system assigned)")
        fun shouldHandleSystemAssignedRole() {
            // Given
            val userRole = UserRole(
                tenantUserId = TenantUserId(UUID.randomUUID()),
                roleId = RoleId(UUID.randomUUID()),
                assignedBy = null
            )
            
            // When
            val result = mapper.toTable(userRole)
            
            // Then
            assertNotNull(result.id)
            assertNull(result.assignedBy)
            assertNotNull(result.assignedAt)
        }
        
        @Test
        @DisplayName("Should create composite key correctly from domain values")
        fun shouldCreateCompositeKeyCorrectly() {
            // Given
            val tenantUserId = TenantUserId(UUID.randomUUID())
            val roleId = RoleId(UUID.randomUUID())
            
            val userRole = UserRole(
                tenantUserId = tenantUserId,
                roleId = roleId
            )
            
            // When
            val result = mapper.toTable(userRole)
            
            // Then
            val compositeKey = result.id
            assertEquals(tenantUserId, compositeKey.tenantUserId)
            assertEquals(roleId, compositeKey.roleId)
            // Verify it's actually a TenantMembershipId (same as TenantUserId)
            assertTrue(compositeKey.tenantUserId is TenantMembershipId)
        }
        
        @Test
        @DisplayName("Should preserve Value Objects during conversion")
        fun shouldPreserveValueObjects() {
            // Given
            val tenantUserId = TenantUserId(UUID.randomUUID())
            val roleId = RoleId(UUID.randomUUID())
            val assignedBy = UserId(UUID.randomUUID())
            
            val userRole = UserRole(
                tenantUserId = tenantUserId,
                roleId = roleId,
                assignedBy = assignedBy
            )
            
            // When
            val result = mapper.toTable(userRole)
            
            // Then
            assertEquals(tenantUserId.value, result.id.tenantUserId.value)
            assertEquals(roleId.value, result.id.roleId.value)
            assertEquals(assignedBy.value, result.assignedBy?.value)
        }
        
        @Test
        @DisplayName("Should convert list of UserRoles to table entities")
        fun shouldConvertUserRoleListToTableList() {
            // Given
            val userRoles = listOf(
                UserRole(
                    tenantUserId = TenantUserId(UUID.randomUUID()),
                    roleId = RoleId(UUID.randomUUID()),
                    assignedBy = UserId(UUID.randomUUID())
                ),
                UserRole(
                    tenantUserId = TenantUserId(UUID.randomUUID()),
                    roleId = RoleId(UUID.randomUUID()),
                    assignedBy = null
                )
            )
            
            // When
            val result = mapper.toTableList(userRoles)
            
            // Then
            assertEquals(2, result.size)
            assertNotNull(result[0].assignedBy)
            assertNull(result[1].assignedBy)
            assertNotNull(result[0].id)
            assertNotNull(result[1].id)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion to table")
        fun shouldHandleEmptyListToTable() {
            // Given
            val userRoles = emptyList<UserRole>()
            
            // When
            val result = mapper.toTableList(userRoles)
            
            // Then
            assertTrue(result.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Entity to Domain Conversion")
    inner class EntityToDomainConversion {
        
        @Test
        @DisplayName("Should convert SpringDataJdbcUserRoleTable entity to UserRole domain extracting from composite key")
        fun shouldConvertTableToUserRoleExtractingFromCompositeKey() {
            // Given
            val tenantUserId = TenantMembershipId(UUID.randomUUID())
            val roleId = RoleId(UUID.randomUUID())
            val assignedAt = Instant.now().minusSeconds(7200)
            val assignedBy = UserId(UUID.randomUUID())
            
            val table = SpringDataJdbcUserRoleTable(
                id = UserRoleId(
                    tenantUserId = tenantUserId,
                    roleId = roleId
                ),
                version = 2L,
                assignedAt = assignedAt,
                assignedBy = assignedBy
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertEquals(tenantUserId, result.tenantUserId)
            assertEquals(roleId, result.roleId)
            assertEquals(assignedAt, result.assignedAt)
            assertEquals(assignedBy, result.assignedBy)
        }
        
        @Test
        @DisplayName("Should handle entity with null assignedBy")
        fun shouldHandleEntityWithNullAssignedBy() {
            // Given
            val table = SpringDataJdbcUserRoleTable(
                id = UserRoleId(
                    tenantUserId = TenantMembershipId(UUID.randomUUID()),
                    roleId = RoleId(UUID.randomUUID())
                ),
                version = 0L,
                assignedAt = Instant.now(),
                assignedBy = null
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertNull(result.assignedBy)
            assertTrue(result.isSystemAssigned())
        }
        
        @Test
        @DisplayName("Should extract values correctly from composite key")
        fun shouldExtractValuesFromCompositeKey() {
            // Given
            val tenantUserId = TenantMembershipId(UUID.randomUUID())
            val roleId = RoleId(UUID.randomUUID())
            
            val table = SpringDataJdbcUserRoleTable(
                id = UserRoleId(
                    tenantUserId = tenantUserId,
                    roleId = roleId
                ),
                version = null,
                assignedAt = Instant.now(),
                assignedBy = null
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertEquals(tenantUserId, result.tenantUserId)
            assertEquals(roleId, result.roleId)
        }
        
        @Test
        @DisplayName("Should convert list of table entities to UserRoles")
        fun shouldConvertTableListToUserRoleList() {
            // Given
            val tables = listOf(
                SpringDataJdbcUserRoleTable(
                    id = UserRoleId(
                        tenantUserId = TenantMembershipId(UUID.randomUUID()),
                        roleId = RoleId(UUID.randomUUID())
                    ),
                    version = 1L,
                    assignedAt = Instant.now(),
                    assignedBy = UserId(UUID.randomUUID())
                ),
                SpringDataJdbcUserRoleTable(
                    id = UserRoleId(
                        tenantUserId = TenantMembershipId(UUID.randomUUID()),
                        roleId = RoleId(UUID.randomUUID())
                    ),
                    version = null,
                    assignedAt = Instant.now(),
                    assignedBy = null
                )
            )
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertEquals(2, result.size)
            assertNotNull(result[0].assignedBy)
            assertNull(result[1].assignedBy)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion from table")
        fun shouldHandleEmptyListFromTable() {
            // Given
            val tables = emptyList<SpringDataJdbcUserRoleTable>()
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertTrue(result.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Composite Key Handling")
    inner class CompositeKeyHandling {
        
        @Test
        @DisplayName("Should maintain composite key integrity in round-trip")
        fun shouldMaintainCompositeKeyIntegrity() {
            // Given
            val tenantUserId = TenantUserId(UUID.randomUUID())
            val roleId = RoleId(UUID.randomUUID())
            
            val userRole = UserRole(
                tenantUserId = tenantUserId,
                roleId = roleId
            )
            
            // When
            val table = mapper.toTable(userRole)
            val compositeKey = table.id
            val resultRole = mapper.toDomain(table)
            
            // Then
            assertEquals(tenantUserId, compositeKey.tenantUserId)
            assertEquals(roleId, compositeKey.roleId)
            assertEquals(tenantUserId, resultRole.tenantUserId)
            assertEquals(roleId, resultRole.roleId)
        }
        
        @Test
        @DisplayName("Should handle same user with different roles")
        fun shouldHandleSameUserWithDifferentRoles() {
            // Given
            val tenantUserId = TenantUserId(UUID.randomUUID())
            val roleId1 = RoleId(UUID.randomUUID())
            val roleId2 = RoleId(UUID.randomUUID())
            
            val userRole1 = UserRole(tenantUserId = tenantUserId, roleId = roleId1)
            val userRole2 = UserRole(tenantUserId = tenantUserId, roleId = roleId2)
            
            // When
            val table1 = mapper.toTable(userRole1)
            val table2 = mapper.toTable(userRole2)
            
            // Then
            assertEquals(table1.id.tenantUserId, table2.id.tenantUserId)
            assertNotEquals(table1.id.roleId, table2.id.roleId)
        }
        
        @Test
        @DisplayName("Should handle same role for different users")
        fun shouldHandleSameRoleForDifferentUsers() {
            // Given
            val tenantUserId1 = TenantUserId(UUID.randomUUID())
            val tenantUserId2 = TenantUserId(UUID.randomUUID())
            val roleId = RoleId(UUID.randomUUID())
            
            val userRole1 = UserRole(tenantUserId = tenantUserId1, roleId = roleId)
            val userRole2 = UserRole(tenantUserId = tenantUserId2, roleId = roleId)
            
            // When
            val table1 = mapper.toTable(userRole1)
            val table2 = mapper.toTable(userRole2)
            
            // Then
            assertNotEquals(table1.id.tenantUserId, table2.id.tenantUserId)
            assertEquals(table1.id.roleId, table2.id.roleId)
        }
    }
    
    @Nested
    @DisplayName("Bidirectional Conversion")
    inner class BidirectionalConversion {
        
        @Test
        @DisplayName("Should maintain data integrity in round-trip conversion (Domain -> Entity -> Domain)")
        fun shouldMaintainIntegrityDomainToEntityToDomain() {
            // Given
            val originalUserRole = UserRole(
                tenantUserId = TenantUserId(UUID.randomUUID()),
                roleId = RoleId(UUID.randomUUID()),
                assignedAt = Instant.now().minusSeconds(1000),
                assignedBy = UserId(UUID.randomUUID())
            )
            
            // When
            val table = mapper.toTable(originalUserRole)
            val resultUserRole = mapper.toDomain(table)
            
            // Then
            assertEquals(originalUserRole.tenantUserId, resultUserRole.tenantUserId)
            assertEquals(originalUserRole.roleId, resultUserRole.roleId)
            assertEquals(originalUserRole.assignedAt, resultUserRole.assignedAt)
            assertEquals(originalUserRole.assignedBy, resultUserRole.assignedBy)
        }
        
        @Test
        @DisplayName("Should handle UserRole.assign factory method")
        fun shouldHandleAssignFactoryMethod() {
            // Given
            val tenantUserId = TenantUserId(UUID.randomUUID())
            val roleId = RoleId(UUID.randomUUID())
            val assignedBy = UserId(UUID.randomUUID())
            
            val userRole = UserRole.assign(
                tenantUserId = tenantUserId,
                roleId = roleId,
                assignedBy = assignedBy
            )
            
            // When
            val table = mapper.toTable(userRole)
            val resultUserRole = mapper.toDomain(table)
            
            // Then
            assertEquals(tenantUserId, resultUserRole.tenantUserId)
            assertEquals(roleId, resultUserRole.roleId)
            assertEquals(assignedBy, resultUserRole.assignedBy)
            assertFalse(resultUserRole.isSystemAssigned())
        }
        
        @Test
        @DisplayName("Should handle UserRole.systemAssign factory method")
        fun shouldHandleSystemAssignFactoryMethod() {
            // Given
            val tenantUserId = TenantUserId(UUID.randomUUID())
            val roleId = RoleId(UUID.randomUUID())
            
            val userRole = UserRole.systemAssign(
                tenantUserId = tenantUserId,
                roleId = roleId
            )
            
            // When
            val table = mapper.toTable(userRole)
            val resultUserRole = mapper.toDomain(table)
            
            // Then
            assertEquals(tenantUserId, resultUserRole.tenantUserId)
            assertEquals(roleId, resultUserRole.roleId)
            assertNull(resultUserRole.assignedBy)
            assertTrue(resultUserRole.isSystemAssigned())
        }
        
        @Test
        @DisplayName("Should handle UserRole.reassignBy method")
        fun shouldHandleReassignByMethod() {
            // Given
            val originalUserRole = UserRole(
                tenantUserId = TenantUserId(UUID.randomUUID()),
                roleId = RoleId(UUID.randomUUID()),
                assignedBy = UserId(UUID.randomUUID())
            )
            val newAssignerId = UserId(UUID.randomUUID())
            val reassignedRole = originalUserRole.reassignBy(newAssignerId)
            
            // When
            val table = mapper.toTable(reassignedRole)
            val resultUserRole = mapper.toDomain(table)
            
            // Then
            assertEquals(originalUserRole.tenantUserId, resultUserRole.tenantUserId)
            assertEquals(originalUserRole.roleId, resultUserRole.roleId)
            assertEquals(newAssignerId, resultUserRole.assignedBy)
            assertTrue(resultUserRole.assignedAt.isAfter(originalUserRole.assignedAt))
        }
        
        @Test
        @DisplayName("Should handle wasAssignedBy check")
        fun shouldHandleWasAssignedByCheck() {
            // Given
            val assignerId = UserId(UUID.randomUUID())
            val userRole = UserRole(
                tenantUserId = TenantUserId(UUID.randomUUID()),
                roleId = RoleId(UUID.randomUUID()),
                assignedBy = assignerId
            )
            
            // When
            val table = mapper.toTable(userRole)
            val resultUserRole = mapper.toDomain(table)
            
            // Then
            assertTrue(resultUserRole.wasAssignedBy(assignerId))
            assertFalse(resultUserRole.wasAssignedBy(UserId(UUID.randomUUID())))
        }
    }
    
    @Nested
    @DisplayName("Special Cases and Time-based Operations")
    inner class SpecialCasesAndTimeOperations {
        
        @Test
        @DisplayName("Should handle wasAssignedWithin time check")
        fun shouldHandleWasAssignedWithinTimeCheck() {
            // Given
            val recentRole = UserRole(
                tenantUserId = TenantUserId(UUID.randomUUID()),
                roleId = RoleId(UUID.randomUUID()),
                assignedAt = Instant.now().minusSeconds(3600) // 1 hour ago
            )
            
            val oldRole = UserRole(
                tenantUserId = TenantUserId(UUID.randomUUID()),
                roleId = RoleId(UUID.randomUUID()),
                assignedAt = Instant.now().minus(Duration.ofDays(30)) // 30 days ago
            )
            
            // When
            val recentTable = mapper.toTable(recentRole)
            val recentResult = mapper.toDomain(recentTable)
            
            val oldTable = mapper.toTable(oldRole)
            val oldResult = mapper.toDomain(oldTable)
            
            // Then
            assertTrue(recentResult.wasAssignedWithin(1)) // Within 1 day
            assertFalse(oldResult.wasAssignedWithin(7)) // Not within 7 days
        }
        
        @Test
        @DisplayName("Should preserve exact Instant timestamps")
        fun shouldPreserveExactTimestamps() {
            // Given
            val preciseAssignedAt = Instant.parse("2024-01-15T10:30:45.123456789Z")
            
            val userRole = UserRole(
                tenantUserId = TenantUserId(UUID.randomUUID()),
                roleId = RoleId(UUID.randomUUID()),
                assignedAt = preciseAssignedAt,
                assignedBy = null
            )
            
            // When
            val table = mapper.toTable(userRole)
            val resultUserRole = mapper.toDomain(table)
            
            // Then
            assertEquals(preciseAssignedAt, resultUserRole.assignedAt)
        }
        
        @Test
        @DisplayName("Should handle multiple conversions of the same object")
        fun shouldHandleMultipleConversions() {
            // Given
            val userRole = UserRole(
                tenantUserId = TenantUserId(UUID.randomUUID()),
                roleId = RoleId(UUID.randomUUID()),
                assignedBy = UserId(UUID.randomUUID())
            )
            
            // When
            val table1 = mapper.toTable(userRole)
            val table2 = mapper.toTable(userRole)
            val table3 = mapper.toTable(userRole)
            
            // Then
            assertEquals(table1.id.tenantUserId, table2.id.tenantUserId)
            assertEquals(table2.id.tenantUserId, table3.id.tenantUserId)
            assertEquals(table1.id.roleId, table2.id.roleId)
            assertEquals(table2.id.roleId, table3.id.roleId)
            assertEquals(table1.assignedBy, table2.assignedBy)
            assertEquals(table2.assignedBy, table3.assignedBy)
        }
        
        @Test
        @DisplayName("Should distinguish between system and user assignments")
        fun shouldDistinguishBetweenSystemAndUserAssignments() {
            // Given
            val systemRole = UserRole(
                tenantUserId = TenantUserId(UUID.randomUUID()),
                roleId = RoleId(UUID.randomUUID()),
                assignedBy = null
            )
            
            val userRole = UserRole(
                tenantUserId = TenantUserId(UUID.randomUUID()),
                roleId = RoleId(UUID.randomUUID()),
                assignedBy = UserId(UUID.randomUUID())
            )
            
            // When
            val systemTable = mapper.toTable(systemRole)
            val systemResult = mapper.toDomain(systemTable)
            
            val userTable = mapper.toTable(userRole)
            val userResult = mapper.toDomain(userTable)
            
            // Then
            assertTrue(systemResult.isSystemAssigned())
            assertFalse(userResult.isSystemAssigned())
        }
    }
}