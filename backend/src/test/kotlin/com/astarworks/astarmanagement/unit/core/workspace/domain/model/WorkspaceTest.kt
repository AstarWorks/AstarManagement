package com.astarworks.astarmanagement.unit.core.workspace.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import com.astarworks.astarmanagement.shared.domain.value.*
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
@DisplayName("Workspace Domain Model Tests")
class WorkspaceTest {
    
    companion object {
        @JvmStatic
        fun invalidNameCases(): Stream<String> {
            return Stream.of("", "   ", "\t", "\n")
        }
        
        @JvmStatic
        fun longNameCases(): Stream<String> {
            return Stream.of(
                "a".repeat(255),  // exactly at limit
                "a".repeat(256)   // over limit
            )
        }
        
        @JvmStatic
        fun validNameCases(): Stream<String> {
            return Stream.of(
                "Test Workspace",
                "My Workspace 123",
                "ワークスペース名前",  // Japanese
                "Espacio de Trabajo",  // Spanish
                "a".repeat(255)        // at boundary
            )
        }
    }
    
    @Nested
    @DisplayName("Construction and Validation Tests")
    inner class ConstructionTests {
        
        @Test
        @DisplayName("Should create workspace with valid parameters")
        fun `should create workspace with valid parameters`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val name = "Test Workspace"
            val createdBy = UserId(UUID.randomUUID())
            val teamId = TeamId(UUID.randomUUID())
            
            // When
            val workspace = DomainModelTestBuilder.workspace(
                tenantId = tenantId,
                name = name,
                createdBy = createdBy,
                teamId = teamId
            )
            
            // Then
            assertEquals(tenantId, workspace.tenantId)
            assertEquals(name, workspace.name)
            assertEquals(createdBy, workspace.createdBy)
            assertEquals(teamId, workspace.teamId)
            assertNotNull(workspace.id)
            assertNotNull(workspace.createdAt)
            assertNotNull(workspace.updatedAt)
        }
        
        @Test
        @DisplayName("Should create workspace with null optional fields")
        fun `should create workspace with null optional fields`() {
            // Given
            val name = "Minimal Workspace"
            
            // When
            val workspace = DomainModelTestBuilder.workspace(
                tenantId = null,
                name = name,
                createdBy = null,
                teamId = null
            )
            
            // Then
            assertNull(workspace.tenantId)
            assertEquals(name, workspace.name)
            assertNull(workspace.createdBy)
            assertNull(workspace.teamId)
        }
        
        @Test
        @DisplayName("Should generate unique ID automatically")
        fun `should generate unique ID automatically`() {
            // When
            val workspace1 = DomainModelTestBuilder.workspace()
            val workspace2 = DomainModelTestBuilder.workspace()
            
            // Then
            assertNotNull(workspace1.id)
            assertNotNull(workspace2.id)
            assertNotEquals(workspace1.id, workspace2.id)
        }
        
