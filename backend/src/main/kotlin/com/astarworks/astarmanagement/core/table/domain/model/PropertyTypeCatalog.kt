package com.astarworks.astarmanagement.core.table.domain.model

import kotlinx.serialization.json.*

/**
 * プロパティ型カタログ
 * システムで利用可能なプロパティ型の定義
 * 
 * @property id 型ID（"text", "number", "select" など）
 * @property category カテゴリー（"basic", "advanced", "relation", "system"）
 * @property validationSchema バリデーションスキーマ
 * @property defaultConfig デフォルト設定
 * @property uiComponent UIコンポーネント名
 * @property icon アイコン
 * @property description 説明
 * @property isActive 有効フラグ
 * @property isCustom カスタム型かどうか（テナント固有）
 */
data class PropertyTypeCatalog(
    val id: String,
    val category: PropertyTypeCategory = PropertyTypeCategory.BASIC,
    val validationSchema: JsonObject? = null,
    val defaultConfig: JsonObject = JsonObject(emptyMap()),
    val uiComponent: String? = null,
    val icon: String? = null,
    val description: String? = null,
    val isActive: Boolean = true,
    val isCustom: Boolean = false
) {
    init {
        require(id.isNotBlank()) { "Property type ID must not be blank" }
    }
    
    /**
     * デフォルト設定値を取得
     */
    inline fun <reified T> getDefaultConfigValue(key: String): T? {
        return defaultConfig[key]?.let { element ->
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
    }
    
    /**
     * バリデーションスキーマ値を取得
     */
    inline fun <reified T> getValidationValue(key: String): T? {
        return validationSchema?.get(key)?.let { element ->
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
    }
    
    /**
     * このプロパティ型が基本型かどうか
     */
    fun isBasicType(): Boolean = category == PropertyTypeCategory.BASIC
    
    /**
     * このプロパティ型がリレーション型かどうか
     */
    fun isRelationType(): Boolean = category == PropertyTypeCategory.RELATION
    
    /**
     * このプロパティ型がシステム型かどうか
     */
    fun isSystemType(): Boolean = category == PropertyTypeCategory.SYSTEM
    
    companion object {
        // 基本型のID定数
        const val TEXT = "text"
        const val LONG_TEXT = "long_text"
        const val NUMBER = "number"
        const val CHECKBOX = "checkbox"
        const val DATE = "date"
        const val DATETIME = "datetime"
        const val SELECT = "select"
        const val MULTI_SELECT = "multi_select"
        const val STATUS = "status"
        
        // 高度な型のID定数
        const val URL = "url"
        const val EMAIL = "email"
        const val PHONE = "phone"
        const val CURRENCY = "currency"
        const val PERCENT = "percent"
        const val FILE = "file"
        
        // リレーション型のID定数
        const val USER = "user"
        const val RELATION = "relation"
        
        // システム型のID定数
        const val CREATED_TIME = "created_time"
        const val CREATED_BY = "created_by"
        const val UPDATED_TIME = "updated_time"
        const val UPDATED_BY = "updated_by"
        
        /**
         * 基本的なテキスト型カタログを作成
         */
        fun createTextType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = TEXT,
                category = PropertyTypeCategory.BASIC,
                defaultConfig = buildJsonObject { put("maxLength", JsonPrimitive(500)) },
                uiComponent = "TextInput",
                description = "Single line text input"
            )
        }
        
        /**
         * 基本的な数値型カタログを作成
         */
        fun createNumberType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = NUMBER,
                category = PropertyTypeCategory.BASIC,
                defaultConfig = buildJsonObject { put("precision", JsonPrimitive(2)) },
                uiComponent = "NumberInput",
                description = "Numeric value input"
            )
        }
        
        /**
         * 基本的な選択型カタログを作成
         */
        fun createSelectType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = SELECT,
                category = PropertyTypeCategory.BASIC,
                defaultConfig = buildJsonObject { put("options", JsonArray(emptyList())) },
                uiComponent = "SelectInput",
                description = "Single selection from options"
            )
        }
        
        /**
         * 基本的なチェックボックス型カタログを作成
         */
        fun createCheckboxType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = CHECKBOX,
                category = PropertyTypeCategory.BASIC,
                defaultConfig = buildJsonObject { put("default", JsonPrimitive(false)) },
                uiComponent = "CheckboxInput",
                description = "Boolean checkbox"
            )
        }
        
        /**
         * 基本的な日付型カタログを作成
         */
        fun createDateType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = DATE,
                category = PropertyTypeCategory.BASIC,
                defaultConfig = JsonObject(emptyMap()),
                uiComponent = "DatePicker",
                description = "Date picker"
            )
        }
        
        /**
         * 長文テキスト型カタログを作成
         */
        fun createLongTextType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = LONG_TEXT,
                category = PropertyTypeCategory.BASIC,
                defaultConfig = buildJsonObject { put("maxLength", JsonPrimitive(5000)) },
                uiComponent = "TextAreaInput",
                description = "Multi-line text input"
            )
        }
        
        /**
         * 複数選択型カタログを作成
         */
        fun createMultiSelectType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = MULTI_SELECT,
                category = PropertyTypeCategory.ADVANCED,
                defaultConfig = buildJsonObject { put("options", JsonArray(emptyList())) },
                uiComponent = "MultiSelectInput",
                description = "Multiple selection from options"
            )
        }
        
        /**
         * ユーザー型カタログを作成
         */
        fun createUserType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = USER,
                category = PropertyTypeCategory.RELATION,
                defaultConfig = JsonObject(emptyMap()),
                uiComponent = "UserPicker",
                description = "User reference"
            )
        }
        
        /**
         * メール型カタログを作成
         */
        fun createEmailType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = EMAIL,
                category = PropertyTypeCategory.ADVANCED,
                validationSchema = buildJsonObject { put("pattern", JsonPrimitive("^[\\w.-]+@[\\w.-]+\\.\\w+$")) },
                defaultConfig = JsonObject(emptyMap()),
                uiComponent = "EmailInput",
                description = "Email address input"
            )
        }
        
        /**
         * 電話番号型カタログを作成
         */
        fun createPhoneType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = PHONE,
                category = PropertyTypeCategory.ADVANCED,
                validationSchema = buildJsonObject { put("pattern", JsonPrimitive("^[+\\d\\s()-]+$")) },
                defaultConfig = JsonObject(emptyMap()),
                uiComponent = "PhoneInput",
                description = "Phone number input"
            )
        }
        
        /**
         * URL型カタログを作成
         */
        fun createUrlType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = URL,
                category = PropertyTypeCategory.ADVANCED,
                validationSchema = buildJsonObject { put("pattern", JsonPrimitive("^https?://.*")) },
                defaultConfig = JsonObject(emptyMap()),
                uiComponent = "UrlInput",
                description = "URL input"
            )
        }
        
        /**
         * ファイル型カタログを作成
         */
        fun createFileType(): PropertyTypeCatalog {
            return PropertyTypeCatalog(
                id = FILE,
                category = PropertyTypeCategory.ADVANCED,
                defaultConfig = buildJsonObject { 
                    put("maxSize", JsonPrimitive(10485760))
                    put("allowedTypes", JsonArray(listOf(JsonPrimitive("*/*"))))
                },
                uiComponent = "FileUpload",
                description = "File attachment"
            )
        }
    }
}

/**
 * プロパティ型のカテゴリー
 */
enum class PropertyTypeCategory {
    BASIC,      // 基本型
    ADVANCED,   // 高度な型
    RELATION,   // リレーション型
    SYSTEM      // システム型
}