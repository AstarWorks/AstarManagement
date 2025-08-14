package com.astarworks.astarmanagement.expense.application.service

import com.astarworks.astarmanagement.expense.application.mapper.ExpenseMapper
import com.astarworks.astarmanagement.expense.domain.model.AuditInfo
import com.astarworks.astarmanagement.expense.domain.model.Expense
import com.astarworks.astarmanagement.expense.domain.model.ExpenseNotFoundException
import com.astarworks.astarmanagement.expense.domain.model.Tag
import com.astarworks.astarmanagement.expense.domain.model.TagScope
import com.astarworks.astarmanagement.expense.domain.repository.ExpenseRepository
import com.astarworks.astarmanagement.expense.domain.repository.TagRepository
import com.astarworks.astarmanagement.expense.presentation.request.CreateExpenseRequest
import com.astarworks.astarmanagement.expense.presentation.request.UpdateExpenseRequest
import com.astarworks.astarmanagement.expense.presentation.response.ExpenseResponse
import com.astarworks.astarmanagement.expense.presentation.response.PagedResponse
import com.astarworks.astarmanagement.infrastructure.security.SecurityContextService
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.*
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Unit tests for ExpenseServiceImpl.
 * 
 * Tests cover:
 * - CRUD operations with proper business logic
 * - Transaction boundaries and security checks
 * - Tag association and usage tracking
 * - Error handling and validation
 */
class ExpenseServiceTest {
    
    private val expenseRepository = mock<ExpenseRepository>()
    private val tagRepository = mock<TagRepository>()
    private val expenseMapper = mock<ExpenseMapper>()
    private val securityContextService = mock<SecurityContextService>()
    
    private lateinit var expenseService: ExpenseServiceImpl
    
    private val testTenantId = UUID.randomUUID()
    private val testUserId = UUID.randomUUID()
    private val testExpenseId = UUID.randomUUID()
    private val testTagId = UUID.randomUUID()
    
    @BeforeEach
    fun setUp() {
        expenseService = ExpenseServiceImpl(
            expenseRepository = expenseRepository,
            tagRepository = tagRepository,
            expenseMapper = expenseMapper,
            securityContextService = securityContextService
        )
        
        // Setup common security context mocks
        whenever(securityContextService.requireCurrentTenantId()).thenReturn(testTenantId)
        whenever(securityContextService.requireCurrentUserId()).thenReturn(testUserId)
    }
    
    @Test
    fun `should find expense by id successfully`() {
        // Given
        val expense = createTestExpense()
        val expectedResponse = createTestExpenseResponse()
        
        whenever(expenseRepository.findByIdAndTenantId(testExpenseId, testTenantId))
            .thenReturn(expense)
        whenever(expenseMapper.toResponse(expense)).thenReturn(expectedResponse)
        
        // When
        val result = expenseService.findById(testExpenseId)
        
        // Then
        assertThat(result).isNotNull
        assertThat(result!!.id).isEqualTo(testExpenseId)
        verify(expenseRepository).findByIdAndTenantId(testExpenseId, testTenantId)
        verify(expenseMapper).toResponse(expense)
    }
    
    @Test
    fun `should return null when expense not found`() {
        // Given
        whenever(expenseRepository.findByIdAndTenantId(testExpenseId, testTenantId))
            .thenReturn(null)
        
        // When
        val result = expenseService.findById(testExpenseId)
        
        // Then
        assertThat(result).isNull()
        verify(expenseRepository).findByIdAndTenantId(testExpenseId, testTenantId)
        verify(expenseMapper, never()).toResponse(any())
    }
    
    @Test
    fun `should create expense successfully with tags`() {
        // Given
        val request = CreateExpenseRequest(
            date = LocalDate.now(),
            category = "Transportation",
            description = "Taxi to court",
            expenseAmount = BigDecimal("50.00"),
            incomeAmount = null,
            caseId = UUID.randomUUID(),
            memo = "Client meeting",
            tagIds = listOf(testTagId)
        )
        
        val tag = createTestTag()
        val expense = createTestExpense()
        val expectedResponse = createTestExpenseResponse()
        
        whenever(tagRepository.findByIdAndTenantId(testTagId, testTenantId)).thenReturn(tag)
        whenever(expenseRepository.save(any<Expense>())).thenReturn(expense)
        whenever(tagRepository.save(tag)).thenReturn(tag)
        whenever(expenseMapper.toResponse(expense)).thenReturn(expectedResponse)
        
        // When
        val result = expenseService.create(request)
        
        // Then
        assertThat(result).isNotNull
        assertThat(result.description).isEqualTo("Test expense")
        
        verify(tagRepository).findByIdAndTenantId(testTagId, testTenantId)
        verify(expenseRepository).save(any<Expense>())
        verify(tagRepository).save(tag) // Tag usage should be updated
        verify(expenseMapper).toResponse(expense)
    }
    
