package com.astarworks.astarmanagement.core.table.api.dto.common

import kotlinx.serialization.Serializable
import kotlinx.serialization.Contextual

import kotlinx.serialization.SerialName
import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

/**
 * Request DTO for filtering data.
 * Supports complex filter conditions with AND/OR operators.
 */
@Serializable
data class FilterRequest(
    @field:Valid
    val filters: List<FilterCondition> = emptyList(),
    
    val operator: FilterOperator = FilterOperator.AND
) {
    /**
     * Checks if the filter request has any conditions.
     */
    fun hasFilters(): Boolean = filters.isNotEmpty()
    
    /**
     * Gets filters for a specific field.
     */
    fun getFiltersForField(field: String): List<FilterCondition> {
        return filters.filter { it.field == field }
    }
    
    /**
     * Combines this filter request with another.
     */
    fun combine(other: FilterRequest, operator: FilterOperator = FilterOperator.AND): FilterRequest {
        return FilterRequest(
            filters = listOf(
                FilterCondition.group(this),
                FilterCondition.group(other)
            ),
            operator = operator
        )
    }
}

/**
 * Represents a single filter condition.
 * Can be a simple condition or a group of conditions.
 */
@Serializable
data class FilterCondition(
    @field:NotBlank
    val field: String? = null,
    
    val operation: FilterOperation? = null,
    
    @Contextual
    val value: Any? = null,
    
    val values: List<@Contextual Any>? = null,
    
    @field:Valid
    val group: FilterRequest? = null
) {
    init {
        require(
            (field != null && operation != null) || group != null
        ) { "FilterCondition must have either (field and operation) or group" }
        
        if (operation != null) {
            when (operation) {
                FilterOperation.IN, FilterOperation.NOT_IN -> {
                    require(values != null && values.isNotEmpty()) {
                        "$operation requires non-empty values list"
                    }
                }
                FilterOperation.IS_NULL, FilterOperation.IS_NOT_NULL -> {
                    // No value required
                }
                FilterOperation.BETWEEN -> {
                    require(values != null && values.size == 2) {
                        "BETWEEN requires exactly 2 values"
                    }
                }
                else -> {
                    require(value != null || values != null) {
                        "$operation requires a value"
                    }
                }
            }
        }
    }
    
    /**
     * Checks if this is a group condition.
     */
    fun isGroup(): Boolean = group != null
    
    /**
     * Gets the effective value (either single value or first of values).
     */
    fun getEffectiveValue(): Any? {
        return value ?: values?.firstOrNull()
    }
    
    companion object {
        /**
         * Creates a simple equality filter.
         */
        fun equals(field: String, value: Any): FilterCondition {
            return FilterCondition(
                field = field,
                operation = FilterOperation.EQUALS,
                value = value
            )
        }
        
        /**
         * Creates a contains filter for text search.
         */
        fun contains(field: String, value: String): FilterCondition {
            return FilterCondition(
                field = field,
                operation = FilterOperation.CONTAINS,
                value = value
            )
        }
        
        /**
         * Creates an IN filter for multiple values.
         */
        fun inValues(field: String, values: List<Any>): FilterCondition {
            return FilterCondition(
                field = field,
                operation = FilterOperation.IN,
                values = values
            )
        }
        
        /**
         * Creates a between filter for range queries.
         */
        fun between(field: String, min: Any, max: Any): FilterCondition {
            return FilterCondition(
                field = field,
                operation = FilterOperation.BETWEEN,
                values = listOf(min, max)
            )
        }
        
        /**
         * Creates a null check filter.
         */
        fun isNull(field: String): FilterCondition {
            return FilterCondition(
                field = field,
                operation = FilterOperation.IS_NULL
            )
        }
        
        /**
         * Creates a group condition from a filter request.
         */
        fun group(filterRequest: FilterRequest): FilterCondition {
            return FilterCondition(group = filterRequest)
        }
    }
}

/**
 * Filter operations enumeration.
 * Defines all supported filter operations.
 */
enum class FilterOperation {
    @SerialName("eq")
    @JsonProperty("eq")
    EQUALS,
    
    @SerialName("ne")
    @JsonProperty("ne")
    NOT_EQUALS,
    
    @SerialName("gt")
    @JsonProperty("gt")
    GREATER_THAN,
    
    @SerialName("gte")
    @JsonProperty("gte")
    GREATER_THAN_OR_EQUALS,
    
    @SerialName("lt")
    @JsonProperty("lt")
    LESS_THAN,
    
    @SerialName("lte")
    @JsonProperty("lte")
    LESS_THAN_OR_EQUALS,
    
    @SerialName("contains")
    @JsonProperty("contains")
    CONTAINS,
    
    @SerialName("startsWith")
    @JsonProperty("startsWith")
    STARTS_WITH,
    
    @SerialName("endsWith")
    @JsonProperty("endsWith")
    ENDS_WITH,
    
    @SerialName("in")
    @JsonProperty("in")
    IN,
    
    @SerialName("notIn")
    @JsonProperty("notIn")
    NOT_IN,
    
    @SerialName("between")
    @JsonProperty("between")
    BETWEEN,
    
    @SerialName("isNull")
    @JsonProperty("isNull")
    IS_NULL,
    
    @SerialName("isNotNull")
    @JsonProperty("isNotNull")
    IS_NOT_NULL;
    
    /**
     * Checks if this operation requires a value.
     */
    fun requiresValue(): Boolean {
        return this !in listOf(IS_NULL, IS_NOT_NULL)
    }
    
    /**
     * Checks if this operation requires multiple values.
     */
    fun requiresMultipleValues(): Boolean {
        return this in listOf(IN, NOT_IN, BETWEEN)
    }
}

/**
 * Logical operator for combining filter conditions.
 */
enum class FilterOperator {
    @SerialName("and")
    @JsonProperty("and")
    AND,
    
    @SerialName("or")
    @JsonProperty("or")
    OR;
    
    /**
     * Returns the SQL keyword for this operator.
     */
    fun toSql(): String = name
}