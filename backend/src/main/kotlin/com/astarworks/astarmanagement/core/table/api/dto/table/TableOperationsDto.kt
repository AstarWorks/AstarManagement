package com.astarworks.astarmanagement.core.table.api.dto.table

import kotlinx.serialization.Serializable
import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.json.JsonObject
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

/**
 * Response DTO for table export operations.
 */
@Serializable
data class TableExportResponse(
    @Contextual
    val tableId: UUID,
    
    val tableName: String,
    
    val format: String,
    
    val schema: TableSchemaResponse? = null,
    
    val records: List<JsonObject>? = null,
    
    val data: String? = null,
    
    val recordCount: Long,
    
    @Contextual
    val exportedAt: Instant
)

/**
 * Request DTO for importing data into a table.
 */
@Serializable
data class TableImportRequest(
    @field:NotNull
    val format: String,
    
    val records: List<JsonObject>? = null,
    
    val csvData: String? = null,
    
    val skipHeader: Boolean? = true,
    
    val fieldMapping: JsonObject? = null,
    
    val updateExisting: Boolean = false,
    
    val upsertKey: String? = null
) {
    init {
        require(format in listOf("json", "csv")) {
            "Format must be 'json' or 'csv'"
        }
        
        when (format) {
            "json" -> require(records != null) { "Records are required for JSON import" }
            "csv" -> require(csvData != null) { "CSV data is required for CSV import" }
        }
    }
    
    /**
     * Checks if this is an update/upsert operation.
     */
    fun isUpsert(): Boolean {
        return updateExisting && upsertKey != null
    }
}

/**
 * Response DTO for import operations.
 */
@Serializable
data class TableImportResponse(
    @Contextual
    val tableId: UUID,
    
    val tableName: String,
    
    val importedCount: Long,
    
    val updatedCount: Long = 0,
    
    val failedCount: Long,
    
    val errors: List<ImportError>,
    
    @Contextual
    val importedAt: Instant
) {
    companion object {
        /**
         * Creates a successful import response.
         */
        fun success(
            tableId: UUID,
            tableName: String,
            importedCount: Long
        ): TableImportResponse {
            return TableImportResponse(
                tableId = tableId,
                tableName = tableName,
                importedCount = importedCount,
                failedCount = 0,
                errors = emptyList(),
                importedAt = Instant.now()
            )
        }
        
        /**
         * Creates a partial success import response.
         */
        fun partialSuccess(
            tableId: UUID,
            tableName: String,
            importedCount: Long,
            errors: List<ImportError>
        ): TableImportResponse {
            return TableImportResponse(
                tableId = tableId,
                tableName = tableName,
                importedCount = importedCount,
                failedCount = errors.size.toLong(),
                errors = errors,
                importedAt = Instant.now()
            )
        }
    }
}

/**
 * Import error details.
 */
@Serializable
data class ImportError(
    val row: Int? = null,
    
    val field: String? = null,
    
    @Contextual
    val value: Any? = null,
    
    val message: String,
    
    val recordData: JsonObject? = null
)

/**
 * Response DTO for table statistics.
 */
@Serializable
data class TableStatisticsResponse(
    @Contextual
    val tableId: UUID,
    
    val tableName: String,
    
    val recordCount: Long,
    
    val propertyCount: Int,
    
    val fieldStatistics: List<FieldStatistics>,
    
    val storageSize: Long,
    
    @Contextual
    val createdAt: Instant,
    
    @Contextual
    val updatedAt: Instant,
    
    @Contextual
    val lastRecordCreatedAt: Instant? = null,
    
    @Contextual
    val lastRecordUpdatedAt: Instant? = null
)

/**
 * Field-level statistics.
 */
@Serializable
data class FieldStatistics(
    val fieldKey: String,
    
    val fieldType: String,
    
    val totalCount: Long,
    
    val nonNullCount: Long,
    
    val nullCount: Long,
    
    val fillRate: Double,
    
    val uniqueCount: Long,
    
    @Contextual
    val minValue: Any? = null,
    
    @Contextual
    val maxValue: Any? = null,
    
    val avgValue: Double? = null,
    
    val mostFrequent: List<FrequencyItem>? = null
)

/**
 * Frequency item for field statistics.
 */
@Serializable
data class FrequencyItem(
    @Contextual
    val value: Any?,
    
    val count: Long,
    
    val percentage: Double
)