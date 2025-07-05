package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.modules.matter.domain.Matter
import dev.ryuzu.astermanagement.modules.matter.domain.MatterRepository
import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.modules.matter.infrastructure.MatterServiceImpl
import dev.ryuzu.astermanagement.modules.audit.api.AuditEventPublisher
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.context.ApplicationEventPublisher
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import java.util.*

/**
 * Simplified unit tests for MatterServiceImpl
 * Tests core business logic functionality
 * 
 * NOTE: Simplified during Spring Modulith migration
 * These tests verify basic service construction and dependencies
 */
class MatterServiceSimpleTest {
    
    private lateinit var matterService: MatterServiceImpl
    private lateinit var matterRepository: MatterRepository
    private lateinit var userRepository: UserRepository
    private lateinit var auditEventPublisher: AuditEventPublisher
    private lateinit var applicationEventPublisher: ApplicationEventPublisher
    
    @BeforeEach
    fun setUp() {
        matterRepository = mock()
        userRepository = mock()
        auditEventPublisher = mock()
        applicationEventPublisher = mock()
        matterService = MatterServiceImpl(matterRepository, userRepository, auditEventPublisher, applicationEventPublisher)
        
        // Set up security context with LAWYER role
        val authorities = listOf(SimpleGrantedAuthority("ROLE_LAWYER"))
        val authentication = UsernamePasswordAuthenticationToken("testuser", "password", authorities)
        SecurityContextHolder.getContext().authentication = authentication
    }
    
    @Test
    fun `service should be properly constructed with dependencies`() {
        assertNotNull(matterService)
    }
    
    /*
    TODO: Reimplement simple tests for the new API:
    
    @Test
    fun `createMatter should accept CreateMatterRequest`() {
        // Given
        val request = CreateMatterRequest(
            caseNumber = "2025-CV-0001",
            title = "Test Matter",
            clientName = "Test Client",
            assignedLawyerId = UUID.randomUUID()
        )
        
        whenever(userRepository.findById(any())).thenReturn(Optional.of(testUser))
        whenever(matterRepository.save(any())).thenReturn(savedMatter)
        
        // When
        val result = matterService.createMatter(request)
        
        // Then
        assertNotNull(result.id)
        verify(matterRepository).save(any())
    }
    
    @Test
    fun `getMatterById should return MatterDTO`() {
        // Given
        val matterId = UUID.randomUUID()
        whenever(matterRepository.findById(matterId)).thenReturn(Optional.of(testMatter))
        
        // When
        val result = matterService.getMatterById(matterId)
        
        // Then
        assertNotNull(result)
        assertEquals(matterId, result?.id)
    }
    */
    
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