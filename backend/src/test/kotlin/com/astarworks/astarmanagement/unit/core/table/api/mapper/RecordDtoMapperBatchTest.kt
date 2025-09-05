package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchError
import com.astarworks.astarmanagement.core.table.api.dto.record.RecordValidationError
import com.astarworks.astarmanagement.core.table.api.mapper.RecordDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.shared.domain.value.RecordId
import com.astarworks.astarmanagement.shared.domain.value.TableId
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.util.*

/**
 * Unit tests for RecordDtoMapper batch operation functionality.
 * Tests batch success, failure, and partial success scenarios.
 */
@UnitTest
@DisplayName("RecordDtoMapper Batch Tests")
class RecordDtoMapperBatchTest {
    
    private lateinit var mapper: RecordDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = RecordDtoMapper()
    }
    
    @Nested
    @DisplayName("Batch Success Response")
    inner class BatchSuccessResponse {
        
        @Test
        @DisplayName("Should create successful batch response")
        fun `should create successful batch response`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { put("name", "Record 1") }),
                createTestRecord(data = buildJsonObject { put("name", "Record 2") }),
                createTestRecord(data = buildJsonObject { put("name", "Record 3") })
            )
            
            // When
            val response = mapper.toBatchSuccessResponse(records)
            
            // Then
            assertThat(response.succeeded).hasSize(3)
            assertThat(response.failed).isEmpty()
            assertThat(response.totalProcessed).isEqualTo(3)
            assertThat(response.successCount).isEqualTo(3)
            assertThat(response.failureCount).isEqualTo(0)
            assertThat(response.isCompleteSuccess()).isTrue
            assertThat(response.isCompleteFailure()).isFalse
            assertThat(response.isPartialSuccess()).isFalse
            assertThat(response.getSuccessRate()).isEqualTo(100.0)
        }
        
        @Test
        @DisplayName("Should handle empty success list")
        fun `should handle empty success list`() {
            // Given
            val emptyRecords = emptyList<Record>()
            
            // When
            val response = mapper.toBatchSuccessResponse(emptyRecords)
            
            // Then
            assertThat(response.succeeded).isEmpty()
            assertThat(response.failed).isEmpty()
            assertThat(response.totalProcessed).isEqualTo(0)
            assertThat(response.successCount).isEqualTo(0)
            assertThat(response.getSuccessRate()).isEqualTo(0.0)
        }
        
        @Test
        @DisplayName("Should preserve record details in success response")
        fun `should preserve record details in success response`() {
            // Given
            val record1 = createTestRecord(
                id = UUID.randomUUID(),
                data = buildJsonObject { 
                    put("field1", "value1")
                    put("field2", 123)
                }
            )
            val record2 = createTestRecord(
                id = UUID.randomUUID(),
                data = buildJsonObject { 
                    put("field3", true)
                    put("field4", "value4")
                }
            )
            
            // When
            val response = mapper.toBatchSuccessResponse(listOf(record1, record2))
            
            // Then
            assertThat(response.succeeded[0].id).isEqualTo(record1.id.value)
            assertThat(response.succeeded[0].data).isEqualTo(record1.data)
            assertThat(response.succeeded[1].id).isEqualTo(record2.id.value)
            assertThat(response.succeeded[1].data).isEqualTo(record2.data)
        }
    }
    
    @Nested
    @DisplayName("Batch Failure Response")
    inner class BatchFailureResponse {
        
        @Test
        @DisplayName("Should create failure batch response")
        fun `should create failure batch response`() {
            // Given
            val errors = listOf(
                RecordBatchError.forIndex(0, "Validation failed"),
                RecordBatchError.forIndex(1, "Duplicate key"),
                RecordBatchError.forIndex(2, "Invalid data")
            )
            
            // When
            val response = mapper.toBatchFailureResponse(errors)
            
            // Then
            assertThat(response.succeeded).isEmpty()
            assertThat(response.failed).hasSize(3)
            assertThat(response.totalProcessed).isEqualTo(3)
            assertThat(response.successCount).isEqualTo(0)
            assertThat(response.failureCount).isEqualTo(3)
            assertThat(response.isCompleteSuccess()).isFalse
            assertThat(response.isCompleteFailure()).isTrue
            assertThat(response.isPartialSuccess()).isFalse
            assertThat(response.getSuccessRate()).isEqualTo(0.0)
        }
        
        @Test
        @DisplayName("Should handle validation errors in batch failure")
        fun `should handle validation errors in batch failure`() {
            // Given
            val validationErrors = listOf(
                RecordValidationError(
                    field = "email",
                    message = "Invalid email format"
                ),
                RecordValidationError(
                    field = "age",
                    message = "Must be positive"
                )
            )
            
            val batchErrors = listOf(
                RecordBatchError.validation(
                    index = 0,
                    recordId = null,
                    validationErrors = validationErrors
                )
            )
            
            // When
            val response = mapper.toBatchFailureResponse(batchErrors)
            
            // Then
            assertThat(response.failed[0].error).isEqualTo("Validation failed")
            assertThat(response.failed[0].validationErrors).hasSize(2)
            assertThat(response.failed[0].validationErrors!![0].field).isEqualTo("email")
            assertThat(response.failed[0].validationErrors!![1].field).isEqualTo("age")
        }
    }
    
    @Nested
    @DisplayName("Batch Partial Success Response")
    inner class BatchPartialSuccessResponse {
        
        @Test
        @DisplayName("Should create partial success batch response")
        fun `should create partial success batch response`() {
            // Given
            val succeeded = listOf(
                createTestRecord(data = buildJsonObject { put("name", "Success 1") }),
                createTestRecord(data = buildJsonObject { put("name", "Success 2") })
            )
            
            val failed = listOf(
                RecordBatchError.forIndex(2, "Failed to process"),
                RecordBatchError.forIndex(3, "Invalid data")
            )
            
            // When
            val response = mapper.toBatchResponse(succeeded, failed)
            
            // Then
            assertThat(response.succeeded).hasSize(2)
            assertThat(response.failed).hasSize(2)
            assertThat(response.totalProcessed).isEqualTo(4)
            assertThat(response.successCount).isEqualTo(2)
            assertThat(response.failureCount).isEqualTo(2)
            assertThat(response.isCompleteSuccess()).isFalse
            assertThat(response.isCompleteFailure()).isFalse
            assertThat(response.isPartialSuccess()).isTrue
            assertThat(response.getSuccessRate()).isEqualTo(50.0)
        }
        
        @Test
        @DisplayName("Should calculate success rate correctly")
        fun `should calculate success rate correctly`() {
            // Given
            val testCases = listOf(
                Triple(1, 3, 25.0),  // 1 success, 3 failures = 25%
                Triple(3, 1, 75.0),  // 3 success, 1 failure = 75%
                Triple(7, 3, 70.0),  // 7 success, 3 failures = 70%
                Triple(99, 1, 99.0)  // 99 success, 1 failure = 99%
            )
            
            testCases.forEach { (successCount, failureCount, expectedRate) ->
                val succeeded = (1..successCount).map { createTestRecord() }
                val failed = (1..failureCount).map { index ->
                    RecordBatchError.forIndex(index, "Error")
                }
                
                // When
                val response = mapper.toBatchResponse(succeeded, failed)
                
                // Then
                assertThat(response.getSuccessRate()).isEqualTo(expectedRate)
            }
        }
    }
    
    @Nested
    @DisplayName("Batch Error Creation")
    inner class BatchErrorCreation {
        
        @Test
        @DisplayName("Should create error from exception")
        fun `should create error from exception`() {
            // Given
            val recordId = UUID.randomUUID()
            val exception = IllegalArgumentException("Invalid field value")
            
            // When
            val error = mapper.toError(
                recordId = recordId,
                index = 5,
                exception = exception
            )
            
            // Then
            assertThat(error.recordId).isEqualTo(recordId)
            assertThat(error.index).isEqualTo(5)
            assertThat(error.message).isEqualTo("Invalid field value")
        }
        
        @Test
        @DisplayName("Should handle exception without message")
        fun `should handle exception without message`() {
            // Given
            val exception = RuntimeException()
            
            // When
            val error = mapper.toError(exception = exception)
            
            // Then
            assertThat(error.message).isEqualTo("Unknown error occurred")
            assertThat(error.recordId).isNull()
            assertThat(error.index).isNull()
        }
        
        @Test
        @DisplayName("Should create batch error with data")
        fun `should create batch error with data`() {
            // Given
            val recordData = mapOf(
                "field1" to "value1",
                "field2" to 42,
                "field3" to true,
                "field4" to null
            )
            val exception = Exception("Processing failed")
            
            // When
            val batchError = mapper.toBatchError(
                recordId = UUID.randomUUID(),
                index = 10,
                data = recordData,
                exception = exception
            )
            
            // Then
            assertThat(batchError.error).isEqualTo("Processing failed")
            assertThat(batchError.index).isEqualTo(10)
            assertThat(batchError.data).isNotNull
            assertThat(batchError.data!!["field1"]?.toString()).contains("value1")
            assertThat(batchError.data!!["field2"]?.toString()).contains("42")
            assertThat(batchError.data!!["field3"]?.toString()).contains("true")
        }
        
        @Test
        @DisplayName("Should convert validation errors map")
        fun `should convert validation errors map`() {
            // Given
            val errorMap = mapOf(
                "email" to "Must be a valid email",
                "age" to "Must be between 0 and 120",
                "name" to "Cannot be empty"
            )
            
            // When
            val validationErrors = mapper.toValidationErrors(errorMap)
            
            // Then
            assertThat(validationErrors).hasSize(3)
            assertThat(validationErrors[0].field).isEqualTo("email")
            assertThat(validationErrors[0].message).isEqualTo("Must be a valid email")
            assertThat(validationErrors[1].field).isEqualTo("age")
            assertThat(validationErrors[2].field).isEqualTo("name")
        }
    }
    
    @Nested
    @DisplayName("Large Batch Processing")
    inner class LargeBatchProcessing {
        
        @Test
        @DisplayName("Should handle large batch of successful records")
        fun `should handle large batch of successful records`() {
            // Given
            val largeRecordList = (1..1000).map { index ->
                createTestRecord(
                    data = buildJsonObject { 
                        put("index", index)
                        put("value", "Record $index")
                    }
                )
            }
            
            // When
            val response = mapper.toBatchSuccessResponse(largeRecordList)
            
            // Then
            assertThat(response.succeeded).hasSize(1000)
            assertThat(response.totalProcessed).isEqualTo(1000)
            assertThat(response.successCount).isEqualTo(1000)
            assertThat(response.getSuccessRate()).isEqualTo(100.0)
        }
        
        @Test
        @DisplayName("Should handle mixed large batch")
        fun `should handle mixed large batch`() {
            // Given
            val succeeded = (1..600).map { createTestRecord() }
            val failed = (1..400).map { index ->
                RecordBatchError.forIndex(index, "Error at index $index")
            }
            
            // When
            val response = mapper.toBatchResponse(succeeded, failed)
            
            // Then
            assertThat(response.totalProcessed).isEqualTo(1000)
            assertThat(response.successCount).isEqualTo(600)
            assertThat(response.failureCount).isEqualTo(400)
            assertThat(response.getSuccessRate()).isEqualTo(60.0)
        }
    }
    
    // Helper methods
    
    private fun createTestRecord(
        id: UUID = UUID.randomUUID(),
        tableId: UUID = UUID.randomUUID(),
        data: kotlinx.serialization.json.JsonObject = buildJsonObject { put("test", "value") },
        position: Float = 65536f
    ): Record {
        return Record(
            id = RecordId(id),
            tableId = TableId(tableId),
            data = data,
            position = position
        )
    }
}