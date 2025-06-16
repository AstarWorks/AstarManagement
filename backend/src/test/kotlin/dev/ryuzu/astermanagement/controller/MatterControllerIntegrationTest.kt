package dev.ryuzu.astermanagement.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import dev.ryuzu.astermanagement.config.SecurityConfiguration
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.dto.matter.CreateMatterRequest
import dev.ryuzu.astermanagement.dto.matter.UpdateMatterRequest
import dev.ryuzu.astermanagement.dto.matter.UpdateMatterStatusRequest
import dev.ryuzu.astermanagement.service.MatterService
import dev.ryuzu.astermanagement.testutil.TestDataFactory
import io.mockk.every
import io.mockk.verify
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.http.MediaType
import org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document
import org.springframework.restdocs.operation.preprocess.Preprocessors.*
import org.springframework.restdocs.payload.PayloadDocumentation.*
import org.springframework.restdocs.request.RequestDocumentation.*
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.util.*

/**
 * Integration tests for MatterController using MockMvc
 * Tests the web layer with security context and request/response handling
 */
@WebMvcTest(MatterController::class)
@Import(SecurityConfiguration::class)
@ActiveProfiles("test")
@DisplayName("Matter Controller Integration Tests")
class MatterControllerIntegrationTest {
    
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @Autowired
    private lateinit var objectMapper: ObjectMapper
    
    @MockkBean
    private lateinit var matterService: MatterService
    
    @Nested
    @DisplayName("Create Matter Endpoint Tests")
    inner class CreateMatterTests {
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Should create matter successfully with valid request")
        fun `POST-matters should create matter when data is valid`() {
            // Given
            val request = CreateMatterRequest(
                caseNumber = "2025-CV-0001",
                title = "Contract Dispute",
                description = "Contract dispute with vendor",
                clientName = "ABC Corporation",
                clientContact = "legal@abc.com",
                status = MatterStatus.INTAKE
            )
            
            val createdMatter = TestDataFactory.createTestMatter(
                id = UUID.randomUUID(),
                caseNumber = request.caseNumber,
                title = request.title,
                description = request.description!!,
                clientName = request.clientName,
                clientContact = request.clientContact!!,
                status = request.status!!
            )
            
            every { matterService.createMatter(any()) } returns createdMatter
            
            // When & Then
            mockMvc.perform(
                post("/v1/matters")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .with(csrf())
            )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.caseNumber").value(request.caseNumber))
            .andExpect(jsonPath("$.title").value(request.title))
            .andExpect(jsonPath("$.status").value(request.status.toString()))
            .andDo(
                document("matters-create",
                    preprocessRequest(prettyPrint()),
                    preprocessResponse(prettyPrint()),
                    requestFields(
                        fieldWithPath("caseNumber").description("Unique case number for the matter"),
                        fieldWithPath("title").description("Title of the legal matter"),
                        fieldWithPath("description").description("Detailed description of the matter"),
                        fieldWithPath("clientName").description("Name of the client"),
                        fieldWithPath("clientContact").description("Client contact information"),
                        fieldWithPath("status").description("Initial status of the matter")
                    ),
                    responseFields(
                        fieldWithPath("id").description("Unique identifier of the created matter"),
                        fieldWithPath("caseNumber").description("Case number of the matter"),
                        fieldWithPath("title").description("Title of the matter"),
                        fieldWithPath("description").description("Description of the matter"),
                        fieldWithPath("status").description("Current status of the matter"),
                        fieldWithPath("clientName").description("Client name"),
                        fieldWithPath("clientContact").description("Client contact information"),
                        fieldWithPath("createdAt").description("Creation timestamp"),
                        fieldWithPath("updatedAt").description("Last update timestamp")
                    )
                )
            )
            
            verify { matterService.createMatter(any()) }
        }
        
        @Test
        @WithMockUser(roles = ["LAWYER"])  
        @DisplayName("Should return 400 for invalid request data")
        fun `POST-matters should return bad request for invalid data`() {
            // Given - request with missing required fields
            val invalidRequest = CreateMatterRequest(
                caseNumber = "", // Invalid empty case number
                title = "Valid Title",
                clientName = "Valid Client"
            )
            
            // When & Then
            mockMvc.perform(
                post("/v1/matters")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(invalidRequest))
                    .with(csrf())
            )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.type").value("about:blank"))
            .andExpect(jsonPath("$.title").value("Bad Request"))
            .andExpect(jsonPath("$.status").value(400))
        }
        
