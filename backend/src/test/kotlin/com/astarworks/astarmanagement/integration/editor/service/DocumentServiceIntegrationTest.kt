package com.astarworks.astarmanagement.integration.editor.service

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNode
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNodeType
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentMetadataRepository
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentNodeRepository
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentRevisionRepository
import com.astarworks.astarmanagement.core.editor.domain.service.DocumentService
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.time.Instant
import java.util.UUID
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class DocumentServiceIntegrationTest : IntegrationTestBase() {

    @Autowired
    private lateinit var documentService: DocumentService

    @Autowired
    private lateinit var documentNodeRepository: DocumentNodeRepository

    @Autowired
    private lateinit var documentRevisionRepository: DocumentRevisionRepository

    @Autowired
    private lateinit var documentMetadataRepository: DocumentMetadataRepository

    @Autowired
    private lateinit var tenantContextService: TenantContextService

    private val tenantId = TenantId(UUID.randomUUID())
    private val workspaceId = WorkspaceId(UUID.randomUUID())
    private val authorId = UserId(UUID.randomUUID())

    @BeforeEach
    fun setup() {
        seedTenantWorkspace()
        tenantContextService.setTenantContext(tenantId.value)
    }

    @AfterEach
    fun teardown() {
        tenantContextService.clearTenantContext()
        executeWithoutRLS { jdbc ->
            jdbc.execute("TRUNCATE TABLE document_metadata, document_revisions, document_nodes CASCADE")
            jdbc.execute("TRUNCATE TABLE tenant_users CASCADE")
            jdbc.execute("TRUNCATE TABLE users CASCADE")
            jdbc.execute("TRUNCATE TABLE workspaces CASCADE")
            jdbc.execute("TRUNCATE TABLE tenants CASCADE")
        }
    }

    @Test
    fun `should create document with initial revision and metadata`() {
        val metadataPayload = buildJsonObject {
            put("description", JsonPrimitive("Weekly sync"))
        }

        val aggregate = documentService.createDocument(
            workspaceId = workspaceId,
            parentId = null,
            title = "Weekly Sync Notes",
            authorId = authorId,
            content = "Initial content",
            summary = "Initial summary",
            metadata = metadataPayload,
            tags = listOf("meeting", "weekly"),
            isPublished = true,
        )

        assertEquals(DocumentNodeType.DOCUMENT, aggregate.node.type)
        assertEquals("/weekly-sync-notes", aggregate.node.materializedPath)
        assertEquals("weekly-sync-notes", aggregate.node.slug)
        assertEquals(authorId, aggregate.node.createdBy)
        assertEquals(1, aggregate.latestRevision.revisionNumber)
        assertEquals("Initial summary", aggregate.latestRevision.summary)
        assertEquals("Initial content", aggregate.latestRevision.contentPlaintext)
        assertNotNull(aggregate.metadata)
        assertEquals(metadataPayload, aggregate.metadata?.metadata)
        assertEquals(listOf("meeting", "weekly"), aggregate.metadata?.tags)
        assertTrue(aggregate.metadata?.isPublished == true)
        assertEquals(1, aggregate.revisionCount)

        val persistedMetadata = documentMetadataRepository.findByDocumentId(aggregate.node.id)
        assertNotNull(persistedMetadata)
    }

    @Test
    fun `should update document and create new revision`() {
        val folder = createFolder("Root Folder")
        val created = documentService.createDocument(
            workspaceId = workspaceId,
            parentId = folder.id,
            title = "Project Charter",
            authorId = authorId,
            content = "Version 1",
            summary = "Baseline",
            tags = listOf("project"),
        )

        val updatedMetadata = buildJsonObject {
            put("status", JsonPrimitive("approved"))
        }

        val updated = documentService.updateDocument(
            documentId = created.node.id,
            authorId = authorId,
            title = "Project Charter v2",
            content = "Version 2",
            summary = "Updated",
            metadata = updatedMetadata,
            tags = listOf("project", "approved"),
            isPublished = false,
            isFavorited = true,
        )

        assertEquals("project-charter-v2", updated.node.slug)
        assertEquals("/root-folder/project-charter-v2", updated.node.materializedPath)
        assertEquals(2, updated.latestRevision.revisionNumber)
        assertEquals("Version 2", updated.latestRevision.contentPlaintext)
        assertEquals("Updated", updated.latestRevision.summary)
        assertEquals(2, updated.revisionCount)
        assertEquals(updatedMetadata, updated.metadata?.metadata)
        assertEquals(listOf("project", "approved"), updated.metadata?.tags)
        assertTrue(updated.metadata?.isPublished == false)
        assertTrue(updated.metadata?.isFavorited == true)

        val revisions = documentService.listRevisions(created.node.id)
        assertEquals(2, revisions.size)
        assertEquals(2, revisions.first().revisionNumber)
        assertEquals(1, revisions.last().revisionNumber)
    }

    @Test
    fun `should delete document and related data`() {
        val created = documentService.createDocument(
            workspaceId = workspaceId,
            parentId = null,
            title = "Disposable Doc",
            authorId = authorId,
            content = "Temporary",
        )

        documentService.deleteDocument(created.node.id)

        assertNull(documentNodeRepository.findById(created.node.id))
        assertEquals(0L, documentRevisionRepository.countByDocumentId(created.node.id))
        assertNull(documentMetadataRepository.findByDocumentId(created.node.id))
    }

    private fun seedTenantWorkspace() {
        executeWithoutRLS { jdbc ->
            jdbc.update(
                "INSERT INTO tenants (id, slug, name, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                tenantId.value,
                "tenant-${tenantId.value.toString().substring(0, 8)}",
                "Tenant ${tenantId.value.toString().substring(0, 8)}"
            )
            jdbc.update(
                "INSERT INTO users (id, auth0_sub, email, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                authorId.value,
                "auth0|${authorId.value}",
                "author+${authorId.value}@example.com"
            )
            jdbc.update(
                "INSERT INTO tenant_users (tenant_id, user_id) VALUES (?, ?)",
                tenantId.value,
                authorId.value
            )
            jdbc.update(
                "INSERT INTO workspaces (id, tenant_id, name, created_by, created_at, updated_at, version) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)",
                workspaceId.value,
                tenantId.value,
                "Workspace",
                authorId.value
            )
        }
    }

    private fun createFolder(name: String): DocumentNode {
        val slug = name.lowercase().replace(Regex("[^a-z0-9]+"), "-").trim('-')
        val node = DocumentNode(
            tenantId = tenantId,
            workspaceId = workspaceId,
            parentId = null,
            type = DocumentNodeType.FOLDER,
            title = name,
            slug = slug,
            materializedPath = "/$slug",
            depth = 0,
            position = DocumentNode.DEFAULT_POSITION,
            createdBy = authorId,
            updatedBy = authorId,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )
        return documentNodeRepository.save(node)
    }
}
