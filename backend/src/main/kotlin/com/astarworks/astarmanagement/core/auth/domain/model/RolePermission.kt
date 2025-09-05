package com.astarworks.astarmanagement.core.auth.domain.model

import com.astarworks.astarmanagement.shared.domain.value.RoleId
import java.time.Instant
import java.util.UUID

/**
 * RolePermission domain entity.
 * ロールに割り当てられた権限ルールを表現。
 * 
 * ビジネスロジックでは文字列を一切扱わない。
 * データベースとの変換はMapper層でのみ行う。
 * 
 * データベースでは(role_id, permission_rule)の複合主キーで管理される。
 * 同じロールに同じ権限ルールを重複して付与することはできない。
 */
data class RolePermission(
    val roleId: RoleId,
    val permissionRule: PermissionRule,  // 型安全なPermissionRuleオブジェクト
    val createdAt: Instant = Instant.now()
) {
    /**
     * この権限が特定のリソースへのアクセスを許可するかチェック
     */
    fun grantsAccessTo(
        resourceId: UUID,
        resourceType: ResourceType,
        action: Action
    ): Boolean {
        // リソースタイプとアクションが一致しない場合は即座にfalse
        if (permissionRule.resourceType != resourceType) return false
        if (permissionRule.action != action && permissionRule.action != Action.MANAGE) return false
        
        // スコープに応じた評価
        return when (permissionRule) {
            is PermissionRule.GeneralRule -> {
                // GeneralRuleの場合、別途スコープ評価が必要（Service層で実装）
                permissionRule.scope == Scope.ALL
            }
            is PermissionRule.ResourceGroupRule -> {
                // ResourceGroupRuleの場合、グループメンバーシップ確認が必要（Service層で実装）
                false  // ここでは判定不可
            }
            is PermissionRule.ResourceIdRule -> {
                // 特定リソースへの権限
                permissionRule.resourceId == resourceId
            }
        }
    }
    
    /**
     * MANAGEアクションを持っているかチェック
     */
    fun hasManagePermission(): Boolean {
        return permissionRule.action == Action.MANAGE
    }
}