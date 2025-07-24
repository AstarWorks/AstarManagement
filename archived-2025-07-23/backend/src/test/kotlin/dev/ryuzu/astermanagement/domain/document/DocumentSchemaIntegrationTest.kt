package dev.ryuzu.astermanagement.domain.document

import dev.ryuzu.astermanagement.modules.matter.domain.Matter
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import dev.ryuzu.astermanagement.modules.matter.domain.MatterRepository
import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.domain.user.UserRole
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.LocalDate
import java.util.*
import kotlin.test.*
import dev.ryuzu.astermanagement.modules.document.domain.Document
import dev.ryuzu.astermanagement.modules.document.domain.DocumentCategory
import dev.ryuzu.astermanagement.modules.document.domain.DocumentCategoryType
import dev.ryuzu.astermanagement.modules.document.domain.DocumentStatus
import dev.ryuzu.astermanagement.modules.document.domain.DocumentTag
import dev.ryuzu.astermanagement.modules.document.domain.TagCategory

/**
 * Integration test for document schema and entity relationships
 * Verifies that document management entities can be persisted and relationships work correctly
 */
@DataJpaTest
@Testcontainers
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class DocumentSchemaIntegrationTest {

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var matterRepository: MatterRepository

    @Autowired
    private lateinit var documentRepository: dev.ryuzu.astermanagement.modules.document.domain.DocumentRepository

    @Autowired
    private lateinit var documentCategoryRepository: dev.ryuzu.astermanagement.modules.document.domain.DocumentCategoryRepository

    @Autowired
    private lateinit var documentTagRepository: dev.ryuzu.astermanagement.modules.document.domain.DocumentTagRepository

    @Test
    fun `should create and persist document category with hierarchical structure`() {
        // Given - Create parent category
        val parentCategory = DocumentCategory().apply {
            code = "CIVIL_LIT"
            name = "Civil Litigation"
            nameJa = "民事訴訟"
            description = "Civil court proceedings"
            categoryType = DocumentCategoryType.SYSTEM
            colorHex = "#3B82F6"
            sortOrder = 10
        }
        val savedParent = documentCategoryRepository.save(parentCategory)

        // Given - Create child category
        val childCategory = DocumentCategory()
        childCategory.code = "PLEADINGS"
        childCategory.name = "Pleadings"
        childCategory.nameJa = "訴答書面"
        childCategory.description = "Court pleadings and motions"
        childCategory.parentCategory = savedParent
        childCategory.categoryType = DocumentCategoryType.SYSTEM
        childCategory.colorHex = "#3B82F6"
        childCategory.sortOrder = 10

        // When
        val savedChild = documentCategoryRepository.save(childCategory)
        
        // Refresh parent to get updated child relationships
        val refreshedParent = documentCategoryRepository.findById(savedParent.id!!).get()

        // Then
        assertNotNull(savedParent.id)
        assertNotNull(savedChild.id)
        assertEquals("CIVIL_LIT", savedParent.code)
        assertEquals("PLEADINGS", savedChild.code)
        assertEquals(savedParent.id, savedChild.parentCategory?.id)
        assertTrue(refreshedParent.childCategories.contains(savedChild))
        assertTrue(savedChild.getPath().contains("Civil Litigation > Pleadings"))
        assertTrue(savedParent.isRootCategory())
        assertFalse(savedChild.isRootCategory())
    }

    @Test
    fun `should create and persist enhanced document tag with usage tracking`() {
        // Given
        val tag = DocumentTag().apply {
            name = "urgent"
            displayLabel = "Urgent"
            nameJa = "緊急"
            description = "Requires immediate attention"
            tagCategory = TagCategory.PRIORITY
            colorHex = "#EF4444"
            iconName = "AlertTriangle"
            sortOrder = 10
        }

        // When
        val savedTag = documentTagRepository.save(tag)

        // Then
        assertNotNull(savedTag.id)
        assertEquals("urgent", savedTag.name)
        assertEquals("Urgent", savedTag.displayLabel)
        assertEquals("緊急", savedTag.nameJa)
        assertEquals(TagCategory.PRIORITY, savedTag.tagCategory)
        assertEquals("#EF4444", savedTag.colorHex)
        assertEquals(0, savedTag.usageCount)
        assertTrue(savedTag.active)
        assertFalse(savedTag.isSystemTag()) // This is USER_DEFINED by default
    }

    @Test
    fun `should create and persist document with complete relationships`() {
        // Given - Create prerequisites
        val user = createTestUser("docuser", UserRole.LAWYER)
        val matter = createTestMatter("2025-DOC-001", user)
        
        val category = DocumentCategory().apply {
            code = "CONTRACTS"
            name = "Contracts"
            categoryType = DocumentCategoryType.LEGAL_SPECIFIC
        }
        val savedCategory = documentCategoryRepository.save(category)

        val tag = DocumentTag().apply {
            name = "important"
            tagCategory = TagCategory.PRIORITY
            colorHex = "#F59E0B"
        }
        val savedTag = documentTagRepository.save(tag)

        // Given - Create document
        val document = Document()
        document.fileId = UUID.randomUUID().toString()
        document.fileName = "contract_2025.pdf"
        document.originalFileName = "Contract_Agreement_2025.pdf"
        document.contentType = "application/pdf"
        document.fileSize = 1024000L
        document.storagePath = "/documents/contract_2025.pdf"
        document.status = DocumentStatus.AVAILABLE
        document.matter = matter
        document.uploadedBy = user
        document.category = savedCategory
        document.title = "Service Agreement Contract"
        document.description = "Annual service agreement with vendor"
        document.extractedText = "This agreement is entered into between..."
        document.pageCount = 15
        document.wordCount = 2500
        document.isPublic = false
        document.isConfidential = true
        document.checksum = "sha256:abc123def456"
        document.versionNumber = 1
        // When
        val savedDocument = documentRepository.save(document)
        savedDocument.addTag(savedTag)
        savedDocument.addSimpleTag("contract")
        val finalDocument = documentRepository.save(savedDocument)

        // Then - Verify document properties
        assertNotNull(finalDocument.id)
        assertEquals("contract_2025.pdf", finalDocument.fileName)
        assertEquals("Contract_Agreement_2025.pdf", finalDocument.originalFileName)
        assertEquals("application/pdf", finalDocument.contentType)
        assertEquals(1024000L, finalDocument.fileSize)
        assertEquals(DocumentStatus.AVAILABLE, finalDocument.status)
        assertEquals(matter.id, finalDocument.matter?.id)
        assertEquals(user.id, finalDocument.uploadedBy?.id)
        assertEquals(savedCategory.id, finalDocument.category?.id)
        assertEquals("Service Agreement Contract", finalDocument.title)
        assertEquals(15, finalDocument.pageCount)
        assertEquals(2500, finalDocument.wordCount)
        assertTrue(finalDocument.isConfidential)
        assertFalse(finalDocument.isPublic)

        // Then - Verify tag relationships
        assertTrue(finalDocument.tagEntities.contains(savedTag))
        assertTrue(finalDocument.tags.contains("contract"))
        assertTrue(finalDocument.hasTag("important"))
        assertTrue(finalDocument.hasTag("contract"))
        assertEquals(2, finalDocument.getAllTagNames().size)

        // Then - Verify utility methods
        assertEquals("Service Agreement Contract", finalDocument.getDisplayTitle())
        assertTrue(finalDocument.isConfidentialDocument())
        assertEquals("Contracts", finalDocument.getCategoryPath())
        assertTrue(finalDocument.isSearchable())
        assertEquals("pdf", finalDocument.getFileExtension())
        assertFalse(finalDocument.isVersionedDocument())
        assertTrue(finalDocument.isLatestVersion())
    }

    @Test
    fun `should support document versioning correctly`() {
        // Given - Create prerequisites
        val user = createTestUser("versionuser", UserRole.LAWYER)
        val matter = createTestMatter("2025-VER-001", user)

        // Given - Create original document
        val originalDocument = Document()
        originalDocument.fileId = UUID.randomUUID().toString()
        originalDocument.fileName = "agreement_v1.pdf"
        originalDocument.originalFileName = "Agreement_v1.pdf"
        originalDocument.contentType = "application/pdf"
        originalDocument.fileSize = 500000L
        originalDocument.storagePath = "/documents/agreement_v1.pdf"
        originalDocument.status = DocumentStatus.AVAILABLE
        originalDocument.matter = matter
        originalDocument.uploadedBy = user
        originalDocument.title = "Original Agreement"
        originalDocument.versionNumber = 1
        val savedOriginal = documentRepository.save(originalDocument)

        // Given - Create new version
        val newVersion = Document()
        newVersion.fileId = UUID.randomUUID().toString()
        newVersion.fileName = "agreement_v2.pdf"
        newVersion.originalFileName = "Agreement_v2.pdf"
        newVersion.contentType = "application/pdf"
        newVersion.fileSize = 520000L
        newVersion.storagePath = "/documents/agreement_v2.pdf"
        newVersion.status = DocumentStatus.AVAILABLE
        newVersion.matter = matter
        newVersion.uploadedBy = user
        newVersion.title = "Updated Agreement"
        newVersion.versionNumber = 2
        newVersion.parentDocument = savedOriginal

        // When
        val savedNewVersion = documentRepository.save(newVersion)
        
        // Refresh original to get updated version relationships
        val refreshedOriginal = documentRepository.findById(savedOriginal.id!!).get()

        // Then - Verify version relationships
        assertEquals(savedOriginal.id, savedNewVersion.parentDocument?.id)
        assertTrue(refreshedOriginal.versions.contains(savedNewVersion))
        assertFalse(savedOriginal.isVersionedDocument())
        assertTrue(savedNewVersion.isVersionedDocument())
        assertTrue(savedOriginal.isLatestVersion()) // Original is still latest until we update the query
        assertTrue(savedNewVersion.isLatestVersion()) // New version should be latest
    }

    @Test
    fun `should find documents by category hierarchy`() {
        // Given - Create category hierarchy
        val parentCategory = DocumentCategory().apply {
            code = "LEGAL_DOCS"
            name = "Legal Documents"
            categoryType = DocumentCategoryType.SYSTEM
        }
        val savedParent = documentCategoryRepository.save(parentCategory)

        val childCategory = DocumentCategory()
        childCategory.code = "COURT_DOCS"
        childCategory.name = "Court Documents"
        childCategory.parentCategory = savedParent
        childCategory.categoryType = DocumentCategoryType.LEGAL_SPECIFIC
        val savedChild = documentCategoryRepository.save(childCategory)

        // Given - Create documents
        val user = createTestUser("hierarchyuser", UserRole.LAWYER)
        val matter = createTestMatter("2025-HIE-001", user)

        val parentDoc = createTestDocument("parent_doc.pdf", user, matter, savedParent)
        val childDoc = createTestDocument("child_doc.pdf", user, matter, savedChild)

        // When
        val parentCategoryDocs = documentRepository.findByCategory(savedParent)
        val childCategoryDocs = documentRepository.findByCategory(savedChild)
        val hierarchyDocs = documentRepository.findByCategoryHierarchy(savedParent)

        // Then
        assertEquals(1, parentCategoryDocs.size)
        assertEquals(1, childCategoryDocs.size)
        assertEquals(2, hierarchyDocs.size) // Should include both parent and child category docs
        assertTrue(hierarchyDocs.contains(parentDoc))
        assertTrue(hierarchyDocs.contains(childDoc))
    }

    @Test
    fun `should handle tag usage tracking automatically`() {
        // Given
        val tag = DocumentTag().apply {
            name = "test-tag"
            tagCategory = TagCategory.USER_DEFINED
        }
        val savedTag = documentTagRepository.save(tag)
        assertEquals(0, savedTag.usageCount)

        // Given - Create document with tag
        val user = createTestUser("taguser", UserRole.LAWYER)
        val matter = createTestMatter("2025-TAG-001", user)
        val document = createTestDocument("tagged_doc.pdf", user, matter)
        val savedDocument = documentRepository.save(document)
        savedDocument.addTag(savedTag)

        // When
        documentRepository.save(savedDocument)

        // Then - Tag usage should be incremented automatically by trigger
        val updatedTag = documentTagRepository.findById(savedTag.id!!).orElse(null)
        assertNotNull(updatedTag)
        assertEquals(1, updatedTag.usageCount)
        assertNotNull(updatedTag.lastUsedAt)
    }

    @Test
    fun `should find documents using enhanced queries`() {
        // Given - Create test data
        val user = createTestUser("queryuser", UserRole.LAWYER)
        val matter = createTestMatter("2025-QRY-001", user)
        
        val urgentTag = DocumentTag().apply {
            name = "urgent"
            tagCategory = TagCategory.PRIORITY
        }
        val savedUrgentTag = documentTagRepository.save(urgentTag)

        val confidentialDoc = createTestDocument("confidential.pdf", user, matter)
        confidentialDoc.isConfidential = true
        val savedConfidentialDoc = documentRepository.save(confidentialDoc)
        savedConfidentialDoc.addTag(savedUrgentTag)
        
        val normalDoc = createTestDocument("normal.pdf", user, matter)
        normalDoc.isConfidential = false

        val finalConfidentialDoc = documentRepository.save(savedConfidentialDoc)
        val finalNormalDoc = documentRepository.save(normalDoc)

        // When - Test various queries
        val urgentDocs = documentRepository.findByEnhancedTag(savedUrgentTag)
        val confidentialDocs = documentRepository.findConfidentialDocuments()
        val matterDocs = documentRepository.findByMatter(matter)

        // Then
        assertEquals(1, urgentDocs.size)
        assertEquals(finalConfidentialDoc.id, urgentDocs[0].id)
        
        assertEquals(1, confidentialDocs.size)
        assertEquals(finalConfidentialDoc.id, confidentialDocs[0].id)
        
        assertEquals(2, matterDocs.size)
        assertTrue(matterDocs.map { it.id }.containsAll(listOf(finalConfidentialDoc.id, finalNormalDoc.id)))
    }

    // Helper methods
    private fun createTestUser(username: String, role: UserRole): User {
        val user = User().apply {
            this.username = username
            email = "$username@example.com"
            firstName = "Test"
            lastName = "User"
            this.role = role
            isActive = true
        }
        return userRepository.save(user)
    }

    private fun createTestMatter(caseNumber: String, lawyer: User): Matter {
        val matter = Matter().apply {
            this.caseNumber = caseNumber
            title = "Test Matter $caseNumber"
            clientName = "Test Client"
            status = MatterStatus.INTAKE
            priority = MatterPriority.MEDIUM
            assignedLawyer = lawyer
            filingDate = LocalDate.now()
        }
        return matterRepository.save(matter)
    }

    private fun createTestDocument(
        fileName: String, 
        user: User, 
        matter: Matter, 
        category: DocumentCategory? = null
    ): Document {
        return Document().apply {
            fileId = UUID.randomUUID().toString()
            this.fileName = fileName
            originalFileName = fileName
            contentType = "application/pdf"
            fileSize = 100000L
            storagePath = "/documents/$fileName"
            status = DocumentStatus.AVAILABLE
            this.matter = matter
            uploadedBy = user
            this.category = category
            title = "Test Document $fileName"
            versionNumber = 1
        }
    }
}