        @ParameterizedTest(name = "Should reject blank name: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.workspace.domain.model.WorkspaceTest#invalidNameCases")
        fun `should reject blank name`(invalidName: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.workspace(name = invalidName)
            }
            assertEquals("Workspace name must not be blank", exception.message)
        }
        
        @Test
        @DisplayName("Should accept name at character limit")
        fun `should accept name at character limit`() {
            // Given
            val nameAt255 = "a".repeat(255)
            
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.workspace(name = nameAt255)
            }
        }
        
        @Test
        @DisplayName("Should reject name over character limit")
        fun `should reject name over character limit`() {
            // Given
            val nameOver255 = "a".repeat(256)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.workspace(name = nameOver255)
            }
            assertEquals("Workspace name must not exceed 255 characters", exception.message)
        }
        
        @ParameterizedTest(name = "Should accept valid name: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.workspace.domain.model.WorkspaceTest#validNameCases")
        fun `should accept valid names`(validName: String) {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.workspace(name = validName)
            }
        }
    }
    
    @Nested
    @DisplayName("Factory Method Tests")
    inner class FactoryMethodTests {
        
        @Test
        @DisplayName("Should create workspace with create factory method")
        fun `should create workspace with create factory method`() {
            // Given
            val name = "Factory Workspace"
            val tenantId = TenantId(UUID.randomUUID())
            val createdBy = UserId(UUID.randomUUID())
            
            // When
            val workspace = Workspace.create(name, tenantId, createdBy)
            
            // Then
            assertEquals(name, workspace.name)
            assertEquals(tenantId, workspace.tenantId)
            assertEquals(createdBy, workspace.createdBy)
            assertNotNull(workspace.id)
            assertNotNull(workspace.createdAt)
            assertNotNull(workspace.updatedAt)
        }
        
        @Test
        @DisplayName("Should create workspace with minimal parameters")
        fun `should create workspace with minimal parameters`() {
            // Given
            val name = "Simple Workspace"
            
            // When
            val workspace = Workspace.create(name)
            
            // Then
            assertEquals(name, workspace.name)
            assertNull(workspace.tenantId)
            assertNull(workspace.createdBy)
        }
        
        @Test
        @DisplayName("Should create default workspace")
        fun `should create default workspace`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val createdBy = UserId(UUID.randomUUID())
            
            // When
            val workspace = Workspace.createDefault(tenantId, createdBy)
            
            // Then
            assertEquals("Default Workspace", workspace.name)
            assertEquals(tenantId, workspace.tenantId)
            assertEquals(createdBy, workspace.createdBy)
        }
        
        @Test
        @DisplayName("Should create default workspace with minimal parameters")
        fun `should create default workspace with minimal parameters`() {
            // When
            val workspace = Workspace.createDefault()
            
            // Then
            assertEquals("Default Workspace", workspace.name)
            assertNull(workspace.tenantId)
            assertNull(workspace.createdBy)
        }
        
        @Test
        @DisplayName("Should validate parameters in create factory method")
        fun `should validate parameters in create factory method`() {
            // When & Then
            assertThrows(IllegalArgumentException::class.java) {
                Workspace.create("")
            }
            
            assertThrows(IllegalArgumentException::class.java) {
                Workspace.create("a".repeat(256))
            }
        }
    }
    
    @Nested
    @DisplayName("Update Operations Tests")
    inner class UpdateOperationsTests {
        
        @Test
        @DisplayName("Should update workspace name and timestamp")
        fun `should update workspace name and timestamp`() {
            // Given
            val originalWorkspace = DomainModelTestBuilder.workspace(name = "Original Name")
            val originalUpdatedAt = originalWorkspace.updatedAt
            val newName = "Updated Name"
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedWorkspace = originalWorkspace.update(name = newName)
            
            // Then
            assertEquals(newName, updatedWorkspace.name)
            assertEquals(originalWorkspace.id, updatedWorkspace.id)
            assertEquals(originalWorkspace.tenantId, updatedWorkspace.tenantId)
            assertEquals(originalWorkspace.createdBy, updatedWorkspace.createdBy)
            assertEquals(originalWorkspace.createdAt, updatedWorkspace.createdAt)
            assertTrue(updatedWorkspace.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should update with null name parameter")
        fun `should update with null name parameter`() {
            // Given
            val originalWorkspace = DomainModelTestBuilder.workspace(name = "Original Name")
            val originalName = originalWorkspace.name
            
            // When
            val updatedWorkspace = originalWorkspace.update(name = null)
            
            // Then
            assertEquals(originalName, updatedWorkspace.name) // Name should remain unchanged
        }
        
        @Test
        @DisplayName("Should reject blank name in update")
        fun `should reject blank name in update`() {
            // Given
            val workspace = DomainModelTestBuilder.workspace()
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                workspace.update(name = "")
            }
            assertEquals("Workspace name must not be blank", exception.message)
        }
        
        @Test
        @DisplayName("Should reject too long name in update")
        fun `should reject too long name in update`() {
            // Given
            val workspace = DomainModelTestBuilder.workspace()
            val tooLongName = "a".repeat(256)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                workspace.update(name = tooLongName)
            }
            assertEquals("Workspace name must not exceed 255 characters", exception.message)
        }
        
        @Test
        @DisplayName("Should preserve immutability when updating")
        fun `should preserve immutability when updating`() {
            // Given
            val originalWorkspace = DomainModelTestBuilder.workspace(name = "Original")
            val originalName = originalWorkspace.name
            
            // When
            val updatedWorkspace = originalWorkspace.update(name = "Updated")
            
            // Then
            assertEquals(originalName, originalWorkspace.name) // Original unchanged
            assertEquals("Updated", updatedWorkspace.name)
            assertNotSame(originalWorkspace, updatedWorkspace) // Different instances
        }
    }
    
    @Nested
    @DisplayName("Tenant Operations Tests")
    inner class TenantOperationsTests {
        
        @Test
        @DisplayName("Should assign tenant ID")
        fun `should assign tenant ID`() {
            // Given
            val workspace = DomainModelTestBuilder.workspace(tenantId = null)
            val tenantId = TenantId(UUID.randomUUID())
            
            // When
            val updatedWorkspace = workspace.withTenant(tenantId)
            
            // Then
            assertEquals(tenantId, updatedWorkspace.tenantId)
            assertEquals(workspace.name, updatedWorkspace.name) // Other fields preserved
            assertEquals(workspace.createdBy, updatedWorkspace.createdBy)
        }
        
        @Test
        @DisplayName("Should check if workspace belongs to tenant")
        fun `should check if workspace belongs to tenant`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val otherTenantId = TenantId(UUID.randomUUID())
            val workspace = DomainModelTestBuilder.workspace(tenantId = tenantId)
            
            // When & Then
            assertTrue(workspace.belongsToTenant(tenantId))
            assertFalse(workspace.belongsToTenant(otherTenantId))
        }
        
        @Test
        @DisplayName("Should return false for belongsToTenant when tenantId is null")
        fun `should return false for belongsToTenant when tenantId is null`() {
            // Given
            val workspace = DomainModelTestBuilder.workspace(tenantId = null)
            val tenantId = TenantId(UUID.randomUUID())
            
            // When & Then
            assertFalse(workspace.belongsToTenant(tenantId))
        }
        
        @Test
        @DisplayName("Should check if workspace is multi-tenant")
        fun `should check if workspace is multi-tenant`() {
            // Given
            val multiTenantWorkspace = DomainModelTestBuilder.workspace(tenantId = TenantId(UUID.randomUUID()))
            val singleTenantWorkspace = DomainModelTestBuilder.workspace(tenantId = null)
            
            // When & Then
            assertTrue(multiTenantWorkspace.isMultiTenant())
            assertFalse(singleTenantWorkspace.isMultiTenant())
        }
    }
    
    @Nested
    @DisplayName("Ownership Operations Tests")
    inner class OwnershipOperationsTests {
        
        @Test
        @DisplayName("Should check workspace ownership")
        fun `should check workspace ownership`() {
            // Given
            val ownerId = UserId(UUID.randomUUID())
            val otherUserId = UserId(UUID.randomUUID())
            val workspace = DomainModelTestBuilder.workspace(createdBy = ownerId)
            
            // When & Then
            assertTrue(workspace.isOwnedBy(ownerId))
            assertFalse(workspace.isOwnedBy(otherUserId))
        }
        
        @Test
        @DisplayName("Should return false for isOwnedBy when createdBy is null")
        fun `should return false for isOwnedBy when createdBy is null`() {
            // Given
            val workspace = DomainModelTestBuilder.workspace(createdBy = null)
            val userId = UserId(UUID.randomUUID())
            
            // When & Then
            assertFalse(workspace.isOwnedBy(userId))
        }
        
        @Test
        @DisplayName("Should change owner and update timestamp")
        fun `should change owner and update timestamp`() {
            // Given
            val originalOwner = UserId(UUID.randomUUID())
            val newOwner = UserId(UUID.randomUUID())
            val originalWorkspace = DomainModelTestBuilder.workspace(createdBy = originalOwner)
            val originalUpdatedAt = originalWorkspace.updatedAt
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedWorkspace = originalWorkspace.changeOwner(newOwner)
            
            // Then
            assertEquals(newOwner, updatedWorkspace.createdBy)
            assertEquals(originalWorkspace.id, updatedWorkspace.id)
            assertEquals(originalWorkspace.tenantId, updatedWorkspace.tenantId)
            assertEquals(originalWorkspace.name, updatedWorkspace.name)
            assertTrue(updatedWorkspace.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should preserve immutability when changing owner")
        fun `should preserve immutability when changing owner`() {
            // Given
            val originalOwner = UserId(UUID.randomUUID())
            val newOwner = UserId(UUID.randomUUID())
            val originalWorkspace = DomainModelTestBuilder.workspace(createdBy = originalOwner)
            
            // When
            val updatedWorkspace = originalWorkspace.changeOwner(newOwner)
            
            // Then
            assertEquals(originalOwner, originalWorkspace.createdBy) // Original unchanged
            assertEquals(newOwner, updatedWorkspace.createdBy)
            assertNotSame(originalWorkspace, updatedWorkspace) // Different instances
        }
    }
    
    @Nested
    @DisplayName("Team Operations Tests")
    inner class TeamOperationsTests {
        
        @Test
        @DisplayName("Should check if workspace belongs to team")
        fun `should check if workspace belongs to team`() {
            // Given
            val teamId = TeamId(UUID.randomUUID())
            val otherTeamId = TeamId(UUID.randomUUID())
            val workspace = DomainModelTestBuilder.workspace(teamId = teamId)
            
            // When & Then
            assertTrue(workspace.belongsToTeam(teamId))
            assertFalse(workspace.belongsToTeam(otherTeamId))
        }
        
        @Test
        @DisplayName("Should return false for belongsToTeam when teamId is null")
        fun `should return false for belongsToTeam when teamId is null`() {
            // Given
            val workspace = DomainModelTestBuilder.workspace(teamId = null)
            val teamId = TeamId(UUID.randomUUID())
            
            // When & Then
            assertFalse(workspace.belongsToTeam(teamId))
        }
        
        @Test
        @DisplayName("Should assign team and update timestamp")
        fun `should assign team and update timestamp`() {
            // Given
            val workspace = DomainModelTestBuilder.workspace(teamId = null)
            val teamId = TeamId(UUID.randomUUID())
            val originalUpdatedAt = workspace.updatedAt
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedWorkspace = workspace.assignToTeam(teamId)
            
            // Then
            assertEquals(teamId, updatedWorkspace.teamId)
            assertEquals(workspace.name, updatedWorkspace.name) // Other fields preserved
            assertEquals(workspace.tenantId, updatedWorkspace.tenantId)
            assertTrue(updatedWorkspace.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should reassign to different team")
        fun `should reassign to different team`() {
            // Given
            val originalTeam = TeamId(UUID.randomUUID())
            val newTeam = TeamId(UUID.randomUUID())
            val workspace = DomainModelTestBuilder.workspace(teamId = originalTeam)
            
            // When
            val updatedWorkspace = workspace.assignToTeam(newTeam)
            
            // Then
            assertEquals(newTeam, updatedWorkspace.teamId)
            assertEquals(originalTeam, workspace.teamId) // Original unchanged
        }
    }
    
    @Nested
    @DisplayName("Data Class Behavior Tests")
    inner class DataClassBehaviorTests {
        
        @Test
        @DisplayName("Should implement equals and hashCode correctly")
        fun `should implement equals and hashCode correctly`() {
            // Given
            val id = WorkspaceId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val name = "Same Name"
            val createdBy = UserId(UUID.randomUUID())
            val teamId = TeamId(UUID.randomUUID())
            val timestamp = Instant.now()
            
            val workspace1 = DomainModelTestBuilder.workspace(
                id = id,
                tenantId = tenantId,
                name = name,
                createdBy = createdBy,
                teamId = teamId,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            val workspace2 = DomainModelTestBuilder.workspace(
                id = id,
                tenantId = tenantId,
                name = name,
                createdBy = createdBy,
                teamId = teamId,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            
            // Then
            assertEquals(workspace1, workspace2)
            assertEquals(workspace1.hashCode(), workspace2.hashCode())
        }
        
        @Test
        @DisplayName("Should not be equal with different properties")
        fun `should not be equal with different properties`() {
            // Given
            val baseWorkspace = DomainModelTestBuilder.workspace()
            val differentIdWorkspace = baseWorkspace.copy(id = WorkspaceId(UUID.randomUUID()))
            val differentNameWorkspace = baseWorkspace.copy(name = "Different Name")
            val differentTenantWorkspace = baseWorkspace.copy(tenantId = TenantId(UUID.randomUUID()))
            
            // Then
            assertNotEquals(baseWorkspace, differentIdWorkspace)
            assertNotEquals(baseWorkspace, differentNameWorkspace)
            assertNotEquals(baseWorkspace, differentTenantWorkspace)
        }
        
        @Test
        @DisplayName("Should implement toString with all properties")
        fun `should implement toString with all properties`() {
            // Given
            val workspace = DomainModelTestBuilder.workspace(
                name = "Test Workspace",
                tenantId = TenantId(UUID.randomUUID()),
                createdBy = UserId(UUID.randomUUID())
            )
            
            // When
            val toString = workspace.toString()
            
            // Then
            assertTrue(toString.contains("Test Workspace"))
            assertTrue(toString.contains(workspace.id.toString()))
            assertTrue(toString.contains(workspace.tenantId.toString()))
            assertTrue(toString.contains(workspace.createdBy.toString()))
        }
        
        @Test
        @DisplayName("Should support copy with parameter changes")
        fun `should support copy with parameter changes`() {
            // Given
            val originalWorkspace = DomainModelTestBuilder.workspace(
                name = "Original Name",
                tenantId = TenantId(UUID.randomUUID())
            )
            
            // When
            val copiedWorkspace = originalWorkspace.copy(
                name = "Copied Name",
                tenantId = TenantId(UUID.randomUUID())
            )
            
            // Then
            assertEquals("Copied Name", copiedWorkspace.name)
            assertNotEquals(originalWorkspace.tenantId, copiedWorkspace.tenantId)
            assertEquals(originalWorkspace.id, copiedWorkspace.id) // ID preserved
            assertEquals(originalWorkspace.createdBy, copiedWorkspace.createdBy) // Owner preserved
        }
    }
    
    @Nested
    @DisplayName("Edge Cases and Integration Tests")
    inner class EdgeCasesTests {
        
        @Test
        @DisplayName("Should handle Unicode characters in workspace name")
        fun `should handle Unicode characters in workspace name`() {
            // Given
            val unicodeWorkspaceName = "ワークスペース 🏢 José's Workspace"
            
            // When & Then
            val workspace = DomainModelTestBuilder.workspace(name = unicodeWorkspaceName)
            
            assertEquals(unicodeWorkspaceName, workspace.name)
        }
        
        @Test
        @DisplayName("Should handle rapid successive updates")
        fun `should handle rapid successive updates`() {
            // Given
            val workspace = DomainModelTestBuilder.workspace()
            
            // When
            var currentWorkspace = workspace
            repeat(10) { i ->
                currentWorkspace = currentWorkspace.update(name = "Name $i")
            }
            
            // Then
            assertEquals("Name 9", currentWorkspace.name)
            assertTrue(currentWorkspace.updatedAt.isAfter(workspace.updatedAt))
        }
        
        @Test
        @DisplayName("Should maintain relationships through multiple operations")
        fun `should maintain relationships through multiple operations`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val originalOwner = UserId(UUID.randomUUID())
            val newOwner = UserId(UUID.randomUUID())
            val teamId = TeamId(UUID.randomUUID())
            val workspace = DomainModelTestBuilder.workspace(
                tenantId = tenantId,
                createdBy = originalOwner
            )
            
            // When - Multiple operations
            val updatedWorkspace = workspace
                .update(name = "Updated Name")
                .assignToTeam(teamId)
                .changeOwner(newOwner)
            
            // Then - Verify all relationships are maintained
            assertEquals(tenantId, updatedWorkspace.tenantId) // Tenant preserved
            assertEquals(newOwner, updatedWorkspace.createdBy) // Owner updated
            assertEquals(teamId, updatedWorkspace.teamId) // Team assigned
            assertEquals("Updated Name", updatedWorkspace.name) // Name updated
            assertTrue(updatedWorkspace.belongsToTenant(tenantId))
            assertTrue(updatedWorkspace.isOwnedBy(newOwner))
            assertTrue(updatedWorkspace.belongsToTeam(teamId))
        }
        
        @Test
        @DisplayName("Should handle workspace with all optional fields null")
        fun `should handle workspace with all optional fields null`() {
            // Given & When
            val workspace = DomainModelTestBuilder.workspace(
                tenantId = null,
                createdBy = null,
                teamId = null
            )
            
            // Then - Should handle null checks gracefully
            assertFalse(workspace.isMultiTenant())
            assertFalse(workspace.isOwnedBy(UserId(UUID.randomUUID())))
            assertFalse(workspace.belongsToTeam(TeamId(UUID.randomUUID())))
            assertFalse(workspace.belongsToTenant(TenantId(UUID.randomUUID())))
        }
        
        @Test
        @DisplayName("Should handle complex workspace operations scenario")
        fun `should handle complex workspace operations scenario`() {
            // Given - Create workspace for a tenant with owner
            val tenantId = TenantId(UUID.randomUUID())
            val originalOwner = UserId(UUID.randomUUID())
            val workspace = Workspace.create(
                name = "Project Alpha",
                tenantId = tenantId,
                createdBy = originalOwner
            )
            
            // When - Business scenario: workspace gets updated, assigned to team, owner changes
            val teamId = TeamId(UUID.randomUUID())
            val newOwner = UserId(UUID.randomUUID())
            
            val step1 = workspace.update(name = "Project Alpha - Updated")
            val step2 = step1.assignToTeam(teamId)
            val step3 = step2.changeOwner(newOwner)
            
            // Then - All operations should work correctly
            assertEquals("Project Alpha - Updated", step3.name)
            assertEquals(tenantId, step3.tenantId)
            assertEquals(teamId, step3.teamId)
            assertEquals(newOwner, step3.createdBy)
            
            // Verify business rules
            assertTrue(step3.belongsToTenant(tenantId))
            assertTrue(step3.belongsToTeam(teamId))
            assertTrue(step3.isOwnedBy(newOwner))
            assertFalse(step3.isOwnedBy(originalOwner))
            assertTrue(step3.isMultiTenant())
        }
    }
}