package com.astarworks.astarmanagement.core.table.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.table.infrastructure.persistence.entity.SpringDataJdbcRecordTable
import com.astarworks.astarmanagement.shared.domain.value.RecordId
import com.astarworks.astarmanagement.shared.domain.value.TableId
import org.springframework.data.jdbc.repository.query.Modifying
import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * Spring Data JDBC repository for Record
 */
@Repository
interface SpringDataJdbcRecordRepository : CrudRepository<SpringDataJdbcRecordTable, RecordId> {
    
    @Query("SELECT * FROM records WHERE table_id = :tableId ORDER BY position ASC")
    fun findByTableId(@Param("tableId") tableId: TableId): List<SpringDataJdbcRecordTable>
    
    @Query("SELECT * FROM records WHERE table_id = :tableId ORDER BY position ASC LIMIT :limit OFFSET :offset")
    fun findByTableIdWithPagination(
        @Param("tableId") tableId: TableId,
        @Param("limit") limit: Int,
        @Param("offset") offset: Int
    ): List<SpringDataJdbcRecordTable>
    
    @Query("SELECT COUNT(*) FROM records WHERE table_id = :tableId")
    fun countByTableId(@Param("tableId") tableId: TableId): Long
    
    @Modifying
    @Query("DELETE FROM records WHERE table_id = :tableId")
    fun deleteByTableId(@Param("tableId") tableId: TableId): Int
    
    @Query("SELECT MAX(position) FROM records WHERE table_id = :tableId")
    fun findMaxPositionByTableId(@Param("tableId") tableId: TableId): Float?
    
    @Query("SELECT * FROM records WHERE table_id = :tableId ORDER BY position DESC LIMIT 1")
    fun findTopByTableIdOrderByPositionDesc(@Param("tableId") tableId: TableId): SpringDataJdbcRecordTable?
}