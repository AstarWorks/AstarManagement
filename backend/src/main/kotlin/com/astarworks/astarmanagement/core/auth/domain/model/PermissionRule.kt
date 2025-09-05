package com.astarworks.astarmanagement.core.auth.domain.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import java.util.UUID

/**
 * 権限ルール = ResourceType + Action + Scope
 * これが権限システムの基本単位
 * 
 * 文字列処理は一切ビジネスロジックで行わない。
 * データベースとの変換はMapper層でのみ行う。
 */
@Serializable
sealed class PermissionRule {
    abstract val resourceType: ResourceType
    abstract val action: Action
    abstract val scope: Scope
    
    /**
     * データベース保存用の文字列表現
     * Mapper層でのみ使用する
     */
    abstract fun toDatabaseString(): String
    
    /**
     * 一般的なスコープベース権限（ALL, TEAM, OWN）
     * 例: "すべてのテーブルを閲覧可能"、"チームのドキュメントを編集可能"
     */
    @Serializable
    data class GeneralRule(
        override val resourceType: ResourceType,
        override val action: Action,
        override val scope: Scope
    ) : PermissionRule() {
        init {
            require(scope in listOf(Scope.ALL, Scope.TEAM, Scope.OWN)) {
                "GeneralRule only supports ALL, TEAM, OWN scopes, got: $scope"
            }
        }
        
        override fun toDatabaseString(): String {
            return "${resourceType.name.lowercase()}.${action.name.lowercase()}.${scope.name.lowercase()}"
        }
    }
    
    /**
     * リソースグループ経由の権限
     * 例: "プロジェクトAグループのテーブルを編集可能"
     */
    @Serializable
    data class ResourceGroupRule(
        override val resourceType: ResourceType,
        override val action: Action,
        @Contextual val groupId: UUID  // グループIDを内包
    ) : PermissionRule() {
        override val scope = Scope.RESOURCE_GROUP
        
        override fun toDatabaseString(): String {
            return "${resourceType.name.lowercase()}.${action.name.lowercase()}.resource_group:$groupId"
        }
    }
    
    /**
     * 特定リソースインスタンスへの権限
     * 例: "テーブルID:123を編集可能"
     */
    @Serializable
    data class ResourceIdRule(
        override val resourceType: ResourceType,
        override val action: Action,
        @Contextual val resourceId: UUID  // リソースIDを内包
    ) : PermissionRule() {
        override val scope = Scope.RESOURCE_ID
        
        override fun toDatabaseString(): String {
            return "${resourceType.name.lowercase()}.${action.name.lowercase()}.resource_id:$resourceId"
        }
    }
    
    companion object {
        /**
         * データベースの文字列からPermissionRuleへ変換
         * Mapper層でのみ使用する
         * 
         * @param str データベースに保存された権限文字列
         * @return PermissionRuleオブジェクト
         * @throws IllegalArgumentException 無効な形式の場合
         */
        fun fromDatabaseString(str: String): PermissionRule {
            val parts = str.split(".")
            require(parts.size == 3) { 
                "Invalid permission format. Expected: 'resourceType.action.scope', got: '$str'" 
            }
            
            val resourceType = try {
                ResourceType.valueOf(parts[0].uppercase())
            } catch (e: IllegalArgumentException) {
                throw IllegalArgumentException("Unknown resource type: ${parts[0]}", e)
            }
            
            val action = try {
                Action.valueOf(parts[1].uppercase())
            } catch (e: IllegalArgumentException) {
                throw IllegalArgumentException("Unknown action: ${parts[1]}", e)
            }
            
            val scopePart = parts[2]
            
            return when {
                scopePart in listOf("all", "team", "own") -> {
                    val scope = Scope.valueOf(scopePart.uppercase())
                    GeneralRule(resourceType, action, scope)
                }
                scopePart.startsWith("resource_group:") -> {
                    val groupIdStr = scopePart.substringAfter(":")
                    val groupId = try {
                        UUID.fromString(groupIdStr)
                    } catch (e: IllegalArgumentException) {
                        throw IllegalArgumentException("Invalid group ID: $groupIdStr", e)
                    }
                    ResourceGroupRule(resourceType, action, groupId)
                }
                scopePart.startsWith("resource_id:") -> {
                    val resourceIdStr = scopePart.substringAfter(":")
                    val resourceId = try {
                        UUID.fromString(resourceIdStr)
                    } catch (e: IllegalArgumentException) {
                        throw IllegalArgumentException("Invalid resource ID: $resourceIdStr", e)
                    }
                    ResourceIdRule(resourceType, action, resourceId)
                }
                else -> throw IllegalArgumentException("Unknown scope format: $scopePart")
            }
        }
    }
}