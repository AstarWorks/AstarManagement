package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.domain.document.DocumentRepository
import dev.ryuzu.astermanagement.domain.document.DocumentStatus
import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.service.DocumentService
// import dev.ryuzu.astermanagement.test.SecurityTestConfiguration
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.transaction.annotation.Transactional

/**
 * Integration tests for DocumentController
 * Tests file upload functionality with proper authentication and validation
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@TestPropertySource(properties = [
    "aster.upload.virus-scan-enabled=false",
    "aster.upload.max-file-size=10485760", // 10MB for testing
    "aster.upload.allowed-extensions=pdf,txt,jpg",
    "aster.upload.allowed-mime-types=application/pdf,text/plain,image/jpeg"
])
// @Import(SecurityTestConfiguration::class)
class DocumentControllerIntegrationTest {
    
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @Autowired
    private lateinit var documentRepository: DocumentRepository
    
    @Autowired
    private lateinit var matterRepository: MatterRepository
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    @Autowired
    private lateinit var documentService: DocumentService
    
    @BeforeEach
    fun setUp() {
        documentRepository.deleteAll()
        // Additional test data setup would go here
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should upload single document successfully`() {
        // Arrange
        val testFile = MockMultipartFile(
            "file",
            "test-document.pdf",
            MediaType.APPLICATION_PDF_VALUE,
            "test content for PDF document".toByteArray()
        )
        
        val metadata = """
            {
                "description": "Test document upload",
                "tags": ["test", "integration"],
                "isPublic": false
            }
        """.trimIndent()
        
        // Act & Assert
        mockMvc.perform(
            multipart("/api/v1/documents/upload")
                .file(testFile)
                .param("metadata", metadata)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
        )
        .andExpect(status().isCreated)
        .andExpect(header().exists("Location"))
        .andExpect(jsonPath("$.fileName").exists())
        .andExpect(jsonPath("$.originalFileName").value("test-document.pdf"))
        .andExpect(jsonPath("$.contentType").value(MediaType.APPLICATION_PDF_VALUE))
        .andExpect(jsonPath("$.fileSize").value(testFile.size.toInt()))
        .andExpect(jsonPath("$.status").value(DocumentStatus.UPLOADING.name))
        .andExpect(jsonPath("$.description").value("Test document upload"))
        .andExpect(jsonPath("$.tags").isArray)
        .andExpect(jsonPath("$.isPublic").value(false))
    }
    
    @Test
    @WithMockUser(roles = ["CLERK"])
    fun `should upload document with clerk role`() {
        // Arrange
        val testFile = MockMultipartFile(
            "file",
            "clerk-document.txt",
            MediaType.TEXT_PLAIN_VALUE,
            "clerk uploaded document".toByteArray()
        )
        
        // Act & Assert
        mockMvc.perform(
            multipart("/api/v1/documents/upload")
                .file(testFile)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
        )
        .andExpect(status().isCreated)
        .andExpect(jsonPath("$.originalFileName").value("clerk-document.txt"))
    }
    
    @Test
    @WithMockUser(roles = ["CLIENT"])
    fun `should reject upload with client role`() {
        // Arrange
        val testFile = MockMultipartFile(
            "file",
            "client-document.txt",
            MediaType.TEXT_PLAIN_VALUE,
            "client attempted upload".toByteArray()
        )
        
        // Act & Assert
        mockMvc.perform(
            multipart("/api/v1/documents/upload")
                .file(testFile)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
        )
        .andExpect(status().isForbidden)
    }
    
    @Test
    fun `should reject upload without authentication`() {
        // Arrange
        val testFile = MockMultipartFile(
            "file",
            "anonymous-document.txt",
            MediaType.TEXT_PLAIN_VALUE,
            "anonymous upload attempt".toByteArray()
        )
        
        // Act & Assert
        mockMvc.perform(
            multipart("/api/v1/documents/upload")
                .file(testFile)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
        )
        .andExpect(status().isUnauthorized)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should reject oversized file`() {
        // Arrange - Create a file larger than the 10MB test limit
        val largeContent = ByteArray(11 * 1024 * 1024) // 11MB
        val largeFile = MockMultipartFile(
            "file",
            "large-file.pdf",
            MediaType.APPLICATION_PDF_VALUE,
            largeContent
        )
        
        // Act & Assert
        mockMvc.perform(
            multipart("/api/v1/documents/upload")
                .file(largeFile)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
        )
        .andExpect(status().isPayloadTooLarge)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should reject unsupported file type`() {
        // Arrange
        val unsupportedFile = MockMultipartFile(
            "file",
            "malicious-file.exe",
            "application/octet-stream",
            "potentially malicious content".toByteArray()
        )
        
        // Act & Assert
        mockMvc.perform(
            multipart("/api/v1/documents/upload")
                .file(unsupportedFile)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
        )
        .andExpect(status().isUnprocessableEntity)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should handle empty file upload`() {
        // Arrange
        val emptyFile = MockMultipartFile(
            "file",
            "empty-file.txt",
            MediaType.TEXT_PLAIN_VALUE,
            ByteArray(0)
        )
        
        // Act & Assert
        mockMvc.perform(
            multipart("/api/v1/documents/upload")
                .file(emptyFile)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
        )
        .andExpect(status().isUnprocessableEntity)
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should upload multiple files in batch`() {
        // Arrange
        val file1 = MockMultipartFile(
            "files",
            "batch-file-1.txt",
            MediaType.TEXT_PLAIN_VALUE,
            "first batch file".toByteArray()
        )
        
        val file2 = MockMultipartFile(
            "files",
            "batch-file-2.pdf",
            MediaType.APPLICATION_PDF_VALUE,
            "second batch file".toByteArray()
        )
        
        val batchMetadata = """
            {
                "commonTags": ["batch", "test"],
                "documentMetadata": {
                    "batch-file-1.txt": {
                        "description": "First file in batch"
                    },
                    "batch-file-2.pdf": {
                        "description": "Second file in batch"
                    }
                }
            }
        """.trimIndent()
        
        // Act & Assert
        mockMvc.perform(
            multipart("/api/v1/documents/upload/batch")
                .file(file1)
                .file(file2)
                .param("metadata", batchMetadata)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
        )
        .andExpect(status().isOk)
        .andExpect(jsonPath("$.totalFiles").value(2))
        .andExpect(jsonPath("$.successCount").value(2))
        .andExpect(jsonPath("$.failureCount").value(0))
        .andExpect(jsonPath("$.results").isArray)
        .andExpect(jsonPath("$.results.length()").value(2))
    }
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should validate file extensions properly`() {
        // Test valid extensions
        val validFiles = listOf(
            MockMultipartFile("file", "document.pdf", "application/pdf", "content".toByteArray()),
            MockMultipartFile("file", "text.txt", "text/plain", "content".toByteArray()),
            MockMultipartFile("file", "image.jpg", "image/jpeg", "content".toByteArray())
        )
        
        validFiles.forEach { file ->
            mockMvc.perform(
                multipart("/api/v1/documents/upload")
                    .file(file)
                    .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
            )
            .andExpect(status().isCreated)
        }
        
        // Test invalid extension
        val invalidFile = MockMultipartFile(
            "file",
            "script.js",
            "application/javascript",
            "alert('xss');".toByteArray()
        )
        
        mockMvc.perform(
            multipart("/api/v1/documents/upload")
                .file(invalidFile)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
        )
        .andExpect(status().isUnprocessableEntity)
    }
}