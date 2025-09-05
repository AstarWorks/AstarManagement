package com.astarworks.astarmanagement.core.table.api.dto.record

import kotlinx.serialization.Serializable
import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonElement
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.util.UUID

/**
 * Request DTO for creating multiple records in batch.
 */
@Serializable
data class RecordBatchCreateRequest(
    @field:NotNull
    @Contextual
    val tableId: UUID,
    
    @field:NotNull
    @field:Size(min = 1, max = 1000, message = "Batch size must be between 1 and 1000")
    val records: List<JsonObject>
) {
    /**
     * Validates that all records have data.
     */
    fun validateRecords(): List<String> {
        val errors = mutableListOf<String>()
        records.forEachIndexed { index, record ->
            if (record.isEmpty()) {
                errors.add("Record at index $index has no data")
            }
        }
        return errors
    }
    
    /**
     * Gets the batch size.
     */
    fun getBatchSize(): Int = records.size
    
    /**
     * Checks if the batch is within the allowed size.
     */
    fun isWithinSizeLimit(): Boolean {
        return records.size in 1..1000
    }
}

/**
 * Request DTO for updating multiple records in batch.
 */
@Serializable
data class RecordBatchUpdateRequest(
    @field:NotNull
    @field:Size(min = 1, max = 1000, message = "Batch size must be between 1 and 1000")
    val updates: Map<@Contextual UUID, JsonObject>,
    
    val merge: Boolean = true
) {
    /**
     * Validates that all updates have data.
     */
    fun validateUpdates(): List<String> {
        val errors = mutableListOf<String>()
        updates.forEach { (recordId, data) ->
            if (data.isEmpty()) {
                errors.add("Update for record $recordId has no data")
            }
        }
        return errors
    }
    
    /**
     * Gets the list of record IDs to be updated.
     */
    fun getRecordIds(): Set<UUID> = updates.keys
    
    /**
     * Gets the update data for a specific record.
     */
    fun getUpdateData(recordId: UUID): JsonObject? = updates[recordId]
    
    /**
     * Gets the batch size.
     */
    fun getBatchSize(): Int = updates.size
}

/**
 * Request DTO for deleting multiple records in batch.
 */
@Serializable
data class RecordBatchDeleteRequest(
    @field:NotNull
    @field:Size(min = 1, max = 1000, message = "Batch size must be between 1 and 1000")
    val recordIds: List<@Contextual UUID>
) {
    /**
     * Validates that there are no duplicate IDs.
     */
    fun hasUniqueIds(): Boolean {
        return recordIds.size == recordIds.toSet().size
    }
    
    /**
     * Gets the batch size.
     */
    fun getBatchSize(): Int = recordIds.size
}

/**
 * Response DTO for batch record operations.
 */
@Serializable
data class RecordBatchResponse(
    val succeeded: List<RecordResponse>,
    
    val failed: List<RecordBatchError>,
    
    val totalProcessed: Int,
    
    val successCount: Int,
    
    val failureCount: Int
) {
    companion object {
        /**
         * Creates a successful batch response.
         */
        fun success(records: List<RecordResponse>): RecordBatchResponse {
            return RecordBatchResponse(
                succeeded = records,
                failed = emptyList(),
                totalProcessed = records.size,
                successCount = records.size,
                failureCount = 0
            )
        }
        
        /**
         * Creates a failed batch response.
         */
        fun failure(errors: List<RecordBatchError>): RecordBatchResponse {
            return RecordBatchResponse(
                succeeded = emptyList(),
                failed = errors,
                totalProcessed = errors.size,
                successCount = 0,
                failureCount = errors.size
            )
        }
        
        /**
         * Creates a partial success batch response.
         */
        fun partial(
            succeeded: List<RecordResponse>,
            failed: List<RecordBatchError>
        ): RecordBatchResponse {
            return RecordBatchResponse(
                succeeded = succeeded,
                failed = failed,
                totalProcessed = succeeded.size + failed.size,
                successCount = succeeded.size,
                failureCount = failed.size
            )
        }
    }
    
    /**
     * Checks if all operations succeeded.
     */
    fun isCompleteSuccess(): Boolean = failureCount == 0
    
    /**
     * Checks if all operations failed.
     */
    fun isCompleteFailure(): Boolean = successCount == 0
    
    /**
     * Checks if there was a partial success.
     */
    fun isPartialSuccess(): Boolean = successCount > 0 && failureCount > 0
    
    /**
     * Gets the success rate as a percentage.
     */
    fun getSuccessRate(): Double {
        return if (totalProcessed > 0) {
            (successCount.toDouble() / totalProcessed) * 100
        } else {
            0.0
        }
    }
}

/**
 * Error details for batch operations.
 */
@Serializable
data class RecordBatchError(
    @Contextual
    val recordId: UUID? = null,
    
    val index: Int? = null,
    
    val data: JsonObject? = null,
    
    val error: String,
    
    val validationErrors: List<RecordValidationError>? = null
) {
    companion object {
        /**
         * Creates an error for a specific record.
         */
        fun forRecord(recordId: UUID, error: String): RecordBatchError {
            return RecordBatchError(
                recordId = recordId,
                error = error
            )
        }
        
        /**
         * Creates an error for a record at a specific index.
         */
        fun forIndex(index: Int, error: String, data: JsonObject? = null): RecordBatchError {
            return RecordBatchError(
                index = index,
                data = data,
                error = error
            )
        }
        
        /**
         * Creates a validation error.
         */
        fun validation(
            index: Int? = null,
            recordId: UUID? = null,
            validationErrors: List<RecordValidationError>
        ): RecordBatchError {
            return RecordBatchError(
                recordId = recordId,
                index = index,
                error = "Validation failed",
                validationErrors = validationErrors
            )
        }
    }
}

/**
 * Request DTO for copying records.
 */
@Serializable
data class RecordCopyRequest(
    @field:NotNull
    @field:Size(min = 1, max = 100, message = "Can copy between 1 and 100 records at once")
    val recordIds: List<@Contextual UUID>,
    
    @Contextual
    val targetTableId: UUID? = null,
    
    val includeData: Boolean = true,
    
    val fieldMapping: Map<String, String>? = null
) {
    /**
     * Checks if copying to a different table.
     */
    fun isCrossTableCopy(): Boolean = targetTableId != null
    
    /**
     * Maps a field name using the field mapping.
     */
    fun mapFieldName(originalName: String): String {
        return fieldMapping?.get(originalName) ?: originalName
    }
}

/**
 * Response DTO for copy operations.
 */
@Serializable
data class RecordCopyResponse(
    val originalIds: List<@Contextual UUID>,
    
    val copiedRecords: List<RecordResponse>,
    
    val mapping: Map<@Contextual UUID, @Contextual UUID>
) {
    /**
     * Gets the copied record ID for an original record ID.
     */
    fun getCopiedId(originalId: UUID): UUID? = mapping[originalId]
    
    /**
     * Gets the number of records copied.
     */
    fun getCopyCount(): Int = copiedRecords.size
}

/**
 * Request DTO for bulk field updates.
 * Updates a specific field across multiple records.
 */
@Serializable
data class RecordBulkFieldUpdateRequest(
    @field:NotNull
    @field:Size(min = 1, max = 1000)
    val recordIds: List<@Contextual UUID>,
    
    @field:NotNull
    val field: String,
    
    val value: JsonElement?
) {
    /**
     * Checks if the update is clearing the field (setting to null).
     */
    fun isClearingField(): Boolean = value == null
}