        @Test
        @WithMockUser(roles = ["CLIENT"])
        @DisplayName("Should return 403 for insufficient permissions")  
        fun `POST-matters should return forbidden for client role`() {
            // Given
            val request = CreateMatterRequest(
                caseNumber = "2025-CV-0001",
                title = "Contract Dispute", 
                clientName = "ABC Corporation"
            )
            
            // When & Then
            mockMvc.perform(
                post("/v1/matters")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .with(csrf())
            )
            .andExpect(status().isForbidden)
        }
        
        @Test
        @DisplayName("Should return 401 for unauthenticated requests")
        fun `POST-matters should return unauthorized without authentication`() {
            // Given
            val request = CreateMatterRequest(
                caseNumber = "2025-CV-0001",
                title = "Contract Dispute",
                clientName = "ABC Corporation"
            )
            
            // When & Then
            mockMvc.perform(
                post("/v1/matters")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isUnauthorized)
        }
    }
    
    @Nested
    @DisplayName("Get Matters Endpoint Tests")
    inner class GetMattersTests {
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Should return paginated matters list")
        fun `GET-matters should return paginated list with default parameters`() {
            // Given
            val matters = TestDataFactory.createMatterList(3)
            val pageable = PageRequest.of(0, 20) // Default pagination
            val page = PageImpl(matters, pageable, matters.size.toLong())
            
            every { matterService.getAllMatters(any(), null, null) } returns page
            
            // When & Then
            mockMvc.perform(
                get("/v1/matters")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
            .andExpect(jsonPath("$.content.length()").value(3))
            .andExpect(jsonPath("$.totalElements").value(3))
            .andExpect(jsonPath("$.totalPages").value(1))
            .andExpect(jsonPath("$.first").value(true))
            .andExpect(jsonPath("$.last").value(true))
            .andDo(
                document("matters-list",
                    preprocessResponse(prettyPrint()),
                    requestParameters(
                        parameterWithName("page").description("Page number (0-based)").optional(),
                        parameterWithName("size").description("Page size (max 100)").optional(),
                        parameterWithName("status").description("Filter by matter status").optional(),
                        parameterWithName("search").description("Search in title and case number").optional()
                    ),
                    responseFields(
                        fieldWithPath("content[]").description("Array of matters"),
                        fieldWithPath("content[].id").description("Matter ID"),
                        fieldWithPath("content[].caseNumber").description("Case number"),
                        fieldWithPath("content[].title").description("Matter title"),
                        fieldWithPath("content[].status").description("Matter status"),
                        fieldWithPath("totalElements").description("Total number of elements"),
                        fieldWithPath("totalPages").description("Total number of pages"),
                        fieldWithPath("size").description("Page size"),
                        fieldWithPath("number").description("Current page number"),
                        fieldWithPath("first").description("Is first page"),
                        fieldWithPath("last").description("Is last page"),
                        fieldWithPath("numberOfElements").description("Number of elements in current page")
                    )
                )
            )
            
            verify { matterService.getAllMatters(any(), null, null) }
        }
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Should filter matters by status")
        fun `GET-matters should filter by status parameter`() {
            // Given
            val status = MatterStatus.INTAKE
            val matters = listOf(TestDataFactory.createTestMatter(status = status))
            val pageable = PageRequest.of(0, 20)
            val page = PageImpl(matters, pageable, 1)
            
            every { matterService.getAllMatters(any(), status, null) } returns page
            
            // When & Then
            mockMvc.perform(
                get("/v1/matters")
                    .param("status", status.toString())
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].status").value(status.toString()))
            
            verify { matterService.getAllMatters(any(), status, null) }
        }
        
        @Test
        @WithMockUser(roles = ["CLERK"])
        @DisplayName("Should allow clerk access to matters list")
        fun `GET-matters should allow clerk role access`() {
            // Given
            val matters = TestDataFactory.createMatterList(2)
            val pageable = PageRequest.of(0, 20)
            val page = PageImpl(matters, pageable, 2)
            
            every { matterService.getAllMatters(any(), null, null) } returns page
            
            // When & Then
            mockMvc.perform(
                get("/v1/matters")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content.length()").value(2))
        }
    }
    
    @Nested
    @DisplayName("Get Matter By ID Endpoint Tests")
    inner class GetMatterByIdTests {
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Should return matter when it exists")
        fun `GET-matters-id should return matter when found`() {
            // Given
            val matterId = UUID.randomUUID()
            val matter = TestDataFactory.createTestMatter(id = matterId)
            
            every { matterService.getMatterById(matterId) } returns matter
            
            // When & Then
            mockMvc.perform(
                get("/v1/matters/{id}", matterId)
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(matterId.toString()))
            .andExpect(jsonPath("$.caseNumber").value(matter.caseNumber))
            .andExpect(jsonPath("$.title").value(matter.title))
            .andDo(
                document("matters-get-by-id",
                    preprocessResponse(prettyPrint()),
                    pathParameters(
                        parameterWithName("id").description("Unique identifier of the matter")
                    ),
                    responseFields(
                        fieldWithPath("id").description("Matter ID"),
                        fieldWithPath("caseNumber").description("Case number"),
                        fieldWithPath("title").description("Matter title"),
                        fieldWithPath("description").description("Matter description"),
                        fieldWithPath("status").description("Current status"),
                        fieldWithPath("clientName").description("Client name"),
                        fieldWithPath("clientContact").description("Client contact"),
                        fieldWithPath("createdAt").description("Creation timestamp"),
                        fieldWithPath("updatedAt").description("Last update timestamp")
                    )
                )
            )
            
            verify { matterService.getMatterById(matterId) }
        }
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Should return 404 when matter not found")
        fun `GET-matters-id should return not found when matter does not exist`() {
            // Given
            val matterId = UUID.randomUUID()
            
            every { matterService.getMatterById(matterId) } returns null
            
            // When & Then
            mockMvc.perform(
                get("/v1/matters/{id}", matterId)
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isNotFound)
            
            verify { matterService.getMatterById(matterId) }
        }
    }
    
    @Nested
    @DisplayName("Update Matter Status Endpoint Tests")
    inner class UpdateMatterStatusTests {
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Should update matter status successfully")
        fun `PUT-matters-id-status should update status with valid data`() {
            // Given
            val matterId = UUID.randomUUID()
            val request = UpdateMatterStatusRequest(
                status = MatterStatus.INITIAL_REVIEW,
                reason = "Moving to initial review phase"
            )
            val updatedMatter = TestDataFactory.createTestMatter(
                id = matterId,
                status = request.status
            )
            
            every { matterService.updateMatterStatus(any(), any(), any(), any()) } returns updatedMatter
            
            // When & Then
            mockMvc.perform(
                put("/v1/matters/{id}/status", matterId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .with(csrf())
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(matterId.toString()))
            .andExpect(jsonPath("$.status").value(request.status.toString()))
            .andDo(
                document("matters-update-status",
                    preprocessRequest(prettyPrint()),
                    preprocessResponse(prettyPrint()),
                    pathParameters(
                        parameterWithName("id").description("Unique identifier of the matter")
                    ),
                    requestFields(
                        fieldWithPath("status").description("New status for the matter"),
                        fieldWithPath("reason").description("Reason for the status change")
                    ),
                    responseFields(
                        fieldWithPath("id").description("Matter ID"),
                        fieldWithPath("status").description("Updated status"),
                        fieldWithPath("caseNumber").description("Case number"),
                        fieldWithPath("title").description("Matter title")
                    )
                )
            )
            
            verify { matterService.updateMatterStatus(matterId, request.status, request.reason, any()) }
        }
        
        @Test
        @WithMockUser(roles = ["CLERK"])
        @DisplayName("Should restrict status updates for clerk role")
        fun `PUT-matters-id-status should restrict clerk access to certain status transitions`() {
            // Given
            val matterId = UUID.randomUUID()
            val request = UpdateMatterStatusRequest(
                status = MatterStatus.CLOSED,
                reason = "Closing matter"
            )
            
            // When & Then - Clerk should not be able to close matters
            mockMvc.perform(
                put("/v1/matters/{id}/status", matterId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .with(csrf())
            )
            .andExpect(status().isForbidden)
        }
    }
    
    @Nested
    @DisplayName("Performance and Load Tests")
    inner class PerformanceTests {
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Should handle large paginated requests efficiently")
        fun `GET-matters should perform well with large page sizes`() {
            // Given
            val matters = TestDataFactory.createMatterList(100)
            val pageable = PageRequest.of(0, 100)
            val page = PageImpl(matters, pageable, 1000)
            
            every { matterService.getAllMatters(any(), null, null) } returns page
            
            val startTime = System.currentTimeMillis()
            
            // When
            mockMvc.perform(
                get("/v1/matters")
                    .param("size", "100")
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content.length()").value(100))
            
            // Then - Should complete within performance threshold
            val duration = System.currentTimeMillis() - startTime
            assert(duration < 200) { "Request took too long: ${duration}ms" }
        }
    }
}