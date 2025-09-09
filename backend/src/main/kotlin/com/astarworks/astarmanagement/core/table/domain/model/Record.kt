package com.astarworks.astarmanagement.core.table.domain.model

import com.astarworks.astarmanagement.shared.domain.value.RecordId
import com.astarworks.astarmanagement.shared.domain.value.TableId
import kotlinx.serialization.json.*
import java.time.Instant
import java.util.UUID

/**
 * レコード
 * データベースの実データを格納するシンプルなJSONコンテナ
 * 
 * @property id レコードID
 * @property tableId 所属するデータベースID
 * @property data プロパティ値のJSONオブジェクト
 * @property position 手動ソート用の位置情報
 * @property createdAt 作成日時
 * @property updatedAt 更新日時
 */
data class Record(
    val id: RecordId = RecordId(UUID.randomUUID()),
    val tableId: TableId,
    val data: JsonObject = buildJsonObject {},
    val position: Float = DEFAULT_POSITION,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
) {
    init {
        require(position > 0) { "Position must be positive" }
    }
    
    /**
     * JSON文字列を取得（互換性のため残す）
     */
    fun getDataJson(): String = data.toString()
    
    /**
     * データを更新（新しいJSONで置換）
     */
    fun updateData(newData: JsonObject): Record {
        return copy(
            data = newData,
            updatedAt = Instant.now()
        )
    }
    
    /**
     * 位置を更新
     */
    fun updatePosition(newPosition: Float): Record {
        require(newPosition > 0) { "Position must be positive" }
        return copy(
            position = newPosition,
            updatedAt = Instant.now()
        )
    }
    
    /**
     * レコードが空かどうか（空のJSONオブジェクト）
     */
    fun isEmpty(): Boolean = data.isEmpty()
    
    /**
     * 2つのレコード間の位置を計算
     */
    fun calculatePositionBetween(before: Record?, after: Record?): Float {
        return when {
            before == null && after == null -> DEFAULT_POSITION
            before == null -> after!!.position / 2
            after == null -> before.position + POSITION_INCREMENT
            else -> (before.position + after.position) / 2
        }
    }
    
    companion object {
        const val DEFAULT_POSITION = 65536f
        const val POSITION_INCREMENT = 65536f
        const val MIN_POSITION = 1f
        const val MAX_POSITION = Float.MAX_VALUE
        
        /**
         * 新しいレコードを作成
         */
        fun create(
            tableId: TableId,
            data: JsonObject = buildJsonObject {},
            position: Float = DEFAULT_POSITION
        ): Record {
            return Record(
                tableId = tableId,
                data = data,
                position = position
            )
        }
        
        /**
         * 最初のレコードの位置を計算
         */
        fun firstPosition(): Float = DEFAULT_POSITION
        
        /**
         * 最後のレコードの次の位置を計算
         */
        fun nextPosition(lastPosition: Float): Float {
            return lastPosition + POSITION_INCREMENT
        }
        
        /**
         * 2つのレコード間の位置を計算
         */
        fun positionBetween(beforePosition: Float?, afterPosition: Float?): Float {
            return when {
                beforePosition == null && afterPosition == null -> DEFAULT_POSITION
                beforePosition == null -> afterPosition!! / 2
                afterPosition == null -> beforePosition + POSITION_INCREMENT
                else -> (beforePosition + afterPosition) / 2
            }
        }
    }
}