package dev.ryuzu.astermanagement.security.rbac.entity

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested

/**
 * Unit tests for Permission enum and bitwise operations.
 * Validates the Discord-style permission flag system implementation.
 */
@DisplayName("Permission Enum Tests")
class PermissionTest {

    @Nested
    @DisplayName("Permission Value Calculations")
    inner class PermissionValueTests {

        @Test
        @DisplayName("Should calculate correct bit values for all permissions")
        fun `should calculate correct bit values`() {
            // Test first few permissions to ensure bit calculations are correct
            assertEquals(1L, Permission.MATTER_CREATE.value) // 1 << 0 = 1
            assertEquals(2L, Permission.MATTER_READ.value)    // 1 << 1 = 2
            assertEquals(4L, Permission.MATTER_UPDATE.value)  // 1 << 2 = 4
            assertEquals(8L, Permission.MATTER_DELETE.value)  // 1 << 3 = 8
            assertEquals(16L, Permission.MATTER_EXPORT.value) // 1 << 4 = 16
            
            // Test some document permissions
            assertEquals(32L, Permission.DOCUMENT_CREATE.value)  // 1 << 5 = 32
            assertEquals(64L, Permission.DOCUMENT_READ.value)    // 1 << 6 = 64
            
            // Test highest permission
            assertEquals(1L shl 27, Permission.AUDIT_READ.value) // 1 << 27 = 134217728
        }

        @Test
        @DisplayName("Should have unique bit positions for all permissions")
        fun `should have unique bit positions`() {
            val bitPositions = Permission.values().map { it.bit }.toSet()
            val values = Permission.values().map { it.value }.toSet()
            
            // All bit positions should be unique
            assertEquals(Permission.values().size, bitPositions.size)
            
            // All calculated values should be unique
            assertEquals(Permission.values().size, values.size)
        }

        @Test
        @DisplayName("Should assign correct categories to permissions")
        fun `should assign correct categories`() {
            assertEquals("MATTER", Permission.MATTER_CREATE.category)
            assertEquals("MATTER", Permission.MATTER_READ.category)
            assertEquals("DOCUMENT", Permission.DOCUMENT_CREATE.category)
            assertEquals("CLIENT", Permission.CLIENT_CREATE.category)
            assertEquals("COMMUNICATION", Permission.COMM_CREATE.category)
            assertEquals("FINANCIAL", Permission.EXPENSE_CREATE.category)
            assertEquals("ADMINISTRATIVE", Permission.USER_MANAGE.category)
        }
    }

    @Nested
    @DisplayName("Bitwise Operations")
    inner class BitwiseOperationTests {

        @Test
        @DisplayName("Should correctly check if permission is set")
        fun `should check permission correctly`() {
            val permissions = Permission.MATTER_READ.value or Permission.DOCUMENT_READ.value
            
            assertTrue(Permission.hasPermission(permissions, Permission.MATTER_READ))
            assertTrue(Permission.hasPermission(permissions, Permission.DOCUMENT_READ))
            assertFalse(Permission.hasPermission(permissions, Permission.MATTER_CREATE))
            assertFalse(Permission.hasPermission(permissions, Permission.DOCUMENT_CREATE))
        }

        @Test
        @DisplayName("Should grant permissions correctly")
        fun `should grant permissions correctly`() {
            var permissions = 0L
            
            permissions = Permission.grantPermission(permissions, Permission.MATTER_READ)
            assertTrue(Permission.hasPermission(permissions, Permission.MATTER_READ))
            
            permissions = Permission.grantPermission(permissions, Permission.DOCUMENT_READ)
            assertTrue(Permission.hasPermission(permissions, Permission.MATTER_READ))
            assertTrue(Permission.hasPermission(permissions, Permission.DOCUMENT_READ))
        }

        @Test
        @DisplayName("Should revoke permissions correctly")
        fun `should revoke permissions correctly`() {
            var permissions = Permission.MATTER_READ.value or Permission.DOCUMENT_READ.value
            
            permissions = Permission.revokePermission(permissions, Permission.MATTER_READ)
            assertFalse(Permission.hasPermission(permissions, Permission.MATTER_READ))
            assertTrue(Permission.hasPermission(permissions, Permission.DOCUMENT_READ))
            
            permissions = Permission.revokePermission(permissions, Permission.DOCUMENT_READ)
            assertFalse(Permission.hasPermission(permissions, Permission.DOCUMENT_READ))
            assertEquals(0L, permissions)
        }

        @Test
        @DisplayName("Should list active permissions correctly")
        fun `should list active permissions correctly`() {
            val permissions = Permission.MATTER_READ.value or Permission.DOCUMENT_READ.value or Permission.CLIENT_READ.value
            val activePermissions = Permission.getPermissionsList(permissions)
            
            assertEquals(3, activePermissions.size)
            assertTrue(activePermissions.contains(Permission.MATTER_READ))
            assertTrue(activePermissions.contains(Permission.DOCUMENT_READ))
            assertTrue(activePermissions.contains(Permission.CLIENT_READ))
            assertFalse(activePermissions.contains(Permission.MATTER_CREATE))
        }

        @Test
        @DisplayName("Should combine multiple permissions")
        fun `should combine permissions correctly`() {
            val combined = Permission.combinePermissions(
                Permission.MATTER_CREATE,
                Permission.MATTER_READ,
                Permission.DOCUMENT_READ
            )
            
            assertTrue(Permission.hasPermission(combined, Permission.MATTER_CREATE))
            assertTrue(Permission.hasPermission(combined, Permission.MATTER_READ))
            assertTrue(Permission.hasPermission(combined, Permission.DOCUMENT_READ))
            assertFalse(Permission.hasPermission(combined, Permission.MATTER_DELETE))
        }
    }

