package com.astarworks.astarmanagement.unit.core.auth.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
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
@DisplayName("DynamicRole Domain Model Tests")
class DynamicRoleTest {
    
    companion object {
        @JvmStatic
        fun invalidRoleNameCases(): Stream<String> {
            return DomainModelTestBuilder.invalidRoleNames().stream()
        }
        
        @JvmStatic
        fun validRoleNameCases(): Stream<String> {
            return DomainModelTestBuilder.validRoleNames().stream()
        }
        
        @JvmStatic
        fun invalidColorCases(): Stream<String> {
            return DomainModelTestBuilder.invalidColors().stream()
        }
        
        @JvmStatic
        fun validColorCases(): Stream<String> {
            return DomainModelTestBuilder.validColors().stream()
        }
        
        @JvmStatic
        fun invalidDisplayNameCases(): Stream<String> {
            return Stream.of(
                "a".repeat(256), // over 255 limit
                "a".repeat(300)  // way over limit
            )
        }
        
        @JvmStatic
        fun validDisplayNameCases(): Stream<String> {
            return Stream.of(
                "Admin Role",
                "User Role",
                "Viewer Role",
                "Super Administrator",
                "Content Manager",
                "a".repeat(255), // at limit
                "ロール名前", // Japanese
                "Rôle Français", // French
                "Роль на русском" // Russian
            )
        }
    }
    
    @Nested
    @DisplayName("Construction and Validation Tests")
    inner class ConstructionTests {
        
        @Test
        @DisplayName("Should create DynamicRole with valid parameters")
        fun `should create DynamicRole with valid parameters`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val name = "admin_role"
            val displayName = "Administrator Role"
            val color = "#FF5733"
            val position = 10
            
            // When
            val role = DomainModelTestBuilder.dynamicRole(
                tenantId = tenantId,
                name = name,
                displayName = displayName,
                color = color,
                position = position
            )
            
            // Then
            assertEquals(tenantId, role.tenantId)
            assertEquals(name, role.name)
            assertEquals(displayName, role.displayName)
            assertEquals(color, role.color)
            assertEquals(position, role.position)
            assertFalse(role.isSystem)
            assertNotNull(role.id)
            assertNotNull(role.createdAt)
            assertNotNull(role.updatedAt)
        }
        
        @Test
        @DisplayName("Should create DynamicRole with minimal parameters")
        fun `should create DynamicRole with minimal parameters`() {
            // Given
            val name = "basic_role"
            
            // When
            val role = DomainModelTestBuilder.dynamicRole(
                tenantId = null,
                name = name,
                displayName = null,
                color = null,
                position = 0,
                isSystem = false
            )
            
            // Then
            assertNull(role.tenantId)
            assertEquals(name, role.name)
            assertNull(role.displayName)
            assertNull(role.color)
            assertEquals(0, role.position)
            assertFalse(role.isSystem)
        }
        
        @Test
        @DisplayName("Should generate unique ID automatically")
        fun `should generate unique ID automatically`() {
            // When
            val role1 = DomainModelTestBuilder.dynamicRole(name = "role1")
            val role2 = DomainModelTestBuilder.dynamicRole(name = "role2")
            
            // Then
            assertNotNull(role1.id)
            assertNotNull(role2.id)
            assertNotEquals(role1.id, role2.id)
        }
        
