package com.astarworks.astarmanagement.unit.core.table.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.api.dto.common.PageMetadata
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
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.Instant
import java.util.*

/**
 * Unit tests for RecordDtoMapper list and pagination operations.
 * Tests list transformations, page responses, and copy operations.
 */
@UnitTest
@DisplayName("RecordDtoMapper List Tests")
class RecordDtoMapperListTest {
    
    private lateinit var mapper: RecordDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = RecordDtoMapper()
    }
    
    @Nested
    @DisplayName("Response List Conversion")
    inner class ResponseListConversion {
        
        @Test
        @DisplayName("Should convert list of records to response list")
        fun `should convert list of records to response list`() {
            // Given
            val records = listOf(
                createTestRecord(data = buildJsonObject { put("name", "Record 1") }),
                createTestRecord(data = buildJsonObject { put("name", "Record 2") }),
                createTestRecord(data = buildJsonObject { put("name", "Record 3") })
            )
            
            // When
            val responses = mapper.toResponseList(records)
            
            // Then
            assertThat(responses).hasSize(3)
            assertThat(responses[0].data["name"]?.toString()).contains("Record 1")
            assertThat(responses[1].data["name"]?.toString()).contains("Record 2")
            assertThat(responses[2].data["name"]?.toString()).contains("Record 3")
        }
        
        @Test
        @DisplayName("Should handle empty record list")
        fun `should handle empty record list`() {
            // Given
            val emptyList = emptyList<Record>()
            
            // When
            val responses = mapper.toResponseList(emptyList)
            
            // Then
            assertThat(responses).isEmpty()
        }
        
        @Test
        @DisplayName("Should preserve record order in list")
        fun `should preserve record order in list`() {
            // Given
            val record1 = createTestRecord(position = 100f)
            val record2 = createTestRecord(position = 200f)
            val record3 = createTestRecord(position = 50f)
            val orderedList = listOf(record3, record1, record2) // Custom order
            
            // When
            val responses = mapper.toResponseList(orderedList)
            
            // Then
            assertThat(responses[0].position).isEqualTo(50f)
            assertThat(responses[1].position).isEqualTo(100f)
            assertThat(responses[2].position).isEqualTo(200f)
        }
    }
    
    @Nested
    @DisplayName("List Response Creation")
    inner class ListResponseCreation {
        
        @Test
        @DisplayName("Should create list response with table ID")
        fun `should create list response with table id`() {
            // Given
            val tableId = UUID.randomUUID()
            val records = listOf(
                createTestRecord(tableId = tableId),
                createTestRecord(tableId = tableId)
            )
            
            // When
            val listResponse = mapper.toListResponse(records, tableId)
            
            // Then
            assertThat(listResponse.records).hasSize(2)
            assertThat(listResponse.totalCount).isEqualTo(2L)
            assertThat(listResponse.tableId).isEqualTo(tableId)
        }
        
        @Test
        @DisplayName("Should create list response without table ID")
        fun `should create list response without table id`() {
            // Given
            val records = listOf(createTestRecord())
            
            // When
            val listResponse = mapper.toListResponse(records)
            
            // Then
            assertThat(listResponse.tableId).isNull()
            assertThat(listResponse.totalCount).isEqualTo(1L)
        }
    }
    
    @Nested
    @DisplayName("Page Response Creation")
    inner class PageResponseCreation {
        
        @Test
        @DisplayName("Should convert page of records to page response")
        fun `should convert page of records to page response`() {
            // Given
            val records = (0..4).map { index ->
                createTestRecord(data = buildJsonObject { put("index", index) })
            }
            val pageable = PageRequest.of(0, 5)
            val page = PageImpl(records, pageable, 15) // Total 15 elements
            
            // When
            val pageResponse = mapper.toPageResponse(page)
            
            // Then
            assertThat(pageResponse.content).hasSize(5)
            assertThat(pageResponse.metadata.page).isEqualTo(0)
            assertThat(pageResponse.metadata.size).isEqualTo(5)
            assertThat(pageResponse.metadata.totalElements).isEqualTo(15)
            assertThat(pageResponse.metadata.totalPages).isEqualTo(3)
            assertThat(pageResponse.metadata.first).isTrue
            assertThat(pageResponse.metadata.last).isFalse
            assertThat(pageResponse.metadata.numberOfElements).isEqualTo(5)
        }
        
        @Test
        @DisplayName("Should handle last page")
        fun `should handle last page`() {
            // Given
            val records = listOf(
                createTestRecord(),
                createTestRecord()
            )
            val pageable = PageRequest.of(2, 5) // Third page
            val page = PageImpl(records, pageable, 12) // Only 2 elements on last page
            
            // When
            val pageResponse = mapper.toPageResponse(page)
            
            // Then
            assertThat(pageResponse.content).hasSize(2)
            assertThat(pageResponse.metadata.page).isEqualTo(2)
            assertThat(pageResponse.metadata.last).isTrue
            assertThat(pageResponse.metadata.numberOfElements).isEqualTo(2)
        }
        
        @Test
        @DisplayName("Should handle empty page")
        fun `should handle empty page`() {
            // Given
            val emptyRecords = emptyList<Record>()
            val pageable = PageRequest.of(0, 10)
            val page = PageImpl(emptyRecords, pageable, 0)
            
            // When
            val pageResponse = mapper.toPageResponse(page)
            
            // Then
            assertThat(pageResponse.content).isEmpty()
            assertThat(pageResponse.metadata.totalElements).isEqualTo(0)
            assertThat(pageResponse.metadata.totalPages).isEqualTo(0)
            assertThat(pageResponse.metadata.first).isTrue
            assertThat(pageResponse.metadata.last).isTrue
        }
    }
    
    @Nested
    @DisplayName("Summary Response List")
    inner class SummaryResponseList {
        
        @Test
        @DisplayName("Should convert records to summary list")
        fun `should convert records to summary list`() {
            // Given
            val records = listOf(
                createTestRecord(
                    data = buildJsonObject {
                        put("title", "First Record")
                        put("description", "Long description")
                    }
                ),
                createTestRecord(
                    data = buildJsonObject {
                        put("name", "Second Record")
                        put("value", 100)
                    }
                ),
                createTestRecord(data = buildJsonObject {}) // Empty data
            )
            
            // When
            val summaries = mapper.toSummaryResponseList(records)
            
            // Then
            assertThat(summaries).hasSize(3)
            assertThat(summaries[0].primaryField?.toString()).contains("First Record")
            assertThat(summaries[1].primaryField?.toString()).contains("Second Record")
            assertThat(summaries[2].primaryField).isNull()
        }
    }
    
    @Nested
    @DisplayName("Copy Response Creation")
    inner class CopyResponseCreation {
        
        @Test
        @DisplayName("Should create copy response with mapping")
        fun `should create copy response with mapping`() {
            // Given
            val originalId1 = UUID.randomUUID()
            val originalId2 = UUID.randomUUID()
            val originalIds = listOf(originalId1, originalId2)
            
            val copiedRecord1 = createTestRecord(
                data = buildJsonObject { put("name", "Copied 1") }
            )
            val copiedRecord2 = createTestRecord(
                data = buildJsonObject { put("name", "Copied 2") }
            )
            val copiedRecords = listOf(copiedRecord1, copiedRecord2)
            
            // When
            val copyResponse = mapper.toCopyResponse(originalIds, copiedRecords)
            
            // Then
            assertThat(copyResponse.originalIds).containsExactly(originalId1, originalId2)
            assertThat(copyResponse.copiedRecords).hasSize(2)
            assertThat(copyResponse.mapping).hasSize(2)
            assertThat(copyResponse.mapping[originalId1]).isEqualTo(copiedRecord1.id.value)
            assertThat(copyResponse.mapping[originalId2]).isEqualTo(copiedRecord2.id.value)
        }
        
        @Test
        @DisplayName("Should handle empty copy operation")
        fun `should handle empty copy operation`() {
            // Given
            val emptyOriginalIds = emptyList<UUID>()
            val emptyCopiedRecords = emptyList<Record>()
            
            // When
            val copyResponse = mapper.toCopyResponse(emptyOriginalIds, emptyCopiedRecords)
            
            // Then
            assertThat(copyResponse.originalIds).isEmpty()
            assertThat(copyResponse.copiedRecords).isEmpty()
            assertThat(copyResponse.mapping).isEmpty()
        }
    }
    
    @Nested
    @DisplayName("Large List Processing")
    inner class LargeListProcessing {
        
        @Test
        @DisplayName("Should handle large record lists")
        fun `should handle large record lists`() {
            // Given
            val largeList = (1..10000).map { index ->
                createTestRecord(
                    data = buildJsonObject {
                        put("index", index)
                        put("value", "Record $index")
                    }
                )
            }
            
            // When
            val responses = mapper.toResponseList(largeList)
            
            // Then
            assertThat(responses).hasSize(10000)
            assertThat(responses[0].data["index"]?.toString()).contains("1")
            assertThat(responses[9999].data["index"]?.toString()).contains("10000")
        }
    }
    
    // Helper methods
    
    private fun createTestRecord(
        id: UUID = UUID.randomUUID(),
        tableId: UUID = UUID.randomUUID(),
        data: kotlinx.serialization.json.JsonObject = buildJsonObject { put("test", "value") },
        position: Float = 65536f,
        createdAt: Instant = Instant.now().minusSeconds(3600),
        updatedAt: Instant = Instant.now()
    ): Record {
        return Record(
            id = RecordId(id),
            tableId = TableId(tableId),
            data = data,
            position = position,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}