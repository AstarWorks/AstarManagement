package com.astarworks.astarmanagement.unit.core.auth.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RolePermissionId
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.SpringDataJdbcRolePermissionTable
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.mapper.SpringDataJdbcRolePermissionMapper
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.Instant
import java.util.UUID

@DisplayName("SpringDataJdbcRolePermissionMapper - RolePermission Entity Mapping with PermissionRule Conversion")
class SpringDataJdbcRolePermissionMapperTest : UnitTestBase() {
    
    private val mapper = SpringDataJdbcRolePermissionMapper()
    
    @Nested
    @DisplayName("Domain to Entity Conversion")
    inner class DomainToEntityConversion {
        
        @Test
        @DisplayName("Should convert RolePermission with GeneralRule to entity")
        fun shouldConvertGeneralRuleToEntity() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val permissionRule = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.EDIT,
                scope = Scope.ALL
            )
            val createdAt = Instant.now()
            
            val rolePermission = RolePermission(
                roleId = roleId,
                permissionRule = permissionRule,
                createdAt = createdAt
            )
            
            // When
            val result = mapper.toTable(rolePermission)
            
            // Then
            assertNotNull(result)
            assertNotNull(result.id)
            assertEquals(roleId, result.id.roleId)
            assertEquals("table.edit.all", result.id.permissionRule)
            assertEquals(createdAt, result.createdAt)
            assertNull(result.version)
        }
        
        @Test
        @DisplayName("Should convert RolePermission with ResourceGroupRule to entity")
        fun shouldConvertResourceGroupRuleToEntity() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val groupId = UUID.randomUUID()
            val permissionRule = PermissionRule.ResourceGroupRule(
                resourceType = ResourceType.DOCUMENT,
                action = Action.VIEW,
                groupId = groupId
            )
            
            val rolePermission = RolePermission(
                roleId = roleId,
                permissionRule = permissionRule
            )
            
            // When
            val result = mapper.toTable(rolePermission)
            
            // Then
            assertEquals(roleId, result.id.roleId)
            assertEquals("document.view.resource_group:$groupId", result.id.permissionRule)
        }
        
        @Test
        @DisplayName("Should convert RolePermission with ResourceIdRule to entity")
        fun shouldConvertResourceIdRuleToEntity() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val resourceId = UUID.randomUUID()
            val permissionRule = PermissionRule.ResourceIdRule(
                resourceType = ResourceType.WORKSPACE,
                action = Action.DELETE,
                resourceId = resourceId
            )
            
            val rolePermission = RolePermission(
                roleId = roleId,
                permissionRule = permissionRule
            )
            
            // When
            val result = mapper.toTable(rolePermission)
            
            // Then
            assertEquals(roleId, result.id.roleId)
            assertEquals("workspace.delete.resource_id:$resourceId", result.id.permissionRule)
        }
        
        @Test
        @DisplayName("Should handle all Scope types in GeneralRule")
        fun shouldHandleAllScopeTypes() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val scopes = listOf(Scope.ALL, Scope.TEAM, Scope.OWN)
            
            scopes.forEach { scope ->
                val permissionRule = PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.EDIT,
                    scope = scope
                )
                
                val rolePermission = RolePermission(
                    roleId = roleId,
                    permissionRule = permissionRule
                )
                
                // When
                val result = mapper.toTable(rolePermission)
                
                // Then
                assertEquals("table.edit.${scope.name.lowercase()}", result.id.permissionRule)
            }
        }
        
        @Test
        @DisplayName("Should convert list of RolePermissions to entities")
        fun shouldConvertRolePermissionListToEntityList() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val rolePermissions = listOf(
                RolePermission(
                    roleId = roleId,
                    permissionRule = PermissionRule.GeneralRule(
                        ResourceType.TABLE, Action.VIEW, Scope.ALL
                    )
                ),
                RolePermission(
                    roleId = roleId,
                    permissionRule = PermissionRule.ResourceGroupRule(
                        ResourceType.DOCUMENT, Action.EDIT, UUID.randomUUID()
                    )
                ),
                RolePermission(
                    roleId = roleId,
                    permissionRule = PermissionRule.ResourceIdRule(
                        ResourceType.RECORD, Action.DELETE, UUID.randomUUID()
                    )
                )
            )
            
            // When
            val result = mapper.toTableList(rolePermissions)
            
            // Then
            assertEquals(3, result.size)
            assertTrue(result[0].id.permissionRule.startsWith("table.view.all"))
            assertTrue(result[1].id.permissionRule.startsWith("document.edit.resource_group:"))
            assertTrue(result[2].id.permissionRule.startsWith("record.delete.resource_id:"))
        }
    }
    
    @Nested
    @DisplayName("Entity to Domain Conversion")
    inner class EntityToDomainConversion {
        
        @Test
        @DisplayName("Should convert entity with GeneralRule string to domain")
        fun shouldConvertEntityWithGeneralRuleToDomain() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val createdAt = Instant.now()
            
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = roleId,
                    permissionRule = "table.edit.all"
                ),
                version = 1L,
                createdAt = createdAt
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertEquals(roleId, result.roleId)
            assertEquals(createdAt, result.createdAt)
            
            val rule = result.permissionRule as PermissionRule.GeneralRule
            assertEquals(ResourceType.TABLE, rule.resourceType)
            assertEquals(Action.EDIT, rule.action)
            assertEquals(Scope.ALL, rule.scope)
        }
        
        @Test
        @DisplayName("Should convert entity with ResourceGroupRule string to domain")
        fun shouldConvertEntityWithResourceGroupRuleToDomain() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val groupId = UUID.randomUUID()
            
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = roleId,
                    permissionRule = "document.view.resource_group:$groupId"
                ),
                version = null,
                createdAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            val rule = result.permissionRule as PermissionRule.ResourceGroupRule
            assertEquals(ResourceType.DOCUMENT, rule.resourceType)
            assertEquals(Action.VIEW, rule.action)
            assertEquals(groupId, rule.groupId)
        }
        
        @Test
        @DisplayName("Should convert entity with ResourceIdRule string to domain")
        fun shouldConvertEntityWithResourceIdRuleToDomain() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val resourceId = UUID.randomUUID()
            
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = roleId,
                    permissionRule = "workspace.delete.resource_id:$resourceId"
                ),
                version = 2L,
                createdAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            val rule = result.permissionRule as PermissionRule.ResourceIdRule
            assertEquals(ResourceType.WORKSPACE, rule.resourceType)
            assertEquals(Action.DELETE, rule.action)
            assertEquals(resourceId, rule.resourceId)
        }
        
        @Test
        @DisplayName("Should handle lowercase permission strings correctly")
        fun shouldHandleLowercasePermissionStrings() {
            // Given - lowercase permission string (as stored in database)
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = "table.edit.all"  // Lowercase as expected
                ),
                version = null,
                createdAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            val rule = result.permissionRule as PermissionRule.GeneralRule
            assertEquals(ResourceType.TABLE, rule.resourceType)
            assertEquals(Action.EDIT, rule.action)
            assertEquals(Scope.ALL, rule.scope)
        }
        
        @Test
        @DisplayName("Should convert list of entities to RolePermissions")
        fun shouldConvertEntityListToDomainList() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val tables = listOf(
                SpringDataJdbcRolePermissionTable(
                    id = RolePermissionId(roleId, "user.manage.all"),
                    version = 1L,
                    createdAt = Instant.now()
                ),
                SpringDataJdbcRolePermissionTable(
                    id = RolePermissionId(
                        roleId, 
                        "role.create.resource_group:${UUID.randomUUID()}"
                    ),
                    version = null,
                    createdAt = Instant.now()
                )
            )
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertEquals(2, result.size)
            assertTrue(result[0].permissionRule is PermissionRule.GeneralRule)
            assertTrue(result[1].permissionRule is PermissionRule.ResourceGroupRule)
        }
    }
    
    @Nested
    @DisplayName("PermissionRule String Conversion - All Types")
    inner class PermissionRuleStringConversion {
        
        @Test
        @DisplayName("Should handle all ResourceType values")
        fun shouldHandleAllResourceTypes() {
            // Given
            val resourceTypes = ResourceType.values()
            val roleId = RoleId(UUID.randomUUID())
            
            resourceTypes.forEach { resourceType ->
                val permissionRule = PermissionRule.GeneralRule(
                    resourceType = resourceType,
                    action = Action.VIEW,
                    scope = Scope.ALL
                )
                
                val rolePermission = RolePermission(
                    roleId = roleId,
                    permissionRule = permissionRule
                )
                
                // When
                val table = mapper.toTable(rolePermission)
                val result = mapper.toDomain(table)
                
                // Then
                val resultRule = result.permissionRule as PermissionRule.GeneralRule
                assertEquals(resourceType, resultRule.resourceType)
            }
        }
        
        @Test
        @DisplayName("Should handle all Action values")
        fun shouldHandleAllActions() {
            // Given
            val actions = Action.values()
            val roleId = RoleId(UUID.randomUUID())
            
            actions.forEach { action ->
                val permissionRule = PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = action,
                    scope = Scope.ALL
                )
                
                val rolePermission = RolePermission(
                    roleId = roleId,
                    permissionRule = permissionRule
                )
                
                // When
                val table = mapper.toTable(rolePermission)
                val result = mapper.toDomain(table)
                
                // Then
                val resultRule = result.permissionRule as PermissionRule.GeneralRule
                assertEquals(action, resultRule.action)
            }
        }
        
        @Test
        @DisplayName("Should preserve UUID values in ResourceGroupRule")
        fun shouldPreserveUuidInResourceGroupRule() {
            // Given
            val specificUuid = UUID.fromString("550e8400-e29b-41d4-a716-446655440000")
            val permissionRule = PermissionRule.ResourceGroupRule(
                resourceType = ResourceType.TENANT,
                action = Action.MANAGE,
                groupId = specificUuid
            )
            
            val rolePermission = RolePermission(
                roleId = RoleId(UUID.randomUUID()),
                permissionRule = permissionRule
            )
            
            // When
            val table = mapper.toTable(rolePermission)
            val result = mapper.toDomain(table)
            
            // Then
            val resultRule = result.permissionRule as PermissionRule.ResourceGroupRule
            assertEquals(specificUuid, resultRule.groupId)
        }
        
        @Test
        @DisplayName("Should preserve UUID values in ResourceIdRule")
        fun shouldPreserveUuidInResourceIdRule() {
            // Given
            val specificUuid = UUID.fromString("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
            val permissionRule = PermissionRule.ResourceIdRule(
                resourceType = ResourceType.SETTINGS,
                action = Action.EXPORT,
                resourceId = specificUuid
            )
            
            val rolePermission = RolePermission(
                roleId = RoleId(UUID.randomUUID()),
                permissionRule = permissionRule
            )
            
            // When
            val table = mapper.toTable(rolePermission)
            val result = mapper.toDomain(table)
            
            // Then
            val resultRule = result.permissionRule as PermissionRule.ResourceIdRule
            assertEquals(specificUuid, resultRule.resourceId)
        }
    }
    
    @Nested
    @DisplayName("Error Handling")
    inner class ErrorHandling {
        
        @Test
        @DisplayName("Should throw exception for invalid permission format - missing parts")
        fun shouldThrowForMissingParts() {
            // Given
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = "table.edit"  // Missing scope
                ),
                version = null,
                createdAt = Instant.now()
            )
            
            // When/Then
            val exception = assertThrows<IllegalArgumentException> {
                mapper.toDomain(table)
            }
            assertTrue(exception.message!!.contains("Invalid permission format"))
        }
        
        @Test
        @DisplayName("Should throw exception for unknown resource type")
        fun shouldThrowForUnknownResourceType() {
            // Given
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = "unknown.edit.all"
                ),
                version = null,
                createdAt = Instant.now()
            )
            
            // When/Then
            val exception = assertThrows<IllegalArgumentException> {
                mapper.toDomain(table)
            }
            assertTrue(exception.message!!.contains("Unknown resource type"))
        }
        
        @Test
        @DisplayName("Should throw exception for unknown action")
        fun shouldThrowForUnknownAction() {
            // Given
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = "table.unknown.all"
                ),
                version = null,
                createdAt = Instant.now()
            )
            
            // When/Then
            val exception = assertThrows<IllegalArgumentException> {
                mapper.toDomain(table)
            }
            assertTrue(exception.message!!.contains("Unknown action"))
        }
        
        @Test
        @DisplayName("Should throw exception for unknown scope format")
        fun shouldThrowForUnknownScopeFormat() {
            // Given
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = "table.edit.unknown"
                ),
                version = null,
                createdAt = Instant.now()
            )
            
            // When/Then
            val exception = assertThrows<IllegalArgumentException> {
                mapper.toDomain(table)
            }
            assertTrue(exception.message!!.contains("Unknown scope format"))
        }
        
        @Test
        @DisplayName("Should throw exception for invalid UUID in resource_group")
        fun shouldThrowForInvalidUuidInResourceGroup() {
            // Given
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = "table.edit.resource_group:invalid-uuid"
                ),
                version = null,
                createdAt = Instant.now()
            )
            
            // When/Then
            val exception = assertThrows<IllegalArgumentException> {
                mapper.toDomain(table)
            }
            assertTrue(exception.message!!.contains("Invalid group ID"))
        }
        
        @Test
        @DisplayName("Should throw exception for invalid UUID in resource_id")
        fun shouldThrowForInvalidUuidInResourceId() {
            // Given
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = "document.view.resource_id:not-a-uuid"
                ),
                version = null,
                createdAt = Instant.now()
            )
            
            // When/Then
            val exception = assertThrows<IllegalArgumentException> {
                mapper.toDomain(table)
            }
            assertTrue(exception.message!!.contains("Invalid resource ID"))
        }
        
        @Test
        @DisplayName("Should throw exception for empty permission string")
        fun shouldThrowForEmptyPermissionString() {
            // Given
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = ""
                ),
                version = null,
                createdAt = Instant.now()
            )
            
            // When/Then
            val exception = assertThrows<IllegalArgumentException> {
                mapper.toDomain(table)
            }
            assertTrue(exception.message!!.contains("Invalid permission format"))
        }
        
        @Test
        @DisplayName("Should throw exception for too many parts in permission string")
        fun shouldThrowForTooManyParts() {
            // Given
            val table = SpringDataJdbcRolePermissionTable(
                id = RolePermissionId(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = "table.edit.all.extra"
                ),
                version = null,
                createdAt = Instant.now()
            )
            
            // When/Then
            val exception = assertThrows<IllegalArgumentException> {
                mapper.toDomain(table)
            }
            assertTrue(exception.message!!.contains("Invalid permission format"))
        }
    }
    
    @Nested
    @DisplayName("Bidirectional Conversion")
    inner class BidirectionalConversion {
        
        @Test
        @DisplayName("Should maintain GeneralRule integrity in round-trip")
        fun shouldMaintainGeneralRuleIntegrity() {
            // Given
            val originalPermission = RolePermission(
                roleId = RoleId(UUID.randomUUID()),
                permissionRule = PermissionRule.GeneralRule(
                    resourceType = ResourceType.WORKSPACE,
                    action = Action.MANAGE,
                    scope = Scope.TEAM
                ),
                createdAt = Instant.now()
            )
            
            // When
            val table = mapper.toTable(originalPermission)
            val result = mapper.toDomain(table)
            
            // Then
            assertEquals(originalPermission.roleId, result.roleId)
            assertEquals(originalPermission.createdAt, result.createdAt)
            
            val originalRule = originalPermission.permissionRule as PermissionRule.GeneralRule
            val resultRule = result.permissionRule as PermissionRule.GeneralRule
            
            assertEquals(originalRule.resourceType, resultRule.resourceType)
            assertEquals(originalRule.action, resultRule.action)
            assertEquals(originalRule.scope, resultRule.scope)
        }
        
        @Test
        @DisplayName("Should maintain ResourceGroupRule integrity in round-trip")
        fun shouldMaintainResourceGroupRuleIntegrity() {
            // Given
            val groupId = UUID.randomUUID()
            val originalPermission = RolePermission(
                roleId = RoleId(UUID.randomUUID()),
                permissionRule = PermissionRule.ResourceGroupRule(
                    resourceType = ResourceType.PROPERTY_TYPE,
                    action = Action.CREATE,
                    groupId = groupId
                ),
                createdAt = Instant.now()
            )
            
            // When
            val table = mapper.toTable(originalPermission)
            val result = mapper.toDomain(table)
            
            // Then
            val originalRule = originalPermission.permissionRule as PermissionRule.ResourceGroupRule
            val resultRule = result.permissionRule as PermissionRule.ResourceGroupRule
            
            assertEquals(originalRule.resourceType, resultRule.resourceType)
            assertEquals(originalRule.action, resultRule.action)
            assertEquals(originalRule.groupId, resultRule.groupId)
            assertEquals(groupId, resultRule.groupId)
        }
        
        @Test
        @DisplayName("Should maintain ResourceIdRule integrity in round-trip")
        fun shouldMaintainResourceIdRuleIntegrity() {
            // Given
            val resourceId = UUID.randomUUID()
            val originalPermission = RolePermission(
                roleId = RoleId(UUID.randomUUID()),
                permissionRule = PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.RECORD,
                    action = Action.IMPORT,
                    resourceId = resourceId
                ),
                createdAt = Instant.now()
            )
            
            // When
            val table = mapper.toTable(originalPermission)
            val result = mapper.toDomain(table)
            
            // Then
            val originalRule = originalPermission.permissionRule as PermissionRule.ResourceIdRule
            val resultRule = result.permissionRule as PermissionRule.ResourceIdRule
            
            assertEquals(originalRule.resourceType, resultRule.resourceType)
            assertEquals(originalRule.action, resultRule.action)
            assertEquals(originalRule.resourceId, resultRule.resourceId)
            assertEquals(resourceId, resultRule.resourceId)
        }
        
        @Test
        @DisplayName("Should handle all scope types in round-trip")
        fun shouldHandleAllScopeTypesInRoundTrip() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val scopes = listOf(Scope.ALL, Scope.TEAM, Scope.OWN)
            
            scopes.forEach { scope ->
                val original = RolePermission(
                    roleId = roleId,
                    permissionRule = PermissionRule.GeneralRule(
                        ResourceType.DIRECTORY,
                        Action.VIEW,
                        scope
                    )
                )
                
                // When
                val table = mapper.toTable(original)
                val result = mapper.toDomain(table)
                
                // Then
                val resultRule = result.permissionRule as PermissionRule.GeneralRule
                assertEquals(scope, resultRule.scope)
            }
        }
    }
    
    @Nested
    @DisplayName("RolePermission Domain Methods")
    inner class RolePermissionDomainMethods {
        
        @Test
        @DisplayName("Should preserve hasManagePermission check")
        fun shouldPreserveHasManagePermissionCheck() {
            // Given
            val managePermission = RolePermission(
                roleId = RoleId(UUID.randomUUID()),
                permissionRule = PermissionRule.GeneralRule(
                    ResourceType.TENANT,
                    Action.MANAGE,
                    Scope.ALL
                )
            )
            
            val viewPermission = RolePermission(
                roleId = RoleId(UUID.randomUUID()),
                permissionRule = PermissionRule.GeneralRule(
                    ResourceType.TENANT,
                    Action.VIEW,
                    Scope.ALL
                )
            )
            
            // When
            val manageTable = mapper.toTable(managePermission)
            val manageResult = mapper.toDomain(manageTable)
            
            val viewTable = mapper.toTable(viewPermission)
            val viewResult = mapper.toDomain(viewTable)
            
            // Then
            assertTrue(manageResult.hasManagePermission())
            assertFalse(viewResult.hasManagePermission())
        }
        
        @Test
        @DisplayName("Should create unique composite keys for different permissions")
        fun shouldCreateUniqueCompositeKeys() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            
            val permission1 = RolePermission(
                roleId = roleId,
                permissionRule = PermissionRule.GeneralRule(
                    ResourceType.TABLE,
                    Action.EDIT,
                    Scope.ALL
                )
            )
            
            val permission2 = RolePermission(
                roleId = roleId,
                permissionRule = PermissionRule.GeneralRule(
                    ResourceType.TABLE,
                    Action.EDIT,
                    Scope.TEAM  // Different scope
                )
            )
            
            // When
            val table1 = mapper.toTable(permission1)
            val table2 = mapper.toTable(permission2)
            
            // Then
            assertEquals(table1.id.roleId, table2.id.roleId)
            assertNotEquals(table1.id.permissionRule, table2.id.permissionRule)
        }
        
        @Test
        @DisplayName("Should preserve grantsAccessTo logic for ResourceIdRule")
        fun shouldPreserveGrantsAccessToLogic() {
            // Given
            val resourceId = UUID.randomUUID()
            val permission = RolePermission(
                roleId = RoleId(UUID.randomUUID()),
                permissionRule = PermissionRule.ResourceIdRule(
                    ResourceType.DOCUMENT,
                    Action.EDIT,
                    resourceId
                )
            )
            
            // When
            val table = mapper.toTable(permission)
            val result = mapper.toDomain(table)
            
            // Then
            assertTrue(result.grantsAccessTo(resourceId, ResourceType.DOCUMENT, Action.EDIT))
            assertFalse(result.grantsAccessTo(UUID.randomUUID(), ResourceType.DOCUMENT, Action.EDIT))
            assertFalse(result.grantsAccessTo(resourceId, ResourceType.TABLE, Action.EDIT))
        }
    }
    
    @Nested
    @DisplayName("Special Cases and Edge Cases")
    inner class SpecialCasesAndEdgeCases {
        
        @Test
        @DisplayName("Should preserve exact Instant timestamps")
        fun shouldPreserveExactTimestamps() {
            // Given
            val preciseCreatedAt = Instant.parse("2024-01-15T10:30:45.123456789Z")
            
            val permission = RolePermission(
                roleId = RoleId(UUID.randomUUID()),
                permissionRule = PermissionRule.GeneralRule(
                    ResourceType.USER,
                    Action.CREATE,
                    Scope.ALL
                ),
                createdAt = preciseCreatedAt
            )
            
            // When
            val table = mapper.toTable(permission)
            val result = mapper.toDomain(table)
            
            // Then
            assertEquals(preciseCreatedAt, result.createdAt)
        }
        
        @Test
        @DisplayName("Should handle multiple conversions of the same object")
        fun shouldHandleMultipleConversions() {
            // Given
            val permission = RolePermission(
                roleId = RoleId(UUID.randomUUID()),
                permissionRule = PermissionRule.GeneralRule(
                    ResourceType.ROLE,
                    Action.DELETE,
                    Scope.OWN
                )
            )
            
            // When
            val table1 = mapper.toTable(permission)
            val table2 = mapper.toTable(permission)
            val table3 = mapper.toTable(permission)
            
            // Then
            assertEquals(table1.id.roleId, table2.id.roleId)
            assertEquals(table2.id.roleId, table3.id.roleId)
            assertEquals(table1.id.permissionRule, table2.id.permissionRule)
            assertEquals(table2.id.permissionRule, table3.id.permissionRule)
        }
        
        @Test
        @DisplayName("Should handle empty list conversions")
        fun shouldHandleEmptyListConversions() {
            // Given
            val emptyPermissions = emptyList<RolePermission>()
            val emptyTables = emptyList<SpringDataJdbcRolePermissionTable>()
            
            // When
            val resultTables = mapper.toTableList(emptyPermissions)
            val resultPermissions = mapper.toDomainList(emptyTables)
            
            // Then
            assertTrue(resultTables.isEmpty())
            assertTrue(resultPermissions.isEmpty())
        }
        
        @Test
        @DisplayName("Should handle complex permission combinations")
        fun shouldHandleComplexPermissionCombinations() {
            // Given - Various complex permission rules
            val complexPermissions = listOf(
                // Manage all resources of a type
                RolePermission(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = PermissionRule.GeneralRule(
                        ResourceType.RESOURCE_GROUP,
                        Action.MANAGE,
                        Scope.ALL
                    )
                ),
                // View specific resource
                RolePermission(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = PermissionRule.ResourceIdRule(
                        ResourceType.SETTINGS,
                        Action.VIEW,
                        UUID.randomUUID()
                    )
                ),
                // Export from resource group
                RolePermission(
                    roleId = RoleId(UUID.randomUUID()),
                    permissionRule = PermissionRule.ResourceGroupRule(
                        ResourceType.TABLE,
                        Action.EXPORT,
                        UUID.randomUUID()
                    )
                )
            )
            
            // When
            val tables = mapper.toTableList(complexPermissions)
            val results = mapper.toDomainList(tables)
            
            // Then
            assertEquals(complexPermissions.size, results.size)
            
            // Verify first permission (GeneralRule)
            val firstRule = results[0].permissionRule as PermissionRule.GeneralRule
            assertEquals(ResourceType.RESOURCE_GROUP, firstRule.resourceType)
            assertEquals(Action.MANAGE, firstRule.action)
            assertEquals(Scope.ALL, firstRule.scope)
            
            // Verify second permission (ResourceIdRule)
            val secondRule = results[1].permissionRule as PermissionRule.ResourceIdRule
            assertEquals(ResourceType.SETTINGS, secondRule.resourceType)
            assertEquals(Action.VIEW, secondRule.action)
            
            // Verify third permission (ResourceGroupRule)
            val thirdRule = results[2].permissionRule as PermissionRule.ResourceGroupRule
            assertEquals(ResourceType.TABLE, thirdRule.resourceType)
            assertEquals(Action.EXPORT, thirdRule.action)
        }
    }
}