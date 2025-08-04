package com.astarworks.astarmanagement.expense.domain.model

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Domain entity representing a financial expense or income entry.
 * Supports multi-tenant law firm expense tracking with audit trail.
 */
@Entity
@Table(name = "expenses", indexes = [
    Index(name = "idx_expenses_tenant_date", columnList = "tenant_id, date DESC"),
    Index(name = "idx_expenses_case", columnList = "case_id"),
    Index(name = "idx_expenses_created_at", columnList = "created_at")
])
class Expense(
    @Id
    @Column(name = "id", nullable = false)
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,
    
    @Column(name = "date", nullable = false)
    val date: LocalDate,
    
    @Column(name = "category", nullable = false, length = 50)
    val category: String,
    
    @Column(name = "description", nullable = false, length = 200)
    val description: String,
    
    @Column(name = "income_amount", nullable = false, precision = 12, scale = 2)
    val incomeAmount: BigDecimal = BigDecimal.ZERO,
    
    @Column(name = "expense_amount", nullable = false, precision = 12, scale = 2)
    val expenseAmount: BigDecimal = BigDecimal.ZERO,
    
    @Column(name = "balance", nullable = false, precision = 12, scale = 2)
    var balance: BigDecimal = BigDecimal.ZERO,
    
    @Column(name = "case_id")
    val caseId: UUID? = null,
    
    @Column(name = "memo", columnDefinition = "TEXT")
    val memo: String? = null,
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "expense_tags",
        joinColumns = [JoinColumn(name = "expense_id")],
        inverseJoinColumns = [JoinColumn(name = "tag_id")]
    )
    val tags: MutableSet<Tag> = mutableSetOf(),
    
    @OneToMany(mappedBy = "expense", cascade = [CascadeType.ALL], orphanRemoval = true)
    val attachments: MutableSet<ExpenseAttachment> = mutableSetOf(),
    
    @Embedded
    val auditInfo: AuditInfo = AuditInfo(),
    
    @Version
    @Column(name = "version", nullable = false)
    val version: Int = 0
) {
    init {
        require(incomeAmount >= BigDecimal.ZERO) { "Income amount cannot be negative" }
        require(expenseAmount >= BigDecimal.ZERO) { "Expense amount cannot be negative" }
        require(!(incomeAmount > BigDecimal.ZERO && expenseAmount > BigDecimal.ZERO)) {
            "Cannot have both income and expense amounts"
        }
        require(category.isNotBlank()) { "Category cannot be blank" }
        require(description.isNotBlank()) { "Description cannot be blank" }
    }
    
    /**
     * Calculates the net amount (income minus expense).
     * @return The net amount, positive for income, negative for expense
     */
    fun calculateNetAmount(): BigDecimal = incomeAmount - expenseAmount
    
    /**
     * Checks if this entry is an income.
     * @return true if income amount is greater than zero
     */
    fun isIncome(): Boolean = incomeAmount > BigDecimal.ZERO
    
    /**
     * Checks if this entry is an expense.
     * @return true if expense amount is greater than zero
     */
    fun isExpense(): Boolean = expenseAmount > BigDecimal.ZERO
    
    /**
     * Adds a tag to this expense.
     * @param tag The tag to add
     */
    fun addTag(tag: Tag) {
        tags.add(tag)
        tag.incrementUsage()
    }
    
    /**
     * Removes a tag from this expense.
     * @param tag The tag to remove
     */
    fun removeTag(tag: Tag) {
        tags.remove(tag)
    }
    
    /**
     * Adds an attachment to this expense.
     * @param attachment The attachment to add
     */
    fun addAttachment(attachment: ExpenseAttachment) {
        attachments.add(attachment)
        attachment.expense = this
    }
    
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Expense) return false
        return id == other.id
    }
    
    override fun hashCode(): Int = id.hashCode()
    
    override fun toString(): String {
        return "Expense(id=$id, date=$date, category='$category', netAmount=${calculateNetAmount()})"
    }
}