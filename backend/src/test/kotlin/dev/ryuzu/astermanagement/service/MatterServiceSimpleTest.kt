package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.service.AuditService
import dev.ryuzu.astermanagement.service.exception.*
import dev.ryuzu.astermanagement.service.impl.MatterServiceImpl
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.*
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import java.util.*

/**
 * Simplified unit tests for MatterServiceImpl
 * Tests core business logic functionality
 */
class MatterServiceSimpleTest {
    
    private lateinit var matterService: MatterServiceImpl
    private lateinit var matterRepository: MatterRepository
    private lateinit var userRepository: UserRepository
    private lateinit var auditService: AuditService
    private lateinit var auditEventPublisher: AuditEventPublisher
    private lateinit var statusTransitionService: StatusTransitionService
    
    @BeforeEach
    fun setUp() {
        matterRepository = mock()
        userRepository = mock()
        auditService = mock()
        auditEventPublisher = mock()
        statusTransitionService = mock()
        matterService = MatterServiceImpl(matterRepository, userRepository, auditService, auditEventPublisher, statusTransitionService)
        
        // Set up security context with LAWYER role
        val authorities = listOf(SimpleGrantedAuthority("ROLE_LAWYER"))
        val authentication = UsernamePasswordAuthenticationToken("testuser", "password", authorities)
        SecurityContextHolder.getContext().authentication = authentication
    }
    
    @Test
    fun `createMatter should save matter when valid`() {
        // Given
        val matter = createValidMatter()
        val savedMatter = createValidMatter()
        savedMatter.id = UUID.randomUUID()
        
        whenever(matterRepository.existsByCaseNumber(matter.caseNumber)).thenReturn(false)
        whenever(matterRepository.save(any())).thenReturn(savedMatter)
        
        // When
        val result = matterService.createMatter(matter)
        
        // Then
        assertNotNull(result.id)
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
    }
    
    @Test
    fun `getMatterById should return matter when exists`() {
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
    fun `existsByCaseNumber should delegate to repository`() {
        // Given
        val caseNumber = "2025-CV-0001"
        whenever(matterRepository.existsByCaseNumber(caseNumber)).thenReturn(true)
        
        // When & Then
        assertTrue(matterService.existsByCaseNumber(caseNumber))
        verify(matterRepository).existsByCaseNumber(caseNumber)
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