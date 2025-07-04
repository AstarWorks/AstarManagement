package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.controller.base.BaseController
import dev.ryuzu.astermanagement.dto.migration.*
import dev.ryuzu.astermanagement.service.MigrationTrackingService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * REST controller for React to Vue migration tracking
 */
@RestController
@RequestMapping("/api/migration")
@Tag(name = "Migration", description = "React to Vue migration tracking endpoints")
class MigrationController(
    private val migrationService: MigrationTrackingService
) : BaseController() {

    @GetMapping("/status")
    @Operation(summary = "Get all component migration statuses")
    fun getAllStatuses(): ResponseEntity<List<MigrationStatusDto>> {
        return ResponseEntity.ok(migrationService.getAllStatuses())
    }

    @GetMapping("/status/{id}")
    @Operation(summary = "Get migration status for a specific component")
    fun getStatus(@PathVariable id: Long): ResponseEntity<MigrationStatusDto> {
        return ResponseEntity.ok(migrationService.getStatus(id))
    }

    @PostMapping("/status")
    @Operation(summary = "Create or update migration status")
    fun updateStatus(@RequestBody request: UpdateMigrationStatusRequest): ResponseEntity<MigrationStatusDto> {
        return ResponseEntity.ok(migrationService.updateStatus(request))
    }

    @PatchMapping("/status/{id}")
    @Operation(summary = "Update specific fields of migration status")
    fun patchStatus(
        @PathVariable id: Long,
        @RequestBody updates: MigrationStatusUpdateDto
    ): ResponseEntity<MigrationStatusDto> {
        return ResponseEntity.ok(migrationService.patchStatus(id, updates))
    }

    @GetMapping("/stats")
    @Operation(summary = "Get migration statistics")
    fun getStats(): ResponseEntity<MigrationStatsDto> {
        return ResponseEntity.ok(migrationService.getStats())
    }

    @GetMapping("/timeline")
    @Operation(summary = "Get migration timeline data")
    fun getTimeline(
        @RequestParam(defaultValue = "30") days: Int
    ): ResponseEntity<List<MigrationMetricsDto>> {
        return ResponseEntity.ok(migrationService.getTimeline(days))
    }

    @PostMapping("/issues")
    @Operation(summary = "Report a migration issue")
    fun reportIssue(@RequestBody request: ReportIssueRequest): ResponseEntity<MigrationIssueDto> {
        return ResponseEntity.ok(migrationService.reportIssue(request))
    }

    @GetMapping("/issues/{componentPath}")
    @Operation(summary = "Get issues for a component")
    fun getComponentIssues(@PathVariable componentPath: String): ResponseEntity<List<MigrationIssueDto>> {
        return ResponseEntity.ok(migrationService.getComponentIssues(componentPath))
    }

    @PostMapping("/metrics/calculate")
    @Operation(summary = "Trigger daily metrics calculation")
    fun calculateMetrics(): ResponseEntity<Void> {
        migrationService.calculateDailyMetrics()
        return ResponseEntity.ok().build()
    }

    @GetMapping("/search")
    @Operation(summary = "Search components by path or status")
    fun searchComponents(
        @RequestParam(required = false) query: String?,
        @RequestParam(required = false) status: String?
    ): ResponseEntity<List<MigrationStatusDto>> {
        return ResponseEntity.ok(migrationService.searchComponents(query, status))
    }
}