    @Nested
    @DisplayName("Category Operations")
    inner class CategoryOperationTests {

        @Test
        @DisplayName("Should get permissions by category")
        fun `should get permissions by category`() {
            val matterPermissions = Permission.getPermissionsByCategory("MATTER")
            assertEquals(5, matterPermissions.size) // CREATE, READ, UPDATE, DELETE, EXPORT
            
            val documentPermissions = Permission.getPermissionsByCategory("DOCUMENT")
            assertEquals(5, documentPermissions.size) // CREATE, READ, UPDATE, DELETE, EXPORT
            
            val adminPermissions = Permission.getPermissionsByCategory("ADMINISTRATIVE")
            assertEquals(5, adminPermissions.size) // USER_MANAGE, ROLE_MANAGE, EXPORT_DATA, SYSTEM_SETTINGS, AUDIT_READ
        }

        @Test
        @DisplayName("Should get all permissions for category")
        fun `should get all permissions for category`() {
            val matterMask = Permission.getAllPermissionsForCategory("MATTER")
            
            // Should have all matter permissions
            assertTrue(Permission.hasPermission(matterMask, Permission.MATTER_CREATE))
            assertTrue(Permission.hasPermission(matterMask, Permission.MATTER_READ))
            assertTrue(Permission.hasPermission(matterMask, Permission.MATTER_UPDATE))
            assertTrue(Permission.hasPermission(matterMask, Permission.MATTER_DELETE))
            assertTrue(Permission.hasPermission(matterMask, Permission.MATTER_EXPORT))
            
            // Should not have permissions from other categories
            assertFalse(Permission.hasPermission(matterMask, Permission.DOCUMENT_READ))
            assertFalse(Permission.hasPermission(matterMask, Permission.CLIENT_READ))
        }

        @Test
        @DisplayName("Should describe permissions in human readable format")
        fun `should describe permissions`() {
            val permissions = Permission.MATTER_READ.value or Permission.DOCUMENT_READ.value
            val description = Permission.describePermissions(permissions)
            
            assertTrue(description.contains("MATTER_READ"))
            assertTrue(description.contains("DOCUMENT_READ"))
            assertTrue(description.contains("View matter details"))
            assertTrue(description.contains("View documents"))
        }
    }