    @Test
    fun `should create expense without tags`() {
        // Given
        val request = CreateExpenseRequest(
            date = LocalDate.now(),
            category = "Transportation",
            description = "Taxi to court",
            expenseAmount = BigDecimal("50.00"),
            incomeAmount = null,
            caseId = null,
            memo = null,
            tagIds = emptyList()
        )
        
        val expense = createTestExpense()
        val expectedResponse = createTestExpenseResponse()
        
        whenever(expenseRepository.save(any<Expense>())).thenReturn(expense)
        whenever(expenseMapper.toResponse(expense)).thenReturn(expectedResponse)
        
        // When
        val result = expenseService.create(request)
        
        // Then
        assertThat(result).isNotNull
        verify(expenseRepository).save(any<Expense>())
        verify(tagRepository, never()).findByIdAndTenantId(any(), any())
        verify(expenseMapper).toResponse(expense)
    }
    
    @Test
    fun `should update expense successfully`() {
        // Given
        val existingExpense = createTestExpense()
        val request = UpdateExpenseRequest(
            date = LocalDate.now(),
            category = "Updated Category",
            description = "Updated description",
            expenseAmount = BigDecimal("75.00"),
            incomeAmount = null,
            caseId = null,
            memo = "Updated memo",
            tagIds = listOf(testTagId),
            version = 0
        )
        
        val tag = createTestTag()
        val updatedExpense = createTestExpense()
        val expectedResponse = createTestExpenseResponse()
        
        whenever(expenseRepository.findByIdAndTenantId(testExpenseId, testTenantId))
            .thenReturn(existingExpense)
        whenever(tagRepository.findByIdAndTenantId(testTagId, testTenantId)).thenReturn(tag)
        whenever(expenseRepository.save(any<Expense>())).thenReturn(updatedExpense)
        whenever(tagRepository.save(tag)).thenReturn(tag)
        whenever(expenseMapper.toResponse(updatedExpense)).thenReturn(expectedResponse)
        
        // When
        val result = expenseService.update(testExpenseId, request)
        
        // Then
        assertThat(result).isNotNull
        verify(expenseRepository).findByIdAndTenantId(testExpenseId, testTenantId)
        verify(expenseRepository).save(any<Expense>())
        verify(tagRepository).save(tag) // Tag usage should be updated
        verify(expenseMapper).toResponse(updatedExpense)
    }
    
    @Test
    fun `should throw exception when updating non-existent expense`() {
        // Given
        val request = UpdateExpenseRequest(
            date = LocalDate.now(),
            category = "Category",
            description = "Description",
            expenseAmount = BigDecimal("50.00"),
            incomeAmount = null,
            caseId = null,
            memo = null,
            tagIds = emptyList(),
            version = 0
        )
        
        whenever(expenseRepository.findByIdAndTenantId(testExpenseId, testTenantId))
            .thenReturn(null)
        
        // When & Then
        assertThrows<ExpenseNotFoundException> {
            expenseService.update(testExpenseId, request)
        }
        
        verify(expenseRepository).findByIdAndTenantId(testExpenseId, testTenantId)
        verify(expenseRepository, never()).save(any<Expense>())
    }
    
    @Test
    fun `should delete expense successfully`() {
        // Given
        val expense = createTestExpense()
        
        whenever(expenseRepository.findByIdAndTenantId(testExpenseId, testTenantId))
            .thenReturn(expense)
        whenever(expenseRepository.save(expense)).thenReturn(expense)
        
        // When
        expenseService.delete(testExpenseId)
        
        // Then
        verify(expenseRepository).findByIdAndTenantId(testExpenseId, testTenantId)
        verify(expenseRepository).save(expense)
        
        // Verify that soft delete was applied
        assertThat(expense.auditInfo.deletedAt).isNotNull()
        assertThat(expense.auditInfo.deletedBy).isEqualTo(testUserId)
    }
    
    @Test
    fun `should throw exception when deleting non-existent expense`() {
        // Given
        whenever(expenseRepository.findByIdAndTenantId(testExpenseId, testTenantId))
            .thenReturn(null)
        
        // When & Then
        assertThrows<ExpenseNotFoundException> {
            expenseService.delete(testExpenseId)
        }
        
        verify(expenseRepository).findByIdAndTenantId(testExpenseId, testTenantId)
        verify(expenseRepository, never()).save(any<Expense>())
    }
    
