package com.astarworks.astarmanagement.integration.editor.api

import com.astarworks.astarmanagement.base.IntegrationTestBase
import com.astarworks.astarmanagement.fixture.JwtTestFixture
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import junit.framework.TestCase.assertEquals
import java.sql.Timestamp
import java.time.Instant
import java.util.UUID
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.int
import kotlinx.serialization.json.long
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.test.web.servlet.RequestBuilder
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.context.annotation.Import
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put

@ActiveProfiles("test", "integration")
@TestPropertySource(properties = ["app.features.editor.enabled=true"])
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Import(EditorSecurityTestConfig::class)
@DisplayName("Editor Controllers - Integration")
class EditorControllerIntegrationTest : IntegrationTestBase() {

    @Autowired
    private lateinit var json: Json

    @Autowired
    private lateinit var tenantContextService: TenantContextService

    private lateinit var tenantId: UUID
    private lateinit var workspaceId: UUID
    private lateinit var userId: UUID
    private lateinit var tenantUserId: UUID
    private lateinit var auth0Sub: String
    private lateinit var auth0OrgId: String
    private lateinit var jwtToken: String

    private data class NodeInfo(val id: UUID, val version: Long)
    private data class DocumentInfo(val id: UUID, val nodeVersion: Long, val metadataVersion: Long?)

    @BeforeEach
    fun setUp() {
        cleanupDatabase()
        truncateEditorTables()

        tenantId = UUID.randomUUID()
        workspaceId = UUID.randomUUID()
        userId = UUID.randomUUID()
        tenantUserId = UUID.randomUUID()
        auth0Sub = "auth0|${userId}"
        auth0OrgId = "org-${UUID.randomUUID().toString().replace("-", "").take(12)}"

        seedTenantUserAndWorkspace()
        tenantContextService.setTenantContext(tenantId)

        jwtToken = JwtTestFixture.createValidJwt(
            subject = auth0Sub,
            orgId = auth0OrgId,
            email = "editor@test.example",
            additionalClaims = mapOf(
                "tenant_id" to tenantId.toString(),
                "user_id" to userId.toString(),
                "tenant_user_id" to tenantUserId.toString()
            )
        )
    }

    @AfterEach
    fun tearDown() {
        tenantContextService.clearTenantContext()
        truncateEditorTables()
    }

    @Test
    fun `should create folder and list children`() {
        val rootFolder = createFolder("Main Folder")

        val listJson = performJson(
            get("/api/v1/editor/folders")
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .param("workspaceId", workspaceId.toString())
        )

        val nodes = listJson.getValue("data").jsonObject.getValue("nodes").jsonArray
        assertEquals(1, nodes.size)
        val firstNode = nodes.first().jsonObject
        assertEquals("Main Folder", firstNode.getValue("title").jsonPrimitive.content)
        assertEquals(rootFolder.id.toString(), firstNode.getValue("id").jsonPrimitive.content)
    }

    @Test
    fun `should rename folder and return breadcrumb`() {
        val parent = createFolder("Projects")
        var child = createFolder("Kickoff", parent.id)

        val renameJson = performJson(
            patch("/api/v1/editor/folders/{folderId}/rename", child.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "Kickoff Plan",
                      "version": ${child.version}
                    }
                    """.trimIndent()
                )
        ).getValue("data").jsonObject.getValue("node").jsonObject

        assertEquals("Kickoff Plan", renameJson.getValue("title").jsonPrimitive.content)
        assertEquals("kickoff-plan", renameJson.getValue("slug").jsonPrimitive.content)
        child = child.copy(version = renameJson.getValue("version").jsonPrimitive.long)

        val breadcrumb = performJson(
            get("/api/v1/editor/folders/{nodeId}/breadcrumb", child.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
        ).getValue("data").jsonObject.getValue("breadcrumb").jsonArray

        assertEquals("Projects", breadcrumb[0].jsonObject.getValue("title").jsonPrimitive.content)
        assertEquals("Kickoff Plan", breadcrumb[1].jsonObject.getValue("title").jsonPrimitive.content)
    }

    @Test
    fun `should reject folder rename with stale version`() {
        var folder = createFolder("Stale Folder")

        val firstRename = performJson(
            patch("/api/v1/editor/folders/{folderId}/rename", folder.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "Stale Folder Renamed",
                      "version": ${folder.version}
                    }
                    """.trimIndent()
                )
        ).getValue("data").jsonObject.getValue("node").jsonObject

        folder = folder.copy(version = firstRename.getValue("version").jsonPrimitive.long)

