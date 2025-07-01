package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.service.exception.*
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.service.impl.MatterServiceImpl
import dev.ryuzu.astermanagement.testutil.TestDataFactory
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.context.junit.jupiter.SpringExtension
import java.util.*

/**
 * Comprehensive unit tests for MatterServiceImpl using MockK
 * Provides better Kotlin-native mocking and testing patterns
 */
@ExtendWith(SpringExtension::class)
@DisplayName("MatterService Unit Tests with MockK")
class MatterServiceMockkTest {
    
    private val matterRepository: MatterRepository = mockk()
    private val userRepository: UserRepository = mockk()
    private val auditService: AuditService = mockk()
    private val auditEventPublisher: AuditEventPublisher = mockk()
    private val statusTransitionService: StatusTransitionService = mockk()
    
    private lateinit var matterService: MatterServiceImpl
    
    @BeforeEach
    fun setUp() {
        // Clear all mocks before each test
        clearAllMocks()
        
        // Initialize service with mocked dependencies
        matterService = MatterServiceImpl(matterRepository, userRepository, auditService, auditEventPublisher, statusTransitionService)
        
        // Set up security context with LAWYER role for most tests
        val authorities = listOf(SimpleGrantedAuthority("ROLE_LAWYER"))
        val authentication = UsernamePasswordAuthenticationToken("testuser", "password", authorities)
        SecurityContextHolder.getContext().authentication = authentication
        
        // Default audit service behavior
        every { auditService.recordMatterEvent(any(), any(), any()) } just Runs
        every { auditEventPublisher.publishMatterCreated(any(), any(), any(), any()) } just Runs
        every { auditEventPublisher.publishMatterUpdated(any(), any(), any(), any(), any()) } just Runs
        every { auditEventPublisher.publishMatterStatusChanged(any(), any(), any(), any(), any()) } just Runs
        every { auditEventPublisher.publishMatterDeleted(any(), any(), any()) } just Runs
        every { statusTransitionService.createTransitionContext(any(), any(), any(), any(), any()) } returns mockk()
        every { statusTransitionService.executeTransition(any()) } returns mockk()
    }
    
    @Nested
    @DisplayName("Create Matter Tests")
    inner class CreateMatterTests {
        
        @Test
        @DisplayName("Should create matter successfully with valid data")
        fun `should create matter when all data is valid`() {
            // Given
            val matter = TestDataFactory.createTestMatter()
            val expectedMatter = matter.apply { id = UUID.randomUUID() }
            
            every { matterRepository.existsByCaseNumber(matter.caseNumber) } returns false
            every { matterRepository.save(any()) } returns expectedMatter
            
            // When
            val result = matterService.createMatter(matter)
            
            // Then
            result.id shouldNotBe null
            result.caseNumber shouldBe matter.caseNumber
            result.title shouldBe matter.title
            result.status shouldBe matter.status
            
            verify { matterRepository.existsByCaseNumber(matter.caseNumber) }
            verify { matterRepository.save(any()) }
            verify { auditService.recordMatterEvent(any(), any(), any()) }
        }
        
        @Test
        @DisplayName("Should throw exception when case number already exists")
        fun `should throw exception for duplicate case number`() {
            // Given
            val matter = TestDataFactory.createTestMatter()
            
            every { matterRepository.existsByCaseNumber(matter.caseNumber) } returns true
            
            // When & Then
            shouldThrow<ResourceAlreadyExistsException> {
                matterService.createMatter(matter)
            }
            
            verify { matterRepository.existsByCaseNumber(matter.caseNumber) }
            verify(exactly = 0) { matterRepository.save(any()) }
        }
        
        @Test
        @DisplayName("Should validate required fields")
        fun `should validate all required fields during creation`() {
            // Test case number validation
            shouldThrow<ValidationException> {
                val matter = TestDataFactory.createTestMatter(caseNumber = "")
                matterService.createMatter(matter)
            }
            
            // Test title validation  
            shouldThrow<ValidationException> {
                val matter = TestDataFactory.createTestMatter(title = "")
                matterService.createMatter(matter)
            }
            
            // Test client name validation
            shouldThrow<ValidationException> {
                val matter = TestDataFactory.createTestMatter(clientName = "")
                matterService.createMatter(matter)
            }
        }
        
        @Test
        @DisplayName("Should set default status when not provided")
        fun `should default to INTAKE status when not specified`() {
            // Given
            val matter = TestDataFactory.createTestMatter(status = MatterStatus.INTAKE)
            val savedMatter = matter.apply { id = UUID.randomUUID() }
            
            every { matterRepository.existsByCaseNumber(any()) } returns false
            every { matterRepository.save(any()) } returns savedMatter
            
            // When
            val result = matterService.createMatter(matter)
            
            // Then
            result.status shouldBe MatterStatus.INTAKE
        }
    }
    
