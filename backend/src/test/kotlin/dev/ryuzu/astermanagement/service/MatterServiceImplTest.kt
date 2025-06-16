package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.service.exception.*
import dev.ryuzu.astermanagement.service.impl.MatterServiceImpl
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.*
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import java.util.*

/**
 * Unit tests for MatterServiceImpl
 * Tests business logic, validation, and security using mocks
 */
class MatterServiceImplTest {
    
    private lateinit var matterService: MatterServiceImpl
    private lateinit var matterRepository: MatterRepository
    private lateinit var userRepository: UserRepository
    private lateinit var auditService: AuditService
    
    @BeforeEach
    fun setUp() {
        matterRepository = mock()
        userRepository = mock()
        auditService = mock()
        matterService = MatterServiceImpl(matterRepository, userRepository, auditService)
        
        // Set up security context with LAWYER role for most tests
        val authorities = listOf(SimpleGrantedAuthority("ROLE_LAWYER"))
        val authentication = UsernamePasswordAuthenticationToken("testuser", "password", authorities)
        SecurityContextHolder.getContext().authentication = authentication
    }
    
    @Test
    fun `createMatter should create matter with valid data`() {
        // Given
        val matter = createValidMatter()
        val savedMatter = createValidMatter().apply { id = UUID.randomUUID() }
        
        whenever(matterRepository.existsByCaseNumber(matter.caseNumber)).thenReturn(false)
        whenever(matterRepository.save(any())).thenReturn(savedMatter)
        
        // When
        val result = matterService.createMatter(matter)
        
        // Then
        assertNotNull(result.id)
        assertEquals(matter.caseNumber, result.caseNumber)
        assertEquals(matter.title, result.title)
        verify(matterRepository).save(any())
    }
    
    @Test
    fun `createMatter should throw exception for duplicate case number`() {
        // Given
        val matter = createValidMatter()
        
        whenever(matterRepository.existsByCaseNumber(matter.caseNumber)).thenReturn(true)
        
        // Then
        assertThrows<ResourceAlreadyExistsException> {
            matterService.createMatter(matter)
        }
    }
    
    @Test
    fun `createMatter should validate required fields`() {
        // Test blank case number
        assertThrows<ValidationException> {
            val matter = createValidMatter()
            matter.caseNumber = ""
            matterService.createMatter(matter)
        }
        
        // Test blank title
        assertThrows<ValidationException> {
            val matter = createValidMatter()
            matter.title = ""
            matterService.createMatter(matter)
        }
        
        // Test blank client name
        assertThrows<ValidationException> {
            val matter = createValidMatter()
            matter.clientName = ""
            matterService.createMatter(matter)
        }
    }
    
    @Test
    fun `getMatterById should return matter when exists and user has access`() {
        // Given
        val matterId = UUID.randomUUID()
        val matter = createValidMatter()
        matter.id = matterId
        
        whenever(matterRepository.findById(matterId)).thenReturn(Optional.of(matter))
        
        // When
        val result = matterService.getMatterById(matterId)
        
        // Then
        assertNotNull(result)
        assertEquals(matterId, result?.id)
        assertEquals(matter.caseNumber, result?.caseNumber)
    }
    
    @Test
    fun `getMatterById should return null when not exists`() {
        // Given
        val matterId = UUID.randomUUID()
        whenever(matterRepository.findById(matterId)).thenReturn(Optional.empty())
        
        // When
        val result = matterService.getMatterById(matterId)
        
        // Then
        assertNull(result)
    }
    
    @Test
    fun `updateMatter should update existing matter`() {
        // Given
        val matterId = UUID.randomUUID()
        val existingMatter = createValidMatter()
        existingMatter.id = matterId
        val updatedMatter = createValidMatter()
        updatedMatter.title = "Updated Title"
        
        whenever(matterRepository.findById(matterId)).thenReturn(Optional.of(existingMatter))
        whenever(matterRepository.save(any())).thenReturn(existingMatter)
        
        // When
        val result = matterService.updateMatter(matterId, updatedMatter)
        
        // Then
        assertNotNull(result)
        verify(matterRepository).save(any())
    }
    
    @Test
    fun `updateMatterStatus should update status with valid transition`() {
        // Given
        val matterId = UUID.randomUUID()
        val matter = createValidMatter()
        matter.id = matterId
        matter.status = MatterStatus.INTAKE
        
        whenever(matterRepository.findById(matterId)).thenReturn(Optional.of(matter))
        whenever(matterRepository.save(any())).thenReturn(matter)
        
        // When
        val result = matterService.updateMatterStatus(matterId, MatterStatus.INITIAL_REVIEW, "Test reason", UUID.randomUUID())
        
        // Then
        assertNotNull(result)
        verify(matterRepository).save(any())
    }
    
