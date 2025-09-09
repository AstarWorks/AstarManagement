package com.astarworks.astarmanagement.core.table.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.core.table.infrastructure.persistence.entity.SpringDataJdbcRecordTable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import org.springframework.stereotype.Component

/**
 * Mapper between Record domain model and Spring Data JDBC entity
 */
@Component
class RecordMapper {
    
    fun toDomain(entity: SpringDataJdbcRecordTable): Record {
        val dataJson = Json.parseToJsonElement(entity.data).jsonObject
        return Record(
            id = entity.id,
            tableId = entity.tableId,
            data = dataJson,
            position = entity.position,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
    
    fun toEntity(domain: Record): SpringDataJdbcRecordTable {
        return SpringDataJdbcRecordTable(
            id = domain.id,
            tableId = domain.tableId,
            data = domain.data.toString(),
            position = domain.position,
            createdAt = domain.createdAt,
            updatedAt = domain.updatedAt
        )
    }
    
    fun toDomainList(entities: List<SpringDataJdbcRecordTable>): List<Record> {
        return entities.map { toDomain(it) }
    }
}