        val conflictResponse = perform(
            patch("/api/v1/editor/folders/{folderId}/rename", folder.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "Another Name",
                      "version": 0
                    }
                    """.trimIndent()
                ),
            expectedStatus = 409
        )
        assertEquals(409, conflictResponse.status)
    }

    @Test
    fun `should create update and retrieve document`() {
        val folder = createFolder("Docs")

        var document = createDocument(
            parentId = folder.id,
            title = "Meeting Notes",
            summary = "Sprint planning",
            content = "Initial draft"
        )

        val documentJson = performJson(
            get("/api/v1/editor/documents/{id}", document.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
        )

        val documentData = documentJson.getValue("data").jsonObject
        assertEquals(1, documentData.getValue("revisionCount").jsonPrimitive.int)
        assertEquals(
            "Meeting Notes",
            documentData.getValue("latestRevision").jsonObject.getValue("titleSnapshot").jsonPrimitive.content
        )
        assertEquals(
            "Initial draft",
            documentData.getValue("latestRevision").jsonObject.getValue("content").jsonPrimitive.content
        )

        val updateJson = performJson(
            put("/api/v1/editor/documents/{id}", document.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "nodeVersion": ${document.nodeVersion},
                      "metadataVersion": ${document.metadataVersion ?: 0},
                      "title": "Meeting Notes Updated",
                      "summary": "Sprint planning recap",
                      "content": "Updated content"
                    }
                    """.trimIndent()
                )
        )

        val updateData = updateJson.getValue("data").jsonObject
        assertEquals(
            "Meeting Notes Updated",
            updateData.getValue("node").jsonObject.getValue("title").jsonPrimitive.content
        )
        assertEquals(
            2,
            updateData.getValue("revisionCount").jsonPrimitive.int
        )
        assertEquals(
            "Updated content",
            updateData.getValue("latestRevision").jsonObject.getValue("content").jsonPrimitive.content
        )
        val updatedNode = updateData.getValue("node").jsonObject
        val updatedMetadata = updateData.getValue("metadata").jsonObject
        document = document.copy(
            nodeVersion = updatedNode.getValue("version").jsonPrimitive.long,
            metadataVersion = updatedMetadata.getValue("version").jsonPrimitive.long
        )

        val revisionsJson = performJson(
            get("/api/v1/editor/documents/{id}/revisions", document.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
        )

        val revisions = revisionsJson.getValue("data").jsonObject.getValue("revisions").jsonArray
        assertEquals(2, revisions.size)
        assertEquals(2, revisions[0].jsonObject.getValue("revisionNumber").jsonPrimitive.int)
    }

    @Test
    fun `should reject document update with stale version`() {
        val document = createDocument(
            parentId = null,
            title = "Conflict Doc",
            summary = null,
            content = "initial"
        )

        val firstUpdate = performJson(
            put("/api/v1/editor/documents/{id}", document.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "nodeVersion": ${document.nodeVersion},
                      "metadataVersion": ${document.metadataVersion ?: 0},
                      "content": "first revision"
                    }
                    """.trimIndent()
                )
        ).getValue("data").jsonObject

        val updatedNodeVersion = firstUpdate.getValue("node").jsonObject.getValue("version").jsonPrimitive.long
        val updatedMetadataVersion = firstUpdate.getValue("metadata").jsonObject.getValue("version").jsonPrimitive.long

        val conflictResponse = perform(
            put("/api/v1/editor/documents/{id}", document.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "nodeVersion": ${document.nodeVersion},
                      "metadataVersion": ${document.metadataVersion ?: 0},
                      "title": "Conflict Attempt"
                    }
                    """.trimIndent()
                ),
            expectedStatus = 409
        )
        assertEquals(409, conflictResponse.status)

        // Ensure current versions remain the ones returned by the successful update
        assertEquals(updatedNodeVersion, justFetchNodeVersion(document.id))
        assertEquals(updatedMetadataVersion, justFetchMetadataVersion(document.id))
    }

    @Test
    fun `should delete document`() {
        val document = createDocument(
            parentId = null,
            title = "Temp Doc",
            summary = null,
            content = "to be deleted"
        )

        val deleteJson = performJson(
            delete("/api/v1/editor/documents/{id}", document.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .param("version", document.nodeVersion.toString())
        )

        assertEquals(true, deleteJson.getValue("data").jsonObject.getValue("deleted").jsonPrimitive.boolean)

        val deletedResponse = perform(
            get("/api/v1/editor/documents/{id}", document.id)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
        , expectedStatus = 404)
    }

    private fun createFolder(title: String, parentId: UUID? = null): NodeInfo {
        tenantContextService.setTenantContext(tenantId)
        val payload = buildString {
            append("{")
            append("\"workspaceId\": \"$workspaceId\",")
            append("\"title\": \"$title\"")
            if (parentId != null) {
                append(", \"parentId\": \"$parentId\"")
            }
            append("}")
        }

        val content = performJson(
            post("/api/v1/editor/folders")
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
        )

        val node = content.getValue("data").jsonObject.getValue("node").jsonObject
        val id = UUID.fromString(node.getValue("id").jsonPrimitive.content)
        val version = node.getValue("version").jsonPrimitive.long
        return NodeInfo(id, version)
    }

    private fun createDocument(
        parentId: UUID?,
        title: String,
        summary: String?,
        content: String
    ): DocumentInfo {
        tenantContextService.setTenantContext(tenantId)
        val payloadBuilder = StringBuilder()
        payloadBuilder.append("{")
        payloadBuilder.append("\"workspaceId\": \"$workspaceId\",")
        if (parentId != null) {
            payloadBuilder.append("\"parentId\": \"$parentId\",")
        }
        payloadBuilder.append("\"title\": \"$title\",")
        summary?.let { payloadBuilder.append("\"summary\": \"$it\",") }
        payloadBuilder.append("\"content\": \"$content\"")
        payloadBuilder.append("}")

        val contentJson = performJson(
            post("/api/v1/editor/documents")
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBuilder.toString())
        )

        val node = contentJson.getValue("data").jsonObject.getValue("node").jsonObject
        val id = UUID.fromString(node.getValue("id").jsonPrimitive.content)
        val nodeVersion = node.getValue("version").jsonPrimitive.long
        val metadataVersion = contentJson.getValue("data").jsonObject
            .getValue("metadata").jsonObject
            .getValue("version").jsonPrimitive.long
        return DocumentInfo(id, nodeVersion, metadataVersion)
    }

    private fun justFetchNodeVersion(documentId: UUID): Long {
        val payload = performJson(
            get("/api/v1/editor/documents/{id}", documentId)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
        )
        return payload.getValue("data").jsonObject
            .getValue("node").jsonObject
            .getValue("version").jsonPrimitive.long
    }

    private fun justFetchMetadataVersion(documentId: UUID): Long {
        val payload = performJson(
            get("/api/v1/editor/documents/{id}", documentId)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
        )
        return payload.getValue("data").jsonObject
            .getValue("metadata").jsonObject
            .getValue("version").jsonPrimitive.long
    }

    private fun seedTenantUserAndWorkspace() {
        executeWithoutRLS { jdbc ->
            val now = Timestamp.from(Instant.now())
            jdbc.update(
                """
                INSERT INTO tenants (id, slug, name, auth0_org_id, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, TRUE, ?, ?)
                """.trimIndent(),
                tenantId,
                "tenant-${tenantId.toString().substring(0, 8)}",
                "Tenant ${tenantId.toString().substring(0, 8)}",
                auth0OrgId,
                now,
                now
            )

            jdbc.update(
                """
                INSERT INTO users (id, auth0_sub, email, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """.trimIndent(),
                userId,
                auth0Sub,
                "editor@test.example",
                now,
                now
            )

            jdbc.update(
                """
                INSERT INTO workspaces (id, tenant_id, name, created_by, created_at, updated_at, version)
                VALUES (?, ?, ?, ?, ?, ?, 0)
                """.trimIndent(),
                workspaceId,
                tenantId,
                "Editor Workspace",
                userId,
                now,
                now
            )
        }
    }

    private fun truncateEditorTables() {
        executeWithoutRLS { jdbc ->
            jdbc.execute("TRUNCATE TABLE document_metadata, document_revisions, document_nodes CASCADE")
            jdbc.execute("TRUNCATE TABLE user_roles, role_permissions, roles CASCADE")
            jdbc.execute("TRUNCATE TABLE tenant_users CASCADE")
            jdbc.execute("TRUNCATE TABLE workspaces CASCADE")
            jdbc.execute("TRUNCATE TABLE users CASCADE")
            jdbc.execute("TRUNCATE TABLE tenants CASCADE")
        }
    }

    private fun performJson(builder: RequestBuilder, expectedStatus: Int = 200): JsonObject {
        val response = perform(builder, expectedStatus)
        val content = response.contentAsString
        require(content.isNotBlank()) { "Expected JSON body but response was empty" }
        return json.decodeFromString(JsonObject.serializer(), content)
    }

    private fun performJsonAllowingEmpty(builder: RequestBuilder, expectedStatus: Int = 200): JsonObject? {
        val response = perform(builder, expectedStatus)
        val content = response.contentAsString
        return if (content.isBlank()) null else json.decodeFromString(JsonObject.serializer(), content)
    }

    private fun perform(builder: RequestBuilder, expectedStatus: Int = 200): MockHttpServletResponse {
        tenantContextService.setTenantContext(tenantId)
        val result = mockMvc.perform(builder).andReturn()
        val response = result.response
        if (response.status != expectedStatus) {
            throw AssertionError(
                "Request expected status $expectedStatus but was ${response.status}: ${response.contentAsString}"
            )
        }
        return response
    }
}
