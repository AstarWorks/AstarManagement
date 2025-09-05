package com.astarworks.astarmanagement.core.table.domain.model

import kotlinx.serialization.json.*

/**
 * PropertyDefinitionのビルダーオブジェクト
 * 
 * 型ごとに整理されたファクトリメソッドを提供します。
 * companion objectの肥大化を防ぎ、より直感的なAPIを提供します。
 */
object PropertyDefinitions {
    
    /**
     * テキスト型のビルダー
     */
    object Text {
        fun create(
            displayName: String,
            maxLength: Int = 500,
            required: Boolean = false,
            placeholder: String? = null,
            trim: Boolean = true
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.TEXT,
                displayName = displayName,
                config = buildJsonObject {
                    put("maxLength", maxLength)
                    put("required", required)
                    put("trim", trim)
                    placeholder?.let { put("placeholder", it) }
                }
            )
        }
        
        fun createLong(
            displayName: String,
            maxLength: Int = 5000,
            required: Boolean = false,
            placeholder: String? = null,
            rows: Int = 5,
            trim: Boolean = true
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.LONG_TEXT,
                displayName = displayName,
                config = buildJsonObject {
                    put("maxLength", maxLength)
                    put("required", required)
                    put("rows", rows)
                    put("trim", trim)
                    placeholder?.let { put("placeholder", it) }
                }
            )
        }
    }
    
    /**
     * 数値型のビルダー
     */
    object Number {
        fun create(
            displayName: String,
            min: kotlin.Number? = null,
            max: kotlin.Number? = null,
            step: kotlin.Number? = null,
            precision: Int = 2,
            required: Boolean = false,
            placeholder: String? = null
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.NUMBER,
                displayName = displayName,
                config = buildJsonObject {
                    put("precision", precision)
                    put("required", required)
                    min?.let { put("min", it.toDouble()) }
                    max?.let { put("max", it.toDouble()) }
                    step?.let { put("step", it.toDouble()) }
                    placeholder?.let { put("placeholder", it) }
                }
            )
        }
        
        fun createInteger(
            displayName: String,
            min: Int? = null,
            max: Int? = null,
            required: Boolean = false
        ): PropertyDefinition {
            return create(
                displayName = displayName,
                min = min,
                max = max,
                step = 1,
                precision = 0,
                required = required
            )
        }
        
        fun createPercentage(
            displayName: String,
            required: Boolean = false
        ): PropertyDefinition {
            return create(
                displayName = displayName,
                min = 0,
                max = 100,
                step = 1,
                precision = 0,
                required = required,
                placeholder = "0-100%"
            )
        }
    }
    
    /**
     * 選択型のビルダー
     */
    object Select {
        fun create(
            displayName: String,
            options: List<SelectOption>,
            required: Boolean = false,
            placeholder: String? = null,
            searchable: Boolean = true
        ): PropertyDefinition {
            require(options.isNotEmpty()) { "Select must have at least one option" }
            
            return PropertyDefinition(
                typeId = PropertyTypes.SELECT,
                displayName = displayName,
                config = buildJsonObject {
                    putJsonArray("options") {
                        options.forEach { option ->
                            addJsonObject {
                                put("value", option.value)
                                put("label", option.label)
                                option.color?.let { put("color", it) }
                            }
                        }
                    }
                    put("required", required)
                    put("multiple", false)
                    put("searchable", searchable)
                    placeholder?.let { put("placeholder", it) }
                }
            )
        }
        
        fun createMultiple(
            displayName: String,
            options: List<SelectOption>,
            maxItems: Int? = null,
            required: Boolean = false,
            placeholder: String? = null,
            searchable: Boolean = true
        ): PropertyDefinition {
            require(options.isNotEmpty()) { "Multi-select must have at least one option" }
            
            return PropertyDefinition(
                typeId = PropertyTypes.MULTI_SELECT,
                displayName = displayName,
                config = buildJsonObject {
                    putJsonArray("options") {
                        options.forEach { option ->
                            addJsonObject {
                                put("value", option.value)
                                put("label", option.label)
                                option.color?.let { put("color", it) }
                            }
                        }
                    }
                    put("required", required)
                    put("multiple", true)
                    put("searchable", searchable)
                    maxItems?.let { put("maxItems", it) }
                    placeholder?.let { put("placeholder", it) }
                }
            )
        }
        
        /**
         * 簡易的な選択肢作成ヘルパー
         */
        fun optionsFromStrings(vararg values: String): List<SelectOption> {
            return values.map { SelectOption(value = it, label = it) }
        }
        
        fun optionsFromPairs(vararg pairs: Pair<String, String>): List<SelectOption> {
            return pairs.map { (value, label) -> SelectOption(value = value, label = label) }
        }
    }
    
    /**
     * ブール型のビルダー
     */
    object Checkbox {
        fun create(
            displayName: String,
            defaultValue: Boolean = false,
            required: Boolean = false
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.CHECKBOX,
                displayName = displayName,
                config = buildJsonObject {
                    put("default", defaultValue)
                    put("required", required)
                }
            )
        }
    }
    
    /**
     * 日付型のビルダー
     */
    object Date {
        fun create(
            displayName: String,
            required: Boolean = false,
            format: String = "YYYY-MM-DD",
            placeholder: String? = null
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.DATE,
                displayName = displayName,
                config = buildJsonObject {
                    put("required", required)
                    put("format", format)
                    put("includeTime", false)
                    placeholder?.let { put("placeholder", it) }
                }
            )
        }
        
        fun createWithTime(
            displayName: String,
            required: Boolean = false,
            format: String = "YYYY-MM-DD HH:mm",
            placeholder: String? = null
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.DATETIME,
                displayName = displayName,
                config = buildJsonObject {
                    put("required", required)
                    put("format", format)
                    put("includeTime", true)
                    placeholder?.let { put("placeholder", it) }
                }
            )
        }
    }
    
    /**
     * 特殊型のビルダー
     */
    object Special {
        fun createEmail(
            displayName: String,
            required: Boolean = false,
            placeholder: String = "email@example.com"
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.EMAIL,
                displayName = displayName,
                config = buildJsonObject {
                    put("required", required)
                    put("placeholder", placeholder)
                    put("pattern", "^[\\w.-]+@[\\w.-]+\\.\\w+$")
                    put("trim", true)
                    put("lowercase", true)
                }
            )
        }
        
        fun createPhone(
            displayName: String,
            required: Boolean = false,
            placeholder: String = "+1 (555) 123-4567"
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.PHONE,
                displayName = displayName,
                config = buildJsonObject {
                    put("required", required)
                    put("placeholder", placeholder)
                    put("pattern", "^[+\\d\\s()-]+$")
                    put("trim", true)
                }
            )
        }
        
        fun createUrl(
            displayName: String,
            required: Boolean = false,
            placeholder: String = "https://example.com"
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.URL,
                displayName = displayName,
                config = buildJsonObject {
                    put("required", required)
                    put("placeholder", placeholder)
                    put("pattern", "^https?://.+")
                    put("trim", true)
                }
            )
        }
        
        fun createUser(
            displayName: String,
            required: Boolean = false,
            allowMultiple: Boolean = false,
            placeholder: String = "Select user"
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.USER,
                displayName = displayName,
                config = buildJsonObject {
                    put("required", required)
                    put("allowMultiple", allowMultiple)
                    put("placeholder", placeholder)
                    put("searchable", true)
                }
            )
        }
        
        fun createFile(
            displayName: String,
            maxSize: Long = 10485760, // 10MB
            allowedTypes: List<String> = emptyList(),
            multiple: Boolean = false,
            maxFiles: Int = 1,
            required: Boolean = false
        ): PropertyDefinition {
            return PropertyDefinition(
                typeId = PropertyTypes.FILE,
                displayName = displayName,
                config = buildJsonObject {
                    put("required", required)
                    put("maxSize", maxSize)
                    putJsonArray("allowedTypes") {
                        allowedTypes.forEach { add(it) }
                    }
                    put("multiple", multiple)
                    put("maxFiles", maxFiles)
                }
            )
        }
    }
}