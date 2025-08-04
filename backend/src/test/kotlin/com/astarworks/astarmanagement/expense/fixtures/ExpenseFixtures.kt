package com.astarworks.astarmanagement.expense.fixtures

import com.astarworks.astarmanagement.expense.domain.model.Expense
import com.astarworks.astarmanagement.expense.domain.model.Tag
import com.astarworks.astarmanagement.expense.domain.model.TagScope
import com.astarworks.astarmanagement.expense.presentation.request.CreateExpenseRequest
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Test data builders using Kotlin DSL for expense domain objects
 */
object ExpenseFixtures {
    fun expense(
        id: UUID = UUID.randomUUID(),
        tenantId: UUID = UUID.randomUUID(),
        date: LocalDate = LocalDate.now(),
        category: String = "Transportation",
        description: String = "Test expense",
        incomeAmount: BigDecimal = BigDecimal.ZERO,
        expenseAmount: BigDecimal = BigDecimal("1000"),
        balance: BigDecimal = BigDecimal("-1000"),
        caseId: UUID? = null,
        memo: String? = null,
        tags: Set<Tag> = emptySet()
    ) = Expense(
        id = id,
        tenantId = tenantId,
        date = date,
        category = category,
        description = description,
        incomeAmount = incomeAmount,
        expenseAmount = expenseAmount,
        balance = balance,
        caseId = caseId,
        memo = memo,
        tags = tags.toMutableSet()
    )
    
    fun createExpenseRequest(
        date: LocalDate = LocalDate.now(),
        category: String = "Transportation",
        description: String = "Test expense",
        incomeAmount: BigDecimal? = BigDecimal.ZERO,
        expenseAmount: BigDecimal? = BigDecimal("1000"),
        caseId: UUID? = null,
        memo: String? = null,
        tagIds: List<UUID> = emptyList()
    ) = CreateExpenseRequest(
        date = date,
        category = category,
        description = description,
        incomeAmount = incomeAmount,
        expenseAmount = expenseAmount,
        caseId = caseId,
        memo = memo,
        tagIds = tagIds
    )
}