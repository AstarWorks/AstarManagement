package dev.ryuzu.astermanagement.security.rbac.entity

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.BeforeEach

/**
 * Unit tests for Role entity functionality.
 * Tests role creation, permission management, and hierarchy operations.
 */
@DisplayName("Role Entity Tests")
class RoleTest {

    private lateinit var role: Role

    @BeforeEach
    fun setUp() {
        role = Role().apply {
            name = "TEST_ROLE"
            displayName = "Test Role"
            hierarchyLevel = 50
            color = "#FF5733"
            description = "Test role for unit testing"
        }
    }

    @Nested
    @DisplayName("Role Creation and Basic Properties")
    inner class RoleCreationTests {

        @Test
        @DisplayName("Should create role with default values")
        fun `should create role with defaults`() {
            val newRole = Role()
            
            assertEquals("", newRole.name)
            assertEquals("", newRole.displayName)
            assertEquals(0L, newRole.permissions)
            assertEquals(0, newRole.hierarchyLevel)
            assertEquals("#808080", newRole.color)
            assertTrue(newRole.isActive)
            assertFalse(newRole.isSystemRole)
        }

        @Test
        @DisplayName("Should set and get role properties")
        fun `should set and get properties`() {
            assertEquals("TEST_ROLE", role.name)
            assertEquals("Test Role", role.displayName)
            assertEquals(50, role.hierarchyLevel)
            assertEquals("#FF5733", role.color)
            assertEquals("Test role for unit testing", role.description)
        }
    }

    @Nested
    @DisplayName("Permission Management")
    inner class PermissionManagementTests {

        @Test
        @DisplayName("Should grant permissions to role")
        fun `should grant permissions`() {
            assertFalse(role.hasPermission(Permission.MATTER_READ))
            
            role.grantPermission(Permission.MATTER_READ)
            assertTrue(role.hasPermission(Permission.MATTER_READ))
            assertFalse(role.hasPermission(Permission.MATTER_CREATE))
        }

        @Test
        @DisplayName("Should revoke permissions from role")
        fun `should revoke permissions`() {
            role.grantPermission(Permission.MATTER_READ)
            role.grantPermission(Permission.DOCUMENT_READ)
            
            assertTrue(role.hasPermission(Permission.MATTER_READ))
            assertTrue(role.hasPermission(Permission.DOCUMENT_READ))
            
            role.revokePermission(Permission.MATTER_READ)
            assertFalse(role.hasPermission(Permission.MATTER_READ))
            assertTrue(role.hasPermission(Permission.DOCUMENT_READ))
        }

        @Test
        @DisplayName("Should get list of permissions")
        fun `should get permissions list`() {
            role.grantPermission(Permission.MATTER_READ)
            role.grantPermission(Permission.DOCUMENT_READ)
            role.grantPermission(Permission.CLIENT_READ)
            
            val permissions = role.getPermissionsList()
            assertEquals(3, permissions.size)
            assertTrue(permissions.contains(Permission.MATTER_READ))
            assertTrue(permissions.contains(Permission.DOCUMENT_READ))
            assertTrue(permissions.contains(Permission.CLIENT_READ))
        }

        @Test
        @DisplayName("Should set permissions from list")
        fun `should set permissions from list`() {
            val permissionList = listOf(
                Permission.MATTER_CREATE,
                Permission.MATTER_READ,
                Permission.DOCUMENT_READ
            )
            
            role.setPermissions(permissionList)
            
            assertTrue(role.hasPermission(Permission.MATTER_CREATE))
            assertTrue(role.hasPermission(Permission.MATTER_READ))
            assertTrue(role.hasPermission(Permission.DOCUMENT_READ))
            assertFalse(role.hasPermission(Permission.MATTER_DELETE))
        }

        @Test
        @DisplayName("Should get permissions description")
        fun `should get permissions description`() {
            role.grantPermission(Permission.MATTER_READ)
            role.grantPermission(Permission.DOCUMENT_READ)
            
            val description = role.getPermissionsDescription()
            assertTrue(description.contains("MATTER_READ"))
            assertTrue(description.contains("DOCUMENT_READ"))
        }
    }

