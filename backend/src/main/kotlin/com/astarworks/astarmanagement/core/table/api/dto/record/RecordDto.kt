package com.astarworks.astarmanagement.core.table.api.dto.record

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import com.astarworks.astarmanagement.core.table.infrastructure.validation.ValidRecordData
import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.time.Instant
import java.util.UUID

/**
 * Request DTO for creating a new record.
 */
@Serializable
data class RecordCreateRequest(
    @field:NotNull
    @Contextual
    val tableId: UUID,
    
    @field:NotNull
    @field:ValidRecordData
    val data: JsonObject,
    
    @field:Positive
    val position: Float? = null
) {
    /**
     * Validates that the data is not empty.
     */
    fun hasData(): Boolean {
        return data.isNotEmpty()
    }
    
    /**
     * Gets a specific field value.
     */
    fun getFieldValue(key: String): JsonElement? {
        return data[key]
    }
}

/**
 * Request DTO for updating a record.
 */
@Serializable
data class RecordUpdateRequest(
    @field:NotNull
    @field:ValidRecordData
    val data: JsonObject,
    
    val merge: Boolean = true
) {
    /**
     * Checks if the request has any updates.
     */
    fun hasUpdates(): Boolean {
        return data.isNotEmpty()
    }
    
    /**
     * Validates that required fields are present when not merging.
     */
    fun validateFullUpdate(requiredFields: Set<String>): List<String> {
        if (merge) return emptyList()
        
        val errors = mutableListOf<String>()
        requiredFields.forEach { field ->
            if (!data.containsKey(field)) {
                errors.add("Required field '$field' is missing")
            }
        }
        return errors
    }
}

/**
 * Response DTO for record information.
 */
@Serializable
data class RecordResponse(
    @Contextual
    val id: UUID,
    
    @Contextual
    val tableId: UUID,
    
    val data: JsonObject,
    
    val position: Float,
    
    @Contextual
    val createdAt: Instant,
    
    @Contextual
    val updatedAt: Instant
) {
    /**
     * Gets a specific field value.
     */
    fun getFieldValue(key: String): JsonElement? {
        return data[key]
    }
    
    /**
     * Gets the primary field value (first field in the data map).
     */
    fun getPrimaryFieldValue(): JsonElement? {
        return data.entries.firstOrNull()?.value
    }
    
    /**
     * Creates a summary view.
     */
    fun toSummary(): RecordSummaryResponse {
        return RecordSummaryResponse(
            id = id,
            primaryField = getPrimaryFieldValue(),
            updatedAt = updatedAt
        )
    }
    
    /**
     * Creates a minimal view with selected fields.
     */
    fun toMinimal(fields: Set<String>): RecordMinimalResponse {
        val filteredData = JsonObject(data.filterKeys { it in fields })
        return RecordMinimalResponse(
            id = id,
            data = filteredData,
            updatedAt = updatedAt
        )
    }
}

/**
 * Summary response DTO for record listing.
 * Contains minimal information for list views.
 */
@Serializable
data class RecordSummaryResponse(
    @Contextual
    val id: UUID,
    
    val primaryField: JsonElement?,
    
    @Contextual
    val updatedAt: Instant
)

/**
 * Minimal response DTO with selected fields.
 * Used for optimized data transfer when only specific fields are needed.
 */
@Serializable
data class RecordMinimalResponse(
    @Contextual
    val id: UUID,
    
    val data: JsonObject,
    
    @Contextual
    val updatedAt: Instant
)

/**
 * Request DTO for moving a record to a new position.
 */
@Serializable
data class RecordMoveRequest(
    @Contextual
    val afterRecordId: UUID? = null,
    
    @Contextual
    val beforeRecordId: UUID? = null
) {
    init {
        require(afterRecordId == null || beforeRecordId == null) {
            "Cannot specify both afterRecordId and beforeRecordId"
        }
    }
    
    /**
     * Checks if the move is to the first position.
     */
    fun isMovingToFirst(): Boolean {
        return afterRecordId == null && beforeRecordId != null
    }
    
    /**
     * Checks if the move is to the last position.
     */
    fun isMovingToLast(): Boolean {
        return afterRecordId != null && beforeRecordId == null
    }
}

