package dev.ryuzu.astermanagement.repository

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.testutil.TestDataFactory
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.ActiveProfiles
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.util.*

/**
 * Integration tests for MatterRepository using Testcontainers
 * Tests data layer with real PostgreSQL database
 */
@DataJpaTest
@Testcontainers
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("Matter Repository Integration Tests")
class MatterRepositoryIntegrationTest {
    
    @Autowired
    private lateinit var testEntityManager: TestEntityManager
    
    @Autowired
    private lateinit var matterRepository: MatterRepository
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test")
            .withLabel("test-db", "matter-repository")
    }
    
    @BeforeEach
    fun setUp() {
        // Clean up data before each test
        testEntityManager.clear()
    }
    
    @Nested
    @DisplayName("Basic CRUD Operations")
    inner class BasicCrudTests {
        
        @Test
        @DisplayName("Should save and retrieve matter successfully")
        fun `should save matter and retrieve by id`() {
            // Given
            val matter = TestDataFactory.createTestMatter()
            
            // When
            val savedMatter = matterRepository.save(matter)
            testEntityManager.flush()
            testEntityManager.clear()
            
            val retrievedMatter = matterRepository.findById(savedMatter.id!!)
            
            // Then
            retrievedMatter.isPresent shouldBe true
            retrievedMatter.get().caseNumber shouldBe matter.caseNumber
            retrievedMatter.get().title shouldBe matter.title
            retrievedMatter.get().status shouldBe matter.status
        }
        
        @Test
        @DisplayName("Should update matter successfully")
        fun `should update existing matter`() {
            // Given
            val matter = TestDataFactory.createTestMatter()
            val savedMatter = testEntityManager.persistAndFlush(matter)
            testEntityManager.clear()
            
            // When
            val updatedTitle = "Updated Matter Title"
            savedMatter.title = updatedTitle
            val updatedMatter = matterRepository.save(savedMatter)
            testEntityManager.flush()
            
            // Then
            updatedMatter.title shouldBe updatedTitle
            updatedMatter.id shouldBe savedMatter.id
        }
        
        @Test
        @DisplayName("Should delete matter by ID")
        fun `should delete matter when it exists`() {
            // Given
            val matter = TestDataFactory.createTestMatter()
            val savedMatter = testEntityManager.persistAndFlush(matter)
            val matterId = savedMatter.id!!
            
            // When
            matterRepository.deleteById(matterId)
            testEntityManager.flush()
            testEntityManager.clear()
            
            // Then
            val retrievedMatter = matterRepository.findById(matterId)
            retrievedMatter.isPresent shouldBe false
        }
    }
    
    @Nested
    @DisplayName("Custom Query Methods")
    inner class CustomQueryTests {
        
        @Test
        @DisplayName("Should find matters by status")
        fun `should find all matters with specific status`() {
            // Given
            val intakeMatter1 = TestDataFactory.createTestMatter(
                caseNumber = "2025-CV-0001",
                status = MatterStatus.INTAKE
            )
            val intakeMatter2 = TestDataFactory.createTestMatter(
                caseNumber = "2025-CV-0002", 
                status = MatterStatus.INTAKE
            )
            val reviewMatter = TestDataFactory.createTestMatter(
                caseNumber = "2025-CV-0003",
                status = MatterStatus.INITIAL_REVIEW
            )
            
            testEntityManager.persistAndFlush(intakeMatter1)
            testEntityManager.persistAndFlush(intakeMatter2)
            testEntityManager.persistAndFlush(reviewMatter)
            testEntityManager.clear()
            
            // When
            val pageable = PageRequest.of(0, 10)
            val intakeMatters = matterRepository.findByStatus(MatterStatus.INTAKE, pageable)
            
            // Then
            intakeMatters.content shouldHaveSize 2
            intakeMatters.content.forEach { matter ->
                matter.status shouldBe MatterStatus.INTAKE
            }
            intakeMatters.content.map { it.caseNumber } shouldContain intakeMatter1.caseNumber
            intakeMatters.content.map { it.caseNumber } shouldContain intakeMatter2.caseNumber
        }
        
        @Test
        @DisplayName("Should check case number existence")
        fun `should verify case number uniqueness`() {
            // Given
            val caseNumber = "2025-CV-UNIQUE"
            val matter = TestDataFactory.createTestMatter(caseNumber = caseNumber)
            testEntityManager.persistAndFlush(matter)
            
            // When & Then
            matterRepository.existsByCaseNumber(caseNumber) shouldBe true
            matterRepository.existsByCaseNumber("NON-EXISTENT") shouldBe false
        }
        
        @Test
        @DisplayName("Should find matters by case number")
        fun `should find matter by case number`() {
            // Given
            val caseNumber = "2025-CV-SEARCH"
            val matter = TestDataFactory.createTestMatter(caseNumber = caseNumber)
            testEntityManager.persistAndFlush(matter)
            testEntityManager.clear()
            
            // When
            val foundMatter = matterRepository.findByCaseNumber(caseNumber)
            
            // Then
            foundMatter shouldNotBe null
            foundMatter?.caseNumber shouldBe caseNumber
            foundMatter?.title shouldBe matter.title
        }
        
        @Test
        @DisplayName("Should find matters by client name")
        fun `should find matters by client name pattern`() {
            // Given
            val clientName = "ABC Corporation"
            val matter1 = TestDataFactory.createTestMatter(
                caseNumber = "2025-CV-0001",
                clientName = clientName
            )
            val matter2 = TestDataFactory.createTestMatter(
                caseNumber = "2025-CV-0002",
                clientName = "XYZ Corporation"
            )
            
            testEntityManager.persistAndFlush(matter1)
            testEntityManager.persistAndFlush(matter2)
            testEntityManager.clear()
            
            // When
            val pageable = PageRequest.of(0, 10)
            val clientMatters = matterRepository.findByClientNameContainingIgnoreCase(
                "abc", pageable
            )
            
            // Then
            clientMatters.content shouldHaveSize 1
            clientMatters.content[0].clientName shouldBe clientName
        }
    }
    
    @Nested
    @DisplayName("Relationship Tests")
    inner class RelationshipTests {
        
        @Test
        @DisplayName("Should handle lawyer assignment relationships")
        fun `should manage matter-lawyer relationships correctly`() {
            // Given
            val lawyer = TestDataFactory.createTestLawyer()
            val savedLawyer = testEntityManager.persistAndFlush(lawyer)
            
            val matter = TestDataFactory.createTestMatter()
            matter.assignedLawyer = savedLawyer
            val savedMatter = testEntityManager.persistAndFlush(matter)
            testEntityManager.clear()
            
            // When
            val retrievedMatter = matterRepository.findById(savedMatter.id!!)
            
            // Then
            retrievedMatter.isPresent shouldBe true
            retrievedMatter.get().assignedLawyer shouldNotBe null
            retrievedMatter.get().assignedLawyer?.id shouldBe savedLawyer.id
            retrievedMatter.get().assignedLawyer?.email shouldBe savedLawyer.email
        }
        
        @Test
        @DisplayName("Should find matters by assigned lawyer")
        fun `should find matters assigned to specific lawyer`() {
            // Given
            val lawyer1 = TestDataFactory.createTestLawyer(username = "lawyer1@test.com")
            val lawyer2 = TestDataFactory.createTestLawyer(username = "lawyer2@test.com")
            val savedLawyer1 = testEntityManager.persistAndFlush(lawyer1)
            val savedLawyer2 = testEntityManager.persistAndFlush(lawyer2)
            
            val matter1 = TestDataFactory.createTestMatter(caseNumber = "2025-CV-0001")
            matter1.assignedLawyer = savedLawyer1
            val matter2 = TestDataFactory.createTestMatter(caseNumber = "2025-CV-0002")
            matter2.assignedLawyer = savedLawyer1
            val matter3 = TestDataFactory.createTestMatter(caseNumber = "2025-CV-0003")
            matter3.assignedLawyer = savedLawyer2
            
            testEntityManager.persistAndFlush(matter1)
            testEntityManager.persistAndFlush(matter2)
            testEntityManager.persistAndFlush(matter3)
            testEntityManager.clear()
            
            // When
            val pageable = PageRequest.of(0, 10)
            val lawyer1Matters = matterRepository.findByAssignedLawyer(savedLawyer1, pageable)
            
            // Then
            lawyer1Matters.content shouldHaveSize 2
            lawyer1Matters.content.forEach { matter ->
                matter.assignedLawyer?.id shouldBe savedLawyer1.id
            }
        }
    }
    
    @Nested
    @DisplayName("Pagination and Sorting Tests")
    inner class PaginationTests {
        
        @Test
        @DisplayName("Should handle pagination correctly")
        fun `should paginate matters correctly`() {
            // Given - Create 25 matters
            val matters = (1..25).map { index ->
                TestDataFactory.createTestMatter(
                    caseNumber = "2025-CV-${String.format("%04d", index)}"
                )
            }
            matters.forEach { testEntityManager.persistAndFlush(it) }
            testEntityManager.clear()
            
            // When - Request first page with 10 items
            val firstPage = matterRepository.findAll(PageRequest.of(0, 10))
            val secondPage = matterRepository.findAll(PageRequest.of(1, 10))
            val thirdPage = matterRepository.findAll(PageRequest.of(2, 10))
            
            // Then
            firstPage.content shouldHaveSize 10
            firstPage.totalElements shouldBe 25
            firstPage.totalPages shouldBe 3
            firstPage.isFirst shouldBe true
            firstPage.isLast shouldBe false
            
            secondPage.content shouldHaveSize 10
            secondPage.isFirst shouldBe false
            secondPage.isLast shouldBe false
            
            thirdPage.content shouldHaveSize 5
            thirdPage.isFirst shouldBe false
            thirdPage.isLast shouldBe true
        }
        
        @Test
        @DisplayName("Should sort matters by creation date")
        fun `should sort matters by creation date descending`() {
            // Given
            val matter1 = TestDataFactory.createTestMatter(caseNumber = "2025-CV-0001")
            val matter2 = TestDataFactory.createTestMatter(caseNumber = "2025-CV-0002")
            val matter3 = TestDataFactory.createTestMatter(caseNumber = "2025-CV-0003")
            
            // Save in specific order
            testEntityManager.persistAndFlush(matter1)
            Thread.sleep(1) // Ensure different timestamps
            testEntityManager.persistAndFlush(matter2)
            Thread.sleep(1)
            testEntityManager.persistAndFlush(matter3)
            testEntityManager.clear()
            
            // When - Get matters sorted by creation date desc
            val pageable = PageRequest.of(0, 10)
            val sortedMatters = matterRepository.findAllByOrderByCreatedAtDesc(pageable)
            
            // Then - Should be in reverse creation order
            sortedMatters.content shouldHaveSize 3
            sortedMatters.content[0].caseNumber shouldBe matter3.caseNumber
            sortedMatters.content[1].caseNumber shouldBe matter2.caseNumber
            sortedMatters.content[2].caseNumber shouldBe matter1.caseNumber
        }
    }
    
    @Nested
    @DisplayName("Search and Filter Tests")
    inner class SearchTests {
        
        @Test
        @DisplayName("Should search matters by title and case number")
        fun `should find matters by title or case number containing search term`() {
            // Given
            val matter1 = TestDataFactory.createTestMatter(
                caseNumber = "2025-CV-CONTRACT",
                title = "Employment Contract Dispute"
            )
            val matter2 = TestDataFactory.createTestMatter(
                caseNumber = "2025-CV-0002",
                title = "Contract Negotiation Issue"
            )
            val matter3 = TestDataFactory.createTestMatter(
                caseNumber = "2025-CV-0003",
                title = "Property Purchase Agreement"
            )
            
            testEntityManager.persistAndFlush(matter1)
            testEntityManager.persistAndFlush(matter2)
            testEntityManager.persistAndFlush(matter3)
            testEntityManager.clear()
            
            // When - Search for "contract"
            val pageable = PageRequest.of(0, 10)
            val contractMatters = matterRepository.findByTitleContainingIgnoreCaseOrCaseNumberContainingIgnoreCase(
                "contract", "contract", pageable
            )
            
            // Then - Should find both contract-related matters
            contractMatters.content shouldHaveSize 2
            contractMatters.content.map { it.id } shouldContain matter1.id
            contractMatters.content.map { it.id } shouldContain matter2.id
        }
    }
    
    @Nested
    @DisplayName("Performance Tests")
    inner class PerformanceTests {
        
        @Test
        @DisplayName("Should perform efficiently with large datasets")
        fun `should handle large number of matters efficiently`() {
            // Given - Create 1000 matters
            val matters = (1..1000).map { index ->
                TestDataFactory.createTestMatter(
                    caseNumber = "2025-PERF-${String.format("%04d", index)}"
                )
            }
            
            val startTime = System.currentTimeMillis()
            
            // When - Batch save all matters
            matterRepository.saveAll(matters)
            testEntityManager.flush()
            
            val saveTime = System.currentTimeMillis() - startTime
            
            // Query performance test
            val queryStartTime = System.currentTimeMillis()
            val firstPage = matterRepository.findAll(PageRequest.of(0, 50))
            val queryTime = System.currentTimeMillis() - queryStartTime
            
            // Then - Should complete within reasonable time
            assert(saveTime < 5000) { "Batch save took too long: ${saveTime}ms" }
            assert(queryTime < 100) { "Query took too long: ${queryTime}ms" }
            
            firstPage.content shouldHaveSize 50
            firstPage.totalElements shouldBe 1000
        }
    }
}