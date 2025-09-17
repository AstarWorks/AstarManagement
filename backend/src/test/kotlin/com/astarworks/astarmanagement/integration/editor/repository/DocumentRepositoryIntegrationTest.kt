package com.astarworks.astarmanagement.integration.editor.repository

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentMetadata
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNode
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNodeType
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentRevision
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentMetadataRepository
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentNodeRepository
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentRevisionRepository
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.time.Instant
import java.util.UUID
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataIntegrityViolationException

class DocumentRepositoryIntegrationTest : IntegrationTestBase() {

    @Autowired
    private lateinit var documentNodeRepository: DocumentNodeRepository

    @Autowired
    private lateinit var documentRevisionRepository: DocumentRevisionRepository

    @Autowired
    private lateinit var documentMetadataRepository: DocumentMetadataRepository

    private val tenantId = TenantId(UUID.randomUUID())
    private val workspaceId = WorkspaceId(UUID.randomUUID())
    private val ownerId = UserId(UUID.randomUUID())

    @AfterEach
    fun tearDown() {
        executeWithoutRLS { jdbc ->
            jdbc.execute("TRUNCATE TABLE document_metadata, document_revisions, document_nodes CASCADE")
            jdbc.execute("TRUNCATE TABLE workspaces CASCADE")
            jdbc.execute("TRUNCATE TABLE users CASCADE")
            jdbc.execute("TRUNCATE TABLE tenants CASCADE")
        }
    }

    @Test
    fun `should persist document hierarchy revisions and metadata`() {
        seedTenantWorkspace()

        val root = documentNodeRepository.save(
            DocumentNode(
                tenantId = tenantId,
                workspaceId = workspaceId,
                parentId = null,
                type = DocumentNodeType.FOLDER,
                title = "Root Folder",
                slug = "root",
                materializedPath = "/root",
                depth = 0,
                position = 10_000.0,
                createdBy = ownerId,
                updatedBy = ownerId
            )
        )

        val document = documentNodeRepository.save(
            DocumentNode(
                tenantId = tenantId,
                workspaceId = workspaceId,
                parentId = root.id,
                type = DocumentNodeType.DOCUMENT,
                title = "Meeting Notes",
                slug = "meeting-notes",
                materializedPath = "/root/meeting-notes",
                depth = 1,
                position = 20_000.0,
                createdBy = ownerId,
                updatedBy = ownerId
            )
        )

        val children = documentNodeRepository.findChildren(tenantId, workspaceId, root.id)
        assertEquals(listOf(document.id), children.map { it.id })

        val revisionV1 = documentRevisionRepository.save(
            DocumentRevision(
                tenantId = tenantId,
                workspaceId = workspaceId,
                documentId = document.id,
                revisionNumber = 1,
                titleSnapshot = "Meeting Notes",
                authorId = ownerId,
                contentPlaintext = "Initial draft",
                contentType = "text/markdown",
                sizeBytes = 12,
                checksum = "checksum-v1"
            )
        )

        documentRevisionRepository.save(
            DocumentRevision(
                tenantId = tenantId,
                workspaceId = workspaceId,
                documentId = document.id,
                revisionNumber = 2,
                titleSnapshot = "Meeting Notes",
                authorId = ownerId,
                contentPlaintext = "Updated draft",
                contentType = "text/markdown",
                sizeBytes = 13,
                checksum = "checksum-v2",
                createdAt = revisionV1.createdAt.plusSeconds(5)
            )
        )

        val latestRevision = documentRevisionRepository.findLatest(document.id)
        assertEquals("Updated draft", latestRevision?.contentPlaintext)
        assertEquals(2, documentRevisionRepository.countByDocumentId(document.id))

        documentMetadataRepository.save(
            DocumentMetadata(
                documentId = document.id,
                tenantId = tenantId,
                workspaceId = workspaceId,
                metadata = buildJsonObject { put("description", JsonPrimitive("Weekly sync")) },
                tags = listOf("meeting", "team"),
                isPublished = true,
                lastViewedAt = Instant.now(),
                lastIndexedAt = null
            )
        )

        val metadata = documentMetadataRepository.findByDocumentId(document.id)
        assertNotNull(metadata)
        assertEquals(listOf("meeting", "team"), metadata?.tags)
        assertEquals("Weekly sync", metadata?.metadata?.get("description")?.jsonPrimitive?.content)

        val duplicate = DocumentNode(
            tenantId = tenantId,
            workspaceId = workspaceId,
            parentId = root.id,
            type = DocumentNodeType.DOCUMENT,
            title = "Duplicate",
            slug = "meeting-notes",
            materializedPath = "/root/meeting-notes",
            depth = 1,
            createdBy = ownerId,
            updatedBy = ownerId
        )

        assertThrows(DataIntegrityViolationException::class.java) {
            documentNodeRepository.save(duplicate)
        }
    }

    @Test
    fun `should retrieve nodes by slug and path`() {
        seedTenantWorkspace()

        val root = persistNode(null, "root")
        persistNode(root, "child-a")
        val target = persistNode(root, "child-b")

        val byPath = documentNodeRepository.findByTenantAndPath(tenantId, workspaceId, target.materializedPath)
        val bySlug = documentNodeRepository.findByTenantAndSlug(tenantId, workspaceId, root.id, "child-b")

        assertEquals(target.id, byPath?.id)
        assertEquals(target.id, bySlug?.id)
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
                ownerId.value,
                "auth0|${ownerId.value}",
                "owner+${ownerId.value}@example.com"
            )
            jdbc.update(
                "INSERT INTO tenant_users (tenant_id, user_id) VALUES (?, ?)",
                tenantId.value,
                ownerId.value
            )
            jdbc.update(
                "INSERT INTO workspaces (id, tenant_id, name, created_by, created_at, updated_at, version) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)",
                workspaceId.value,
                tenantId.value,
                "Workspace",
                ownerId.value
            )
        }
    }

    private fun persistNode(parent: DocumentNode?, slug: String): DocumentNode {
        val parentId = parent?.id
        return documentNodeRepository.save(
            DocumentNode(
                tenantId = tenantId,
                workspaceId = workspaceId,
                parentId = parentId,
                type = if (parentId == null) DocumentNodeType.FOLDER else DocumentNodeType.DOCUMENT,
                title = slug.replaceFirstChar { it.uppercase() },
                slug = slug,
                materializedPath = if (parent == null) "/$slug" else "${parent.materializedPath}/$slug",
                depth = (parent?.depth ?: -1) + 1,
                position = DocumentNode.DEFAULT_POSITION,
                createdBy = ownerId,
                updatedBy = ownerId
            )
        )
    }
}
