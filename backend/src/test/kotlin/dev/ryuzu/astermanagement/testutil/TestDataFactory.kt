package dev.ryuzu.astermanagement.testutil

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.dto.matter.CreateMatterRequest
import dev.ryuzu.astermanagement.dto.matter.UpdateMatterRequest
import java.time.LocalDateTime
import java.util.*

/**
 * Test data factory for creating consistent test objects across all test classes
 * Provides builder patterns for flexible test data creation
 */
object TestDataFactory {
    
    fun createTestMatter(
        id: UUID = UUID.randomUUID(),
        caseNumber: String = "2025-CV-${(1000..9999).random()}",
        title: String = "Test Legal Matter",
        description: String = "Test matter description for legal case",
        status: MatterStatus = MatterStatus.INTAKE,
        clientName: String = "Test Client Corporation", 
        clientContact: String = "legal@testclient.com",
        assignedLawyer: User? = null,
        createdAt: LocalDateTime = LocalDateTime.now(),
        updatedAt: LocalDateTime = LocalDateTime.now()
    ): Matter {
        return Matter().apply {
            this.id = id
            this.caseNumber = caseNumber
            this.title = title
            this.description = description
            this.status = status
            this.clientName = clientName
            this.clientContact = clientContact
            this.assignedLawyer = assignedLawyer
            this.createdAt = createdAt
            this.updatedAt = updatedAt
        }
    }
    
    fun createTestUser(
        id: UUID = UUID.randomUUID(),
        username: String = "testuser@example.com",
        firstName: String = "Test",
        lastName: String = "User",
        email: String = "testuser@example.com",
        role: UserRole = UserRole.LAWYER,
        active: Boolean = true
    ): User {
        return User().apply {
            this.id = id
            this.username = username
            this.firstName = firstName
            this.lastName = lastName
            this.email = email
            this.role = role
            this.active = active
        }
    }
    
    fun createTestLawyer(
        id: UUID = UUID.randomUUID(),
        username: String = "lawyer@example.com"
    ): User = createTestUser(
        id = id,
        username = username,
        firstName = "John",
        lastName = "Lawyer",
        email = username,
        role = UserRole.LAWYER
    )
    
    fun createTestClerk(
        id: UUID = UUID.randomUUID(),
        username: String = "clerk@example.com"
    ): User = createTestUser(
        id = id,
        username = username,
        firstName = "Jane",
        lastName = "Clerk",
        email = username,
        role = UserRole.CLERK
    )
    
    fun createTestClient(
        id: UUID = UUID.randomUUID(),
        username: String = "client@example.com"
    ): User = createTestUser(
        id = id,
        username = username,
        firstName = "Client",
        lastName = "User",
        email = username,
        role = UserRole.CLIENT
    )
    
    fun createCreateMatterRequest(
        caseNumber: String = "2025-CV-${(1000..9999).random()}",
        title: String = "New Legal Case",
        description: String = "Description for new legal case",
        clientName: String = "Client Corporation",
        clientContact: String = "contact@client.com",
        status: MatterStatus = MatterStatus.INTAKE
    ): CreateMatterRequest {
        return CreateMatterRequest(
            caseNumber = caseNumber,
            title = title,
            description = description,
            clientName = clientName,
            clientContact = clientContact,
            status = status
        )
    }
    
    fun createUpdateMatterRequest(
        title: String = "Updated Legal Case",
        description: String = "Updated description",
        clientName: String = "Updated Client Name", 
        clientContact: String = "updated@client.com"
    ): UpdateMatterRequest {
        return UpdateMatterRequest(
            title = title,
            description = description,
            clientName = clientName,
            clientContact = clientContact
        )
    }
    
    /**
     * Creates a list of test matters with different statuses for comprehensive testing
     */
    fun createMatterList(count: Int = 5): List<Matter> {
        val statuses = MatterStatus.values()
        return (1..count).map { index ->
            createTestMatter(
                caseNumber = "2025-CV-${1000 + index}",
                title = "Test Matter $index",
                status = statuses[index % statuses.size],
                clientName = "Client $index"
            )
        }
    }
    
    /**
     * Creates matters assigned to a specific lawyer for testing lawyer-specific operations
     */
    fun createMattersForLawyer(lawyer: User, count: Int = 3): List<Matter> {
        return (1..count).map { index ->
            createTestMatter(
                caseNumber = "2025-LW-${1000 + index}",
                title = "Lawyer Matter $index",
                assignedLawyer = lawyer
            )
        }
    }
    
    /**
     * Creates matters with specific status transitions for testing business rules
     */
    fun createMatterWithStatusHistory(
        initialStatus: MatterStatus = MatterStatus.INTAKE,
        currentStatus: MatterStatus = MatterStatus.INITIAL_REVIEW
    ): Matter {
        return createTestMatter(
            status = currentStatus,
            caseNumber = "2025-SH-${(1000..9999).random()}"
        )
    }
}