    @Nested
    @DisplayName("Role Hierarchy")
    inner class RoleHierarchyTests {

        @Test
        @DisplayName("Should compare hierarchy levels correctly")
        fun `should compare hierarchy levels`() {
            val higherRole = Role().apply {
                name = "HIGHER_ROLE"
                hierarchyLevel = 100
            }
            
            val lowerRole = Role().apply {
                name = "LOWER_ROLE"
                hierarchyLevel = 10
            }
            
            assertTrue(higherRole.hasHigherHierarchyThan(lowerRole))
            assertFalse(lowerRole.hasHigherHierarchyThan(higherRole))
            
            assertTrue(higherRole.hasEqualOrHigherHierarchyThan(lowerRole))
            assertTrue(higherRole.hasEqualOrHigherHierarchyThan(higherRole))
            assertFalse(lowerRole.hasEqualOrHigherHierarchyThan(higherRole))
        }

        @Test
        @DisplayName("Should check if role can perform all actions of another role")
        fun `should check role capabilities`() {
            val fullRole = Role().apply {
                grantPermission(Permission.MATTER_CREATE)
                grantPermission(Permission.MATTER_READ)
                grantPermission(Permission.DOCUMENT_READ)
            }
            
            val limitedRole = Role().apply {
                grantPermission(Permission.MATTER_READ)
                grantPermission(Permission.DOCUMENT_READ)
            }
            
            assertTrue(fullRole.canPerformAllActionsOf(limitedRole))
            assertFalse(limitedRole.canPerformAllActionsOf(fullRole))
            assertTrue(fullRole.canPerformAllActionsOf(fullRole))
        }

        @Test
        @DisplayName("Should get additional permissions compared to another role")
        fun `should get additional permissions`() {
            val fullRole = Role().apply {
                grantPermission(Permission.MATTER_CREATE)
                grantPermission(Permission.MATTER_READ)
                grantPermission(Permission.DOCUMENT_READ)
            }
            
            val limitedRole = Role().apply {
                grantPermission(Permission.MATTER_READ)
            }
            
            val additional = fullRole.getAdditionalPermissionsComparedTo(limitedRole)
            assertEquals(2, additional.size)
            assertTrue(additional.contains(Permission.MATTER_CREATE))
            assertTrue(additional.contains(Permission.DOCUMENT_READ))
        }
    }

    @Nested
    @DisplayName("Role Factory Methods")
    inner class RoleFactoryTests {

        @Test
        @DisplayName("Should create default client role")
        fun `should create client role`() {
            val clientRole = Role.createClientRole()
            
            assertEquals("CLIENT", clientRole.name)
            assertEquals("Client", clientRole.displayName)
            assertEquals(Role.Companion.HierarchyLevel.CLIENT, clientRole.hierarchyLevel)
            assertEquals(Role.Companion.DefaultColors.CLIENT, clientRole.color)
            assertTrue(clientRole.isSystemRole)
            
            // Should have read-only permissions
            assertTrue(clientRole.hasPermission(Permission.MATTER_READ))
            assertTrue(clientRole.hasPermission(Permission.DOCUMENT_READ))
            assertTrue(clientRole.hasPermission(Permission.COMM_READ))
            assertFalse(clientRole.hasPermission(Permission.MATTER_CREATE))
        }

        @Test
        @DisplayName("Should create default clerk role")
        fun `should create clerk role`() {
            val clerkRole = Role.createClerkRole()
            
            assertEquals("CLERK", clerkRole.name)
            assertEquals("Clerk", clerkRole.displayName)
            assertEquals(Role.Companion.HierarchyLevel.CLERK, clerkRole.hierarchyLevel)
            assertEquals(Role.Companion.DefaultColors.CLERK, clerkRole.color)
            assertTrue(clerkRole.isSystemRole)
            
            // Should have CRUD permissions but not delete
            assertTrue(clerkRole.hasPermission(Permission.MATTER_CREATE))
            assertTrue(clerkRole.hasPermission(Permission.MATTER_READ))
            assertTrue(clerkRole.hasPermission(Permission.MATTER_UPDATE))
            assertFalse(clerkRole.hasPermission(Permission.MATTER_DELETE))
        }

        @Test
        @DisplayName("Should create default lawyer role")
        fun `should create lawyer role`() {
            val lawyerRole = Role.createLawyerRole()
            
            assertEquals("LAWYER", lawyerRole.name)
            assertEquals("Lawyer", lawyerRole.displayName)
            assertEquals(Role.Companion.HierarchyLevel.LAWYER, lawyerRole.hierarchyLevel)
            assertEquals(Role.Companion.DefaultColors.LAWYER, lawyerRole.color)
            assertTrue(lawyerRole.isSystemRole)
            
            // Should have all permissions
            Permission.values().forEach { permission ->
                assertTrue(
                    lawyerRole.hasPermission(permission),
                    "Lawyer should have permission: ${permission.name}"
                )
            }
        }
    }

