package dev.ryuzu.astermanagement.security.rbac.entity

/**
 * Permission constants enum with Discord-style bitwise values for RBAC system.
 * Each permission uses a unique bit position to enable efficient permission checking
 * using bitwise operations on a Long value (supports up to 64 permissions).
 * 
 * This enum defines all granular permissions in the AsterManagement system,
 * covering CRUD operations for all resources plus administrative functions.
 */
enum class Permission(val bit: Int, val description: String) {
    // Matter permissions (bits 0-4)
    MATTER_CREATE(0, "Create new matters"),
    MATTER_READ(1, "View matter details"),
    MATTER_UPDATE(2, "Edit matter information"),
    MATTER_DELETE(3, "Delete matters"),
    MATTER_EXPORT(4, "Export matter data"),
    
    // Document permissions (bits 5-9)
    DOCUMENT_CREATE(5, "Upload documents"),
    DOCUMENT_READ(6, "View documents"),
    DOCUMENT_UPDATE(7, "Edit document metadata"),
    DOCUMENT_DELETE(8, "Delete documents"),
    DOCUMENT_EXPORT(9, "Export documents"),
    
    // Client permissions (bits 10-13)
    CLIENT_CREATE(10, "Create client records"),
    CLIENT_READ(11, "View client details"),
    CLIENT_UPDATE(12, "Edit client information"),
    CLIENT_DELETE(13, "Delete client records"),
    
    // Communication permissions (bits 14-17)
    COMM_CREATE(14, "Create communications"),
    COMM_READ(15, "View communications"),
    COMM_UPDATE(16, "Edit communications"),
    COMM_DELETE(17, "Delete communications"),
    
    // Financial permissions (bits 18-22)
    EXPENSE_CREATE(18, "Create expense records"),
    EXPENSE_READ(19, "View expenses"),
    EXPENSE_UPDATE(20, "Edit expenses"),
    EXPENSE_DELETE(21, "Delete expenses"),
    EXPENSE_APPROVE(22, "Approve expense reports"),
    
    // Administrative permissions (bits 23-26)
    USER_MANAGE(23, "Manage user accounts"),
    ROLE_MANAGE(24, "Manage roles and permissions"),
    EXPORT_DATA(25, "Export system data"),
    SYSTEM_SETTINGS(26, "Access system settings"),
    AUDIT_READ(27, "View audit logs");

    /**
     * The actual permission bit value calculated from the bit position.
     * Uses left bit shift to convert bit position to the corresponding power of 2.
     */
    val value: Long = 1L shl bit

    /**
     * Permission category for grouping related permissions
     */
    val category: String = when {
        bit in 0..4 -> "MATTER"
        bit in 5..9 -> "DOCUMENT" 
        bit in 10..13 -> "CLIENT"
        bit in 14..17 -> "COMMUNICATION"
        bit in 18..22 -> "FINANCIAL"
        bit in 23..27 -> "ADMINISTRATIVE"
        else -> "UNKNOWN"
    }

    companion object {
        /**
         * Check if a permission flag set contains a specific permission
         */
        fun hasPermission(permissions: Long, permission: Permission): Boolean {
            return (permissions and permission.value) == permission.value
        }

        /**
         * Add a permission to a permission flag set
         */
        fun grantPermission(permissions: Long, permission: Permission): Long {
            return permissions or permission.value
        }

        /**
         * Remove a permission from a permission flag set
         */
        fun revokePermission(permissions: Long, permission: Permission): Long {
            return permissions and permission.value.inv()
        }

        /**
         * Get all permissions that are set in a permission flag set
         */
        fun getPermissionsList(permissions: Long): List<Permission> {
            return values().filter { hasPermission(permissions, it) }
        }

        /**
         * Combine multiple permissions into a single permission flag set
         */
        fun combinePermissions(vararg permissions: Permission): Long {
            return permissions.fold(0L) { acc, permission -> acc or permission.value }
        }

        /**
         * Get all permissions in a specific category
         */
        fun getPermissionsByCategory(category: String): List<Permission> {
            return values().filter { it.category == category }
        }

        /**
         * Create a permission set with all permissions for a specific category
         */
        fun getAllPermissionsForCategory(category: String): Long {
            return getPermissionsByCategory(category).fold(0L) { acc, permission -> acc or permission.value }
        }

        /**
         * Get a human-readable description of all permissions in a flag set
         */
        fun describePermissions(permissions: Long): String {
            val permissionList = getPermissionsList(permissions)
            return if (permissionList.isEmpty()) {
                "No permissions"
            } else {
                permissionList.joinToString(", ") { "${it.name} (${it.description})" }
            }
        }

        /**
         * Parse permission names from a string list
         */
        fun parsePermissions(permissionNames: List<String>): Long {
            return permissionNames.mapNotNull { name ->
                values().find { it.name == name.uppercase() }
            }.fold(0L) { acc, permission -> acc or permission.value }
        }

        /**
         * Default permission sets for each role type
         */
        object Defaults {
            /**
             * Client role permissions - read-only access to their own matters
             */
            val CLIENT_PERMISSIONS = combinePermissions(
                MATTER_READ,
                DOCUMENT_READ,
                COMM_READ
            )

            /**
             * Clerk role permissions - CRUD operations but no deletion or admin access
             */
            val CLERK_PERMISSIONS = combinePermissions(
                MATTER_CREATE, MATTER_READ, MATTER_UPDATE,
                DOCUMENT_CREATE, DOCUMENT_READ, DOCUMENT_UPDATE,
                CLIENT_CREATE, CLIENT_READ, CLIENT_UPDATE,
                COMM_CREATE, COMM_READ, COMM_UPDATE,
                EXPENSE_CREATE, EXPENSE_READ, EXPENSE_UPDATE
            )

            /**
             * Lawyer role permissions - full access to all operations
             */
            val LAWYER_PERMISSIONS = values().fold(0L) { acc, permission -> acc or permission.value }
        }
    }
}