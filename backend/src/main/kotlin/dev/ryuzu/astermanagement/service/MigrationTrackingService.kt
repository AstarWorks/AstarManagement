package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.dto.migration.*
import dev.ryuzu.astermanagement.repository.MigrationRepository
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * Service for tracking React to Vue migration progress
 */
@Service
@Transactional
class MigrationTrackingService(
    private val jdbcTemplate: JdbcTemplate,
    private val migrationRepository: MigrationRepository
) {

    /**
     * Get all migration statuses
     */
    fun getAllStatuses(): List<MigrationStatusDto> {
        val sql = """
            SELECT id, component_path, react_loc, vue_loc, status,
                   migrated_at, migrated_by, verified_at, verified_by,
                   test_coverage, notes, created_at, updated_at
            FROM migration_status
            ORDER BY component_path
        """
        
        return jdbcTemplate.query(sql) { rs, _ ->
            MigrationStatusDto(
                id = rs.getLong("id"),
                componentPath = rs.getString("component_path"),
                reactLoc = rs.getInt("react_loc"),
                vueLoc = rs.getObject("vue_loc", Int::class.java),
                status = MigrationStatus.valueOf(rs.getString("status").uppercase()),
                migratedAt = rs.getTimestamp("migrated_at")?.toLocalDateTime(),
                migratedBy = rs.getString("migrated_by"),
                verifiedAt = rs.getTimestamp("verified_at")?.toLocalDateTime(),
                verifiedBy = rs.getString("verified_by"),
                testCoverage = rs.getObject("test_coverage", Double::class.java),
                notes = rs.getString("notes"),
                createdAt = rs.getTimestamp("created_at").toLocalDateTime(),
                updatedAt = rs.getTimestamp("updated_at").toLocalDateTime()
            )
        }
    }

    /**
     * Get status for a specific component
     */
    fun getStatus(id: Long): MigrationStatusDto {
        val sql = """
            SELECT * FROM migration_status WHERE id = ?
        """
        
        return jdbcTemplate.queryForObject(sql, { rs, _ ->
            MigrationStatusDto(
                id = rs.getLong("id"),
                componentPath = rs.getString("component_path"),
                reactLoc = rs.getInt("react_loc"),
                vueLoc = rs.getObject("vue_loc", Int::class.java),
                status = MigrationStatus.valueOf(rs.getString("status").uppercase()),
                migratedAt = rs.getTimestamp("migrated_at")?.toLocalDateTime(),
                migratedBy = rs.getString("migrated_by"),
                verifiedAt = rs.getTimestamp("verified_at")?.toLocalDateTime(),
                verifiedBy = rs.getString("verified_by"),
                testCoverage = rs.getObject("test_coverage", Double::class.java),
                notes = rs.getString("notes"),
                createdAt = rs.getTimestamp("created_at").toLocalDateTime(),
                updatedAt = rs.getTimestamp("updated_at").toLocalDateTime()
            )
        }, id) ?: throw NoSuchElementException("Migration status not found with id: $id")
    }

    /**
     * Update migration status
     */
    fun updateStatus(request: UpdateMigrationStatusRequest): MigrationStatusDto {
        val sql = """
            INSERT INTO migration_status (
                component_path, react_loc, vue_loc, status, 
                migrated_at, migrated_by, test_coverage, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (component_path) DO UPDATE SET
                react_loc = COALESCE(?, migration_status.react_loc),
                vue_loc = COALESCE(?, migration_status.vue_loc),
                status = COALESCE(?, migration_status.status),
                migrated_at = CASE 
                    WHEN ? = 'MIGRATED' AND migration_status.status != 'MIGRATED' 
                    THEN CURRENT_TIMESTAMP 
                    ELSE migration_status.migrated_at 
                END,
                migrated_by = COALESCE(?, migration_status.migrated_by),
                test_coverage = COALESCE(?, migration_status.test_coverage),
                notes = COALESCE(?, migration_status.notes),
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        """
        
        val statusStr = request.status?.name ?: "PENDING"
        val migratedAt = if (request.status == MigrationStatus.MIGRATED) LocalDateTime.now() else null
        
        val id = jdbcTemplate.queryForObject(
            sql,
            Long::class.java,
            request.componentPath,
            request.reactLoc ?: 0,
            request.vueLoc,
            statusStr.lowercase(),
            migratedAt,
            request.migratedBy,
            request.testCoverage,
            request.notes,
            request.reactLoc,
            request.vueLoc,
            statusStr.lowercase(),
            statusStr,
            request.migratedBy,
            request.testCoverage,
            request.notes
        )
        
        return getStatus(id!!)
    }

    /**
     * Patch specific fields of migration status
     */
    fun patchStatus(id: Long, updates: Map<String, Any>): MigrationStatusDto {
        val allowedFields = setOf("status", "vue_loc", "test_coverage", "notes", "verified_by")
        val updateClauses = mutableListOf<String>()
        val params = mutableListOf<Any?>()
        
        updates.forEach { (key, value) ->
            if (key in allowedFields) {
                when (key) {
                    "status" -> {
                        updateClauses.add("status = ?")
                        params.add(value.toString().lowercase())
                        
                        if (value.toString() == "VERIFIED") {
                            updateClauses.add("verified_at = CURRENT_TIMESTAMP")
                        }
                    }
                    else -> {
                        updateClauses.add("$key = ?")
                        params.add(value)
                    }
                }
            }
        }
        
        if (updateClauses.isNotEmpty()) {
            updateClauses.add("updated_at = CURRENT_TIMESTAMP")
            params.add(id)
            
            val sql = """
                UPDATE migration_status 
                SET ${updateClauses.joinToString(", ")}
                WHERE id = ?
            """
            
            jdbcTemplate.update(sql, *params.toTypedArray())
        }
        
        return getStatus(id)
    }

    /**
     * Get migration statistics
     */
    fun getStats(): MigrationStatsDto {
        val sql = """
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'migrated') as migrated,
                COUNT(*) FILTER (WHERE status = 'verified') as verified,
                COALESCE(SUM(react_loc), 0) as total_react_loc,
                COALESCE(SUM(vue_loc), 0) as total_vue_loc,
                COALESCE(AVG(test_coverage) FILTER (WHERE test_coverage IS NOT NULL), 0) as average_test_coverage
            FROM migration_status
        """
        
        return jdbcTemplate.queryForObject(sql) { rs, _ ->
            val total = rs.getInt("total")
            val verified = rs.getInt("verified")
            val completionPercentage = if (total > 0) (verified.toDouble() / total) * 100 else 0.0
            
            MigrationStatsDto(
                total = total,
                pending = rs.getInt("pending"),
                inProgress = rs.getInt("in_progress"),
                migrated = rs.getInt("migrated"),
                verified = verified,
                totalReactLoc = rs.getInt("total_react_loc"),
                totalVueLoc = rs.getInt("total_vue_loc"),
                averageTestCoverage = rs.getDouble("average_test_coverage"),
                completionPercentage = completionPercentage
            )
        }!!
    }

    /**
     * Get migration timeline
     */
    fun getTimeline(days: Int): List<MigrationMetricsDto> {
        val sql = """
            SELECT * FROM migration_metrics
            WHERE date >= CURRENT_DATE - INTERVAL '$days days'
            ORDER BY date DESC
        """
        
        return jdbcTemplate.query(sql) { rs, _ ->
            MigrationMetricsDto(
                date = rs.getTimestamp("date").toLocalDateTime(),
                totalComponents = rs.getInt("total_components"),
                pendingComponents = rs.getInt("pending_components"),
                inProgressComponents = rs.getInt("in_progress_components"),
                migratedComponents = rs.getInt("migrated_components"),
                verifiedComponents = rs.getInt("verified_components"),
                totalReactLoc = rs.getInt("total_react_loc"),
                totalVueLoc = rs.getInt("total_vue_loc"),
                averageTestCoverage = rs.getObject("average_test_coverage", Double::class.java)
            )
        }
    }

    /**
     * Report a migration issue
     */
    fun reportIssue(request: ReportIssueRequest): MigrationIssueDto {
        val sql = """
            INSERT INTO migration_issues (
                component_path, issue_type, severity, description, suggested_fix
            ) VALUES (?, ?, ?, ?, ?)
            RETURNING id, created_at
        """
        
        return jdbcTemplate.queryForObject(
            sql,
            { rs, _ ->
            MigrationIssueDto(
                id = rs.getLong("id"),
                componentPath = request.componentPath,
                issueType = request.issueType,
                severity = request.severity,
                description = request.description,
                suggestedFix = request.suggestedFix,
                resolved = false,
                resolvedAt = null,
                resolvedBy = null,
                createdAt = rs.getTimestamp("created_at").toLocalDateTime()
            )
        },
            request.componentPath,
            request.issueType,
            request.severity.name.lowercase(),
            request.description,
            request.suggestedFix
        )!!
    }

    /**
     * Get issues for a component
     */
    fun getComponentIssues(componentPath: String): List<MigrationIssueDto> {
        val sql = """
            SELECT * FROM migration_issues
            WHERE component_path = ?
            ORDER BY severity DESC, created_at DESC
        """
        
        return jdbcTemplate.query(sql, { rs, _ ->
            MigrationIssueDto(
                id = rs.getLong("id"),
                componentPath = rs.getString("component_path"),
                issueType = rs.getString("issue_type"),
                severity = IssueSeverity.valueOf(rs.getString("severity").uppercase()),
                description = rs.getString("description"),
                suggestedFix = rs.getString("suggested_fix"),
                resolved = rs.getBoolean("resolved"),
                resolvedAt = rs.getTimestamp("resolved_at")?.toLocalDateTime(),
                resolvedBy = rs.getString("resolved_by"),
                createdAt = rs.getTimestamp("created_at").toLocalDateTime()
            )
        }, componentPath)
    }

    /**
     * Calculate daily metrics
     */
    fun calculateDailyMetrics() {
        val sql = "SELECT calculate_migration_metrics()"
        jdbcTemplate.execute(sql)
    }

    /**
     * Search components
     */
    fun searchComponents(query: String?, status: String?): List<MigrationStatusDto> {
        val conditions = mutableListOf<String>()
        val params = mutableListOf<Any>()
        
        if (!query.isNullOrBlank()) {
            conditions.add("LOWER(component_path) LIKE LOWER(?)")
            params.add("%$query%")
        }
        
        if (!status.isNullOrBlank()) {
            conditions.add("status = ?")
            params.add(status.lowercase())
        }
        
        val whereClause = if (conditions.isNotEmpty()) {
            "WHERE ${conditions.joinToString(" AND ")}"
        } else {
            ""
        }
        
        val sql = """
            SELECT * FROM migration_status
            $whereClause
            ORDER BY component_path
        """
        
        return jdbcTemplate.query(sql, { rs, _ ->
            MigrationStatusDto(
                id = rs.getLong("id"),
                componentPath = rs.getString("component_path"),
                reactLoc = rs.getInt("react_loc"),
                vueLoc = rs.getObject("vue_loc", Int::class.java),
                status = MigrationStatus.valueOf(rs.getString("status").uppercase()),
                migratedAt = rs.getTimestamp("migrated_at")?.toLocalDateTime(),
                migratedBy = rs.getString("migrated_by"),
                verifiedAt = rs.getTimestamp("verified_at")?.toLocalDateTime(),
                verifiedBy = rs.getString("verified_by"),
                testCoverage = rs.getObject("test_coverage", Double::class.java),
                notes = rs.getString("notes"),
                createdAt = rs.getTimestamp("created_at").toLocalDateTime(),
                updatedAt = rs.getTimestamp("updated_at").toLocalDateTime()
            )
        }, *params.toTypedArray())
    }
}