/**
 * Request DTO for reordering multiple records.
 */
@Serializable
data class RecordReorderRequest(
    @field:NotNull
    val recordIds: List<@Contextual UUID>
) {
    /**
     * Validates that there are no duplicate IDs.
     */
    fun hasUniqueIds(): Boolean {
        return recordIds.size == recordIds.toSet().size
    }
    
    /**
     * Gets the position of a specific record ID.
     */
    fun getPosition(recordId: UUID): Int? {
        return recordIds.indexOf(recordId).takeIf { it >= 0 }
    }
}

/**
 * Response DTO for record list.
 */
@Serializable
data class RecordListResponse(
    val records: List<RecordResponse>,
    
    val totalCount: Long,
    
    @Contextual
    val tableId: UUID? = null
) {
    companion object {
        /**
         * Creates a record list response.
         */
        fun of(records: List<RecordResponse>, tableId: UUID? = null): RecordListResponse {
            return RecordListResponse(
                records = records,
                totalCount = records.size.toLong(),
                tableId = tableId
            )
        }
        
        /**
         * Creates an empty record list response.
         */
        fun empty(tableId: UUID? = null): RecordListResponse {
            return RecordListResponse(
                records = emptyList(),
                totalCount = 0,
                tableId = tableId
            )
        }
    }
}

/**
 * Query parameters for filtering records.
 */
@Serializable
data class RecordFilterRequest(
    val filters: JsonObject? = null,
    
    val sort: RecordSortRequest? = null,
    
    val fields: Set<String>? = null
) {
    /**
     * Checks if any filters are specified.
     */
    fun hasFilters(): Boolean {
        return !filters.isNullOrEmpty()
    }
    
    /**
     * Checks if field selection is specified.
     */
    fun hasFieldSelection(): Boolean {
        return !fields.isNullOrEmpty()
    }
}

/**
 * Sort configuration for records.
 */
@Serializable
data class RecordSortRequest(
    val field: String,
    
    val direction: SortDirection = SortDirection.ASC
)

/**
 * Sort direction enumeration.
 */
enum class SortDirection {
    @SerialName("asc")
    ASC,
    
    @SerialName("desc")
    DESC
}

/**
 * Response DTO for record validation errors.
 */
@Serializable
data class RecordValidationError(
    val field: String,
    
    val message: String,
    
    @Contextual
    val value: Any? = null
)

/**
 * Response DTO for record operation errors.
 */
@Serializable
data class RecordError(
    @Contextual
    val recordId: UUID? = null,
    
    val index: Int? = null,
    
    val message: String,
    
    val validationErrors: List<RecordValidationError>? = null
)

/**
 * Request DTO for validating record data.
 */
@Serializable
data class RecordValidateRequest(
    @field:NotNull
    @Contextual
    val tableId: UUID,
    
    @field:NotNull
    val data: JsonObject,
    
    @Contextual
    val recordId: UUID? = null,
    
    val partial: Boolean = false
) {
    /**
     * Checks if this is a partial validation (for updates).
     */
    fun isPartialValidation(): Boolean {
        return partial && recordId != null
    }
    
    /**
     * Checks if this is a full validation (for creates).
     */
    fun isFullValidation(): Boolean {
        return !partial
    }
}

/**
 * Response DTO for record validation results.
 */
@Serializable
data class RecordValidationResponse(
    val valid: Boolean,
    
    val errors: List<RecordValidationError> = emptyList(),
    
    val warnings: List<RecordValidationWarning> = emptyList(),
    
    val processedData: JsonObject? = null
) {
    companion object {
        /**
         * Creates a successful validation response.
         */
        fun success(processedData: JsonObject? = null): RecordValidationResponse {
            return RecordValidationResponse(
                valid = true,
                errors = emptyList(),
                warnings = emptyList(),
                processedData = processedData
            )
        }
        
        /**
         * Creates a failed validation response.
         */
        fun failure(errors: List<RecordValidationError>): RecordValidationResponse {
            return RecordValidationResponse(
                valid = false,
                errors = errors,
                warnings = emptyList(),
                processedData = null
            )
        }
        
        /**
         * Creates a validation response with warnings.
         */
        fun withWarnings(
            warnings: List<RecordValidationWarning>,
            processedData: JsonObject? = null
        ): RecordValidationResponse {
            return RecordValidationResponse(
                valid = true,
                errors = emptyList(),
                warnings = warnings,
                processedData = processedData
            )
        }
    }
}

