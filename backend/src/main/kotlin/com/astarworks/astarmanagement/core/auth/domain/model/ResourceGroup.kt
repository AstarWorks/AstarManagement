package com.astarworks.astarmanagement.core.auth.domain.model

import java.time.Instant
import java.util.UUID

/**
 * リソースグループ - リソースのUserRole版
 * 
 * 部署、プロジェクト、クライアント、セキュリティレベルなどを表現し、
 * リソースを論理的にグループ化する。
 * 
 * ユーザーが複数のロールを持てるように、
 * リソースも複数のグループに所属することができる。
 */
data class ResourceGroup(
    val id: UUID = UUID.randomUUID(),
    val tenantId: UUID,
    val name: String,
    val description: String? = null,
    val resourceType: ResourceType,  // このグループが対象とするリソースタイプ
    val parentGroupId: UUID? = null,  // 階層構造サポート（オプション）
    val metadata: Map<String, Any> = emptyMap(),  // 追加情報（部署コード、プロジェクトコード等）
    val createdAt: Instant = Instant.now(),
    val createdBy: UUID,
    val updatedAt: Instant? = null,
    val isActive: Boolean = true
) {
    init {
        require(name.isNotBlank()) {
            "ResourceGroup name cannot be blank"
        }
        require(name.length <= 100) {
            "ResourceGroup name cannot exceed 100 characters"
        }
    }
    
    /**
     * グループのフルパスを取得（階層がある場合）
     * 例: "部門/営業部/第一営業課"
     */
    fun getFullPath(allGroups: List<ResourceGroup>): String {
        val path = mutableListOf<String>()
        var current: ResourceGroup? = this
        
        while (current != null) {
            path.add(0, current.name)
            current = current.parentGroupId?.let { parentId ->
                allGroups.find { it.id == parentId }
            }
        }
        
        return path.joinToString("/")
    }
    
    /**
     * メタデータから特定の値を取得
     */
    inline fun <reified T> getMetadataValue(key: String): T? {
        return metadata[key] as? T
    }
    
    /**
     * このグループが特定のリソースタイプに適用可能かチェック
     */
    fun isApplicableToResourceType(type: ResourceType): Boolean {
        return resourceType == type
    }
}