package com.astarworks.astarmanagement.core.table.domain.model

import kotlinx.serialization.json.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

/**
 * プロパティ値
 * レコードの各プロパティの値を表現する値オブジェクト
 * 
 * @property key プロパティのキー
 * @property value 実際の値（JsonElement型で統一）
 * @property typeId プロパティ型のID（オプション、バリデーション用）
 */
data class PropertyValue(
    val key: String,
    val value: JsonElement,
    val typeId: String? = null
) {
    init {
        require(key.isNotBlank()) { "Property key must not be blank" }
        
        // 型に応じたバリデーション
        typeId?.let { validateValueType(it, value) }
    }
    
    /**
     * 値の型検証
     */
    private fun validateValueType(typeId: String, value: JsonElement) {
        if (value is JsonNull) return // nullは許可
        
        when (typeId) {
            "text", "long_text" -> {
                require(value is JsonPrimitive && value.isString) { 
                    "Value for $typeId must be String JsonPrimitive" 
                }
            }
            "number" -> {
                require(value is JsonPrimitive && (value.doubleOrNull != null || value.longOrNull != null)) { 
                    "Value for number must be numeric JsonPrimitive" 
                }
            }
            "checkbox" -> {
                require(value is JsonPrimitive && value.booleanOrNull != null) { 
                    "Value for checkbox must be boolean JsonPrimitive" 
                }
            }
            "date", "datetime" -> {
                require(value is JsonPrimitive && value.isString) { 
                    "Value for $typeId must be String JsonPrimitive" 
                }
            }
            "select" -> {
                require(value is JsonPrimitive && value.isString) { 
                    "Value for select must be String JsonPrimitive" 
                }
            }
            "multi_select" -> {
                require(value is JsonArray) { 
                    "Value for multi_select must be JsonArray" 
                }
                value.forEach { item ->
                    require(item is JsonPrimitive && item.isString) { 
                        "Each item in multi_select must be String JsonPrimitive" 
                    }
                }
            }
            "user" -> {
                require(value is JsonPrimitive && value.isString || value is JsonArray) { 
                    "Value for user must be String JsonPrimitive or JsonArray" 
                }
            }
        }
    }
    
    /**
     * 値を指定した型として取得
     */
    inline fun <reified T> getAs(): T? = when (value) {
        is JsonNull -> null
        is JsonPrimitive -> when {
            T::class == String::class && value.isString -> value.content as? T
            T::class == Boolean::class && value.booleanOrNull != null -> value.boolean as? T
            T::class == Int::class && value.intOrNull != null -> value.int as? T
            T::class == Long::class && value.longOrNull != null -> value.long as? T
            T::class == Float::class && value.floatOrNull != null -> value.float as? T
            T::class == Double::class && value.doubleOrNull != null -> value.double as? T
            else -> null
        }
        is JsonArray -> if (T::class == List::class) value.map { it } as? T else null
        is JsonObject -> null
    }
    
    /**
     * 値を文字列として取得
     */
    fun asString(): String? = when (value) {
        is JsonNull -> null
        is JsonPrimitive -> value.contentOrNull
        else -> value.toString()
    }
    
    /**
     * 値を数値として取得
     */
    fun asNumber(): Number? = (value as? JsonPrimitive)?.doubleOrNull
    
    /**
     * 値をブール値として取得
     */
    fun asBoolean(): Boolean? = (value as? JsonPrimitive)?.booleanOrNull
    
    /**
     * 値をリストとして取得
     */
    fun asList(): List<JsonElement>? = (value as? JsonArray)?.toList()
    
    /**
     * 値を文字列リストとして取得
     */
    fun asStringList(): List<String>? = (value as? JsonArray)?.mapNotNull { 
        (it as? JsonPrimitive)?.contentOrNull 
    }
    
    companion object {
        /**
         * テキスト値を作成
         */
        fun text(key: String, value: String?): PropertyValue {
            return PropertyValue(key, value?.let { JsonPrimitive(it) } ?: JsonNull, "text")
        }
        
        /**
         * 数値を作成
         */
        fun number(key: String, value: Number?): PropertyValue {
            return PropertyValue(key, value?.let { JsonPrimitive(it) } ?: JsonNull, "number")
        }
        
        /**
         * チェックボックス値を作成
         */
        fun checkbox(key: String, value: Boolean): PropertyValue {
            return PropertyValue(key, JsonPrimitive(value), "checkbox")
        }
        
        /**
         * 日付値を作成
         */
        fun date(key: String, value: LocalDate?): PropertyValue {
            return PropertyValue(key, value?.let { JsonPrimitive(it.toString()) } ?: JsonNull, "date")
        }
        
        /**
         * 日時値を作成
         */
        fun datetime(key: String, value: LocalDateTime?): PropertyValue {
            return PropertyValue(key, value?.let { JsonPrimitive(it.toString()) } ?: JsonNull, "datetime")
        }
        
        /**
         * 選択値を作成
         */
        fun select(key: String, value: String?): PropertyValue {
            return PropertyValue(key, value?.let { JsonPrimitive(it) } ?: JsonNull, "select")
        }
        
        /**
         * 複数選択値を作成
         */
        fun multiSelect(key: String, values: List<String>): PropertyValue {
            return PropertyValue(key, JsonArray(values.map { JsonPrimitive(it) }), "multi_select")
        }
        
        /**
         * ユーザー値を作成
         */
        fun user(key: String, userId: UUID?): PropertyValue {
            return PropertyValue(key, userId?.let { JsonPrimitive(it.toString()) } ?: JsonNull, "user")
        }
        
        /**
         * JsonObjectから PropertyValue のリストを作成
         */
        fun fromJsonObject(data: JsonObject): List<PropertyValue> {
            return data.map { (key, value) ->
                PropertyValue(key, value)
            }
        }
        
        /**
         * PropertyValue のリストから JsonObject を作成
         */
        fun toJsonObject(values: List<PropertyValue>): JsonObject {
            return buildJsonObject {
                values.forEach { put(it.key, it.value) }
            }
        }
    }
}