    @Nested
    @DisplayName("Role Utilities")
    inner class RoleUtilityTests {

        @Test
        @DisplayName("Should create role copy with different permissions")
        fun `should create role copy with permissions`() {
            role.grantPermission(Permission.MATTER_READ)
            
            val newPermissions = Permission.DOCUMENT_READ.value or Permission.CLIENT_READ.value
            val roleCopy = role.withPermissions(newPermissions)
            
            // Original role should be unchanged
            assertTrue(role.hasPermission(Permission.MATTER_READ))
            assertFalse(role.hasPermission(Permission.DOCUMENT_READ))
            
            // Copy should have new permissions
            assertFalse(roleCopy.hasPermission(Permission.MATTER_READ))
            assertTrue(roleCopy.hasPermission(Permission.DOCUMENT_READ))
            assertTrue(roleCopy.hasPermission(Permission.CLIENT_READ))
            
            // Other properties should be copied
            assertEquals(role.name, roleCopy.name)
            assertEquals(role.displayName, roleCopy.displayName)
            assertEquals(role.hierarchyLevel, roleCopy.hierarchyLevel)
        }

        @Test
        @DisplayName("Should generate meaningful toString")
        fun `should generate toString`() {
            role.grantPermission(Permission.MATTER_READ)
            role.grantPermission(Permission.DOCUMENT_READ)
            
            val toString = role.toString()
            
            assertTrue(toString.contains("TEST_ROLE"))
            assertTrue(toString.contains("Test Role"))
            assertTrue(toString.contains("hierarchyLevel=50"))
            assertTrue(toString.contains("permissionCount=2"))
            assertTrue(toString.contains("isActive=true"))
            assertTrue(toString.contains("isSystemRole=false"))
        }
    }

    @Nested
    @DisplayName("Role Constants")
    inner class RoleConstantsTests {

        @Test
        @DisplayName("Should have correct hierarchy level constants")
        fun `should have hierarchy level constants`() {
            assertEquals(10, Role.Companion.HierarchyLevel.CLIENT)
            assertEquals(50, Role.Companion.HierarchyLevel.CLERK)
            assertEquals(100, Role.Companion.HierarchyLevel.LAWYER)
            assertEquals(200, Role.Companion.HierarchyLevel.ADMIN)
        }

        @Test
        @DisplayName("Should have valid color constants")
        fun `should have color constants`() {
            assertTrue(Role.Companion.DefaultColors.CLIENT.matches(Regex("^#[0-9A-Fa-f]{6}$")))
            assertTrue(Role.Companion.DefaultColors.CLERK.matches(Regex("^#[0-9A-Fa-f]{6}$")))
            assertTrue(Role.Companion.DefaultColors.LAWYER.matches(Regex("^#[0-9A-Fa-f]{6}$")))
            assertTrue(Role.Companion.DefaultColors.ADMIN.matches(Regex("^#[0-9A-Fa-f]{6}$")))
        }
    }
}