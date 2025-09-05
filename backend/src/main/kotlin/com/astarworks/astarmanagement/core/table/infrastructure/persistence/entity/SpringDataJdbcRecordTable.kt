package com.astarworks.astarmanagement.core.table.infrastructure.persistence.entity

import com.astarworks.astarmanagement.shared.domain.value.RecordId
import com.astarworks.astarmanagement.shared.domain.value.TableId
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * Spring Data JDBC entity for records table.
 * Stores actual data rows for dynamic tables.
 */
@Table("records")
data class SpringDataJdbcRecordTable(
    @Id
    @Column("id")
    val id: RecordId,
    
    @Version
    val version: Long? = null,  // Spring Data JDBC: null = new entity
    
    @Column("table_id")
    val tableId: TableId,
    
    @Column("data")
    val data: String = "{}",  // Store as String with custom converter to JSONB
    
    @Column("position")
    val position: Float = 65536f,
    
    @Column("created_at")
    val createdAt: Instant = Instant.now(),
    
    @Column("updated_at")
    val updatedAt: Instant = Instant.now()
)