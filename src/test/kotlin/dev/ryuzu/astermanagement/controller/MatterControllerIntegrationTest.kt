package dev.ryuzu.astermanagement.controller

import com.fasterxml.jackson.databind.ObjectMapper
import dev.ryuzu.astermanagement.domain.Matter
import dev.ryuzu.astermanagement.domain.MatterStatus
import dev.ryuzu.astermanagement.dto.matter.CreateMatterRequest
import dev.ryuzu.astermanagement.dto.matter.UpdateMatterRequest
import dev.ryuzu.astermanagement.dto.matter.UpdateMatterStatusRequest
import dev.ryuzu.astermanagement.service.MatterService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.OffsetDateTime

/**
 * Integration tests for MatterController.
 * Tests the REST API endpoints with mocked service layer.
 */
@WebMvcTest(MatterController::class)
class MatterControllerIntegrationTest {
    
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @Autowired
    private lateinit var objectMapper: ObjectMapper
    
    @MockBean
    private lateinit var matterService: MatterService
    
    private lateinit var sampleMatter: Matter
    private lateinit var createRequest: CreateMatterRequest
    private lateinit var updateRequest: UpdateMatterRequest
    
    @BeforeEach
    fun setUp() {
        val now = OffsetDateTime.now()
        
        sampleMatter = Matter(
            id = 1L,
            caseNumber = "2025-CV-0001",
            title = "Sample Contract Dispute",
            description = "A contract dispute case",
            status = MatterStatus.ACTIVE,
            clientName = "John Doe",
            clientContact = "john.doe@example.com",
            opponentName = "Jane Smith",
            opponentContact = "jane.smith@example.com",
            assignedLawyerId = 1L,
            courtName = "District Court",
            courtCaseNumber = "DC-2025-001",
            filingDeadline = now.plusDays(30),
            nextHearingDate = now.plusDays(14),
            createdAt = now,
            updatedAt = now,
            createdByUserId = 1L,
            updatedByUserId = 1L
        )
        
        createRequest = CreateMatterRequest(
            caseNumber = "2025-CV-0002",
            title = "New Contract Dispute",
            description = "Another contract dispute case",
            clientName = "Alice Johnson",
            clientContact = "alice.johnson@example.com",
            opponentName = "Bob Wilson",
            opponentContact = "bob.wilson@example.com",
            assignedLawyerId = 1L,
            courtName = "District Court",
            courtCaseNumber = "DC-2025-002",
            filingDeadline = now.plusDays(60),
            nextHearingDate = now.plusDays(28),
            status = MatterStatus.ACTIVE
        )
        
        updateRequest = UpdateMatterRequest(
            title = "Updated Contract Dispute",
            description = "Updated description",
            clientName = "John Doe Jr.",
            clientContact = "john.doe.jr@example.com",
            opponentName = "Jane Smith Sr.",
            opponentContact = "jane.smith.sr@example.com",
            assignedLawyerId = 2L,
            courtName = "Superior Court",
            courtCaseNumber = "SC-2025-001",
            filingDeadline = now.plusDays(45),
            nextHearingDate = now.plusDays(21)
        )
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `createMatter should create and return matter when valid request`() {
        // Given
        `when`(matterService.existsByCaseNumber(createRequest.caseNumber)).thenReturn(false)
        `when`(matterService.createMatter(any(Matter::class.java))).thenReturn(sampleMatter)
        
        // When & Then
        mockMvc.perform(
            post("/api/v1/matters")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
        )
            .andExpect(status().isCreated)
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.id").value(sampleMatter.id))
            .andExpect(jsonPath("$.caseNumber").value(sampleMatter.caseNumber))
            .andExpect(jsonPath("$.title").value(sampleMatter.title))
            .andExpect(jsonPath("$.status").value(sampleMatter.status.name))
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `createMatter should return conflict when case number exists`() {
        // Given
        `when`(matterService.existsByCaseNumber(createRequest.caseNumber)).thenReturn(true)
        
        // When & Then
        mockMvc.perform(
            post("/api/v1/matters")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
        )
            .andExpect(status().isConflict)
    }
    
    @Test
    @WithMockUser(roles = ["CLERK"])
    fun `createMatter should return forbidden for clerk role`() {
        // When & Then
        mockMvc.perform(
            post("/api/v1/matters")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
        )
            .andExpect(status().isForbidden)
    }
    
    @Test
    fun `createMatter should return unauthorized when not authenticated`() {
        // When & Then
        mockMvc.perform(
            post("/api/v1/matters")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
        )
            .andExpect(status().isUnauthorized)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `createMatter should return bad request when validation fails`() {
        // Given
        val invalidRequest = createRequest.copy(
            caseNumber = "invalid-format",
            title = "",
            clientName = ""
        )
        
        // When & Then
        mockMvc.perform(
            post("/api/v1/matters")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest))
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.message").exists())
            .andExpect(jsonPath("$.details").isArray)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `getMatterById should return matter when exists`() {
        // Given
        `when`(matterService.getMatterById(1L)).thenReturn(sampleMatter)
        
        // When & Then
        mockMvc.perform(get("/api/v1/matters/1"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(sampleMatter.id))
            .andExpect(jsonPath("$.caseNumber").value(sampleMatter.caseNumber))
            .andExpect(jsonPath("$.title").value(sampleMatter.title))
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `getMatterById should return not found when matter does not exist`() {
        // Given
        `when`(matterService.getMatterById(999L)).thenReturn(null)
        
        // When & Then
        mockMvc.perform(get("/api/v1/matters/999"))
            .andExpect(status().isNotFound)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `getAllMatters should return paginated list`() {
        // Given
        val matters = listOf(sampleMatter)
        val page = PageImpl(matters, PageRequest.of(0, 20), 1L)
        `when`(matterService.getAllMatters(any(), any(), any())).thenReturn(page)
        
        // When & Then
        mockMvc.perform(
            get("/api/v1/matters")
                .param("page", "0")
                .param("size", "20")
                .param("sort", "createdAt,desc")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data").isArray)
            .andExpect(jsonPath("$.data[0].id").value(sampleMatter.id))
            .andExpect(jsonPath("$.page.number").value(0))
            .andExpect(jsonPath("$.page.size").value(20))
            .andExpect(jsonPath("$.page.totalElements").value(1))
    }
    
    @Test
    @WithMockUser(roles = ["CLIENT"])
    fun `getAllMatters should return forbidden for client role`() {
        // When & Then
        mockMvc.perform(get("/api/v1/matters"))
            .andExpect(status().isForbidden)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `updateMatter should update and return matter when valid`() {
        // Given
        val updatedMatter = sampleMatter.copy(title = updateRequest.title)
        `when`(matterService.getMatterById(1L)).thenReturn(sampleMatter)
        `when`(matterService.updateMatter(eq(1L), any(Matter::class.java))).thenReturn(updatedMatter)
        
        // When & Then
        mockMvc.perform(
            put("/api/v1/matters/1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.title").value(updateRequest.title))
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `updateMatter should return not found when matter does not exist`() {
        // Given
        `when`(matterService.getMatterById(999L)).thenReturn(null)
        
        // When & Then
        mockMvc.perform(
            put("/api/v1/matters/999")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
        )
            .andExpect(status().isNotFound)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `updateMatterStatus should update status when valid transition`() {
        // Given
        val statusRequest = UpdateMatterStatusRequest(
            status = MatterStatus.CLOSED,
            comment = "Case resolved"
        )
        val updatedMatter = sampleMatter.copy(status = MatterStatus.CLOSED)
        `when`(matterService.updateMatterStatus(eq(1L), eq(MatterStatus.CLOSED), eq("Case resolved"), any()))
            .thenReturn(updatedMatter)
        
        // When & Then
        mockMvc.perform(
            patch("/api/v1/matters/1/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusRequest))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("CLOSED"))
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `updateMatterStatus should return bad request when invalid transition`() {
        // Given
        val statusRequest = UpdateMatterStatusRequest(status = MatterStatus.CLOSED)
        `when`(matterService.updateMatterStatus(any(), any(), any(), any()))
            .thenThrow(IllegalStateException("Invalid status transition"))
        
        // When & Then
        mockMvc.perform(
            patch("/api/v1/matters/1/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusRequest))
        )
            .andExpect(status().isBadRequest)
    }
    
    @Test
    @WithMockUser(roles = ["CLERK"])
    fun `updateMatterStatus should return forbidden for clerk role`() {
        // Given
        val statusRequest = UpdateMatterStatusRequest(status = MatterStatus.CLOSED)
        
        // When & Then
        mockMvc.perform(
            patch("/api/v1/matters/1/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusRequest))
        )
            .andExpect(status().isForbidden)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `deleteMatter should return no content when successful`() {
        // Given
        `when`(matterService.deleteMatter(1L)).thenReturn(true)
        
        // When & Then
        mockMvc.perform(
            delete("/api/v1/matters/1")
                .with(csrf())
        )
            .andExpect(status().isNoContent)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `deleteMatter should return not found when matter does not exist`() {
        // Given
        `when`(matterService.deleteMatter(999L)).thenReturn(false)
        
        // When & Then
        mockMvc.perform(
            delete("/api/v1/matters/999")
                .with(csrf())
        )
            .andExpect(status().isNotFound)
    }
    
    @Test
    @WithMockUser(roles = ["CLERK"])
    fun `deleteMatter should return forbidden for clerk role`() {
        // When & Then
        mockMvc.perform(
            delete("/api/v1/matters/1")
                .with(csrf())
        )
            .andExpect(status().isForbidden)
    }
}