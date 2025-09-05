package com.astarworks.astarmanagement.unit.core.auth.domain.model

import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.MethodSource
import java.util.UUID
import java.util.stream.Stream

@DisplayName("PermissionRule Domain Model Tests")
class PermissionRuleTest {
    
    companion object {
        private val TEST_GROUP_ID = UUID.fromString("12345678-1234-1234-1234-123456789abc")
        private val TEST_RESOURCE_ID = UUID.fromString("87654321-4321-4321-4321-cba987654321")
        
        @JvmStatic
        fun validGeneralRuleStrings(): Stream<Arguments> = Stream.of(
            Arguments.of("table.view.all", ResourceType.TABLE, Action.VIEW, Scope.ALL),
            Arguments.of("document.edit.team", ResourceType.DOCUMENT, Action.EDIT, Scope.TEAM),
            Arguments.of("workspace.delete.own", ResourceType.WORKSPACE, Action.DELETE, Scope.OWN),
            Arguments.of("record.create.all", ResourceType.RECORD, Action.CREATE, Scope.ALL),
            Arguments.of("role.manage.team", ResourceType.ROLE, Action.MANAGE, Scope.TEAM),
            Arguments.of("settings.export.own", ResourceType.SETTINGS, Action.EXPORT, Scope.OWN),
            Arguments.of("user.import.all", ResourceType.USER, Action.IMPORT, Scope.ALL)
        )
        
        @JvmStatic
        fun invalidDatabaseStrings(): Stream<String> = Stream.of(
            "",                                    // empty string
            "invalid",                            // too few parts
            "table.view",                         // missing scope
            "table.view.all.extra",              // too many parts
            "unknown.view.all",                  // unknown resource type
            "table.unknown.all",                 // unknown action
            "table.view.unknown",                // unknown scope for general rule
            "table.view.resource_group:invalid", // invalid UUID for resource group
            "table.view.resource_id:invalid",    // invalid UUID for resource id
            "table.view.resource_group:",        // missing UUID for resource group
            "table.view.resource_id:",           // missing UUID for resource id
            "table.view.something:uuid"          // unknown scope prefix
        )
    }
    
