package com.astarworks.astarmanagement.core.table.domain.model

import com.astarworks.astarmanagement.shared.domain.value.RecordId
import com.astarworks.astarmanagement.shared.domain.value.TableId
import kotlinx.serialization.json.*
import java.time.Instant
import java.util.UUID

/**
 * レコード
 * データベースの実データを格納
 * 
 * @property id レコードID
 * @property tableId 所属するデータベースID
 * @property dataJson プロパティ値のJSON文字列（内部保存用）
 * @property position 手動ソート用の位置情報
 * @property createdAt 作成日時
 * @property updatedAt 更新日時
 */
data class Record(
    val id: RecordId = RecordId(UUID.randomUUID()),
    val tableId: TableId,
    private val dataJson: String = "{}",
    val position: Float = DEFAULT_POSITION,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
) {
    init {
        require(position > 0) { "Position must be positive" }
    }
    
    /**
     * プロパティ値のマップ（JsonObject形式）
     * 後方互換性のための計算プロパティ
     */
    val data: JsonObject
        get() = try {
            Json.parseToJsonElement(dataJson).jsonObject
        } catch (e: Exception) {
            JsonObject(emptyMap())
        }
    
    /**
     * JSON文字列を取得（内部用）
     */
    fun getDataJson(): String = dataJson
    
    /**
     * JsonObjectからRecordを作成（コンストラクタヘルパー）
     */
    constructor(
        id: RecordId = RecordId(java.util.UUID.randomUUID()),
        tableId: TableId,
        data: JsonObject,
        position: Float = DEFAULT_POSITION,
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ) : this(
        id = id,
        tableId = tableId,
        dataJson = data.toString(),
        position = position,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
    
    /**
     * プロパティ値を取得
     */
    fun getValue(key: String): JsonElement? = data[key]
    
    /**
     * プロパティ値を型安全に取得
     */
    inline fun <reified T> getValueAs(key: String): T? = data[key]?.let { element ->
        when (element) {
            is JsonPrimitive -> when {
                T::class == String::class && element.isString -> element.content as? T
                T::class == Boolean::class && element.booleanOrNull != null -> element.boolean as? T
                T::class == Int::class && element.intOrNull != null -> element.int as? T
                T::class == Long::class && element.longOrNull != null -> element.long as? T
                T::class == Float::class && element.floatOrNull != null -> element.float as? T
                T::class == Double::class && element.doubleOrNull != null -> element.double as? T
                else -> null
            }
            is JsonArray -> if (T::class == List::class) element.map { it } as? T else null
            is JsonObject -> if (T::class == Map::class) element.toMap() as? T else null
            is JsonNull -> null
        }
    }
    
    /**
     * プロパティ値を設定
     */
    fun setValue(key: String, value: JsonElement): Record {
        val newData = buildJsonObject {
            data.forEach { (k, v) -> if (k != key) put(k, v) }
            put(key, value)
        }
        return copy(
            dataJson = newData.toString(),
            updatedAt = Instant.now()
        )
    }
    
    /**
     * 複数のプロパティ値を設定
     */
    fun setValues(values: JsonObject): Record {
        val newData = buildJsonObject {
            data.forEach { (k, v) -> put(k, v) }
            values.forEach { (k, v) -> put(k, v) }
        }
        return copy(
            dataJson = newData.toString(),
            updatedAt = Instant.now()
        )
    }
    
    /**
     * プロパティ値を削除
     */
    fun removeValue(key: String): Record {
        val newData = buildJsonObject {
            data.forEach { (k, v) -> if (k != key) put(k, v) }
        }
        return copy(
            dataJson = newData.toString(),
            updatedAt = Instant.now()
        )
    }
    
    /**
     * すべてのプロパティ値をクリア
     */
    fun clearValues(): Record {
        return copy(
            dataJson = "{}",
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
     * レコードが空かどうか
     */
    fun isEmpty(): Boolean = data.isEmpty()
    
    /**
     * 特定のキーが存在するか
     */
    fun hasKey(key: String): Boolean = data.containsKey(key)
    
    /**
     * PropertyValueのリストに変換
     */
    fun toPropertyValues(): List<PropertyValue> {
        return data.map { (key, value) ->
            PropertyValue(key, value)
        }
    }
    
    /**
     * データベース定義に基づいて検証
     */
    fun validate(table: Table): List<String> {
        val errors = mutableListOf<String>()
        
        // 必須フィールドのチェック
        table.properties.forEach { (key, definition) ->
            if (definition.isRequired && !hasKey(key)) {
                errors.add("Required field '$key' is missing")
            }
        }
        
        // 未知のフィールドのチェック
        data.keys.forEach { key ->
            if (key !in table.properties) {
                errors.add("Unknown field '$key'")
            }
        }
        
        return errors
    }
    
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
            data: JsonObject = JsonObject(emptyMap()),
            position: Float = DEFAULT_POSITION
        ): Record {
            return Record(
                tableId = tableId,
                dataJson = data.toString(),
                position = position
            )
        }
        
        /**
         * JSON文字列から作成（内部用）
         */
        fun fromJson(
            id: RecordId = RecordId(java.util.UUID.randomUUID()),
            tableId: TableId,
            dataJson: String,
            position: Float = DEFAULT_POSITION,
            createdAt: Instant = Instant.now(),
            updatedAt: Instant = Instant.now()
        ): Record {
            return Record(
                id = id,
                tableId = tableId,
                dataJson = dataJson,
                position = position,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
        }
        
        /**
         * PropertyValueのリストからレコードを作成
         */
        fun fromPropertyValues(
            tableId: TableId,
            values: List<PropertyValue>,
            position: Float = DEFAULT_POSITION
        ): Record {
            val data = buildJsonObject {
                values.forEach { put(it.key, it.value) }
            }
            return create(tableId, data, position)
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