/**
 * Validation warning for record data.
 */
@Serializable
data class RecordValidationWarning(
    val field: String,
    
    val message: String,
    
    val suggestedValue: JsonElement? = null
)

/**
 * Request DTO for searching records.
 */
@Serializable
data class RecordSearchRequest(
    val query: String? = null,
    
    val filters: List<RecordSearchFilter> = emptyList(),
    
    val fields: List<String>? = null,
    
    val sort: List<RecordSortRequest>? = null,
    
    @field:Positive
    @field:Max(1000)
    val limit: Int = 100,
    
    val includeArchived: Boolean = false
) {
    /**
     * Checks if a text search query is provided.
     */
    fun hasTextQuery(): Boolean {
        return !query.isNullOrBlank()
    }
    
    /**
     * Checks if filters are provided.
     */
    fun hasFilters(): Boolean {
        return filters.isNotEmpty()
    }
    
    /**
     * Checks if specific fields are requested.
     */
    fun hasFieldSelection(): Boolean {
        return !fields.isNullOrEmpty()
    }
    
    /**
     * Gets filters for a specific field.
     */
    fun getFiltersForField(fieldName: String): List<RecordSearchFilter> {
        return filters.filter { it.field == fieldName }
    }
}

/**
 * Filter configuration for record search.
 */
@Serializable
data class RecordSearchFilter(
    val field: String,
    
    val operator: FilterOperator,
    
    val value: JsonElement? = null,
    
    val values: JsonArray? = null
) {
    init {
        when (operator) {
            FilterOperator.IN, FilterOperator.NOT_IN -> {
                require(!values.isNullOrEmpty()) {
                    "Operator $operator requires 'values' to be non-empty"
                }
            }
            FilterOperator.IS_NULL, FilterOperator.IS_NOT_NULL -> {
                // No value required
            }
            else -> {
                require(value != null) {
                    "Operator $operator requires 'value' to be non-null"
                }
            }
        }
    }
    
    /**
     * Checks if this is a range filter.
     */
    fun isRangeFilter(): Boolean {
        return operator in listOf(
            FilterOperator.GREATER_THAN,
            FilterOperator.GREATER_THAN_OR_EQUAL,
            FilterOperator.LESS_THAN,
            FilterOperator.LESS_THAN_OR_EQUAL,
            FilterOperator.BETWEEN
        )
    }
    
    /**
     * Checks if this is a text filter.
     */
    fun isTextFilter(): Boolean {
        return operator in listOf(
            FilterOperator.EQUALS,
            FilterOperator.NOT_EQUALS,
            FilterOperator.CONTAINS,
            FilterOperator.STARTS_WITH,
            FilterOperator.ENDS_WITH
        )
    }
}

/**
 * Filter operators for record search.
 */
enum class FilterOperator {
    @SerialName("eq")
    EQUALS,
    
    @SerialName("neq")
    NOT_EQUALS,
    
    @SerialName("gt")
    GREATER_THAN,
    
    @SerialName("gte")
    GREATER_THAN_OR_EQUAL,
    
    @SerialName("lt")
    LESS_THAN,
    
    @SerialName("lte")
    LESS_THAN_OR_EQUAL,
    
    @SerialName("between")
    BETWEEN,
    
    @SerialName("in")
    IN,
    
    @SerialName("not_in")
    NOT_IN,
    
    @SerialName("contains")
    CONTAINS,
    
    @SerialName("starts_with")
    STARTS_WITH,
    
    @SerialName("ends_with")
    ENDS_WITH,
    
    @SerialName("is_null")
    IS_NULL,
    
    @SerialName("is_not_null")
    IS_NOT_NULL
}