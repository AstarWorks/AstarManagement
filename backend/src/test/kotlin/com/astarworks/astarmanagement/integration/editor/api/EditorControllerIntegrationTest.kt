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
        val rootFolderId = createFolder("Main Folder")

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
        assertEquals(rootFolderId.toString(), firstNode.getValue("id").jsonPrimitive.content)
    }

    @Test
    fun `should rename folder and return breadcrumb`() {
        val parentId = createFolder("Projects")
        val childId = createFolder("Kickoff", parentId)

        val renameJson = performJson(
            patch("/api/v1/editor/folders/{folderId}/rename", childId)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "Kickoff Plan"
                    }
                    """.trimIndent()
                )
        ).getValue("data").jsonObject.getValue("node").jsonObject

        assertEquals("Kickoff Plan", renameJson.getValue("title").jsonPrimitive.content)
        assertEquals("kickoff-plan", renameJson.getValue("slug").jsonPrimitive.content)

        val breadcrumb = performJson(
            get("/api/v1/editor/folders/{nodeId}/breadcrumb", childId)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
        ).getValue("data").jsonObject.getValue("breadcrumb").jsonArray

        assertEquals("Projects", breadcrumb[0].jsonObject.getValue("title").jsonPrimitive.content)
        assertEquals("Kickoff Plan", breadcrumb[1].jsonObject.getValue("title").jsonPrimitive.content)
    }

    @Test
    fun `should create update and retrieve document`() {
        val folderId = createFolder("Docs")

        val documentId = createDocument(
            parentId = folderId,
            title = "Meeting Notes",
            summary = "Sprint planning",
            content = "Initial draft"
        )

        val documentJson = performJson(
            get("/api/v1/editor/documents/{id}", documentId)
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
            put("/api/v1/editor/documents/{id}", documentId)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
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

        val revisionsJson = performJson(
            get("/api/v1/editor/documents/{id}/revisions", documentId)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
        )

        val revisions = revisionsJson.getValue("data").jsonObject.getValue("revisions").jsonArray
        assertEquals(2, revisions.size)
        assertEquals(2, revisions[0].jsonObject.getValue("revisionNumber").jsonPrimitive.int)
    }

    @Test
    fun `should delete document`() {
        val docId = createDocument(
            parentId = null,
            title = "Temp Doc",
            summary = null,
            content = "to be deleted"
        )

        val deleteJson = performJson(
            delete("/api/v1/editor/documents/{id}", docId)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
        )

        assertEquals(true, deleteJson.getValue("data").jsonObject.getValue("deleted").jsonPrimitive.boolean)

        val deletedResponse = perform(
            get("/api/v1/editor/documents/{id}", docId)
                .header("Authorization", "Bearer $jwtToken")
                .header("X-Tenant-Id", tenantId.toString())
        , expectedStatus = 404)
    }

    private fun createFolder(title: String, parentId: UUID? = null): UUID {
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
        return UUID.fromString(node.getValue("id").jsonPrimitive.content)
    }

    private fun createDocument(
        parentId: UUID?,
        title: String,
        summary: String?,
        content: String
    ): UUID {
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
        return UUID.fromString(node.getValue("id").jsonPrimitive.content)
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
        return json.decodeFromString(JsonObject.serializer(), content)
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
