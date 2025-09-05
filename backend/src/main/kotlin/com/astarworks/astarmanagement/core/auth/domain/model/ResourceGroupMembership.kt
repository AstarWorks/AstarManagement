package com.astarworks.astarmanagement.core.auth.domain.model

import java.time.Instant
import java.util.UUID

/**
 * リソースとグループの所属関係
 * 
 * M:N関係を表現し、1つのリソースは複数のグループに所属可能。
 * ユーザーとロールの関係（UserRole）と同じ概念。
 */
data class ResourceGroupMembership(
    val id: UUID = UUID.randomUUID(),
    val resourceId: UUID,           // 所属するリソースのID
    val groupId: UUID,              // 所属先グループのID
    val resourceType: ResourceType,  // リソースのタイプ（検証用）
    val joinedAt: Instant = Instant.now(),
    val joinedBy: UUID,             // メンバーシップを作成したユーザー
    val expiresAt: Instant? = null  // 期限付きメンバーシップ（オプション）
) {
    init {
        // 期限が設定されている場合、過去でないことを確認
        expiresAt?.let {
            require(it.isAfter(joinedAt)) {
                "Expiration date must be after join date"
            }
        }
    }
    
    /**
     * メンバーシップが有効かチェック
     */
    fun isActive(now: Instant = Instant.now()): Boolean {
        return expiresAt?.let { it.isAfter(now) } ?: true
    }
    
    /**
     * メンバーシップの残り有効期間を取得
     */
    fun getRemainingDuration(now: Instant = Instant.now()): java.time.Duration? {
        return expiresAt?.let {
            if (it.isAfter(now)) {
                java.time.Duration.between(now, it)
            } else {
                java.time.Duration.ZERO
            }
        }
    }
}