    @Nested
    @DisplayName("Retrieve Matter Tests")
    inner class RetrieveMatterTests {
        
        @Test
        @DisplayName("Should return matter when it exists")
        fun `should return matter when exists and user has access`() {
            // Given
            val matterId = UUID.randomUUID()
            val matter = TestDataFactory.createTestMatter(id = matterId)
            
            every { matterRepository.findById(matterId) } returns Optional.of(matter)
            
            // When
            val result = matterService.getMatterById(matterId)
            
            // Then
            result shouldNotBe null
            result?.id shouldBe matterId
            result?.caseNumber shouldBe matter.caseNumber
            
            verify { matterRepository.findById(matterId) }
        }
        
        @Test
        @DisplayName("Should return null when matter does not exist")
        fun `should return null when matter not found`() {
            // Given
            val matterId = UUID.randomUUID()
            
            every { matterRepository.findById(matterId) } returns Optional.empty()
            
            // When
            val result = matterService.getMatterById(matterId)
            
            // Then
            result shouldBe null
            
            verify { matterRepository.findById(matterId) }
        }
        
        @Test
        @DisplayName("Should return paginated results")
        fun `should return paginated matters list`() {
            // Given
            val matters = TestDataFactory.createMatterList(3)
            val pageable = PageRequest.of(0, 10)
            val page = PageImpl(matters, pageable, matters.size.toLong())
            
            every { matterRepository.findAll(pageable) } returns page
            
            // When
            val result = matterService.getAllMatters(pageable, null, null)
            
            // Then
            result.totalElements shouldBe matters.size.toLong()
            result.content.size shouldBe matters.size
            result.content[0].id shouldBe matters[0].id
            
            verify { matterRepository.findAll(pageable) }
        }
        
        @Test
        @DisplayName("Should filter matters by status")
        fun `should filter matters by status when provided`() {
            // Given
            val status = MatterStatus.INTAKE
            val matters = listOf(TestDataFactory.createTestMatter(status = status))
            val pageable = PageRequest.of(0, 10)
            val page = PageImpl(matters, pageable, 1)
            
            every { matterRepository.findByStatus(status, pageable) } returns page
            
            // When
            val result = matterService.getAllMatters(pageable, status, null)
            
            // Then
            result.totalElements shouldBe 1
            result.content[0].status shouldBe status
            
            verify { matterRepository.findByStatus(status, pageable) }
        }
    }
    
    @Nested
    @DisplayName("Update Matter Tests") 
    inner class UpdateMatterTests {
        
        @Test
        @DisplayName("Should update existing matter successfully")
        fun `should update matter when it exists`() {
            // Given
            val matterId = UUID.randomUUID()
            val existingMatter = TestDataFactory.createTestMatter(id = matterId)
            val updatedData = TestDataFactory.createTestMatter(title = "Updated Title")
            val updatedMatter = existingMatter.apply { title = "Updated Title" }
            
            every { matterRepository.findById(matterId) } returns Optional.of(existingMatter)
            every { matterRepository.save(any()) } returns updatedMatter
            
            // When
            val result = matterService.updateMatter(matterId, updatedData)
            
            // Then
            result shouldNotBe null
            result?.title shouldBe "Updated Title"
            
            verify { matterRepository.findById(matterId) }
            verify { matterRepository.save(any()) }
            verify { auditService.recordMatterEvent(any(), any(), any()) }
        }
        
        @Test
        @DisplayName("Should throw exception when matter not found for update")
        fun `should throw exception when updating non-existent matter`() {
            // Given
            val matterId = UUID.randomUUID()
            val updateData = TestDataFactory.createTestMatter()
            
            every { matterRepository.findById(matterId) } returns Optional.empty()
            
            // When & Then
            val result = matterService.updateMatter(matterId, updateData)
            result shouldBe null
            
            verify { matterRepository.findById(matterId) }
            verify(exactly = 0) { matterRepository.save(any()) }
        }
    }
    