    @Nested
    @DisplayName("Default Permission Sets")
    inner class DefaultPermissionTests {

        @Test
        @DisplayName("Client permissions should be read-only")
        fun `client permissions should be read only`() {
            val clientPermissions = Permission.Companion.Defaults.CLIENT_PERMISSIONS
            
            // Should have read permissions
            assertTrue(Permission.hasPermission(clientPermissions, Permission.MATTER_READ))
            assertTrue(Permission.hasPermission(clientPermissions, Permission.DOCUMENT_READ))
            assertTrue(Permission.hasPermission(clientPermissions, Permission.COMM_READ))
            
            // Should not have write permissions
            assertFalse(Permission.hasPermission(clientPermissions, Permission.MATTER_CREATE))
            assertFalse(Permission.hasPermission(clientPermissions, Permission.DOCUMENT_CREATE))
            assertFalse(Permission.hasPermission(clientPermissions, Permission.USER_MANAGE))
        }

        @Test
        @DisplayName("Clerk permissions should include CRUD but not delete or admin")
        fun `clerk permissions should include CRUD without delete or admin`() {
            val clerkPermissions = Permission.Companion.Defaults.CLERK_PERMISSIONS
            
            // Should have CRUD permissions (except delete)
            assertTrue(Permission.hasPermission(clerkPermissions, Permission.MATTER_CREATE))
            assertTrue(Permission.hasPermission(clerkPermissions, Permission.MATTER_READ))
            assertTrue(Permission.hasPermission(clerkPermissions, Permission.MATTER_UPDATE))
            
            assertTrue(Permission.hasPermission(clerkPermissions, Permission.DOCUMENT_CREATE))
            assertTrue(Permission.hasPermission(clerkPermissions, Permission.DOCUMENT_READ))
            assertTrue(Permission.hasPermission(clerkPermissions, Permission.DOCUMENT_UPDATE))
            
            // Should not have delete or admin permissions
            assertFalse(Permission.hasPermission(clerkPermissions, Permission.MATTER_DELETE))
            assertFalse(Permission.hasPermission(clerkPermissions, Permission.DOCUMENT_DELETE))
            assertFalse(Permission.hasPermission(clerkPermissions, Permission.USER_MANAGE))
            assertFalse(Permission.hasPermission(clerkPermissions, Permission.ROLE_MANAGE))
        }

        @Test
        @DisplayName("Lawyer permissions should include all permissions")
        fun `lawyer permissions should include all permissions`() {
            val lawyerPermissions = Permission.Companion.Defaults.LAWYER_PERMISSIONS
            
            // Should have all permissions
            Permission.values().forEach { permission ->
                assertTrue(
                    Permission.hasPermission(lawyerPermissions, permission),
                    "Lawyer should have permission: ${permission.name}"
                )
            }
        }

        @Test
        @DisplayName("Should parse permission names correctly")
        fun `should parse permission names correctly`() {
            val permissionNames = listOf("MATTER_READ", "DOCUMENT_READ", "CLIENT_READ")
            val parsedPermissions = Permission.parsePermissions(permissionNames)
            
            assertTrue(Permission.hasPermission(parsedPermissions, Permission.MATTER_READ))
            assertTrue(Permission.hasPermission(parsedPermissions, Permission.DOCUMENT_READ))
            assertTrue(Permission.hasPermission(parsedPermissions, Permission.CLIENT_READ))
            assertFalse(Permission.hasPermission(parsedPermissions, Permission.MATTER_CREATE))
        }
    }

    @Nested
    @DisplayName("Edge Cases and Validation")
    inner class EdgeCaseTests {

        @Test
        @DisplayName("Should handle empty permissions correctly")
        fun `should handle empty permissions`() {
            val emptyPermissions = 0L
            
            Permission.values().forEach { permission ->
                assertFalse(Permission.hasPermission(emptyPermissions, permission))
            }
            
            assertEquals(emptyList<Permission>(), Permission.getPermissionsList(emptyPermissions))
            assertEquals("No permissions", Permission.describePermissions(emptyPermissions))
        }

        @Test
        @DisplayName("Should handle granting same permission multiple times")
        fun `should handle duplicate permission grants`() {
            var permissions = 0L
            
            permissions = Permission.grantPermission(permissions, Permission.MATTER_READ)
            val firstGrant = permissions
            
            permissions = Permission.grantPermission(permissions, Permission.MATTER_READ)
            val secondGrant = permissions
            
            // Should be idempotent
            assertEquals(firstGrant, secondGrant)
            assertTrue(Permission.hasPermission(permissions, Permission.MATTER_READ))
        }

        @Test
        @DisplayName("Should handle revoking non-existent permission")
        fun `should handle revoking non-existent permission`() {
            val permissions = Permission.MATTER_READ.value
            val result = Permission.revokePermission(permissions, Permission.DOCUMENT_READ)
            
            // Should remain unchanged
            assertEquals(permissions, result)
            assertTrue(Permission.hasPermission(result, Permission.MATTER_READ))
            assertFalse(Permission.hasPermission(result, Permission.DOCUMENT_READ))
        }

        @Test
        @DisplayName("Should handle invalid permission names gracefully")
        fun `should handle invalid permission names`() {
            val permissionNames = listOf("MATTER_READ", "INVALID_PERMISSION", "DOCUMENT_READ")
            val parsedPermissions = Permission.parsePermissions(permissionNames)
            
            // Should only parse valid permissions
            assertTrue(Permission.hasPermission(parsedPermissions, Permission.MATTER_READ))
            assertTrue(Permission.hasPermission(parsedPermissions, Permission.DOCUMENT_READ))
            
            // Should have only 2 permissions (invalid one ignored)
            assertEquals(2, Permission.getPermissionsList(parsedPermissions).size)
        }
    }
}