    @Test
    fun `updateMatterStatus should throw exception for invalid transition`() {
        // Given
        val matterId = UUID.randomUUID()
        val matter = createValidMatter().apply { 
            id = matterId
            status = MatterStatus.CLOSED
        }
        
        whenever(matterRepository.findById(matterId)).thenReturn(Optional.of(matter))
        
        // Then - trying to transition from CLOSED to other status should fail based on business rules
        // Note: The exact transition rules depend on the MatterStatus enum implementation
        // This test assumes CLOSED -> INTAKE is not allowed
        assertThrows<InvalidStatusTransitionException> {
            matterService.updateMatterStatus(matterId, MatterStatus.INTAKE, "Cannot transition", UUID.randomUUID())
        }
    }
    
    @Test
    fun `deleteMatter should soft delete by setting status to CLOSED`() {
        // Given
        val matterId = UUID.randomUUID()
        val matter = createValidMatter().apply { 
            id = matterId
            status = MatterStatus.INTAKE
        }
        val deletedMatter = matter.apply { status = MatterStatus.CLOSED }
        
        whenever(matterRepository.findById(matterId)).thenReturn(Optional.of(matter))
        whenever(matterRepository.save(any())).thenReturn(deletedMatter)
        
        // When
        val result = matterService.deleteMatter(matterId)
        
        // Then
        assertTrue(result)
        verify(matterRepository).save(any())
    }
    
    @Test
    fun `getAllMatters should return paginated results`() {
        // Given
        val matter1 = createValidMatter().apply { id = UUID.randomUUID(); caseNumber = "2025-CV-0001" }
        val matter2 = createValidMatter().apply { id = UUID.randomUUID(); caseNumber = "2025-CV-0002" }
        val pageable = PageRequest.of(0, 10)
        val page = PageImpl(listOf(matter1, matter2), pageable, 2)
        
        whenever(matterRepository.findAll(pageable)).thenReturn(page)
        
        // When
        val result = matterService.getAllMatters(pageable, null, null)
        
        // Then
        assertEquals(2, result.totalElements)
        assertEquals(2, result.content.size)
    }
    
    @Test
    fun `getAllMatters should filter by status`() {
        // Given
        val matter1 = createValidMatter().apply { 
            id = UUID.randomUUID()
            status = MatterStatus.INTAKE
        }
        val pageable = PageRequest.of(0, 10)
        val page = PageImpl(listOf(matter1), pageable, 1)
        
        whenever(matterRepository.findByStatus(MatterStatus.INTAKE, pageable)).thenReturn(page)
        
        // When
        val result = matterService.getAllMatters(pageable, MatterStatus.INTAKE, null)
        
        // Then
        assertEquals(1, result.totalElements)
        assertEquals(MatterStatus.INTAKE, result.content[0].status)
    }
    
    @Test
    fun `existsByCaseNumber should return repository result`() {
        // Given
        val caseNumber = "2025-CV-0001"
        whenever(matterRepository.existsByCaseNumber(caseNumber)).thenReturn(true)
        
        // When & Then
        assertTrue(matterService.existsByCaseNumber(caseNumber))
        verify(matterRepository).existsByCaseNumber(caseNumber)
    }
    
    @Test
    fun `assignLawyer should assign lawyer to matter`() {
        // Given
        val matterId = UUID.randomUUID()
        val lawyerId = UUID.randomUUID()
        val matter = createValidMatter().apply { id = matterId }
        val lawyer = User().apply { 
            id = lawyerId
            username = "lawyer@test.com"
        }
        val updatedMatter = matter.apply { assignedLawyer = lawyer }
        
        whenever(matterRepository.findById(matterId)).thenReturn(Optional.of(matter))
        whenever(userRepository.findById(lawyerId)).thenReturn(Optional.of(lawyer))
        whenever(matterRepository.save(any())).thenReturn(updatedMatter)
        
        // When
        val result = matterService.assignLawyer(matterId, lawyerId)
        
        // Then
        assertNotNull(result)
        assertEquals(lawyer, result?.assignedLawyer)
        verify(matterRepository).save(any())
    }
    
    @Test
    fun `assignLawyer should throw exception for nonexistent lawyer`() {
        // Given
        val matterId = UUID.randomUUID()
        val lawyerId = UUID.randomUUID()
        val matter = createValidMatter().apply { id = matterId }
        
        whenever(matterRepository.findById(matterId)).thenReturn(Optional.of(matter))
        whenever(userRepository.findById(lawyerId)).thenReturn(Optional.empty())
        
        // Then
        assertThrows<ValidationException> {
            matterService.assignLawyer(matterId, lawyerId)
        }
    }
    
    private fun createValidMatter(): Matter {
        return Matter().apply {
            caseNumber = "2025-CV-0001"
            title = "Test Matter"
            description = "Test Description"
            status = MatterStatus.INTAKE
            clientName = "Test Client"
            clientContact = "test@example.com"
        }
    }
}