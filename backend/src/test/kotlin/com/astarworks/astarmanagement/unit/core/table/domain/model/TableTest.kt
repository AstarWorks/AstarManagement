package com.astarworks.astarmanagement.unit.core.table.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypes
import com.astarworks.astarmanagement.core.table.api.exception.DuplicatePropertyKeyException
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import kotlinx.serialization.json.*
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
@DisplayName("Table Domain Model Tests")
class TableTest {
    
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
                "Simple Table",
                "テーブル名",
                "Table with Numbers 123",
                "Special Characters: !@#$%",
                "a".repeat(255), // at boundary
                "A"
            )
        }
    }
    
    @Nested
    @DisplayName("Construction and Validation Tests")
    inner class ConstructionTests {
        
        @Test
        @DisplayName("Should create Table with valid parameters")
        fun `should create Table with valid parameters`() {
            // Given
            val workspaceId = WorkspaceId(UUID.randomUUID())
            val name = "Test Table"
            val properties = mapOf(
                "title" to DomainModelTestBuilder.propertyDefinition(displayName = "Title"),
                "description" to DomainModelTestBuilder.propertyDefinition(displayName = "Description")
            )
            val propertyOrder = listOf("title", "description")
            
            // When
            val table = DomainModelTestBuilder.table(
                workspaceId = workspaceId,
                name = name,
                properties = properties,
                propertyOrder = propertyOrder
            )
            
            // Then
            assertEquals(workspaceId, table.workspaceId)
            assertEquals(name, table.name)
            assertEquals(properties, table.properties)
            assertEquals(propertyOrder, table.propertyOrder)
            assertNotNull(table.id)
            assertNotNull(table.createdAt)
            assertNotNull(table.updatedAt)
        }
        
        @Test
        @DisplayName("Should create Table with minimal parameters")
        fun `should create Table with minimal parameters`() {
            // Given
            val workspaceId = WorkspaceId(UUID.randomUUID())
            val name = "Minimal Table"
            
            // When
            val table = DomainModelTestBuilder.table(
                workspaceId = workspaceId,
                name = name,
                properties = emptyMap(),
                propertyOrder = emptyList()
            )
            
            // Then
            assertEquals(workspaceId, table.workspaceId)
            assertEquals(name, table.name)
            assertTrue(table.properties.isEmpty())
            assertTrue(table.propertyOrder.isEmpty())
            assertTrue(table.isEmpty())
        }
        
        @Test
        @DisplayName("Should generate unique ID automatically")
        fun `should generate unique ID automatically`() {
            // When
            val table1 = DomainModelTestBuilder.table(name = "Table 1")
            val table2 = DomainModelTestBuilder.table(name = "Table 2")
            
            // Then
            assertNotNull(table1.id)
            assertNotNull(table2.id)
            assertNotEquals(table1.id, table2.id)
        }
        
        @ParameterizedTest(name = "Should reject blank name: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.TableTest#invalidNameCases")
        fun `should reject blank names`(invalidName: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.table(name = invalidName)
            }
            assertEquals("Table name must not be blank", exception.message)
        }
        
        @Test
        @DisplayName("Should accept name at character limit")
        fun `should accept name at character limit`() {
            // Given
            val nameAt255 = "a".repeat(255)
            
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.table(name = nameAt255)
            }
        }
        
        @Test
        @DisplayName("Should reject name over character limit")
        fun `should reject name over character limit`() {
            // Given
            val nameOver255 = "a".repeat(256)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.table(name = nameOver255)
            }
            assertEquals("Table name must not exceed 255 characters", exception.message)
        }
        
        @ParameterizedTest(name = "Should accept valid name: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.TableTest#validNameCases")
        fun `should accept valid names`(validName: String) {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.table(name = validName)
            }
        }
        
        @Test
        @DisplayName("Should validate property order consistency")
        fun `should validate property order consistency`() {
            // Given
            val properties = mapOf(
                "prop1" to DomainModelTestBuilder.propertyDefinition(),
                "prop2" to DomainModelTestBuilder.propertyDefinition()
            )
            val invalidOrder = listOf("prop1", "prop2", "nonexistent")
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.table(
                    properties = properties,
                    propertyOrder = invalidOrder
                )
            }
            assertTrue(exception.message?.contains("Property order contains unknown key") == true)
        }
    }
    
    @Nested
    @DisplayName("Property Management Tests")
    inner class PropertyManagementTests {
        
        @Test
        @DisplayName("Should add property successfully")
        fun `should add property successfully`() {
            // Given
            val table = DomainModelTestBuilder.table()
            val propertyKey = "new_property"
            val propertyDefinition = DomainModelTestBuilder.propertyDefinition(
                displayName = "New Property"
            )
            val originalUpdatedAt = table.updatedAt
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedTable = table.addProperty(propertyKey, propertyDefinition)
            
            // Then
            assertTrue(updatedTable.properties.containsKey(propertyKey))
            assertEquals(propertyDefinition, updatedTable.properties[propertyKey])
            assertTrue(updatedTable.propertyOrder.contains(propertyKey))
            assertEquals(updatedTable.propertyOrder.last(), propertyKey) // Added at end
            assertTrue(updatedTable.updatedAt.isAfter(originalUpdatedAt))
            
            // Original should remain unchanged
            assertFalse(table.properties.containsKey(propertyKey))
        }
        
        @Test
        @DisplayName("Should reject blank property key")
        fun `should reject blank property key`() {
            // Given
            val table = DomainModelTestBuilder.table()
            val propertyDefinition = DomainModelTestBuilder.propertyDefinition()
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                table.addProperty("", propertyDefinition)
            }
            assertEquals("Property key must not be blank", exception.message)
        }
        
        @Test
        @DisplayName("Should reject duplicate property key")
        fun `should reject duplicate property key`() {
            // Given
            val existingKey = "existing_property"
            val properties = mapOf(
                existingKey to DomainModelTestBuilder.propertyDefinition()
            )
            val table = DomainModelTestBuilder.table(properties = properties)
            val newPropertyDefinition = DomainModelTestBuilder.propertyDefinition()
            
            // When & Then
            val exception = assertThrows(DuplicatePropertyKeyException::class.java) {
                table.addProperty(existingKey, newPropertyDefinition)
            }
            assertEquals("Property with key '$existingKey' already exists in this table", exception.message)
        }
        
        @Test
        @DisplayName("Should update property successfully")
        fun `should update property successfully`() {
            // Given
            val propertyKey = "existing_property"
            val originalProperty = DomainModelTestBuilder.propertyDefinition(displayName = "Original")
            val properties = mapOf(propertyKey to originalProperty)
            val table = DomainModelTestBuilder.table(properties = properties)
            
            val updatedProperty = DomainModelTestBuilder.propertyDefinition(displayName = "Updated")
            val originalUpdatedAt = table.updatedAt
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedTable = table.updateProperty(propertyKey, updatedProperty)
            
            // Then
            assertEquals(updatedProperty, updatedTable.properties[propertyKey])
            assertTrue(updatedTable.updatedAt.isAfter(originalUpdatedAt))
            
            // Original should remain unchanged
            assertEquals(originalProperty, table.properties[propertyKey])
        }
        
        @Test
        @DisplayName("Should reject update for nonexistent property")
        fun `should reject update for nonexistent property`() {
            // Given
            val table = DomainModelTestBuilder.table()
            val nonexistentKey = "nonexistent"
            val propertyDefinition = DomainModelTestBuilder.propertyDefinition()
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                table.updateProperty(nonexistentKey, propertyDefinition)
            }
            assertEquals("Property with key '$nonexistentKey' does not exist", exception.message)
        }
        
        @Test
        @DisplayName("Should remove property successfully")
        fun `should remove property successfully`() {
            // Given
            val propertyKey = "to_be_removed"
            val properties = mapOf(
                propertyKey to DomainModelTestBuilder.propertyDefinition(),
                "keep_this" to DomainModelTestBuilder.propertyDefinition()
            )
            val propertyOrder = listOf(propertyKey, "keep_this")
            val table = DomainModelTestBuilder.table(
                properties = properties,
                propertyOrder = propertyOrder
            )
            val originalUpdatedAt = table.updatedAt
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedTable = table.removeProperty(propertyKey)
            
            // Then
            assertFalse(updatedTable.properties.containsKey(propertyKey))
            assertTrue(updatedTable.properties.containsKey("keep_this"))
            assertFalse(updatedTable.propertyOrder.contains(propertyKey))
            assertTrue(updatedTable.propertyOrder.contains("keep_this"))
            assertTrue(updatedTable.updatedAt.isAfter(originalUpdatedAt))
            
            // Original should remain unchanged
            assertTrue(table.properties.containsKey(propertyKey))
        }
        
        @Test
        @DisplayName("Should reject remove for nonexistent property")
        fun `should reject remove for nonexistent property`() {
            // Given
            val table = DomainModelTestBuilder.table()
            val nonexistentKey = "nonexistent"
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                table.removeProperty(nonexistentKey)
            }
            assertEquals("Property with key '$nonexistentKey' does not exist", exception.message)
        }
        
        @Test
        @DisplayName("Should get property by key")
        fun `should get property by key`() {
            // Given
            val propertyKey = "test_property"
            val propertyDefinition = DomainModelTestBuilder.propertyDefinition(displayName = "Test")
            val properties = mapOf(propertyKey to propertyDefinition)
            val table = DomainModelTestBuilder.table(properties = properties)
            
            // When
            val retrievedProperty = table.getProperty(propertyKey)
            val nonexistentProperty = table.getProperty("nonexistent")
            
            // Then
            assertEquals(propertyDefinition, retrievedProperty)
            assertNull(nonexistentProperty)
        }
        
        @Test
        @DisplayName("Should count properties correctly")
        fun `should count properties correctly`() {
            // Given
            val emptyTable = DomainModelTestBuilder.table()
            val properties = mapOf(
                "prop1" to DomainModelTestBuilder.propertyDefinition(),
                "prop2" to DomainModelTestBuilder.propertyDefinition(),
                "prop3" to DomainModelTestBuilder.propertyDefinition()
            )
            val populatedTable = DomainModelTestBuilder.table(properties = properties)
            
            // When & Then
            assertEquals(0, emptyTable.getPropertyCount())
            assertTrue(emptyTable.isEmpty())
            
            assertEquals(3, populatedTable.getPropertyCount())
            assertFalse(populatedTable.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Property Ordering Tests")
    inner class PropertyOrderingTests {
        
        @Test
        @DisplayName("Should reorder properties successfully")
        fun `should reorder properties successfully`() {
            // Given
            val properties = mapOf(
                "prop1" to DomainModelTestBuilder.propertyDefinition(displayName = "Property 1"),
                "prop2" to DomainModelTestBuilder.propertyDefinition(displayName = "Property 2"),
                "prop3" to DomainModelTestBuilder.propertyDefinition(displayName = "Property 3")
            )
            val originalOrder = listOf("prop1", "prop2", "prop3")
            val table = DomainModelTestBuilder.table(
                properties = properties,
                propertyOrder = originalOrder
            )
            
            val newOrder = listOf("prop3", "prop1", "prop2")
            val originalUpdatedAt = table.updatedAt
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val reorderedTable = table.reorderProperties(newOrder)
            
            // Then
            assertEquals(newOrder, reorderedTable.propertyOrder)
            assertEquals(properties, reorderedTable.properties) // Properties unchanged
            assertTrue(reorderedTable.updatedAt.isAfter(originalUpdatedAt))
            
            // Original should remain unchanged
            assertEquals(originalOrder, table.propertyOrder)
        }
        
        @Test
        @DisplayName("Should reject reorder with missing properties")
        fun `should reject reorder with missing properties`() {
            // Given
            val properties = mapOf(
                "prop1" to DomainModelTestBuilder.propertyDefinition(),
                "prop2" to DomainModelTestBuilder.propertyDefinition(),
                "prop3" to DomainModelTestBuilder.propertyDefinition()
            )
            val table = DomainModelTestBuilder.table(properties = properties)
            val incompleteOrder = listOf("prop1", "prop2") // Missing prop3
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                table.reorderProperties(incompleteOrder)
            }
            assertEquals("New order must contain exactly the same properties", exception.message)
        }
        
        @Test
        @DisplayName("Should reject reorder with extra properties")
        fun `should reject reorder with extra properties`() {
            // Given
            val properties = mapOf(
                "prop1" to DomainModelTestBuilder.propertyDefinition(),
                "prop2" to DomainModelTestBuilder.propertyDefinition()
            )
            val table = DomainModelTestBuilder.table(properties = properties)
            val extraOrder = listOf("prop1", "prop2", "prop3") // Extra prop3
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                table.reorderProperties(extraOrder)
            }
            assertEquals("New order must contain exactly the same properties", exception.message)
        }
        
        @Test
        @DisplayName("Should reject reorder with duplicate properties")
        fun `should reject reorder with duplicate properties`() {
            // Given
            val properties = mapOf(
                "prop1" to DomainModelTestBuilder.propertyDefinition(),
                "prop2" to DomainModelTestBuilder.propertyDefinition()
            )
            val table = DomainModelTestBuilder.table(properties = properties)
            val duplicateOrder = listOf("prop1", "prop1") // Duplicate prop1
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                table.reorderProperties(duplicateOrder)
            }
            assertEquals("New order must contain exactly the same properties", exception.message)
        }
        
        @Test
        @DisplayName("Should get ordered properties correctly")
        fun `should get ordered properties correctly`() {
            // Given
            val properties = mapOf(
                "prop1" to DomainModelTestBuilder.propertyDefinition(displayName = "Property 1"),
                "prop2" to DomainModelTestBuilder.propertyDefinition(displayName = "Property 2"),
                "prop3" to DomainModelTestBuilder.propertyDefinition(displayName = "Property 3")
            )
            val propertyOrder = listOf("prop2", "prop3", "prop1")
            val table = DomainModelTestBuilder.table(
                properties = properties,
                propertyOrder = propertyOrder
            )
            
            // When
            val orderedProperties = table.getOrderedProperties()
            
            // Then
            assertEquals(3, orderedProperties.size)
            assertEquals("prop2", orderedProperties[0].first)
            assertEquals("Property 2", orderedProperties[0].second.displayName)
            assertEquals("prop3", orderedProperties[1].first)
            assertEquals("Property 3", orderedProperties[1].second.displayName)
            assertEquals("prop1", orderedProperties[2].first)
            assertEquals("Property 1", orderedProperties[2].second.displayName)
        }
        
        @Test
        @DisplayName("Should get properties in key order when no explicit order")
        fun `should get properties in key order when no explicit order`() {
            // Given
            val properties = mapOf(
                "zebra" to DomainModelTestBuilder.propertyDefinition(displayName = "Zebra"),
                "alpha" to DomainModelTestBuilder.propertyDefinition(displayName = "Alpha"),
                "beta" to DomainModelTestBuilder.propertyDefinition(displayName = "Beta")
            )
            val table = DomainModelTestBuilder.table(
                properties = properties,
                propertyOrder = emptyList() // No explicit order
            )
            
            // When
            val orderedProperties = table.getOrderedProperties()
            
            // Then
            assertEquals(3, orderedProperties.size)
            // Should use natural key order since no explicit order is provided
            val keys = orderedProperties.map { it.first }
            assertEquals(properties.keys.toList(), keys)
        }
        
        @Test
        @DisplayName("Should handle partial property order")
        fun `should handle partial property order`() {
            // Given
            val properties = mapOf(
                "prop1" to DomainModelTestBuilder.propertyDefinition(),
                "prop2" to DomainModelTestBuilder.propertyDefinition(),
                "prop3" to DomainModelTestBuilder.propertyDefinition()
            )
            val partialOrder = listOf("prop2") // Only prop2 is ordered
            val table = DomainModelTestBuilder.table(
                properties = properties,
                propertyOrder = partialOrder
            )
            
            // When
            val orderedProperties = table.getOrderedProperties()
            
            // Then
            assertEquals(1, orderedProperties.size) // Only ordered property should appear
            assertEquals("prop2", orderedProperties[0].first)
        }
    }
    
    @Nested
    @DisplayName("Table Operations Tests")
    inner class TableOperationsTests {
        
        @Test
        @DisplayName("Should rename table successfully")
        fun `should rename table successfully`() {
            // Given
            val originalTable = DomainModelTestBuilder.table(name = "Original Name")
            val originalUpdatedAt = originalTable.updatedAt
            val newName = "New Name"
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val renamedTable = originalTable.rename(newName)
            
            // Then
            assertEquals(newName, renamedTable.name)
            assertEquals(originalTable.id, renamedTable.id)
            assertEquals(originalTable.workspaceId, renamedTable.workspaceId)
            assertEquals(originalTable.properties, renamedTable.properties)
            assertTrue(renamedTable.updatedAt.isAfter(originalUpdatedAt))
            
            // Original should remain unchanged
            assertEquals("Original Name", originalTable.name)
        }
        
        @Test
        @DisplayName("Should reject blank name in rename")
        fun `should reject blank name in rename`() {
            // Given
            val table = DomainModelTestBuilder.table()
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                table.rename("")
            }
            assertEquals("Table name must not be blank", exception.message)
        }
        
        @Test
        @DisplayName("Should reject too long name in rename")
        fun `should reject too long name in rename`() {
            // Given
            val table = DomainModelTestBuilder.table()
            val tooLongName = "a".repeat(256)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                table.rename(tooLongName)
            }
            assertEquals("Table name must not exceed 255 characters", exception.message)
        }
        
        @Test
        @DisplayName("Should preserve immutability in operations")
        fun `should preserve immutability in operations`() {
            // Given
            val originalTable = DomainModelTestBuilder.table(name = "Original")
            val property = DomainModelTestBuilder.propertyDefinition()
            
            // When
            val modifiedTable = originalTable
                .rename("Modified")
                .addProperty("new_prop", property)
                .reorderProperties(listOf("new_prop"))
            
            // Then - Original should remain completely unchanged
            assertEquals("Original", originalTable.name)
            assertTrue(originalTable.properties.isEmpty())
            assertTrue(originalTable.propertyOrder.isEmpty())
            
            // And modified should have all changes
            assertEquals("Modified", modifiedTable.name)
            assertEquals(1, modifiedTable.getPropertyCount())
            assertEquals(listOf("new_prop"), modifiedTable.propertyOrder)
        }
    }
    
    @Nested
    @DisplayName("Factory Method Tests")
    inner class FactoryMethodTests {
        
        @Test
        @DisplayName("Should create table with factory method")
        fun `should create table with factory method`() {
            // Given
            val workspaceId = WorkspaceId(UUID.randomUUID())
            val name = "Factory Table"
            val properties = mapOf(
                "title" to DomainModelTestBuilder.propertyDefinition(displayName = "Title"),
                "status" to DomainModelTestBuilder.propertyDefinition(displayName = "Status")
            )
            
            // When
            val table = Table.create(workspaceId, name, null, properties)
            
            // Then
            assertEquals(workspaceId, table.workspaceId)
            assertEquals(name, table.name)
            assertEquals(properties, table.properties)
            assertEquals(properties.keys.toList(), table.propertyOrder) // Order from keys
            assertNotNull(table.id)
            assertNotNull(table.createdAt)
            assertNotNull(table.updatedAt)
        }
        
        @Test
        @DisplayName("Should create table with minimal factory parameters")
        fun `should create table with minimal factory parameters`() {
            // Given
            val workspaceId = WorkspaceId(UUID.randomUUID())
            val name = "Minimal Factory Table"
            
            // When
            val table = Table.create(workspaceId, name)
            
            // Then
            assertEquals(workspaceId, table.workspaceId)
            assertEquals(name, table.name)
            assertTrue(table.properties.isEmpty())
            assertTrue(table.propertyOrder.isEmpty())
            assertTrue(table.isEmpty())
        }
        
        @Test
        @DisplayName("Should validate parameters in factory method")
        fun `should validate parameters in factory method`() {
            // Given
            val workspaceId = WorkspaceId(UUID.randomUUID())
            
            // When & Then
            assertThrows(IllegalArgumentException::class.java) {
                Table.create(workspaceId, "")
            }
            
            assertThrows(IllegalArgumentException::class.java) {
                Table.create(workspaceId, "a".repeat(256))
            }
        }
    }
    
    @Nested
    @DisplayName("Complex Integration Tests")
    inner class IntegrationTests {
        
        @Test
        @DisplayName("Should handle complex table operations sequence")
        fun `should handle complex table operations sequence`() {
            // Given
            val workspaceId = WorkspaceId(UUID.randomUUID())
            val table = Table.create(workspaceId, "Project Tasks")
            
            // When - Complex sequence of operations
            val finalTable = table
                .addProperty("title", DomainModelTestBuilder.textPropertyDefinition("Title", isRequired = true))
                .addProperty("status", DomainModelTestBuilder.selectPropertyDefinition("Status"))
                .addProperty("priority", DomainModelTestBuilder.selectPropertyDefinition("Priority"))
                .addProperty("assignee", DomainModelTestBuilder.propertyDefinition(
                    typeId = PropertyTypes.USER, 
                    displayName = "Assignee"
                ))
                .addProperty("due_date", DomainModelTestBuilder.propertyDefinition(
                    typeId = PropertyTypes.DATE, 
                    displayName = "Due Date"
                ))
                .reorderProperties(listOf("title", "priority", "status", "assignee", "due_date"))
                .rename("Project Task Management")
            
            // Then
            assertEquals("Project Task Management", finalTable.name)
            assertEquals(5, finalTable.getPropertyCount())
            assertEquals(
                listOf("title", "priority", "status", "assignee", "due_date"), 
                finalTable.propertyOrder
            )
            
            // Verify specific properties
            val titleProperty = finalTable.getProperty("title")!!
            assertTrue(titleProperty.isRequired)
            assertEquals("Title", titleProperty.displayName)
            
            val statusProperty = finalTable.getProperty("status")!!
            assertEquals(PropertyTypes.SELECT, statusProperty.typeId)
        }
        
        @Test
        @DisplayName("Should handle property lifecycle management")
        fun `should handle property lifecycle management`() {
            // Given
            val table = DomainModelTestBuilder.table()
            
            // When - Add, update, remove properties
            val step1 = table.addProperty("temp_prop", DomainModelTestBuilder.propertyDefinition(displayName = "Temporary"))
            val step2 = step1.addProperty("keep_prop", DomainModelTestBuilder.propertyDefinition(displayName = "Keep This"))
            val step3 = step2.updateProperty("temp_prop", DomainModelTestBuilder.propertyDefinition(displayName = "Updated Temp"))
            val step4 = step3.addProperty("another_prop", DomainModelTestBuilder.propertyDefinition(displayName = "Another"))
            val step5 = step4.removeProperty("temp_prop")
            
            // Then
            assertEquals(2, step5.getPropertyCount())
            assertFalse(step5.properties.containsKey("temp_prop"))
            assertTrue(step5.properties.containsKey("keep_prop"))
            assertTrue(step5.properties.containsKey("another_prop"))
            assertEquals(listOf("keep_prop", "another_prop"), step5.propertyOrder)
        }
        
        @Test
        @DisplayName("Should create and manage complex table from builder")
        fun `should create and manage complex table from builder`() {
            // When
            val complexTable = DomainModelTestBuilder.complexTable()
            
            // Then - Verify complex table structure
            assertEquals("Complex Test Table", complexTable.name)
            assertEquals(7, complexTable.getPropertyCount())
            assertFalse(complexTable.isEmpty())
            
            // Verify specific properties exist and are configured correctly
            val titleProperty = complexTable.getProperty("title")!!
            assertTrue(titleProperty.isRequired)
            assertEquals(255, titleProperty.maxLength)
            
            val priorityProperty = complexTable.getProperty("priority")!!
            assertTrue(priorityProperty.isRequired)
            assertEquals(PropertyTypes.SELECT, priorityProperty.typeId)
            
            val tagsProperty = complexTable.getProperty("tags")!!
            assertEquals(PropertyTypes.MULTI_SELECT, tagsProperty.typeId)
            assertTrue(tagsProperty.isMultiple)
            
            val scoreProperty = complexTable.getProperty("score")!!
            assertEquals(0.0, scoreProperty.minValue?.toDouble())
            assertEquals(100.0, scoreProperty.maxValue?.toDouble())
            assertEquals(1, scoreProperty.precision)
            
            // Verify property order is maintained
            val expectedOrder = listOf("title", "description", "priority", "tags", "score", "completed", "due_date")
            assertEquals(expectedOrder, complexTable.propertyOrder)
            
            val orderedProperties = complexTable.getOrderedProperties()
            assertEquals(expectedOrder.size, orderedProperties.size)
            assertEquals("title", orderedProperties[0].first)
            assertEquals("due_date", orderedProperties.last().first)
        }
        
        @Test
        @DisplayName("Should handle edge cases in property management")
        fun `should handle edge cases in property management`() {
            // Given
            val properties = mapOf(
                "prop_with_unicode" to DomainModelTestBuilder.propertyDefinition(displayName = "プロパティ 🎯"),
                "prop_with_special_chars" to DomainModelTestBuilder.propertyDefinition(displayName = "Property: !@#$%"),
                "very_long_property_key_" + "x".repeat(100) to DomainModelTestBuilder.propertyDefinition()
            )
            val table = DomainModelTestBuilder.table(properties = properties)
            
            // When & Then - Should handle all property keys correctly
            assertEquals(3, table.getPropertyCount())
            properties.keys.forEach { key ->
                assertNotNull(table.getProperty(key))
            }
            
            // Should be able to reorder with complex keys
            val newOrder = properties.keys.toList().reversed()
            assertDoesNotThrow {
                table.reorderProperties(newOrder)
            }
        }
    }
    
    @Nested
    @DisplayName("Data Class Behavior Tests")
    inner class DataClassBehaviorTests {
        
        @Test
        @DisplayName("Should implement equals and hashCode correctly")
        fun `should implement equals and hashCode correctly`() {
            // Given
            val id = TableId(UUID.randomUUID())
            val workspaceId = WorkspaceId(UUID.randomUUID())
            val name = "Same Table"
            val properties = mapOf(
                "prop1" to DomainModelTestBuilder.propertyDefinition()
            )
            val propertyOrder = listOf("prop1")
            val timestamp = Instant.now()
            
            val table1 = DomainModelTestBuilder.table(
                id = id,
                workspaceId = workspaceId,
                name = name,
                properties = properties,
                propertyOrder = propertyOrder,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            val table2 = DomainModelTestBuilder.table(
                id = id,
                workspaceId = workspaceId,
                name = name,
                properties = properties,
                propertyOrder = propertyOrder,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            
            // Then
            assertEquals(table1, table2)
            assertEquals(table1.hashCode(), table2.hashCode())
        }
        
        @Test
        @DisplayName("Should not be equal with different properties")
        fun `should not be equal with different properties`() {
            // Given
            val baseTable = DomainModelTestBuilder.table()
            val differentId = baseTable.copy(id = TableId(UUID.randomUUID()))
            val differentName = baseTable.copy(name = "Different Name")
            val differentWorkspace = baseTable.copy(workspaceId = WorkspaceId(UUID.randomUUID()))
            
            // Then
            assertNotEquals(baseTable, differentId)
            assertNotEquals(baseTable, differentName)
            assertNotEquals(baseTable, differentWorkspace)
        }
        
        @Test
        @DisplayName("Should implement toString with all properties")
        fun `should implement toString with all properties`() {
            // Given
            val table = DomainModelTestBuilder.table(
                name = "Test Table"
            )
            
            // When
            val toString = table.toString()
            
            // Then
            assertTrue(toString.contains("Test Table"))
            assertTrue(toString.contains(table.id.toString()))
            assertTrue(toString.contains(table.workspaceId.toString()))
        }
        
        @Test
        @DisplayName("Should support copy with parameter changes")
        fun `should support copy with parameter changes`() {
            // Given
            val originalTable = DomainModelTestBuilder.table(
                name = "Original Table"
            )
            
            // When
            val copiedTable = originalTable.copy(
                name = "Copied Table",
                workspaceId = WorkspaceId(UUID.randomUUID())
            )
            
            // Then
            assertEquals("Copied Table", copiedTable.name)
            assertNotEquals(originalTable.workspaceId, copiedTable.workspaceId)
            assertEquals(originalTable.id, copiedTable.id) // ID preserved
            assertEquals(originalTable.properties, copiedTable.properties) // Properties preserved
        }
    }
    
    @Nested
    @DisplayName("Edge Cases Tests")
    inner class EdgeCasesTests {
        
        @Test
        @DisplayName("Should handle Unicode characters in table name")
        fun `should handle Unicode characters in table name`() {
            // Given
            val unicodeName = "テーブル名 🎯 José María's Table"
            
            // When
            val table = DomainModelTestBuilder.table(name = unicodeName)
            
            // Then
            assertEquals(unicodeName, table.name)
        }
        
        @Test
        @DisplayName("Should handle table name at exact boundaries")
        fun `should handle table name at exact boundaries`() {
            // Given
            val nameAt255 = "a".repeat(255)
            val nameAt1 = "a"
            
            // When & Then
            val tableAt255 = DomainModelTestBuilder.table(name = nameAt255)
            assertEquals(nameAt255, tableAt255.name)
            
            val tableAt1 = DomainModelTestBuilder.table(name = nameAt1)
            assertEquals(nameAt1, tableAt1.name)
        }
        
        @Test
        @DisplayName("Should handle empty table operations")
        fun `should handle empty table operations`() {
            // Given
            val emptyTable = DomainModelTestBuilder.table()
            
            // When & Then
            assertTrue(emptyTable.isEmpty())
            assertEquals(0, emptyTable.getPropertyCount())
            assertTrue(emptyTable.getOrderedProperties().isEmpty())
            assertNull(emptyTable.getProperty("nonexistent"))
            
            // Should be able to get ordered properties on empty table
            assertDoesNotThrow {
                emptyTable.getOrderedProperties()
            }
        }
        
        @Test
        @DisplayName("Should handle rapid successive operations")
        fun `should handle rapid successive operations`() {
            // Given
            val table = DomainModelTestBuilder.table()
            
            // When
            var currentTable = table
            repeat(10) { i ->
                currentTable = currentTable
                    .addProperty("prop_$i", DomainModelTestBuilder.propertyDefinition(displayName = "Property $i"))
                    .rename("Table $i")
            }
            
            // Then
            assertEquals("Table 9", currentTable.name)
            assertEquals(10, currentTable.getPropertyCount())
            assertTrue(currentTable.updatedAt.isAfter(table.updatedAt))
        }
    }
}