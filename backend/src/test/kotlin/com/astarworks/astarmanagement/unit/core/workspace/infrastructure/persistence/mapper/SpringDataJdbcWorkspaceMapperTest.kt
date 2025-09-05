package com.astarworks.astarmanagement.unit.core.workspace.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.workspace.infrastructure.persistence.entity.SpringDataJdbcWorkspaceTable
import com.astarworks.astarmanagement.core.workspace.infrastructure.persistence.mapper.SpringDataJdbcWorkspaceMapper
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TeamId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

@DisplayName("SpringDataJdbcWorkspaceMapper - Workspace Entity Mapping")
class SpringDataJdbcWorkspaceMapperTest : UnitTestBase() {
    
    private val mapper = SpringDataJdbcWorkspaceMapper()
    
    @Nested
    @DisplayName("Domain to Entity Conversion")
    inner class DomainToEntityConversion {
        
        @Test
        @DisplayName("Should convert Workspace domain to SpringDataJdbcWorkspaceTable entity")
        fun shouldConvertWorkspaceToTable() {
            // Given
            val workspaceId = WorkspaceId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val name = "Test Workspace"
            val createdBy = UserId(UUID.randomUUID())
            val teamId = TeamId(UUID.randomUUID())
            val createdAt = Instant.now().minusSeconds(3600)
            val updatedAt = Instant.now()
            
            val workspace = Workspace(
                id = workspaceId,
                tenantId = tenantId,
                name = name,
                createdBy = createdBy,
                teamId = teamId,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val result = mapper.toTable(workspace)
            
            // Then
            assertNotNull(result)
            assertEquals(workspaceId, result.id)
            assertEquals(tenantId, result.tenantId)
            assertEquals(name, result.name)
            assertEquals(createdBy, result.createdBy)
            assertEquals(teamId, result.teamId)
            assertEquals(createdAt, result.createdAt)
            assertEquals(updatedAt, result.updatedAt)
            assertNull(result.version) // New entity has null version
        }
        
        @Test
        @DisplayName("Should handle Workspace with null optional fields")
        fun shouldHandleNullOptionalFields() {
            // Given
            val workspace = Workspace(
                name = "Minimal Workspace",
                tenantId = null,
                createdBy = null,
                teamId = null
            )
            
            // When
            val result = mapper.toTable(workspace)
            
            // Then
            assertEquals("Minimal Workspace", result.name)
            assertNull(result.tenantId)
            assertNull(result.createdBy)
            assertNull(result.teamId)
            assertNotNull(result.id)
            assertNotNull(result.createdAt)
            assertNotNull(result.updatedAt)
            assertNull(result.version)
        }
        
        @Test
        @DisplayName("Should preserve Value Objects during conversion")
        fun shouldPreserveValueObjects() {
            // Given
            val workspaceId = WorkspaceId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            val teamId = TeamId(UUID.randomUUID())
            
            val workspace = Workspace(
                id = workspaceId,
                tenantId = tenantId,
                name = "Test",
                createdBy = userId,
                teamId = teamId
            )
            
            // When
            val result = mapper.toTable(workspace)
            
            // Then
            assertEquals(workspaceId, result.id)
            assertEquals(workspaceId.value, result.id.value)
            assertEquals(tenantId, result.tenantId)
            assertEquals(tenantId.value, result.tenantId?.value)
            assertEquals(userId, result.createdBy)
            assertEquals(userId.value, result.createdBy?.value)
            assertEquals(teamId, result.teamId)
            assertEquals(teamId.value, result.teamId?.value)
        }
        
        @Test
        @DisplayName("Should convert list of Workspaces to table entities")
        fun shouldConvertWorkspaceListToTableList() {
            // Given
            val workspaces = listOf(
                Workspace(name = "Workspace 1", tenantId = TenantId(UUID.randomUUID())),
                Workspace(name = "Workspace 2", createdBy = UserId(UUID.randomUUID())),
                Workspace(name = "Workspace 3", teamId = TeamId(UUID.randomUUID()))
            )
            
            // When
            val result = mapper.toTableList(workspaces)
            
            // Then
            assertEquals(3, result.size)
            assertEquals("Workspace 1", result[0].name)
            assertNotNull(result[0].tenantId)
            assertEquals("Workspace 2", result[1].name)
            assertNotNull(result[1].createdBy)
            assertEquals("Workspace 3", result[2].name)
            assertNotNull(result[2].teamId)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion to table")
        fun shouldHandleEmptyListToTable() {
            // Given
            val workspaces = emptyList<Workspace>()
            
            // When
            val result = mapper.toTableList(workspaces)
            
            // Then
            assertTrue(result.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Entity to Domain Conversion")
    inner class EntityToDomainConversion {
        
        @Test
        @DisplayName("Should convert SpringDataJdbcWorkspaceTable entity to Workspace domain")
        fun shouldConvertTableToWorkspace() {
            // Given
            val workspaceId = WorkspaceId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val name = "Entity Workspace"
            val createdBy = UserId(UUID.randomUUID())
            val teamId = TeamId(UUID.randomUUID())
            val createdAt = Instant.now().minusSeconds(7200)
            val updatedAt = Instant.now()
            
            val table = SpringDataJdbcWorkspaceTable(
                id = workspaceId,
                version = 5L,
                tenantId = tenantId,
                name = name,
                createdBy = createdBy,
                teamId = teamId,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertEquals(workspaceId, result.id)
            assertEquals(tenantId, result.tenantId)
            assertEquals(name, result.name)
            assertEquals(createdBy, result.createdBy)
            assertEquals(teamId, result.teamId)
            assertEquals(createdAt, result.createdAt)
            assertEquals(updatedAt, result.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle entity with null optional fields")
        fun shouldHandleEntityWithNullFields() {
            // Given
            val table = SpringDataJdbcWorkspaceTable(
                id = WorkspaceId(UUID.randomUUID()),
                version = 0L,
                tenantId = null,
                name = "Minimal Entity",
                createdBy = null,
                teamId = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertEquals("Minimal Entity", result.name)
            assertNull(result.tenantId)
            assertNull(result.createdBy)
            assertNull(result.teamId)
        }
        
        @Test
        @DisplayName("Should preserve Value Objects from entity")
        fun shouldPreserveValueObjectsFromEntity() {
            // Given
            val workspaceId = WorkspaceId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val userId = UserId(UUID.randomUUID())
            val teamId = TeamId(UUID.randomUUID())
            
            val table = SpringDataJdbcWorkspaceTable(
                id = workspaceId,
                version = null,
                tenantId = tenantId,
                name = "Test Entity",
                createdBy = userId,
                teamId = teamId,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertEquals(workspaceId, result.id)
            assertEquals(workspaceId.value, result.id.value)
            assertEquals(tenantId, result.tenantId)
            assertEquals(userId, result.createdBy)
            assertEquals(teamId, result.teamId)
        }
        
        @Test
        @DisplayName("Should convert list of table entities to Workspaces")
        fun shouldConvertTableListToWorkspaceList() {
            // Given
            val tables = listOf(
                SpringDataJdbcWorkspaceTable(
                    id = WorkspaceId(UUID.randomUUID()),
                    version = 1L,
                    tenantId = TenantId(UUID.randomUUID()),
                    name = "Entity 1",
                    createdBy = null,
                    teamId = null,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                ),
                SpringDataJdbcWorkspaceTable(
                    id = WorkspaceId(UUID.randomUUID()),
                    version = null,
                    tenantId = null,
                    name = "Entity 2",
                    createdBy = UserId(UUID.randomUUID()),
                    teamId = TeamId(UUID.randomUUID()),
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertEquals(2, result.size)
            assertEquals("Entity 1", result[0].name)
            assertNotNull(result[0].tenantId)
            assertEquals("Entity 2", result[1].name)
            assertNotNull(result[1].createdBy)
            assertNotNull(result[1].teamId)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion from table")
        fun shouldHandleEmptyListFromTable() {
            // Given
            val tables = emptyList<SpringDataJdbcWorkspaceTable>()
            
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
            val originalWorkspace = Workspace(
                id = WorkspaceId(UUID.randomUUID()),
                tenantId = TenantId(UUID.randomUUID()),
                name = "Round Trip Workspace",
                createdBy = UserId(UUID.randomUUID()),
                teamId = TeamId(UUID.randomUUID()),
                createdAt = Instant.now().minusSeconds(1000),
                updatedAt = Instant.now()
            )
            
            // When
            val table = mapper.toTable(originalWorkspace)
            val resultWorkspace = mapper.toDomain(table)
            
            // Then
            assertEquals(originalWorkspace.id, resultWorkspace.id)
            assertEquals(originalWorkspace.tenantId, resultWorkspace.tenantId)
            assertEquals(originalWorkspace.name, resultWorkspace.name)
            assertEquals(originalWorkspace.createdBy, resultWorkspace.createdBy)
            assertEquals(originalWorkspace.teamId, resultWorkspace.teamId)
            assertEquals(originalWorkspace.createdAt, resultWorkspace.createdAt)
            assertEquals(originalWorkspace.updatedAt, resultWorkspace.updatedAt)
        }
        
        @Test
        @DisplayName("Should maintain data integrity with null fields in round-trip")
        fun shouldMaintainIntegrityWithNullFields() {
            // Given
            val originalWorkspace = Workspace(
                name = "Null Fields Workspace",
                tenantId = null,
                createdBy = null,
                teamId = null
            )
            
            // When
            val table = mapper.toTable(originalWorkspace)
            val resultWorkspace = mapper.toDomain(table)
            
            // Then
            assertEquals(originalWorkspace.name, resultWorkspace.name)
            assertNull(resultWorkspace.tenantId)
            assertNull(resultWorkspace.createdBy)
            assertNull(resultWorkspace.teamId)
        }
        
        @Test
        @DisplayName("Should handle Workspace.update method")
        fun shouldHandleUpdateMethod() {
            // Given
            val originalWorkspace = Workspace(
                name = "Original Name",
                tenantId = TenantId(UUID.randomUUID())
            )
            val updatedWorkspace = originalWorkspace.update(name = "Updated Name")
            
            // When
            val table = mapper.toTable(updatedWorkspace)
            val resultWorkspace = mapper.toDomain(table)
            
            // Then
            assertEquals("Updated Name", resultWorkspace.name)
            assertEquals(originalWorkspace.tenantId, resultWorkspace.tenantId)
            assertTrue(resultWorkspace.updatedAt.isAfter(originalWorkspace.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle Workspace.assignToTeam method")
        fun shouldHandleAssignToTeamMethod() {
            // Given
            val originalWorkspace = Workspace(
                name = "Team Workspace",
                teamId = null
            )
            val teamId = TeamId(UUID.randomUUID())
            val assignedWorkspace = originalWorkspace.assignToTeam(teamId)
            
            // When
            val table = mapper.toTable(assignedWorkspace)
            val resultWorkspace = mapper.toDomain(table)
            
            // Then
            assertEquals(teamId, resultWorkspace.teamId)
            assertEquals(originalWorkspace.name, resultWorkspace.name)
            assertTrue(resultWorkspace.updatedAt.isAfter(originalWorkspace.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle Workspace.changeOwner method")
        fun shouldHandleChangeOwnerMethod() {
            // Given
            val originalOwnerId = UserId(UUID.randomUUID())
            val originalWorkspace = Workspace(
                name = "Owner Workspace",
                createdBy = originalOwnerId
            )
            val newOwnerId = UserId(UUID.randomUUID())
            val changedWorkspace = originalWorkspace.changeOwner(newOwnerId)
            
            // When
            val table = mapper.toTable(changedWorkspace)
            val resultWorkspace = mapper.toDomain(table)
            
            // Then
            assertEquals(newOwnerId, resultWorkspace.createdBy)
            assertEquals(originalWorkspace.name, resultWorkspace.name)
            assertTrue(resultWorkspace.updatedAt.isAfter(originalWorkspace.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle Workspace.withTenant method")
        fun shouldHandleWithTenantMethod() {
            // Given
            val originalWorkspace = Workspace(
                name = "Tenant Workspace",
                tenantId = null
            )
            val tenantId = TenantId(UUID.randomUUID())
            val tenantWorkspace = originalWorkspace.withTenant(tenantId)
            
            // When
            val table = mapper.toTable(tenantWorkspace)
            val resultWorkspace = mapper.toDomain(table)
            
            // Then
            assertEquals(tenantId, resultWorkspace.tenantId)
            assertEquals(originalWorkspace.name, resultWorkspace.name)
            // withTenant doesn't update timestamp
            assertEquals(originalWorkspace.updatedAt, resultWorkspace.updatedAt)
        }
    }
    
    @Nested
    @DisplayName("Factory Methods and Special Cases")
    inner class FactoryMethodsAndSpecialCases {
        
        @Test
        @DisplayName("Should handle Workspace.create factory method")
        fun shouldHandleCreateFactoryMethod() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val createdBy = UserId(UUID.randomUUID())
            val workspace = Workspace.create(
                name = "Factory Workspace",
                tenantId = tenantId,
                createdBy = createdBy
            )
            
            // When
            val table = mapper.toTable(workspace)
            val resultWorkspace = mapper.toDomain(table)
            
            // Then
            assertEquals("Factory Workspace", resultWorkspace.name)
            assertEquals(tenantId, resultWorkspace.tenantId)
            assertEquals(createdBy, resultWorkspace.createdBy)
            assertNull(resultWorkspace.teamId)
        }
        
        @Test
        @DisplayName("Should handle Workspace.createDefault factory method")
        fun shouldHandleCreateDefaultFactoryMethod() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val createdBy = UserId(UUID.randomUUID())
            val workspace = Workspace.createDefault(
                tenantId = tenantId,
                createdBy = createdBy
            )
            
            // When
            val table = mapper.toTable(workspace)
            val resultWorkspace = mapper.toDomain(table)
            
            // Then
            assertEquals("Default Workspace", resultWorkspace.name)
            assertEquals(tenantId, resultWorkspace.tenantId)
            assertEquals(createdBy, resultWorkspace.createdBy)
        }
        
        @Test
        @DisplayName("Should handle maximum length workspace name")
        fun shouldHandleMaxLengthName() {
            // Given
            val maxLengthName = "W".repeat(255)
            val workspace = Workspace(name = maxLengthName)
            
            // When
            val table = mapper.toTable(workspace)
            val resultWorkspace = mapper.toDomain(table)
            
            // Then
            assertEquals(maxLengthName, resultWorkspace.name)
            assertEquals(255, resultWorkspace.name.length)
        }
        
        @Test
        @DisplayName("Should preserve exact Instant timestamps")
        fun shouldPreserveExactTimestamps() {
            // Given
            val preciseCreatedAt = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val preciseUpdatedAt = Instant.parse("2024-01-15T14:25:30.987654321Z")
            
            val workspace = Workspace(
                name = "Timestamp Test",
                createdAt = preciseCreatedAt,
                updatedAt = preciseUpdatedAt
            )
            
            // When
            val table = mapper.toTable(workspace)
            val resultWorkspace = mapper.toDomain(table)
            
            // Then
            assertEquals(preciseCreatedAt, resultWorkspace.createdAt)
            assertEquals(preciseUpdatedAt, resultWorkspace.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle multiple conversions of the same object")
        fun shouldHandleMultipleConversions() {
            // Given
            val workspace = Workspace(
                name = "Multiple Test",
                tenantId = TenantId(UUID.randomUUID()),
                createdBy = UserId(UUID.randomUUID())
            )
            
            // When
            val table1 = mapper.toTable(workspace)
            val table2 = mapper.toTable(workspace)
            val table3 = mapper.toTable(workspace)
            
            // Then
            assertEquals(table1.id, table2.id)
            assertEquals(table2.id, table3.id)
            assertEquals(table1.name, table2.name)
            assertEquals(table2.name, table3.name)
            assertEquals(table1.tenantId, table2.tenantId)
            assertEquals(table2.tenantId, table3.tenantId)
        }
    }
}