    @Test
    fun `should find expenses by filters with pagination`() {
        // Given
        val startDate = LocalDate.of(2024, 1, 1)
        val endDate = LocalDate.of(2024, 1, 31)
        val category = "Transportation"
        val tagIds = listOf(testTagId)
        val pageable = PageRequest.of(0, 10)
        
        val expenses = listOf(createTestExpense())
        val expensePage = PageImpl(expenses, pageable, 1)
        val expenseResponses = listOf(createTestExpenseResponse())
        
        whenever(expenseRepository.findByFilters(
            tenantId = testTenantId,
            startDate = startDate,
            endDate = endDate,
            caseId = null,
            category = category,
            tagIds = tagIds,
            pageable = pageable
        )).thenReturn(expensePage)
        
        whenever(expenseMapper.toResponseList(expenses)).thenReturn(expenseResponses)
        
        // When
        val result = expenseService.findByFilters(
            startDate = startDate,
            endDate = endDate,
            caseId = null,
            category = category,
            tagIds = tagIds,
            pageable = pageable
        )
        
        // Then
        assertThat(result).isNotNull
        assertThat(result.data).hasSize(1)
        assertThat(result.total).isEqualTo(1L)
        assertThat(result.hasNext).isFalse()
        
        verify(expenseRepository).findByFilters(
            tenantId = testTenantId,
            startDate = startDate,
            endDate = endDate,
            caseId = null,
            category = category,
            tagIds = tagIds,
            pageable = pageable
        )
        verify(expenseMapper).toResponseList(expenses)
    }
    
    @Test
    fun `should create bulk expenses successfully`() {
        // Given
        val requests = listOf(
            CreateExpenseRequest(
                date = LocalDate.now(),
                category = "Transportation",
                description = "Expense 1",
                expenseAmount = BigDecimal("50.00"),
                incomeAmount = null,
                caseId = null,
                memo = null,
                tagIds = emptyList()
            ),
            CreateExpenseRequest(
                date = LocalDate.now(),
                category = "Office",
                description = "Expense 2",
                expenseAmount = BigDecimal("25.00"),
                incomeAmount = null,
                caseId = null,
                memo = null,
                tagIds = emptyList()
            )
        )
        
        val expenses = listOf(createTestExpense(), createTestExpense())
        val expectedResponses = listOf(createTestExpenseResponse(), createTestExpenseResponse())
        
        whenever(expenseRepository.save(any<Expense>())).thenReturn(expenses[0], expenses[1])
        whenever(expenseMapper.toResponseList(expenses)).thenReturn(expectedResponses)
        
        // When
        val result = expenseService.createBulk(requests)
        
        // Then
        assertThat(result).hasSize(2)
        verify(expenseRepository, times(2)).save(any<Expense>())
        verify(expenseMapper).toResponseList(expenses)
    }
    
    @Test
    fun `should return empty list for empty bulk create request`() {
        // When
        val result = expenseService.createBulk(emptyList())
        
        // Then
        assertThat(result).isEmpty()
        verify(expenseRepository, never()).save(any<Expense>())
        verify(expenseMapper, never()).toResponseList(any())
    }
    
    private fun createTestExpense(): Expense {
        return Expense(
            id = testExpenseId,
            tenantId = testTenantId,
            date = LocalDate.now(),
            category = "Transportation",
            description = "Test expense",
            incomeAmount = BigDecimal.ZERO,
            expenseAmount = BigDecimal("50.00"),
            balance = BigDecimal("-50.00"),
            caseId = null,
            memo = null,
            version = 1,
            auditInfo = AuditInfo(
                createdBy = testUserId,
                updatedBy = testUserId
            )
        )
    }
    
    private fun createTestTag(): Tag {
        return Tag(
            id = testTagId,
            tenantId = testTenantId,
            name = "Transportation",
            nameNormalized = "transportation",
            color = "#FF5733",
            scope = TagScope.TENANT,
            ownerId = null,
            usageCount = 0,
            lastUsedAt = null,
            auditInfo = AuditInfo(
                createdBy = testUserId,
                updatedBy = testUserId
            )
        )
    }
    
    private fun createTestExpenseResponse(): ExpenseResponse {
        return ExpenseResponse(
            id = testExpenseId,
            tenantId = testTenantId,
            date = LocalDate.now(),
            category = "Transportation",
            description = "Test expense",
            incomeAmount = BigDecimal.ZERO,
            expenseAmount = BigDecimal("50.00"),
            balance = BigDecimal("-50.00"),
            netAmount = BigDecimal("-50.00"),
            caseId = null,
            memo = null,
            tags = emptyList(),
            attachments = emptyList(),
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
            createdBy = testUserId,
            updatedBy = testUserId,
            version = 1
        )
    }
}