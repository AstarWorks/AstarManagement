package com.astarworks.astarmanagement.core.table.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.core.table.infrastructure.persistence.entity.SpringDataJdbcRecordTable
import org.springframework.stereotype.Component

/**
 * Mapper between Record domain model and Spring Data JDBC entity
 */
@Component
class RecordMapper {
    
    fun toDomain(entity: SpringDataJdbcRecordTable): Record {
        return Record.fromJson(
            id = entity.id,
            tableId = entity.tableId,
            dataJson = entity.data,
            position = entity.position,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
    
    fun toEntity(domain: Record): SpringDataJdbcRecordTable {
        return SpringDataJdbcRecordTable(
            id = domain.id,
            tableId = domain.tableId,
            data = domain.getDataJson(),
            position = domain.position,
            createdAt = domain.createdAt,
            updatedAt = domain.updatedAt
        )
    }
    
    fun toDomainList(entities: List<SpringDataJdbcRecordTable>): List<Record> {
        return entities.map { toDomain(it) }
    }
}