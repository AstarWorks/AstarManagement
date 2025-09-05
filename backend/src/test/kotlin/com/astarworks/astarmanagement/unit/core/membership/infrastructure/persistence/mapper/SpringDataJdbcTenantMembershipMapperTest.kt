package com.astarworks.astarmanagement.unit.core.membership.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.infrastructure.persistence.entity.SpringDataJdbcTenantMembershipTable
import com.astarworks.astarmanagement.core.membership.infrastructure.persistence.mapper.SpringDataJdbcTenantMembershipMapper
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Duration
import java.time.Instant
import java.util.UUID

@DisplayName("SpringDataJdbcTenantMembershipMapper - TenantMembership Entity Mapping")
class SpringDataJdbcTenantMembershipMapperTest : UnitTestBase() {
    
    private val mapper = SpringDataJdbcTenantMembershipMapper()
    
    @Nested
    @DisplayName("Domain to Entity Conversion")
    inner class DomainToEntityConversion {
        
        @Test
        @DisplayName("Should convert TenantMembership domain to SpringDataJdbcTenantMembershipTable entity")
        fun shouldConvertTenantMembershipToTable() {
            // Given
            val membershipId = TenantMembershipId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            val isActive = true
            val joinedAt = Instant.now().minusSeconds(86400)
            val lastAccessedAt = Instant.now()
            
            val membership = TenantMembership(
                id = membershipId,
                tenantId = tenantId,
                userId = userId,
                isActive = isActive,
                joinedAt = joinedAt,
                lastAccessedAt = lastAccessedAt
            )
            
            // When
            val result = mapper.toTable(membership)
            
            // Then
            assertNotNull(result)
            assertEquals(membershipId, result.id)
            assertEquals(tenantId, result.tenantId)
            assertEquals(userId, result.userId)
            assertEquals(isActive, result.isActive)
            assertEquals(joinedAt, result.joinedAt)
            assertEquals(lastAccessedAt, result.lastAccessedAt)
            assertNull(result.version) // New entity has null version
        }
        
        @Test
        @DisplayName("Should handle TenantMembership with null lastAccessedAt")
        fun shouldHandleNullLastAccessedAt() {
            // Given
            val membership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                lastAccessedAt = null
            )
            
            // When
            val result = mapper.toTable(membership)
            
            // Then
            assertNotNull(result.tenantId)
            assertNotNull(result.userId)
            assertTrue(result.isActive)
            assertNull(result.lastAccessedAt)
            assertNull(result.version)
        }
        
        @Test
        @DisplayName("Should handle inactive TenantMembership")
        fun shouldHandleInactiveMembership() {
            // Given
            val membership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                isActive = false
            )
            
            // When
            val result = mapper.toTable(membership)
            