        @ParameterizedTest(name = "Should reject invalid name: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.auth.domain.model.DynamicRoleTest#invalidRoleNameCases")
        fun `should reject invalid role names`(invalidName: String) {
            // When & Then
            assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.dynamicRole(name = invalidName)
            }
        }
        
        @ParameterizedTest(name = "Should accept valid name: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.auth.domain.model.DynamicRoleTest#validRoleNameCases")
        fun `should accept valid role names`(validName: String) {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.dynamicRole(name = validName)
            }
        }
        
        @ParameterizedTest(name = "Should accept valid display name: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.auth.domain.model.DynamicRoleTest#validDisplayNameCases")
        fun `should accept valid display names`(validDisplayName: String) {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.dynamicRole(displayName = validDisplayName)
            }
        }
        
        @ParameterizedTest(name = "Should reject invalid display name: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.auth.domain.model.DynamicRoleTest#invalidDisplayNameCases")
        fun `should reject invalid display names`(invalidDisplayName: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.dynamicRole(displayName = invalidDisplayName)
            }
            assertEquals("Display name cannot exceed 255 characters", exception.message)
        }
        
        @ParameterizedTest(name = "Should accept valid color: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.auth.domain.model.DynamicRoleTest#validColorCases")
        fun `should accept valid colors`(validColor: String) {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.dynamicRole(color = validColor)
            }
        }
        
        @ParameterizedTest(name = "Should reject invalid color: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.auth.domain.model.DynamicRoleTest#invalidColorCases")
        fun `should reject invalid colors`(invalidColor: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.dynamicRole(color = invalidColor)
            }
            assertEquals("Color must be a valid hex color code (e.g., #FF5733)", exception.message)
        }
        
        @Test
        @DisplayName("Should accept position at zero")
        fun `should accept position at zero`() {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.dynamicRole(position = 0)
            }
        }
        
        @Test
        @DisplayName("Should reject negative position")
        fun `should reject negative position`() {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.dynamicRole(position = -1)
            }
            assertEquals("Position must be non-negative", exception.message)
        }
        
        @Test
        @DisplayName("Should accept high position values")
        fun `should accept high position values`() {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.dynamicRole(position = Int.MAX_VALUE)
            }
        }
    }
    
    @Nested
    @DisplayName("Update Operations Tests")
    inner class UpdateOperationsTests {
        
        @Test
        @DisplayName("Should update display name and timestamp")
        fun `should update display name and timestamp`() {
            // Given
            val originalRole = DomainModelTestBuilder.dynamicRole(displayName = "Original Name")
            val originalUpdatedAt = originalRole.updatedAt
            val newDisplayName = "Updated Name"
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedRole = originalRole.updateDisplayName(newDisplayName)
            
            // Then
            assertEquals(newDisplayName, updatedRole.displayName)
            assertEquals(originalRole.id, updatedRole.id)
            assertEquals(originalRole.name, updatedRole.name)
            assertEquals(originalRole.tenantId, updatedRole.tenantId)
            assertEquals(originalRole.createdAt, updatedRole.createdAt)
            assertTrue(updatedRole.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should update display name to null")
        fun `should update display name to null`() {
            // Given
            val originalRole = DomainModelTestBuilder.dynamicRole(displayName = "Original Name")
            
            // When
            val updatedRole = originalRole.updateDisplayName(null)
            
            // Then
            assertNull(updatedRole.displayName)
            assertEquals(originalRole.name, updatedRole.name) // Other fields preserved
        }
        
        @Test
        @DisplayName("Should reject invalid display name in update")
        fun `should reject invalid display name in update`() {
            // Given
            val role = DomainModelTestBuilder.dynamicRole()
            val tooLongName = "a".repeat(256)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                role.updateDisplayName(tooLongName)
            }
            assertEquals("Display name cannot exceed 255 characters", exception.message)
        }
        
        @Test
        @DisplayName("Should update color and timestamp")
        fun `should update color and timestamp`() {
            // Given
            val originalRole = DomainModelTestBuilder.dynamicRole(color = "#FF5733")
            val originalUpdatedAt = originalRole.updatedAt
            val newColor = "#33FF57"
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedRole = originalRole.updateColor(newColor)
            
            // Then
            assertEquals(newColor, updatedRole.color)
            assertEquals(originalRole.displayName, updatedRole.displayName) // Other fields preserved
            assertTrue(updatedRole.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should update color to null")
        fun `should update color to null`() {
            // Given
            val originalRole = DomainModelTestBuilder.dynamicRole(color = "#FF5733")
            
            // When
            val updatedRole = originalRole.updateColor(null)
            
            // Then
            assertNull(updatedRole.color)
            assertEquals(originalRole.displayName, updatedRole.displayName) // Other fields preserved
        }
        
        @Test
        @DisplayName("Should reject invalid color in update")
        fun `should reject invalid color in update`() {
            // Given
            val role = DomainModelTestBuilder.dynamicRole()
            val invalidColor = "#GG5733"
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                role.updateColor(invalidColor)
            }
            assertEquals("Color must be a valid hex color code (e.g., #FF5733)", exception.message)
        }
        
        @Test
        @DisplayName("Should update position and timestamp")
        fun `should update position and timestamp`() {
            // Given
            val originalRole = DomainModelTestBuilder.dynamicRole(position = 0)
            val originalUpdatedAt = originalRole.updatedAt
            val newPosition = 42
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedRole = originalRole.updatePosition(newPosition)
            
            // Then
            assertEquals(newPosition, updatedRole.position)
            assertEquals(originalRole.displayName, updatedRole.displayName) // Other fields preserved
            assertTrue(updatedRole.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should reject negative position in update")
        fun `should reject negative position in update`() {
            // Given
            val role = DomainModelTestBuilder.dynamicRole()
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                role.updatePosition(-5)
            }
            assertEquals("Position must be non-negative", exception.message)
        }
        
        @Test
        @DisplayName("Should preserve immutability in updates")
        fun `should preserve immutability in updates`() {
            // Given
            val originalRole = DomainModelTestBuilder.dynamicRole(
                displayName = "Original",
                color = "#FF5733",
                position = 0
            )
            val originalDisplayName = originalRole.displayName
            val originalColor = originalRole.color
            val originalPosition = originalRole.position
            
            // When
            val updatedRole = originalRole
                .updateDisplayName("Updated")
                .updateColor("#33FF57")
                .updatePosition(10)
            
            // Then - Original unchanged
            assertEquals(originalDisplayName, originalRole.displayName)
            assertEquals(originalColor, originalRole.color)
            assertEquals(originalPosition, originalRole.position)
            
            // And - Updated has new values
            assertEquals("Updated", updatedRole.displayName)
            assertEquals("#33FF57", updatedRole.color)
            assertEquals(10, updatedRole.position)
        }
    }
    
    @Nested
    @DisplayName("Business Logic Tests")
    inner class BusinessLogicTests {
        
        @Test
        @DisplayName("Should correctly identify tenant-specific roles")
        fun `should correctly identify tenant-specific roles`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val tenantRole = DomainModelTestBuilder.dynamicRole(tenantId = tenantId)
            val systemRole = DomainModelTestBuilder.dynamicRole(tenantId = null)
            
            // When & Then
            assertTrue(tenantRole.isTenantSpecific())
            assertFalse(tenantRole.isSystemWide())
            
            assertFalse(systemRole.isTenantSpecific())
            assertTrue(systemRole.isSystemWide())
        }
        
        @Test
        @DisplayName("Should correctly identify deletable roles")
        fun `should correctly identify deletable roles`() {
            // Given
            val systemRole = DomainModelTestBuilder.dynamicRole(isSystem = true)
            val regularRole = DomainModelTestBuilder.dynamicRole(isSystem = false)
            
            // When & Then
            assertFalse(systemRole.isDeletable())
            assertTrue(regularRole.isDeletable())
        }
        
        @Test
        @DisplayName("Should correctly identify editable roles")
        fun `should correctly identify editable roles`() {
            // Given
            val systemRole = DomainModelTestBuilder.dynamicRole(isSystem = true)
            val regularRole = DomainModelTestBuilder.dynamicRole(isSystem = false)
            
            // When & Then - All roles should be editable
            assertTrue(systemRole.isEditable())
            assertTrue(regularRole.isEditable())
        }
    }
    
    @Nested
    @DisplayName("Factory Method Tests")
    inner class FactoryMethodTests {
        
        @Test
        @DisplayName("Should create tenant-specific role with forTenant factory")
        fun `should create tenant-specific role with forTenant factory`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val name = "tenant_admin"
            val displayName = "Tenant Administrator"
            val color = "#FF5733"
            val position = 5
            
            // When
            val role = DynamicRole.forTenant(
                tenantId = tenantId,
                name = name,
                displayName = displayName,
                color = color,
                position = position
            )
            
            // Then
            assertEquals(tenantId, role.tenantId)
            assertEquals(name, role.name)
            assertEquals(displayName, role.displayName)
            assertEquals(color, role.color)
            assertEquals(position, role.position)
            assertFalse(role.isSystem)
            assertTrue(role.isTenantSpecific())
            assertTrue(role.isDeletable())
        }
        
        @Test
        @DisplayName("Should create tenant-specific role with minimal parameters")
        fun `should create tenant-specific role with minimal parameters`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val name = "basic_role"
            
            // When
            val role = DynamicRole.forTenant(tenantId, name)
            
            // Then
            assertEquals(tenantId, role.tenantId)
            assertEquals(name, role.name)
            assertNull(role.displayName)
            assertNull(role.color)
            assertEquals(0, role.position)
            assertFalse(role.isSystem)
        }
        
        @Test
        @DisplayName("Should create system role with systemRole factory")
        fun `should create system role with systemRole factory`() {
            // Given
            val name = "system_admin"
            val displayName = "System Administrator"
            val color = "#FF0000"
            val position = 100
            
            // When
            val role = DynamicRole.systemRole(
                name = name,
                displayName = displayName,
                color = color,
                position = position
            )
            
            // Then
            assertNull(role.tenantId)
            assertEquals(name, role.name)
            assertEquals(displayName, role.displayName)
            assertEquals(color, role.color)
            assertEquals(position, role.position)
            assertTrue(role.isSystem)
            assertTrue(role.isSystemWide())
            assertFalse(role.isDeletable())
        }
        
        @Test
        @DisplayName("Should create system role with minimal parameters")
        fun `should create system role with minimal parameters`() {
            // Given
            val name = "basic_system"
            
            // When
            val role = DynamicRole.systemRole(name)
            
            // Then
            assertNull(role.tenantId)
            assertEquals(name, role.name)
            assertNull(role.displayName)
            assertNull(role.color)
            assertEquals(0, role.position)
            assertTrue(role.isSystem)
        }
        
        @Test
        @DisplayName("Should validate parameters in factory methods")
        fun `should validate parameters in factory methods`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            
            // When & Then - forTenant validation
            assertThrows(IllegalArgumentException::class.java) {
                DynamicRole.forTenant(tenantId, "")
            }
            
            assertThrows(IllegalArgumentException::class.java) {
                DynamicRole.forTenant(tenantId, "invalid name", color = "#invalid")
            }
            
            // When & Then - systemRole validation
            assertThrows(IllegalArgumentException::class.java) {
                DynamicRole.systemRole("")
            }
            
            assertThrows(IllegalArgumentException::class.java) {
                DynamicRole.systemRole("valid_name", color = "not_hex")
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
            val id = RoleId(UUID.randomUUID())
            val tenantId = TenantId(UUID.randomUUID())
            val name = "same_role"
            val displayName = "Same Role"
            val color = "#FF5733"
            val position = 5
            val timestamp = Instant.now()
            
            val role1 = DomainModelTestBuilder.dynamicRole(
                id = id,
                tenantId = tenantId,
                name = name,
                displayName = displayName,
                color = color,
                position = position,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            val role2 = DomainModelTestBuilder.dynamicRole(
                id = id,
                tenantId = tenantId,
                name = name,
                displayName = displayName,
                color = color,
                position = position,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            
            // Then
            assertEquals(role1, role2)
            assertEquals(role1.hashCode(), role2.hashCode())
        }
        
        @Test
        @DisplayName("Should not be equal with different properties")
        fun `should not be equal with different properties`() {
            // Given
            val baseRole = DomainModelTestBuilder.dynamicRole()
            val differentId = baseRole.copy(id = RoleId(UUID.randomUUID()))
            val differentName = baseRole.copy(name = "different_name")
            val differentTenant = baseRole.copy(tenantId = TenantId(UUID.randomUUID()))
            val differentColor = baseRole.copy(color = "#33FF57")
            
            // Then
            assertNotEquals(baseRole, differentId)
            assertNotEquals(baseRole, differentName)
            assertNotEquals(baseRole, differentTenant)
            assertNotEquals(baseRole, differentColor)
        }
        
        @Test
        @DisplayName("Should implement toString with all properties")
        fun `should implement toString with all properties`() {
            // Given
            val role = DomainModelTestBuilder.dynamicRole(
                name = "test_role",
                displayName = "Test Role",
                color = "#FF5733",
                position = 10
            )
            
            // When
            val toString = role.toString()
            
            // Then
            assertTrue(toString.contains("test_role"))
            assertTrue(toString.contains("Test Role"))
            assertTrue(toString.contains("#FF5733"))
            assertTrue(toString.contains("10"))
            assertTrue(toString.contains(role.id.toString()))
        }
        
        @Test
        @DisplayName("Should support copy with parameter changes")
        fun `should support copy with parameter changes`() {
            // Given
            val originalRole = DomainModelTestBuilder.dynamicRole(
                name = "original_role",
                displayName = "Original Role",
                color = "#FF5733"
            )
            
            // When
            val copiedRole = originalRole.copy(
                name = "copied_role",
                displayName = "Copied Role",
                color = "#33FF57"
            )
            
            // Then
            assertEquals("copied_role", copiedRole.name)
            assertEquals("Copied Role", copiedRole.displayName)
            assertEquals("#33FF57", copiedRole.color)
            assertEquals(originalRole.id, copiedRole.id) // ID preserved
            assertEquals(originalRole.tenantId, copiedRole.tenantId) // Tenant preserved
        }
    }
    
    @Nested
    @DisplayName("Edge Cases and Integration Tests")
    inner class EdgeCasesTests {
        
        @Test
        @DisplayName("Should handle role name at boundary limits")
        fun `should handle role name at boundary limits`() {
            // Given
            val nameAt100 = "a".repeat(100)
            val nameAt1 = "a"
            
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.dynamicRole(name = nameAt100)
            }
            assertDoesNotThrow {
                DomainModelTestBuilder.dynamicRole(name = nameAt1)
            }
        }
        
        @Test
        @DisplayName("Should handle display name at boundary limits")
        fun `should handle display name at boundary limits`() {
            // Given
            val displayNameAt255 = "a".repeat(255)
            
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.dynamicRole(displayName = displayNameAt255)
            }
        }
        
        @Test
        @DisplayName("Should handle complex role scenarios")
        fun `should handle complex role scenarios`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val role = DynamicRole.forTenant(
                tenantId = tenantId,
                name = "complex_role",
                displayName = "Complex Role",
                color = "#FF5733",
                position = 10
            )
            
            // When - Multiple operations
            val updatedRole = role
                .updateDisplayName("Updated Complex Role")
                .updateColor("#33FF57")
                .updatePosition(20)
            
            // Then - Verify all business rules
            assertTrue(updatedRole.isTenantSpecific())
            assertFalse(updatedRole.isSystemWide())
            assertTrue(updatedRole.isDeletable())
            assertTrue(updatedRole.isEditable())
            assertEquals("Updated Complex Role", updatedRole.displayName)
            assertEquals("#33FF57", updatedRole.color)
            assertEquals(20, updatedRole.position)
            assertEquals(tenantId, updatedRole.tenantId)
        }
        
        @Test
        @DisplayName("Should handle all valid role name patterns")
        fun `should handle all valid role name patterns`() {
            // Given
            val validPatterns = mapOf(
                "lowercase_only" to "admin",
                "with_numbers" to "user123",
                "with_underscores" to "super_admin_role",
                "mixed" to "role_123_admin",
                "single_char" to "a",
                "all_numbers" to "123456"
            )
            
            // When & Then
            validPatterns.forEach { (description, name) ->
                assertDoesNotThrow {
                    DomainModelTestBuilder.dynamicRole(name = name)
                }
            }
        }
        
        @Test
        @DisplayName("Should handle rapid successive updates")
        fun `should handle rapid successive updates`() {
            // Given
            val role = DomainModelTestBuilder.dynamicRole()
            
            // When
            var currentRole = role
            repeat(10) { i ->
                currentRole = currentRole
                    .updateDisplayName("Name $i")
                    .updatePosition(i)
            }
            
            // Then
            assertEquals("Name 9", currentRole.displayName)
            assertEquals(9, currentRole.position)
            assertTrue(currentRole.updatedAt.isAfter(role.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle Unicode characters in display name")
        fun `should handle Unicode characters in display name`() {
            // Given
            val unicodeDisplayName = "管理者ロール 🎯 José María"
            
            // When
            val role = DomainModelTestBuilder.dynamicRole(displayName = unicodeDisplayName)
            
            // Then
            assertEquals(unicodeDisplayName, role.displayName)
        }
        
        @Test
        @DisplayName("Should handle system vs tenant role differences")
        fun `should handle system vs tenant role differences`() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val systemRole = DynamicRole.systemRole("system_admin")
            val tenantRole = DynamicRole.forTenant(tenantId, "tenant_admin")
            
            // Then - System role characteristics
            assertNull(systemRole.tenantId)
            assertTrue(systemRole.isSystem)
            assertTrue(systemRole.isSystemWide())
            assertFalse(systemRole.isTenantSpecific())
            assertFalse(systemRole.isDeletable())
            assertTrue(systemRole.isEditable())
            
            // Then - Tenant role characteristics
            assertEquals(tenantId, tenantRole.tenantId)
            assertFalse(tenantRole.isSystem)
            assertFalse(tenantRole.isSystemWide())
            assertTrue(tenantRole.isTenantSpecific())
            assertTrue(tenantRole.isDeletable())
            assertTrue(tenantRole.isEditable())
        }
    }
}