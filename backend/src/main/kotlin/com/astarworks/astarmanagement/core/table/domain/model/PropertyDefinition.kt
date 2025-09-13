package com.astarworks.astarmanagement.core.table.domain.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

/**
 * プロパティ定義
 * データベース（テーブル）のカラム定義を表現する値オブジェクト
 * 
 * @property type プロパティ型
 * @property displayName 表示名
 * @property config 型固有の設定（選択肢、最大文字数など）
 */
@Serializable
data class PropertyDefinition(
    val type: PropertyType,
    val displayName: String,
    val config: JsonObject = JsonObject(emptyMap())
) {
    init {
        require(displayName.isNotBlank()) { "Display name must not be blank" }
        require(displayName.length <= 255) { "Display name too long (max 255 characters)" }
    }
    
    // ===== 型安全なプロパティアクセサ =====
    
    /**tu
     * 必須フィールドかどうか
     */
    val isRequired: Boolean 
        get() = config["required"]?.jsonPrimitive?.booleanOrNull ?: false
    
    /**
     * 最大文字数（テキスト型用）
     */
    val maxLength: Int? 
        get() = config["maxLength"]?.jsonPrimitive?.intOrNull
    
    /**
     * 最小値（数値型用）
     */
    val minValue: Number? 
        get() = config["min"]?.jsonPrimitive?.doubleOrNull
    
    /**
     * 最大値（数値型用）
     */
    val maxValue: Number? 
        get() = config["max"]?.jsonPrimitive?.doubleOrNull
    
    /**
     * 精度（数値型用）
     */
    val precision: Int? 
        get() = config["precision"]?.jsonPrimitive?.intOrNull
    
    /**
     * デフォルト値
     */
    val defaultValue: JsonElement? 
        get() = config["default"]
    
    /**
     * プレースホルダーテキスト
     */
    val placeholder: String? 
        get() = config["placeholder"]?.jsonPrimitive?.contentOrNull
    
    /**
     * 複数選択可能か（選択型用）
     */
    val isMultiple: Boolean 
        get() = config["multiple"]?.jsonPrimitive?.booleanOrNull ?: false
    
    /**
     * 選択肢を取得（selectタイプ用）
     * Kotlin Serializationを活用して型安全に取得
     */
    val options: List<SelectOption>?
        get() {
            val optionsArray = config["options"] as? JsonArray ?: return null
            return try {
                optionsArray.map { element ->
                    require(element is JsonObject) { "Invalid option format" }
                    Json.decodeFromJsonElement<SelectOption>(element)
                }
            } catch (e: Exception) {
                // ログに記録するか、エラーを適切に処理
                null
            }
        }
    
    // ===== リレーション用のプロパティアクセサ =====
    
    /**
     * リレーション先のテーブルID（RELATION型用）
     */
    val targetTableId: String?
        get() = config["targetTableId"]?.jsonPrimitive?.contentOrNull
    
    /**
     * リレーションのターゲットタイプ（RELATION型用）
     */
    val targetType: String?
        get() = config["targetType"]?.jsonPrimitive?.contentOrNull ?: "table"
    
    /**
     * リレーション関係のタイプ（RELATION型用）
     */
    val relationshipType: String?
        get() = config["relationshipType"]?.jsonPrimitive?.contentOrNull ?: "one-to-many"
    
    /**
     * 表示用フィールド名（RELATION型用）
     */
    val displayField: String?
        get() = config["displayField"]?.jsonPrimitive?.contentOrNull ?: "name"
    
    // ===== ユーティリティメソッド =====
    
    /**
     * configを更新（不変性を保持）
     */
    fun withConfig(transform: JsonObjectBuilder.() -> Unit): PropertyDefinition {
        return copy(config = buildJsonObject {
            // 既存のconfigをコピー
            config.forEach { (key, value) -> put(key, value) }
            // 新しい変更を適用
            transform()
        })
    }
    
    /**
     * 特定の設定値を更新
     */
    fun withConfigValue(key: String, value: JsonElement): PropertyDefinition {
        return withConfig { put(key, value) }
    }
    
    /**
     * 必須フィールドに変更
     */
    fun asRequired(): PropertyDefinition = withConfigValue("required", JsonPrimitive(true))
    
    /**
     * 任意フィールドに変更
     */
    fun asOptional(): PropertyDefinition = withConfigValue("required", JsonPrimitive(false))
    
    /**
     * バリデーション
     * @return エラーメッセージのリスト（空の場合は有効）
     */
    fun validate(): List<String> {
        val errors = mutableListOf<String>()
        
        // 型固有のバリデーション
        when (type) {
            PropertyType.TEXT, PropertyType.LONG_TEXT -> {
                maxLength?.let { max ->
                    if (max <= 0) errors.add("Max length must be positive")
                    if (type == PropertyType.TEXT && max > 5000) {
                        errors.add("Text type max length should not exceed 5000")
                    }
                }
            }
            PropertyType.NUMBER -> {
                minValue?.let { min ->
                    maxValue?.let { max ->
                        if (min.toDouble() > max.toDouble()) {
                            errors.add("Min value cannot be greater than max value")
                        }
                    }
                }
                precision?.let { p ->
                    if (p < 0 || p > 10) errors.add("Precision must be between 0 and 10")
                }
            }
            PropertyType.SELECT, PropertyType.MULTI_SELECT -> {
                if (options.isNullOrEmpty()) {
                    errors.add("Select type must have at least one option")
                }
            }
            PropertyType.RELATION -> {
                if (targetTableId.isNullOrBlank()) {
                    errors.add("Relation type must have a targetTableId")
                }
                if (targetType !in listOf("table", "document", "record")) {
                    errors.add("Invalid target type for relation: $targetType")
                }
            }
            else -> {
                // その他の型については特別なバリデーションなし
            }
        }
        
        return errors
    }
    
    /**
     * このプロパティ定義が有効かどうか
     */
    fun isValid(): Boolean = validate().isEmpty()
}

/**
 * 選択肢オプション
 */
@Serializable
data class SelectOption(
    val value: String,
    val label: String,
    val color: String? = null
) {
    init {
        require(value.isNotBlank()) { "Option value must not be blank" }
        require(label.isNotBlank()) { "Option label must not be blank" }
        color?.let {
            require(it.matches(Regex("^#[0-9A-Fa-f]{6}$"))) {
                "Color must be a valid hex color code (e.g., #FF5733)"
            }
        }
    }
}