package com.astarworks.astarmanagement.core.table.api.dto.property

import com.astarworks.astarmanagement.core.table.domain.model.PropertyType
import com.astarworks.astarmanagement.core.table.infrastructure.validation.ValidPropertyKey
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

/**
 * DTO for property definition.
 * Represents a column definition in a dynamic table.
 */
@Serializable
data class PropertyDefinitionDto(
    @field:NotBlank
    @field:Size(min = 1, max = 50)
    @field:ValidPropertyKey
    val key: String,
    
    @field:NotNull
    val type: PropertyType,
    
    @field:NotBlank
    @field:Size(min = 1, max = 255)
    val displayName: String,
    
    val config: JsonObject = JsonObject(emptyMap()),
    
    val required: Boolean = false,
    
    val defaultValue: JsonElement? = null,
    
    val description: String? = null
) {
    /**
     * Gets a configuration value by key.
     */
    fun getConfigValue(key: String): JsonElement? = config[key]
    
    /**
     * Gets a configuration value with a default.
     */
    inline fun <reified T> getConfigValue(key: String, default: T): T {
        val element = config[key] ?: return default
        return when (element) {
            is JsonPrimitive -> when (T::class) {
                String::class -> (element.contentOrNull ?: default) as T
                Int::class -> (element.intOrNull ?: default) as T
                Long::class -> (element.longOrNull ?: default) as T
                Double::class -> (element.doubleOrNull ?: default) as T
                Boolean::class -> (element.booleanOrNull ?: default) as T
                else -> default
            }
            is JsonArray -> element as? T ?: default
            is JsonObject -> element as? T ?: default
            else -> default
        }
    }
    
    /**
     * Creates a copy with updated configuration.
     */
    fun withConfig(newConfig: JsonObject): PropertyDefinitionDto {
        return copy(config = JsonObject(config + newConfig))
    }
    
    companion object {
        /**
         * Creates a text property definition.
         */
        fun text(
            key: String,
            displayName: String,
            maxLength: Int = 500,
            required: Boolean = false
        ): PropertyDefinitionDto {
            return PropertyDefinitionDto(
                key = key,
                type = PropertyType.TEXT,
                displayName = displayName,
                config = buildJsonObject { put("maxLength", maxLength) },
                required = required
            )
        }
        
        /**
         * Creates a number property definition.
         */
        fun number(
            key: String,
            displayName: String,
            min: Number? = null,
            max: Number? = null,
            required: Boolean = false
        ): PropertyDefinitionDto {
            val config = buildJsonObject {
                min?.let { put("min", it) }
                max?.let { put("max", it) }
            }
            
            return PropertyDefinitionDto(
                key = key,
                type = PropertyType.NUMBER,
                displayName = displayName,
                config = config,
                required = required
            )
        }
        
        /**
         * Creates a select property definition.
         */
        fun select(
            key: String,
            displayName: String,
            options: List<SelectOptionDto>,
            required: Boolean = false,
            multiple: Boolean = false
        ): PropertyDefinitionDto {
            return PropertyDefinitionDto(
                key = key,
                type = if (multiple) PropertyType.MULTI_SELECT else PropertyType.SELECT,
                displayName = displayName,
                config = buildJsonObject {
                    putJsonArray("options") {
                        options.forEach { option ->
                            addJsonObject {
                                put("value", option.value)
                                put("label", option.label)
                                option.color?.let { put("color", it) }
                                option.icon?.let { put("icon", it) }
                                option.description?.let { put("description", it) }
                                put("order", option.order)
                            }
                        }
                    }
                },
                required = required
            )
        }
    }
}

/**
 * DTO for property value.
 * Represents the actual value of a property in a record.
 */
@Serializable
data class PropertyValueDto(
    @field:NotBlank
    val key: String,
    
    val value: JsonElement?,
    
    val displayValue: String? = null
) {
    /**
     * Checks if the value is null or empty.
     */
    fun isEmpty(): Boolean {
        return when (value) {
            null, is JsonNull -> true
            is JsonPrimitive -> value.contentOrNull?.isBlank() ?: true
            is JsonArray -> value.isEmpty()
            is JsonObject -> value.isEmpty()
            else -> false
        }
    }
    
    /**
     * Gets the value as a specific type.
     */
    inline fun <reified T> getValueAs(): T? {
        return when (value) {
            is JsonPrimitive -> when (T::class) {
                String::class -> value.contentOrNull as? T
                Int::class -> value.intOrNull as? T
                Long::class -> value.longOrNull as? T
                Double::class -> value.doubleOrNull as? T
                Boolean::class -> value.booleanOrNull as? T
                else -> null
            }
            is JsonArray -> value as? T
            is JsonObject -> value as? T
            else -> null
        }
    }
    
    /**
     * Gets the effective display value.
     */
    fun getEffectiveDisplayValue(): String {
        return displayValue ?: when (value) {
            is JsonPrimitive -> value.contentOrNull ?: ""
            is JsonArray -> value.toString()
            is JsonObject -> value.toString()
            else -> ""
        }
    }
    
    companion object {
        /**
         * Creates a property value from a key-value pair.
         */
        fun of(key: String, value: JsonElement?): PropertyValueDto {
            return PropertyValueDto(
                key = key,
                value = value
            )
        }
        
        /**
         * Creates a property value with display value.
         */
        fun withDisplay(
            key: String,
            value: JsonElement?,
            displayValue: String
        ): PropertyValueDto {
            return PropertyValueDto(
                key = key,
                value = value,
                displayValue = displayValue
            )
        }
    }
}

/**
 * DTO for select option.
 * Represents an option in a select/multi-select property.
 */
@Serializable
data class SelectOptionDto(
    @field:NotBlank
    val value: String,
    
    @field:NotBlank
    val label: String,
    
    val color: String? = null,
    
    val icon: String? = null,
    
    val description: String? = null,
    
    val order: Int = 0
) {
    /**
     * Creates a display string for this option.
     */
    fun toDisplayString(): String {
        return if (description != null) {
            "$label - $description"
        } else {
            label
        }
    }
    
    companion object {
        /**
         * Creates a simple option.
         */
        fun simple(value: String, label: String): SelectOptionDto {
            return SelectOptionDto(value = value, label = label)
        }
        
        /**
         * Creates an option with color.
         */
        fun withColor(
            value: String,
            label: String,
            color: String
        ): SelectOptionDto {
            return SelectOptionDto(
                value = value,
                label = label,
                color = color
            )
        }
        
        /**
         * Creates status options.
         */
        fun statusOptions(): List<SelectOptionDto> {
            return listOf(
                SelectOptionDto("todo", "To Do", "#808080"),
                SelectOptionDto("in_progress", "In Progress", "#0066CC"),
                SelectOptionDto("done", "Done", "#00AA00"),
                SelectOptionDto("cancelled", "Cancelled", "#CC0000")
            )
        }
    }
}

/**
 * Request DTO for adding a property to a table.
 */
@Serializable
data class PropertyAddRequest(
    @field:NotNull
    val definition: PropertyDefinitionDto,
    
    val position: Int? = null
)

/**
 * Request DTO for updating a property definition.
 */
@Serializable
data class PropertyUpdateRequest(
    val displayName: String? = null,
    
    val config: JsonObject? = null,
    
    val required: Boolean? = null,
    
    val defaultValue: JsonElement? = null,
    
    val description: String? = null
)

/**
 * Request DTO for reordering properties.
 */
@Serializable
data class PropertyReorderRequest(
    @field:NotNull
    @field:Size(min = 1)
    val order: List<String>
)