    @Nested
    @DisplayName("Database String Parsing Tests")
    inner class DatabaseStringParsingTests {
        
        @ParameterizedTest(name = "Should parse valid GeneralRule: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.auth.domain.model.PermissionRuleTest#validGeneralRuleStrings")
        fun `should parse valid GeneralRule formats`(
            databaseString: String,
            expectedResourceType: ResourceType,
            expectedAction: Action,
            expectedScope: Scope
        ) {
            // When
            val result = PermissionRule.fromDatabaseString(databaseString)
            
            // Then
            assertInstanceOf(PermissionRule.GeneralRule::class.java, result)
            val generalRule = result as PermissionRule.GeneralRule
            assertEquals(expectedResourceType, generalRule.resourceType)
            assertEquals(expectedAction, generalRule.action)
            assertEquals(expectedScope, generalRule.scope)
        }
        
        @Test
        @DisplayName("Should parse valid ResourceGroupRule format")
        fun `should parse valid ResourceGroupRule format`() {
            // Given
            val databaseString = "table.view.resource_group:$TEST_GROUP_ID"
            
            // When
            val result = PermissionRule.fromDatabaseString(databaseString)
            
            // Then
            assertInstanceOf(PermissionRule.ResourceGroupRule::class.java, result)
            val resourceGroupRule = result as PermissionRule.ResourceGroupRule
            assertEquals(ResourceType.TABLE, resourceGroupRule.resourceType)
            assertEquals(Action.VIEW, resourceGroupRule.action)
            assertEquals(Scope.RESOURCE_GROUP, resourceGroupRule.scope)
            assertEquals(TEST_GROUP_ID, resourceGroupRule.groupId)
        }
        
        @Test
        @DisplayName("Should parse valid ResourceIdRule format")
        fun `should parse valid ResourceIdRule format`() {
            // Given
            val databaseString = "document.edit.resource_id:$TEST_RESOURCE_ID"
            
            // When
            val result = PermissionRule.fromDatabaseString(databaseString)
            
            // Then
            assertInstanceOf(PermissionRule.ResourceIdRule::class.java, result)
            val resourceIdRule = result as PermissionRule.ResourceIdRule
            assertEquals(ResourceType.DOCUMENT, resourceIdRule.resourceType)
            assertEquals(Action.EDIT, resourceIdRule.action)
            assertEquals(Scope.RESOURCE_ID, resourceIdRule.scope)
            assertEquals(TEST_RESOURCE_ID, resourceIdRule.resourceId)
        }
        
        @ParameterizedTest(name = "Should throw IllegalArgumentException for: {0}")
        @MethodSource("com.astarworks.astarmanagement.unit.core.auth.domain.model.PermissionRuleTest#invalidDatabaseStrings")
        fun `should throw IllegalArgumentException for invalid formats`(invalidString: String) {
            // When & Then
            assertThrows(IllegalArgumentException::class.java) {
                PermissionRule.fromDatabaseString(invalidString)
            }
        }
        
        @Test
        @DisplayName("Should handle case sensitivity correctly")
        fun `should handle case sensitivity correctly`() {
            // Given - mixed case input should work (resource type and action are converted to uppercase)
            val mixedCaseString = "table.VIEW.all"
            
            // When
            val result = PermissionRule.fromDatabaseString(mixedCaseString)
            
            // Then
            assertInstanceOf(PermissionRule.GeneralRule::class.java, result)
            val generalRule = result as PermissionRule.GeneralRule
            assertEquals(ResourceType.TABLE, generalRule.resourceType)
            assertEquals(Action.VIEW, generalRule.action)
            assertEquals(Scope.ALL, generalRule.scope)
        }
    }
    
