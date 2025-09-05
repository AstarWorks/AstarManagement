package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.RolePermission
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionDiff
import com.astarworks.astarmanagement.core.auth.domain.model.SyncResult
import com.astarworks.astarmanagement.core.auth.domain.model.ValidationResult
import org.assertj.core.api.Assertions.assertThat
import java.util.UUID

/**
 * Assertion helpers for role-related tests.
 */
object RoleAssertions {
    
    fun assertRoleEquals(expected: DynamicRole, actual: DynamicRole, ignoreTimestamps: Boolean = true) {
        assertThat(actual.id).isEqualTo(expected.id)
        assertThat(actual.tenantId).isEqualTo(expected.tenantId)
        assertThat(actual.name).isEqualTo(expected.name)
        assertThat(actual.displayName).isEqualTo(expected.displayName)
        assertThat(actual.color).isEqualTo(expected.color)
        assertThat(actual.position).isEqualTo(expected.position)
        assertThat(actual.isSystem).isEqualTo(expected.isSystem)
        
        if (!ignoreTimestamps) {
            assertThat(actual.createdAt).isEqualTo(expected.createdAt)
            assertThat(actual.updatedAt).isEqualTo(expected.updatedAt)
        }
    }
    
    fun assertRoleProperties(
        role: DynamicRole,
        name: String? = null,
        displayName: String? = null,
        color: String? = null,
        position: Int? = null,
        isSystem: Boolean? = null
    ) {
        name?.let { assertThat(role.name).isEqualTo(it) }
        displayName?.let { assertThat(role.displayName).isEqualTo(it) }
        color?.let { assertThat(role.color).isEqualTo(it) }
        position?.let { assertThat(role.position).isEqualTo(it) }
        isSystem?.let { assertThat(role.isSystem).isEqualTo(it) }
    }
    
    fun assertTenantIsolation(role: DynamicRole, expectedTenantId: UUID) {
        assertThat(role.tenantId).isEqualTo(expectedTenantId)
    }
}

/**
 * Assertion helpers for permission-related tests.
 */
object PermissionAssertions {
    
    fun assertPermissionValid(permission: String) {
        val parts = permission.split(".")
        assertThat(parts).hasSize(3)
        assertThat(parts[0]).isNotBlank()
        assertThat(parts[1]).isNotBlank()
        assertThat(parts[2]).isNotBlank()
    }
    
    fun assertPermissionFormat(permission: String, resource: String, action: String, scope: String) {
        assertThat(permission).isEqualTo("$resource.$action.$scope")
    }
    
    fun assertPermissionEquals(expected: RolePermission, actual: RolePermission) {
        assertThat(actual.roleId).isEqualTo(expected.roleId)
        assertThat(actual.permissionRule).isEqualTo(expected.permissionRule)
    }
    
    fun assertHasPermissions(permissions: List<String>, expectedRules: List<String>) {
        assertThat(permissions).containsExactlyInAnyOrderElementsOf(expectedRules)
    }
    
    fun assertPermissionCount(permissions: List<RolePermission>, expectedCount: Int) {
        assertThat(permissions).hasSize(expectedCount)
    }
    
    fun assertWildcardExpansion(
        originalPermission: String,
        expandedPermissions: Set<String>,
        shouldContain: List<String>
    ) {
        assertThat(originalPermission).contains("*")
        assertThat(expandedPermissions).containsAll(shouldContain)
    }
}

/**
 * Assertion helpers for sync and comparison results.
 */
object SyncAssertions {
    
    fun assertSyncResult(
        result: SyncResult,
        expectedAdded: Int? = null,
        expectedRemoved: Int? = null,
        expectedUnchanged: Int? = null
    ) {
        expectedAdded?.let { 
            assertThat(result.added).hasSize(it)
        }
        expectedRemoved?.let { 
            assertThat(result.removed).hasSize(it)
        }
        expectedUnchanged?.let { 
            assertThat(result.unchanged).hasSize(it)
        }
        
        // Verify total count matches
        assertThat(result.totalChanges).isEqualTo(result.added.size + result.removed.size)
    }
    
    fun assertPermissionDiff(
        diff: PermissionDiff,
        role1Only: List<String>? = null,
        role2Only: List<String>? = null,
        common: List<String>? = null
    ) {
        role1Only?.let {
            assertThat(diff.onlyInFirst).containsExactlyInAnyOrderElementsOf(it)
        }
        role2Only?.let {
            assertThat(diff.onlyInSecond).containsExactlyInAnyOrderElementsOf(it)
        }
        common?.let {
            assertThat(diff.inBoth).containsExactlyInAnyOrderElementsOf(it)
        }
    }
}

/**
 * Assertion helpers for validation results.
 */
object ValidationAssertions {
    
    fun assertValidationResult(
        result: ValidationResult,
        expectValid: Boolean,
        expectedErrors: Int? = null,
        expectedWarnings: Int? = null
    ) {
        assertThat(result.isValid).isEqualTo(expectValid)
        
        expectedErrors?.let {
            assertThat(result.invalid.size).isEqualTo(it)
        }
        
        expectedWarnings?.let {
            assertThat(result.warnings).hasSize(it)
        }
    }
    
    fun assertHasError(result: ValidationResult, expectedError: String) {
        assertThat(result.invalid.values.any { it.contains(expectedError) }).isTrue()
    }
    
    fun assertHasWarning(result: ValidationResult, expectedWarning: String) {
        assertThat(result.warnings.values.any { it.contains(expectedWarning) }).isTrue()
    }
}