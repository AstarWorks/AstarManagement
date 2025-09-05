package com.astarworks.astarmanagement.unit.core.table.domain.service

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.core.table.domain.model.*
import com.astarworks.astarmanagement.core.table.domain.repository.RecordRepository
import com.astarworks.astarmanagement.core.table.domain.repository.TableRepository
import com.astarworks.astarmanagement.core.table.domain.service.TableService
import com.astarworks.astarmanagement.core.template.domain.service.TemplateService
import com.astarworks.astarmanagement.core.workspace.domain.service.WorkspaceService
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.shared.domain.value.*
import com.astarworks.astarmanagement.core.table.api.exception.*
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

/**
 * TableService Unit Tests (Using MockK)
 */
@DisplayName("TableService Unit Tests")
class TableServiceTest : UnitTestBase() {

    private val tableRepository = mockk<TableRepository>()
    private val recordRepository = mockk<RecordRepository>()
    private val workspaceService = mockk<WorkspaceService>()
    private val templateService = mockk<TemplateService>()
    private val tenantContextService = mockk<TenantContextService>()

    private lateinit var tableService: TableService
    private lateinit var sampleWorkspace: Workspace
    private lateinit var sampleTable: Table

    @BeforeEach
    fun setUp() {
        clearMocks(tableRepository, recordRepository, workspaceService, templateService, tenantContextService)
        tableService = TableService(tableRepository, recordRepository, workspaceService, templateService, tenantContextService)
        setupTestData()
    }

    private fun setupTestData() {
        sampleWorkspace = Workspace(
            name = "Test Workspace",
            createdBy = UserId(java.util.UUID.randomUUID()),
            tenantId = TenantId(java.util.UUID.randomUUID())
        )

        sampleTable = Table(
            workspaceId = sampleWorkspace.id,
            name = "Test Table"
        )
    }

    @Test
    @DisplayName("Should create table successfully")
    fun shouldCreateTableSuccessfully() {
        // Arrange
        val workspaceId = sampleWorkspace.id
        val tableName = "New Table"

        every { workspaceService.findWorkspaceById(workspaceId) } returns sampleWorkspace
        every { tableRepository.countByWorkspaceId(workspaceId) } returns 5
        every { tableRepository.existsByWorkspaceIdAndName(workspaceId, tableName) } returns false
        every { tableRepository.save(any<Table>()) } returns sampleTable

        // Act
        val result = tableService.createTable(workspaceId, tableName)

        // Assert
        result shouldNotBe null
        result.workspaceId shouldBe workspaceId

        verify { workspaceService.findWorkspaceById(workspaceId) }
        verify { tableRepository.countByWorkspaceId(workspaceId) }
        verify { tableRepository.existsByWorkspaceIdAndName(workspaceId, tableName) }
        verify { tableRepository.save(any<Table>()) }
    }

    @Test
    @DisplayName("Should throw exception when workspace not found")
    fun shouldThrowExceptionWhenWorkspaceNotFound() {
        // Arrange
        val workspaceId = WorkspaceId(java.util.UUID.randomUUID())
        val tableName = "New Table"

        every { workspaceService.findWorkspaceById(workspaceId) } throws IllegalArgumentException("Workspace not found")

        // Act & Assert
        assertThrows<IllegalArgumentException> {
            tableService.createTable(workspaceId, tableName)
        }

        verify { workspaceService.findWorkspaceById(workspaceId) }
        verify(exactly = 0) { tableRepository.save(any<Table>()) }
    }

    @Test
    @DisplayName("Should get table by ID successfully")
    fun shouldGetTableByIdSuccessfully() {
        // Arrange
        val tableId = sampleTable.id

        every { tableRepository.findById(tableId) } returns sampleTable
        every { tenantContextService.getTenantContext() } returns sampleWorkspace.tenantId?.value
        every { workspaceService.getWorkspaceById(sampleWorkspace.id) } returns sampleWorkspace

        // Act
        val result = tableService.getTableById(tableId)

        // Assert
        result shouldNotBe null
        result shouldBe sampleTable

        verify { tableRepository.findById(tableId) }
        verify { tenantContextService.getTenantContext() }
        verify { workspaceService.getWorkspaceById(sampleWorkspace.id) }
    }
}