    @Nested
    @DisplayName("Status Transition Tests")
    inner class StatusTransitionTests {
        
        @Test
        @DisplayName("Should update status with valid transition")
        fun `should update status when transition is valid`() {
            // Given
            val matterId = UUID.randomUUID()
            val matter = TestDataFactory.createTestMatter(id = matterId, status = MatterStatus.INTAKE)
            val newStatus = MatterStatus.INITIAL_REVIEW
            val reason = "Moving to initial review"
            val userId = UUID.randomUUID()
            
            every { matterRepository.findById(matterId) } returns Optional.of(matter)
            every { matterRepository.save(any()) } returns matter.apply { status = newStatus }
            
            // When
            val result = matterService.updateMatterStatus(matterId, newStatus, reason, userId)
            
            // Then
            result shouldNotBe null
            result?.status shouldBe newStatus
            
            verify { matterRepository.findById(matterId) }
            verify { matterRepository.save(any()) }
            verify { auditService.recordMatterEvent(any(), any(), any()) }
        }
        
        @Test
        @DisplayName("Should validate status transitions according to business rules")
        fun `should enforce valid status transitions only`() {
            // Given
            val matterId = UUID.randomUUID()
            val matter = TestDataFactory.createTestMatter(id = matterId, status = MatterStatus.CLOSED)
            val newStatus = MatterStatus.INTAKE
            val reason = "Invalid transition"
            val userId = UUID.randomUUID()
            
            every { matterRepository.findById(matterId) } returns Optional.of(matter)
            
            // When & Then
            shouldThrow<InvalidStatusTransitionException> {
                matterService.updateMatterStatus(matterId, newStatus, reason, userId)
            }
            
            verify { matterRepository.findById(matterId) }
            verify(exactly = 0) { matterRepository.save(any()) }
        }
    }
    
    @Nested
    @DisplayName("Lawyer Assignment Tests")
    inner class LawyerAssignmentTests {
        
        @Test
        @DisplayName("Should assign lawyer to matter successfully")
        fun `should assign lawyer when both matter and lawyer exist`() {
            // Given
            val matterId = UUID.randomUUID()
            val lawyerId = UUID.randomUUID()
            val matter = TestDataFactory.createTestMatter(id = matterId)
            val lawyer = TestDataFactory.createTestLawyer(id = lawyerId)
            
            every { matterRepository.findById(matterId) } returns Optional.of(matter)
            every { userRepository.findById(lawyerId) } returns Optional.of(lawyer)
            every { matterRepository.save(any()) } returns matter.apply { assignedLawyer = lawyer }
            
            // When
            val result = matterService.assignLawyer(matterId, lawyerId)
            
            // Then
            result shouldNotBe null
            result?.assignedLawyer?.id shouldBe lawyerId
            
            verify { matterRepository.findById(matterId) }
            verify { userRepository.findById(lawyerId) }
            verify { matterRepository.save(any()) }
        }
        
        @Test
        @DisplayName("Should throw exception when lawyer does not exist")
        fun `should throw exception when assigning non-existent lawyer`() {
            // Given
            val matterId = UUID.randomUUID()
            val lawyerId = UUID.randomUUID()
            val matter = TestDataFactory.createTestMatter(id = matterId)
            
            every { matterRepository.findById(matterId) } returns Optional.of(matter)
            every { userRepository.findById(lawyerId) } returns Optional.empty()
            
            // When & Then
            shouldThrow<ValidationException> {
                matterService.assignLawyer(matterId, lawyerId)
            }
            
            verify { matterRepository.findById(matterId) }
            verify { userRepository.findById(lawyerId) }
            verify(exactly = 0) { matterRepository.save(any()) }
        }
    }
    
    @Nested
    @DisplayName("Business Logic Tests")
    inner class BusinessLogicTests {
        
        @Test
        @DisplayName("Should validate case number format")
        fun `should validate case number follows required format`() {
            // Valid case numbers should pass
            val validMatter = TestDataFactory.createTestMatter(caseNumber = "2025-CV-0001")
            
            every { matterRepository.existsByCaseNumber(any()) } returns false
            every { matterRepository.save(any()) } returns validMatter.apply { id = UUID.randomUUID() }
            
            // Should not throw exception
            val result = matterService.createMatter(validMatter)
            result.caseNumber shouldBe "2025-CV-0001"
        }
        
        @Test
        @DisplayName("Should check case number uniqueness")
        fun `should ensure case number uniqueness across all matters`() {
            // Given
            val caseNumber = "2025-CV-0001"
            
            every { matterRepository.existsByCaseNumber(caseNumber) } returns true
            
            // When & Then
            val result = matterService.existsByCaseNumber(caseNumber)
            result shouldBe true
            
            verify { matterRepository.existsByCaseNumber(caseNumber) }
        }
        
        @Test
        @DisplayName("Should soft delete matter by setting status to CLOSED")
        fun `should perform soft delete by changing status to CLOSED`() {
            // Given
            val matterId = UUID.randomUUID()
            val matter = TestDataFactory.createTestMatter(id = matterId, status = MatterStatus.INTAKE)
            
            every { matterRepository.findById(matterId) } returns Optional.of(matter)
            every { matterRepository.save(any()) } returns matter.apply { status = MatterStatus.CLOSED }
            
            // When
            val result = matterService.deleteMatter(matterId)
            
            // Then
            result shouldBe true
            
            verify { matterRepository.findById(matterId) }
            verify { matterRepository.save(match { it.status == MatterStatus.CLOSED }) }
        }
    }
}