package com.astarworks.astarmanagement.core.workspace.domain.model

import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TeamId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.time.Instant

/**
 * ワークスペース
 * テナント内の論理的な作業空間
 * 
 * @property id ワークスペースID
 * @property tenantId テナントID（マルチテナント対応）
 * @property name ワークスペース名
 * @property createdBy 作成者のユーザーID（所有権管理用）
 * @property teamId チームID（将来のチーム機能用、現在はNULL許可）
 * @property createdAt 作成日時
 * @property updatedAt 更新日時
 */
data class Workspace(
    val id: WorkspaceId = WorkspaceId(java.util.UUID.randomUUID()),
    val tenantId: TenantId? = null,
    val name: String,
    val createdBy: UserId? = null,
    val teamId: TeamId? = null,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
) {
    init {
        require(name.isNotBlank()) { "Workspace name must not be blank" }
        require(name.length <= 255) { "Workspace name must not exceed 255 characters" }
    }
    
    /**
     * ワークスペースを更新
     */
    fun update(
        name: String? = null
    ): Workspace {
        return copy(
            name = name ?: this.name,
            updatedAt = Instant.now()
        )
    }
    
    /**
     * テナントIDを設定
     */
    fun withTenant(tenantId: TenantId): Workspace {
        return copy(tenantId = tenantId)
    }
    
    /**
     * このワークスペースが特定のテナントに属しているか確認
     */
    fun belongsToTenant(tenantId: TenantId): Boolean {
        return this.tenantId == tenantId
    }
    
    /**
     * このワークスペースがマルチテナント対応か確認
     */
    fun isMultiTenant(): Boolean {
        return tenantId != null
    }
    
    /**
     * このワークスペースが指定ユーザーによって所有されているか確認
     */
    fun isOwnedBy(userId: UserId): Boolean {
        return createdBy == userId
    }
    
    /**
     * このワークスペースが指定チームに属しているか確認
     */
    fun belongsToTeam(teamId: TeamId): Boolean {
        return this.teamId == teamId
    }
    
    /**
     * ワークスペースにチームを割り当て
     */
    fun assignToTeam(teamId: TeamId): Workspace {
        return copy(teamId = teamId, updatedAt = Instant.now())
    }
    
    /**
     * 所有者を変更（管理者権限が必要な操作）
     */
    fun changeOwner(newOwnerId: UserId): Workspace {
        return copy(createdBy = newOwnerId, updatedAt = Instant.now())
    }
    
    companion object {
        /**
         * 新しいワークスペースを作成
         */
        fun create(
            name: String,
            tenantId: TenantId? = null,
            createdBy: UserId? = null
        ): Workspace {
            return Workspace(
                name = name,
                tenantId = tenantId,
                createdBy = createdBy
            )
        }
        
        /**
         * デフォルトワークスペースを作成
         */
        fun createDefault(tenantId: TenantId? = null, createdBy: UserId? = null): Workspace {
            return create(
                name = "Default Workspace",
                tenantId = tenantId,
                createdBy = createdBy
            )
        }
    }
}