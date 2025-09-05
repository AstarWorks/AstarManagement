package com.astarworks.astarmanagement.core.auth.domain.model

import java.time.Instant
import java.util.UUID

/**
 * Authenticated user context containing resolved user information from JWT.
 * This context is created after JWT validation and user resolution,
 * containing all necessary information for authorization decisions.
 * 
 * This model represents the complete authentication state including:
 * - Auth0 identity (auth0Sub)
 * - Internal system identities (userId, tenantUserId)
 * - Current tenant context (tenantId)
 * - Authorization data (roles, permissions)
 * 
 * Used as the principal in Spring Security Authentication objects.
 * 
 * 文字列ベースの権限処理は一切行わない。すべて型安全なPermissionRuleで処理。
 */
data class AuthenticatedUserContext(
    // Auth0 identity
    val auth0Sub: String,              // Auth0 subject ID (e.g., "auth0|123456")
    
    // Internal system identities
    val userId: UUID,                  // User ID from users table
    val tenantUserId: UUID,            // Tenant-specific user ID from tenant_users table
    val tenantId: UUID,                // Current tenant ID
    
    // Authorization information
    val roles: Set<DynamicRole> = emptySet(),       // User's dynamic roles in current tenant
    val permissions: Set<PermissionRule> = emptySet(), // 型安全な権限ルール
    
    // User metadata
    val email: String? = null,         // User's email address
    val isActive: Boolean = true,      // Whether the tenant user membership is active
    val lastAccessedAt: Instant? = null // Last access timestamp for this tenant
) {
    init {
        require(auth0Sub.isNotBlank()) {
            "Auth0 subject ID cannot be blank"
        }
        require(email?.isNotBlank() ?: true) {
            "Email cannot be blank if provided"
        }
    }
    
    /**
     * Checks if the user has a specific role by name.
     * Case-insensitive comparison.
     * 
     * @param roleName The name of the role to check
     * @return true if the user has the role
     */
    fun hasRole(roleName: String): Boolean {
        return roles.any { it.name.equals(roleName, ignoreCase = true) }
    }
    
    /**
     * Checks if the user has any of the specified roles.
     * Case-insensitive comparison.
     * 
     * @param roleNames The names of the roles to check
     * @return true if the user has at least one of the roles
     */
    fun hasAnyRole(vararg roleNames: String): Boolean {
        return roleNames.any { roleName ->
            hasRole(roleName)
        }
    }
    
    /**
     * Checks if the user has all of the specified roles.
     * Case-insensitive comparison.
     * 
     * @param roleNames The names of the roles to check
     * @return true if the user has all the roles
     */
    fun hasAllRoles(vararg roleNames: String): Boolean {
        return roleNames.all { roleName ->
            hasRole(roleName)
        }
    }
    
    /**
     * 特定の権限ルールを持っているかチェック
     * 
     * @param rule チェックする権限ルール
     * @return 権限を持っている場合true
     */
    fun hasPermissionRule(rule: PermissionRule): Boolean {
        return permissions.contains(rule)
    }
    
    /**
     * 特定のリソースタイプとアクションの組み合わせで権限を持っているかチェック
     * 
     * @param resourceType リソースタイプ
     * @param action アクション
     * @return 権限を持っている場合true
     */
    fun hasAction(resourceType: ResourceType, action: Action): Boolean {
        return permissions.any { rule ->
            rule.resourceType == resourceType && 
            (rule.action == action || rule.action == Action.MANAGE)
        }
    }
    
    /**
     * 特定のリソースへのアクセス権限を持っているかチェック
     * 注：このメソッドは限定的な判定のみ可能。完全な評価はService層で行う。
     * 
     * @param resourceId リソースID
     * @param resourceType リソースタイプ
     * @param action アクション
     * @return 権限を持っている場合true（ただしTEAM/OWNスコープは評価不可）
     */
    fun canAccessResource(
        resourceId: UUID,
        resourceType: ResourceType,
        action: Action
    ): Boolean {
        return permissions.any { rule ->
            when (rule) {
                is PermissionRule.GeneralRule -> {
                    // ALLスコープのみここで判定可能
                    rule.resourceType == resourceType &&
                    (rule.action == action || rule.action == Action.MANAGE) &&
                    rule.scope == Scope.ALL
                }
                is PermissionRule.ResourceGroupRule -> {
                    // グループメンバーシップはService層で評価が必要
                    false
                }
                is PermissionRule.ResourceIdRule -> {
                    // 特定リソースへの直接権限
                    rule.resourceType == resourceType &&
                    (rule.action == action || rule.action == Action.MANAGE) &&
                    rule.resourceId == resourceId
                }
            }
        }
    }
    
    /**
     * 指定されたスコープで権限を持っているかチェック
     * 
     * @param resourceType リソースタイプ
     * @param action アクション
     * @param scope スコープ
     * @return 権限を持っている場合true
     */
    fun hasPermissionWithScope(
        resourceType: ResourceType,
        action: Action,
        scope: Scope
    ): Boolean {
        return permissions.any { rule ->
            rule.resourceType == resourceType &&
            (rule.action == action || rule.action == Action.MANAGE) &&
            rule.scope == scope
        }
    }
    
    /**
     * ユーザーが管理者権限を持っているかチェック
     * 
     * @return 任意のリソースに対してMANAGE権限を持っている場合true
     */
    fun isAdmin(): Boolean {
        return permissions.any { rule ->
            rule.action == Action.MANAGE && rule.scope == Scope.ALL
        }
    }
    
    /**
     * 新しい権限セットでコンテキストを更新
     * 
     * @param computedPermissions 計算された権限セット
     * @return 更新されたコンテキスト
     */
    fun withPermissions(computedPermissions: Set<PermissionRule>): AuthenticatedUserContext {
        return copy(permissions = computedPermissions)
    }
    
    /**
     * 新しいロールセットでコンテキストを更新
     * 
     * @param newRoles 新しいロールセット
     * @return 更新されたコンテキスト
     */
    fun withRoles(newRoles: Set<DynamicRole>): AuthenticatedUserContext {
        return copy(roles = newRoles)
    }
    
    /**
     * 最終アクセス時刻を更新
     * 
     * @param timestamp 新しいタイムスタンプ
     * @return 更新されたコンテキスト
     */
    fun withLastAccessedAt(timestamp: Instant = Instant.now()): AuthenticatedUserContext {
        return copy(lastAccessedAt = timestamp)
    }
}