            // Then
            assertFalse(result.isActive)
        }
        
        @Test
        @DisplayName("Should preserve Value Objects during conversion")
        fun shouldPreserveValueObjects() {
            // Given
            val membershipId = TenantMembershipId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            
            val membership = TenantMembership(
                id = membershipId,
                tenantId = tenantId,
                userId = userId
            )
            
            // When
            val result = mapper.toTable(membership)
            
            // Then
            assertEquals(membershipId, result.id)
            assertEquals(membershipId.value, result.id.value)
            assertEquals(tenantId, result.tenantId)
            assertEquals(tenantId.value, result.tenantId.value)
            assertEquals(userId, result.userId)
            assertEquals(userId.value, result.userId.value)
        }
        
        @Test
        @DisplayName("Should convert list of TenantMemberships to table entities")
        fun shouldConvertMembershipListToTableList() {
            // Given
            val memberships = listOf(
                TenantMembership(
                    tenantId = TenantId(UUID.randomUUID()),
                    userId = UserId(UUID.randomUUID()),
                    isActive = true
                ),
                TenantMembership(
                    tenantId = TenantId(UUID.randomUUID()),
                    userId = UserId(UUID.randomUUID()),
                    isActive = false
                ),
                TenantMembership(
                    tenantId = TenantId(UUID.randomUUID()),
                    userId = UserId(UUID.randomUUID()),
                    lastAccessedAt = Instant.now()
                )
            )
            
            // When
            val result = mapper.toTableList(memberships)
            
            // Then
            assertEquals(3, result.size)
            assertTrue(result[0].isActive)
            assertFalse(result[1].isActive)
            assertNotNull(result[2].lastAccessedAt)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion to table")
        fun shouldHandleEmptyListToTable() {
            // Given
            val memberships = emptyList<TenantMembership>()
            
            // When
            val result = mapper.toTableList(memberships)
            
            // Then
            assertTrue(result.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Entity to Domain Conversion")
    inner class EntityToDomainConversion {
        
        @Test
        @DisplayName("Should convert SpringDataJdbcTenantMembershipTable entity to TenantMembership domain")
        fun shouldConvertTableToTenantMembership() {
            // Given
            val membershipId = TenantMembershipId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            val isActive = true
            val joinedAt = Instant.now().minusSeconds(172800)
            val lastAccessedAt = Instant.now()
            
            val table = SpringDataJdbcTenantMembershipTable(
                id = membershipId,
                version = 3L,
                tenantId = tenantId,
                userId = userId,
                isActive = isActive,
                joinedAt = joinedAt,
                lastAccessedAt = lastAccessedAt
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertEquals(membershipId, result.id)
            assertEquals(tenantId, result.tenantId)
            assertEquals(userId, result.userId)
            assertEquals(isActive, result.isActive)
            assertEquals(joinedAt, result.joinedAt)
            assertEquals(lastAccessedAt, result.lastAccessedAt)
        }
        
        @Test
        @DisplayName("Should handle entity with null lastAccessedAt")
        fun shouldHandleEntityWithNullLastAccessedAt() {
            // Given
            val table = SpringDataJdbcTenantMembershipTable(
                id = TenantMembershipId(UUID.randomUUID()),
                version = 0L,
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = null
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertNull(result.lastAccessedAt)
            assertTrue(result.isActive)
        }
        
        @Test
        @DisplayName("Should handle inactive entity")
        fun shouldHandleInactiveEntity() {
            // Given
            val table = SpringDataJdbcTenantMembershipTable(
                id = TenantMembershipId(UUID.randomUUID()),
                version = 1L,
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                isActive = false,
                joinedAt = Instant.now(),
                lastAccessedAt = null
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertFalse(result.isActive)
            assertFalse(result.isActiveMember())
        }
        
        @Test
        @DisplayName("Should preserve Value Objects from entity")
        fun shouldPreserveValueObjectsFromEntity() {
            // Given
            val membershipId = TenantMembershipId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            
            val table = SpringDataJdbcTenantMembershipTable(
                id = membershipId,
                version = null,
                tenantId = tenantId,
                userId = userId,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertEquals(membershipId, result.id)
            assertEquals(membershipId.value, result.id.value)
            assertEquals(tenantId, result.tenantId)
            assertEquals(userId, result.userId)
        }
        
        @Test
        @DisplayName("Should convert list of table entities to TenantMemberships")
        fun shouldConvertTableListToMembershipList() {
            // Given
            val tables = listOf(
                SpringDataJdbcTenantMembershipTable(
                    id = TenantMembershipId(UUID.randomUUID()),
                    version = 1L,
                    tenantId = TenantId(UUID.randomUUID()),
                    userId = UserId(UUID.randomUUID()),
                    isActive = true,
                    joinedAt = Instant.now(),
                    lastAccessedAt = Instant.now()
                ),
                SpringDataJdbcTenantMembershipTable(
                    id = TenantMembershipId(UUID.randomUUID()),
                    version = null,
                    tenantId = TenantId(UUID.randomUUID()),
                    userId = UserId(UUID.randomUUID()),
                    isActive = false,
                    joinedAt = Instant.now(),
                    lastAccessedAt = null
                )
            )
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertEquals(2, result.size)
            assertTrue(result[0].isActive)
            assertNotNull(result[0].lastAccessedAt)
            assertFalse(result[1].isActive)
            assertNull(result[1].lastAccessedAt)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion from table")
        fun shouldHandleEmptyListFromTable() {
            // Given
            val tables = emptyList<SpringDataJdbcTenantMembershipTable>()
            
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
            val originalMembership = TenantMembership(
                id = TenantMembershipId(UUID.randomUUID()),
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                isActive = true,
                joinedAt = Instant.now().minusSeconds(10000),
                lastAccessedAt = Instant.now()
            )
            
            // When
            val table = mapper.toTable(originalMembership)
            val resultMembership = mapper.toDomain(table)
            
            // Then
            assertEquals(originalMembership.id, resultMembership.id)
            assertEquals(originalMembership.tenantId, resultMembership.tenantId)
            assertEquals(originalMembership.userId, resultMembership.userId)
            assertEquals(originalMembership.isActive, resultMembership.isActive)
            assertEquals(originalMembership.joinedAt, resultMembership.joinedAt)
            assertEquals(originalMembership.lastAccessedAt, resultMembership.lastAccessedAt)
        }
        
        @Test
        @DisplayName("Should maintain data integrity with null lastAccessedAt")
        fun shouldMaintainIntegrityWithNullLastAccessedAt() {
            // Given
            val originalMembership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                lastAccessedAt = null
            )
            
            // When
            val table = mapper.toTable(originalMembership)
            val resultMembership = mapper.toDomain(table)
            
            // Then
            assertEquals(originalMembership.tenantId, resultMembership.tenantId)
            assertEquals(originalMembership.userId, resultMembership.userId)
            assertNull(resultMembership.lastAccessedAt)
        }
        
        @Test
        @DisplayName("Should handle TenantMembership.deactivate method")
        fun shouldHandleDeactivateMethod() {
            // Given
            val originalMembership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                isActive = true
            )
            val deactivatedMembership = originalMembership.deactivate()
            
            // When
            val table = mapper.toTable(deactivatedMembership)
            val resultMembership = mapper.toDomain(table)
            
            // Then
            assertFalse(resultMembership.isActive)
            assertEquals(originalMembership.tenantId, resultMembership.tenantId)
            assertEquals(originalMembership.userId, resultMembership.userId)
        }
        
        @Test
        @DisplayName("Should handle TenantMembership.reactivate method")
        fun shouldHandleReactivateMethod() {
            // Given
            val originalMembership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                isActive = false,
                lastAccessedAt = null
            )
            val reactivatedMembership = originalMembership.reactivate()
            
            // When
            val table = mapper.toTable(reactivatedMembership)
            val resultMembership = mapper.toDomain(table)
            
            // Then
            assertTrue(resultMembership.isActive)
            assertNotNull(resultMembership.lastAccessedAt)
            assertEquals(originalMembership.tenantId, resultMembership.tenantId)
            assertEquals(originalMembership.userId, resultMembership.userId)
        }
        
        @Test
        @DisplayName("Should handle TenantMembership.updateLastAccess method")
        fun shouldHandleUpdateLastAccessMethod() {
            // Given
            val originalMembership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                lastAccessedAt = Instant.now().minusSeconds(86400)
            )
            val updatedMembership = originalMembership.updateLastAccess()
            
            // When
            val table = mapper.toTable(updatedMembership)
            val resultMembership = mapper.toDomain(table)
            
            // Then
            assertNotNull(resultMembership.lastAccessedAt)
            assertTrue(resultMembership.lastAccessedAt!!.isAfter(originalMembership.lastAccessedAt))
            assertEquals(originalMembership.tenantId, resultMembership.tenantId)
            assertEquals(originalMembership.userId, resultMembership.userId)
        }
    }
    
    @Nested
    @DisplayName("Domain Methods and Special Cases")
    inner class DomainMethodsAndSpecialCases {
        
        @Test
        @DisplayName("Should preserve membership activity status")
        fun shouldPreserveMembershipActivityStatus() {
            // Given
            val activeMembership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                isActive = true
            )
            
            val inactiveMembership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                isActive = false
            )
            
            // When
            val activeTable = mapper.toTable(activeMembership)
            val activeResult = mapper.toDomain(activeTable)
            
            val inactiveTable = mapper.toTable(inactiveMembership)
            val inactiveResult = mapper.toDomain(inactiveTable)
            
            // Then
            assertTrue(activeResult.isActiveMember())
            assertFalse(inactiveResult.isActiveMember())
        }
        
        @Test
        @DisplayName("Should handle new member detection")
        fun shouldHandleNewMemberDetection() {
            // Given
            val newMembership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                joinedAt = Instant.now().minusSeconds(3600) // 1 hour ago
            )
            
            val oldMembership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                joinedAt = Instant.now().minus(Duration.ofDays(30)) // 30 days ago
            )
            
            // When
            val newTable = mapper.toTable(newMembership)
            val newResult = mapper.toDomain(newTable)
            
            val oldTable = mapper.toTable(oldMembership)
            val oldResult = mapper.toDomain(oldTable)
            
            // Then
            assertTrue(newResult.isNewMember())
            assertFalse(oldResult.isNewMember())
        }
        
        @Test
        @DisplayName("Should calculate membership duration correctly")
        fun shouldCalculateMembershipDuration() {
            // Given
            val daysAgo = 15L
            val membership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                joinedAt = Instant.now().minus(Duration.ofDays(daysAgo))
            )
            
            // When
            val table = mapper.toTable(membership)
            val result = mapper.toDomain(table)
            
            // Then
            val duration = result.getMembershipDuration()
            assertTrue(duration >= daysAgo - 1 && duration <= daysAgo + 1) // Allow for small time differences
        }
        
        @Test
        @DisplayName("Should preserve exact Instant timestamps")
        fun shouldPreserveExactTimestamps() {
            // Given
            val preciseJoinedAt = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val preciseLastAccessedAt = Instant.parse("2024-01-15T14:25:30.987654321Z")
            
            val membership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                joinedAt = preciseJoinedAt,
                lastAccessedAt = preciseLastAccessedAt
            )
            
            // When
            val table = mapper.toTable(membership)
            val resultMembership = mapper.toDomain(table)
            
            // Then
            assertEquals(preciseJoinedAt, resultMembership.joinedAt)
            assertEquals(preciseLastAccessedAt, resultMembership.lastAccessedAt)
        }
        
        @Test
        @DisplayName("Should handle multiple conversions of the same object")
        fun shouldHandleMultipleConversions() {
            // Given
            val membership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                isActive = true,
                lastAccessedAt = Instant.now()
            )
            
            // When
            val table1 = mapper.toTable(membership)
            val table2 = mapper.toTable(membership)
            val table3 = mapper.toTable(membership)
            
            // Then
            assertEquals(table1.id, table2.id)
            assertEquals(table2.id, table3.id)
            assertEquals(table1.tenantId, table2.tenantId)
            assertEquals(table2.tenantId, table3.tenantId)
            assertEquals(table1.userId, table2.userId)
            assertEquals(table2.userId, table3.userId)
        }
        
        @Test
        @DisplayName("Should handle membership state transitions")
        fun shouldHandleMembershipStateTransitions() {
            // Given
            val initialMembership = TenantMembership(
                tenantId = TenantId(UUID.randomUUID()),
                userId = UserId(UUID.randomUUID()),
                isActive = true,
                lastAccessedAt = null
            )
            
            // When - deactivate
            val deactivated = initialMembership.deactivate()
            val deactivatedTable = mapper.toTable(deactivated)
            val deactivatedResult = mapper.toDomain(deactivatedTable)
            
            // Then
            assertFalse(deactivatedResult.isActive)
            assertNull(deactivatedResult.lastAccessedAt)
            
            // When - reactivate
            val reactivated = deactivatedResult.reactivate()
            val reactivatedTable = mapper.toTable(reactivated)
            val reactivatedResult = mapper.toDomain(reactivatedTable)
            
            // Then
            assertTrue(reactivatedResult.isActive)
            assertNotNull(reactivatedResult.lastAccessedAt)
            
            // When - update access
            val updated = reactivatedResult.updateLastAccess()
            val updatedTable = mapper.toTable(updated)
            val updatedResult = mapper.toDomain(updatedTable)
            
            // Then
            assertTrue(updatedResult.isActive)
            assertNotNull(updatedResult.lastAccessedAt)
            assertTrue(updatedResult.lastAccessedAt!!.isAfter(reactivatedResult.lastAccessedAt))
        }
    }
}