    @Nested
    @DisplayName("Rule Creation and Validation Tests")
    inner class RuleCreationTests {
        
        @Test
        @DisplayName("GeneralRule should accept valid scopes (ALL, TEAM, OWN)")
        fun `GeneralRule should accept valid scopes`() {
            // Given & When & Then - should not throw exceptions
            assertDoesNotThrow {
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
            }
            assertDoesNotThrow {
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.TEAM)
            }
            assertDoesNotThrow {
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.OWN)
            }
        }
        
        @Test
        @DisplayName("GeneralRule should reject invalid scopes (RESOURCE_GROUP, RESOURCE_ID)")
        fun `GeneralRule should reject invalid scopes`() {
            // Given & When & Then - should throw IllegalArgumentException
            val exception1 = assertThrows(IllegalArgumentException::class.java) {
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.RESOURCE_GROUP)
            }
            assertTrue(exception1.message!!.contains("GeneralRule only supports ALL, TEAM, OWN scopes"))
            
            val exception2 = assertThrows(IllegalArgumentException::class.java) {
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.RESOURCE_ID)
            }
            assertTrue(exception2.message!!.contains("GeneralRule only supports ALL, TEAM, OWN scopes"))
        }
        
        @Test
        @DisplayName("ResourceGroupRule should always have RESOURCE_GROUP scope")
        fun `ResourceGroupRule should always have RESOURCE_GROUP scope`() {
            // Given
            val rule = PermissionRule.ResourceGroupRule(
                ResourceType.TABLE, 
                Action.EDIT, 
                TEST_GROUP_ID
            )
            
            // When & Then
            assertEquals(Scope.RESOURCE_GROUP, rule.scope)
            assertEquals(ResourceType.TABLE, rule.resourceType)
            assertEquals(Action.EDIT, rule.action)
            assertEquals(TEST_GROUP_ID, rule.groupId)
        }
        
        @Test
        @DisplayName("ResourceIdRule should always have RESOURCE_ID scope")
        fun `ResourceIdRule should always have RESOURCE_ID scope`() {
            // Given
            val rule = PermissionRule.ResourceIdRule(
                ResourceType.DOCUMENT, 
                Action.DELETE, 
                TEST_RESOURCE_ID
            )
            
            // When & Then
            assertEquals(Scope.RESOURCE_ID, rule.scope)
            assertEquals(ResourceType.DOCUMENT, rule.resourceType)
            assertEquals(Action.DELETE, rule.action)
            assertEquals(TEST_RESOURCE_ID, rule.resourceId)
        }
    }
    
    @Nested
    @DisplayName("Database String Conversion Tests")
    inner class DatabaseStringConversionTests {
        
        @Test
        @DisplayName("GeneralRule should convert to database string correctly")
        fun `GeneralRule should convert to database string correctly`() {
            // Given
            val rule = PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
            
            // When
            val result = rule.toDatabaseString()
            
            // Then
            assertEquals("table.view.all", result)
        }
        
        @Test
        @DisplayName("ResourceGroupRule should convert to database string correctly")
        fun `ResourceGroupRule should convert to database string correctly`() {
            // Given
            val rule = PermissionRule.ResourceGroupRule(ResourceType.DOCUMENT, Action.EDIT, TEST_GROUP_ID)
            
            // When
            val result = rule.toDatabaseString()
            
            // Then
            assertEquals("document.edit.resource_group:$TEST_GROUP_ID", result)
        }
        
        @Test
        @DisplayName("ResourceIdRule should convert to database string correctly")
        fun `ResourceIdRule should convert to database string correctly`() {
            // Given
            val rule = PermissionRule.ResourceIdRule(ResourceType.WORKSPACE, Action.DELETE, TEST_RESOURCE_ID)
            
            // When
            val result = rule.toDatabaseString()
            
            // Then
            assertEquals("workspace.delete.resource_id:$TEST_RESOURCE_ID", result)
        }
    }
    
    @Nested
    @DisplayName("Round-trip Conversion Tests")
    inner class RoundTripConversionTests {
        
        @Test
        @DisplayName("GeneralRule round-trip conversion should preserve equality")
        fun `GeneralRule round-trip conversion should preserve equality`() {
            // Given
            val originalRule = PermissionRule.GeneralRule(ResourceType.TABLE, Action.MANAGE, Scope.TEAM)
            
            // When
            val databaseString = originalRule.toDatabaseString()
            val reconstructedRule = PermissionRule.fromDatabaseString(databaseString)
            
            // Then
            assertEquals(originalRule, reconstructedRule)
            assertInstanceOf(PermissionRule.GeneralRule::class.java, reconstructedRule)
        }
        
        @Test
        @DisplayName("ResourceGroupRule round-trip conversion should preserve equality")
        fun `ResourceGroupRule round-trip conversion should preserve equality`() {
            // Given
            val originalRule = PermissionRule.ResourceGroupRule(ResourceType.RECORD, Action.CREATE, TEST_GROUP_ID)
            
            // When
            val databaseString = originalRule.toDatabaseString()
            val reconstructedRule = PermissionRule.fromDatabaseString(databaseString)
            
            // Then
            assertEquals(originalRule, reconstructedRule)
            assertInstanceOf(PermissionRule.ResourceGroupRule::class.java, reconstructedRule)
        }
        
        @Test
        @DisplayName("ResourceIdRule round-trip conversion should preserve equality")
        fun `ResourceIdRule round-trip conversion should preserve equality`() {
            // Given
            val originalRule = PermissionRule.ResourceIdRule(ResourceType.USER, Action.EXPORT, TEST_RESOURCE_ID)
            
            // When
            val databaseString = originalRule.toDatabaseString()
            val reconstructedRule = PermissionRule.fromDatabaseString(databaseString)
            
            // Then
            assertEquals(originalRule, reconstructedRule)
            assertInstanceOf(PermissionRule.ResourceIdRule::class.java, reconstructedRule)
        }
    }
    
    @Nested
    @DisplayName("Action Inclusion Tests")
    inner class ActionInclusionTests {
        
        @Test
        @DisplayName("MANAGE action should include all other actions")
        fun `MANAGE action should include all other actions`() {
            // Given
            val manageAction = Action.MANAGE
            val allActions = Action.entries
            
            // When & Then
            allActions.forEach { action ->
                assertTrue(
                    manageAction.includes(action),
                    "MANAGE should include $action"
                )
            }
        }
        
        @ParameterizedTest(name = "{0} action should only include itself")
        @ValueSource(strings = ["VIEW", "CREATE", "EDIT", "DELETE", "EXPORT", "IMPORT"])
        fun `non-MANAGE actions should only include themselves`(actionName: String) {
            // Given
            val action = Action.valueOf(actionName)
            val otherActions = Action.entries.filter { it != action && it != Action.MANAGE }
            
            // When & Then - should include itself
            assertTrue(action.includes(action), "$actionName should include itself")
            
            // Should not include other actions (except MANAGE is tested separately)
            otherActions.forEach { otherAction ->
                assertFalse(
                    action.includes(otherAction),
                    "$actionName should not include $otherAction"
                )
            }
        }
        
        @Test
        @DisplayName("All actions should include themselves")
        fun `all actions should include themselves`() {
            // Given
            val allActions = Action.entries
            
            // When & Then
            allActions.forEach { action ->
                assertTrue(
                    action.includes(action),
                    "$action should include itself"
                )
            }
        }
    }
    
    @Nested
    @DisplayName("Edge Cases and Error Handling")
    inner class EdgeCasesTests {
        
        @Test
        @DisplayName("Should handle whitespace in database strings")
        fun `should handle trimmed input correctly`() {
            // Given - string with whitespace (if implementation supports trimming)
            val stringWithWhitespace = " table.view.all "
            
            // When & Then - this might throw or work depending on implementation
            // Based on the code, it doesn't trim, so should throw
            assertThrows(IllegalArgumentException::class.java) {
                PermissionRule.fromDatabaseString(stringWithWhitespace)
            }
        }
        
        @Test
        @DisplayName("Should handle mixed case resource types and actions correctly")
        fun `should handle mixed case resource types and actions correctly`() {
            // Given - mixed case resource type and action should work (converted to uppercase)
            // but scope must be lowercase 
            val mixedCaseString = "Table.View.all"
            
            // When
            val result = PermissionRule.fromDatabaseString(mixedCaseString)
            
            // Then
            assertInstanceOf(PermissionRule.GeneralRule::class.java, result)
            val rule = result as PermissionRule.GeneralRule
            assertEquals(ResourceType.TABLE, rule.resourceType)
            assertEquals(Action.VIEW, rule.action)
            assertEquals(Scope.ALL, rule.scope)
        }
        
        @Test
        @DisplayName("Should throw meaningful error messages for invalid resource types")
        fun `should throw meaningful error messages for invalid resource types`() {
            // Given
            val invalidString = "invalid_resource.view.all"
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                PermissionRule.fromDatabaseString(invalidString)
            }
            assertTrue(
                exception.message!!.contains("Unknown resource type"),
                "Should contain meaningful error message about unknown resource type"
            )
        }
        
        @Test
        @DisplayName("Should throw meaningful error messages for invalid actions")
        fun `should throw meaningful error messages for invalid actions`() {
            // Given
            val invalidString = "table.invalid_action.all"
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                PermissionRule.fromDatabaseString(invalidString)
            }
            assertTrue(
                exception.message!!.contains("Unknown action"),
                "Should contain meaningful error message about unknown action"
            )
        }
        
        @Test
        @DisplayName("Should throw meaningful error messages for invalid UUID format")
        fun `should throw meaningful error messages for invalid UUID format`() {
            // Given
            val invalidString = "table.view.resource_group:not-a-uuid"
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                PermissionRule.fromDatabaseString(invalidString)
            }
            assertTrue(
                exception.message!!.contains("Invalid group ID"),
                "Should contain meaningful error message about invalid UUID"
            )
        }
    }
}