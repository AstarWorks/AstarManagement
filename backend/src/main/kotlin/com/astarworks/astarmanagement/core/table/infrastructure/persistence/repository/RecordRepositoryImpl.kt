package com.astarworks.astarmanagement.core.table.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.core.table.domain.repository.RecordRepository
import com.astarworks.astarmanagement.core.table.infrastructure.persistence.mapper.RecordMapper
import com.astarworks.astarmanagement.shared.domain.value.RecordId
import com.astarworks.astarmanagement.shared.domain.value.TableId
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.sql.Types
import java.time.Instant
/**
 * Implementation of RecordRepository using Spring Data JDBC.
 * Manages record (data row) persistence operations with batch support.
 */
@Component
class RecordRepositoryImpl(
    private val jdbcRepository: SpringDataJdbcRecordRepository,
    private val jdbcTemplate: JdbcTemplate,
    private val mapper: RecordMapper
) : RecordRepository {
    
    @Transactional
    override fun save(record: Record): Record {
        val existingRecord = if (record.id != null) {
            jdbcRepository.findById(record.id).orElse(null)
        } else null
        
        return if (existingRecord != null) {
            // Update existing record
            val sql = """
                UPDATE records 
                SET data = ?::jsonb, position = ?, updated_at = ?, version = version + 1
                WHERE id = ?::uuid AND version = ?
            """.trimIndent()
            
            val now = Instant.now()
            val rowsAffected = jdbcTemplate.update(
                sql,
                record.getDataJson(),
                record.position,
                java.sql.Timestamp.from(now),
                record.id.value,
                existingRecord.version ?: 0
            )
            
            if (rowsAffected == 0) {
                throw RuntimeException("Optimistic locking failure: Record was modified by another transaction")
            }
            
            record.copy(updatedAt = now)
        } else {
            // Insert new record
            val sql = """
                INSERT INTO records (id, table_id, data, position, created_at, updated_at, version)
                VALUES (?::uuid, ?::uuid, ?::jsonb, ?, ?, ?, 0)
            """.trimIndent()
            
            val now = Instant.now()
            jdbcTemplate.update(
                sql,
                record.id.value,
                record.tableId.value,
                record.getDataJson(),
                record.position,
                java.sql.Timestamp.from(now),
                java.sql.Timestamp.from(now)
            )
            
            record.copy(createdAt = now, updatedAt = now)
        }
    }
    
    @Transactional
    override fun saveAll(records: List<Record>): List<Record> {
        if (records.isEmpty()) {
            return emptyList()
        }
        // For batch operations, use individual save calls to ensure JSONB casting
        return records.map { save(it) }
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: RecordId): Record? {
        return jdbcRepository.findById(id)
            .map { mapper.toDomain(it) }
            .orElse(null)
    }
    
    @Transactional(readOnly = true)
    override fun findByTableId(tableId: TableId): List<Record> {
        val entities = jdbcRepository.findByTableId(tableId)
        return mapper.toDomainList(entities)
    }
    
    @Transactional(readOnly = true)
    override fun findByTableIdOrderByPosition(tableId: TableId): List<Record> {
        val entities = jdbcRepository.findByTableId(tableId) // Already ordered by position
        return mapper.toDomainList(entities)
    }
    
    @Transactional(readOnly = true)
    override fun findByTableIdOrderByPosition(tableId: TableId, pageable: Pageable): Page<Record> {
        val offset = pageable.offset.toInt()
        val limit = pageable.pageSize
        val entities = jdbcRepository.findByTableIdWithPagination(tableId, limit, offset)
        val total = jdbcRepository.countByTableId(tableId)
        val domainRecords = mapper.toDomainList(entities)
        return PageImpl(domainRecords, pageable, total)
    }
    
    @Transactional(readOnly = true)
    override fun findByTableIdWithPagination(
        tableId: TableId,
        offset: Int,
        limit: Int
    ): List<Record> {
        val entities = jdbcRepository.findByTableIdWithPagination(tableId, limit, offset)
        return mapper.toDomainList(entities)
    }
    
    @Transactional(readOnly = true)
    override fun findByTableIdAndPositionBetween(
        tableId: TableId,
        startPosition: Float,
        endPosition: Float
    ): List<Record> {
        // Need to filter manually since Spring Data JDBC doesn't support complex queries easily
        val allEntities = jdbcRepository.findByTableId(tableId)
        val filteredEntities = allEntities.filter { 
            it.position in startPosition..endPosition 
        }
        return mapper.toDomainList(filteredEntities)
    }
    
    @Transactional(readOnly = true)
    override fun existsById(id: RecordId): Boolean {
        return jdbcRepository.existsById(id)
    }
    
    @Transactional
    override fun deleteById(id: RecordId) {
        jdbcRepository.deleteById(id)
    }
    
    @Transactional
    override fun deleteAllById(ids: List<RecordId>) {
        if (ids.isNotEmpty()) {
            jdbcRepository.deleteAllById(ids)
        }
    }
    
    @Transactional
    override fun deleteByTableId(tableId: TableId) {
        jdbcRepository.deleteByTableId(tableId)
    }
    
    @Transactional(readOnly = true)
    override fun count(): Long {
        return jdbcRepository.count()
    }
    
    @Transactional(readOnly = true)
    override fun countByTableId(tableId: TableId): Long {
        return jdbcRepository.countByTableId(tableId)
    }
    
    @Transactional(readOnly = true)
    override fun findMaxPositionByTableId(tableId: TableId): Float? {
        return jdbcRepository.findMaxPositionByTableId(tableId)
    }
}