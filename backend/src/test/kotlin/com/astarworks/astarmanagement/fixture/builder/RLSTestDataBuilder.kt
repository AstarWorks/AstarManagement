package com.astarworks.astarmanagement.fixture.builder

import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.RolePermission
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.RolePermissionRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.UserRoleRepository
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.workspace.domain.repository.WorkspaceRepository
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.repository.TableRepository
import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.core.table.domain.repository.RecordRepository
// RLSTestHelper import removed - using direct JDBC instead
import com.astarworks.astarmanagement.shared.domain.value.*
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.slf4j.LoggerFactory
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.UUID

/**
 * Builder for creating comprehensive RLS test environments.
 * 
 * This class extends the basic test setup with additional data specifically
 * needed for RLS testing, including workspaces, tables, and records that
 * demonstrate multi-level tenant isolation.
 */
@Component
class RLSTestDataBuilder(
    private val userRepository: UserRepository,
    private val tenantRepository: TenantRepository,
    private val dynamicRoleRepository: DynamicRoleRepository,
    private val rolePermissionRepository: RolePermissionRepository,
    private val userRoleRepository: UserRoleRepository,
    private val tenantMembershipRepository: TenantMembershipRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val tableRepository: TableRepository,
    private val recordRepository: RecordRepository,
    private val jdbcTemplate: JdbcTemplate
) {
    
    private val logger = LoggerFactory.getLogger(RLSTestDataBuilder::class.java)
    
    /**
     * Creates a complete multi-tenant RLS test environment with:
     * - Two tenants (A and B)
     * - Multiple users per tenant with different roles
     * - Workspaces, tables, and records for each tenant
     * - Proper RLS isolation setup
     */
    fun createMultiTenantRLSEnvironment(): RLSTestEnvironment {
        logger.info("Creating multi-tenant RLS test environment")
        
        // Use SECURITY DEFINER function to set up initial tenant with admin
        val tenantASetup = setupTenantWithAdmin(
            "RLS Tenant A",
            "org_rls_tenant_a",
            "admin@rls-tenant-a.com"
        )
        
        val tenantBSetup = setupTenantWithAdmin(
            "RLS Tenant B",
            "org_rls_tenant_b",
            "admin@rls-tenant-b.com"
        )
        
        // Now we have tenants with admin users and roles
        // Set RLS context briefly to access the created data
        
        // Set context for Tenant A to get its data
        jdbcTemplate.execute("""
            SELECT set_config('app.current_tenant_id', '${tenantASetup.tenantId}', false);
            SELECT set_config('app.current_user_id', '${tenantASetup.adminUserId}', false);
        """.trimIndent())
        val tenantA = tenantRepository.findById(TenantId(tenantASetup.tenantId))!!
        val adminUserA = userRepository.findById(UserId(tenantASetup.adminUserId))!!
        val adminRoleA = dynamicRoleRepository.findById(RoleId(tenantASetup.adminRoleId))!!
        val adminMembershipA = tenantMembershipRepository.findByUserIdAndTenantId(
            UserId(tenantASetup.adminUserId),
            TenantId(tenantASetup.tenantId)
        )!!
        
        // Create additional users and roles for Tenant A
        val additionalDataA = createAdditionalTenantData(tenantASetup.tenantId, "A")
        
        // Set context for Tenant B to get its data
        jdbcTemplate.execute("""
            SELECT set_config('app.current_tenant_id', '${tenantBSetup.tenantId}', false);
            SELECT set_config('app.current_user_id', '${tenantBSetup.adminUserId}', false);
        """.trimIndent())
        val tenantB = tenantRepository.findById(TenantId(tenantBSetup.tenantId))!!
        val adminUserB = userRepository.findById(UserId(tenantBSetup.adminUserId))!!
        val adminRoleB = dynamicRoleRepository.findById(RoleId(tenantBSetup.adminRoleId))!!
        val adminMembershipB = tenantMembershipRepository.findByUserIdAndTenantId(
            UserId(tenantBSetup.adminUserId),
            TenantId(tenantBSetup.tenantId)
        )!!
        
        // Create additional users and roles for Tenant B
        val additionalDataB = createAdditionalTenantData(tenantBSetup.tenantId, "B")
        
        // Clear context after setup
        jdbcTemplate.execute("""
            SELECT set_config('app.current_tenant_id', NULL, false);
            SELECT set_config('app.current_user_id', NULL, false);
        """.trimIndent())
        
        // Build the complete environment structure
        val tenants = mapOf(
            "tenant_a" to tenantA,
            "tenant_b" to tenantB
        )
        
        val users = mapOf(
            "admin_a" to adminUserA,
            "regular_a" to additionalDataA.regularUser,
            "admin_b" to adminUserB,
            "regular_b" to additionalDataB.regularUser
        )
        
        val roles = mapOf(
            "admin_role_a" to adminRoleA,
            "user_role_a" to additionalDataA.userRole,
            "admin_role_b" to adminRoleB,
            "user_role_b" to additionalDataB.userRole
        )
        
        val memberships = mapOf(
            "admin_a_membership" to adminMembershipA,
            "regular_a_membership" to additionalDataA.regularUserMembership,
            "admin_b_membership" to adminMembershipB,
            "regular_b_membership" to additionalDataB.regularUserMembership
        )
        
        // Create workspace data
        val workspaceData = createWorkspaceTestData(tenants, users)
        
        logger.info("Multi-tenant RLS environment created successfully")
        
        return RLSTestEnvironment(
            tenants = tenants,
            users = users,
            roles = roles,
            memberships = memberships,
            workspaceData = workspaceData
        )
    }
    
    private data class TenantSetupResult(
        val tenantId: UUID,
        val adminUserId: UUID,
        val adminRoleId: UUID,
        val tenantUserId: UUID
    )
    
    private data class AdditionalTenantData(
        val regularUser: User,
        val userRole: DynamicRole,
        val regularUserMembership: TenantMembership
    )
    
    private fun setupTenantWithAdmin(
        tenantName: String,
        orgId: String,
        adminEmail: String
    ): TenantSetupResult {
        // Use SECURITY DEFINER function to bypass RLS for initial setup
        val result = jdbcTemplate.queryForMap(
            "SELECT * FROM setup_test_tenant_with_roles(?, ?, ?)",
            tenantName, orgId, adminEmail
        )
        
        return TenantSetupResult(
            tenantId = UUID.fromString(result["tenant_id"].toString()),
            adminUserId = UUID.fromString(result["admin_user_id"].toString()),
            adminRoleId = UUID.fromString(result["admin_role_id"].toString()),
            tenantUserId = UUID.fromString(result["tenant_user_id"].toString())
        )
    }
    
    private fun createAdditionalTenantData(
        tenantId: UUID,
        suffix: String
    ): AdditionalTenantData {
        // Create regular user using SECURITY DEFINER function
        val userResult = jdbcTemplate.queryForMap(
            "SELECT * FROM add_test_user_to_tenant(?, ?, ?)",
            tenantId, "regular@rls-tenant-${suffix.lowercase()}.com", "user"
        )
        
        val userId = UUID.fromString(userResult["user_id"].toString())
        val tenantUserId = UUID.fromString(userResult["tenant_user_id"].toString())
        
        // Create user role (now we have admin context, so we can create roles)
        val userRole = DynamicRole(
            id = RoleId(UUID.randomUUID()),
            tenantId = TenantId(tenantId),
            name = "user",
            displayName = "User",
            color = "#00FF00",
            position = 5,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        dynamicRoleRepository.save(userRole)
        
        // Load the created entities
        val regularUser = userRepository.findById(UserId(userId))!!
        val membership = tenantMembershipRepository.findByUserIdAndTenantId(
            UserId(userId),
            TenantId(tenantId)
        )!!
        
        return AdditionalTenantData(
            regularUser = regularUser,
            userRole = userRole,
            regularUserMembership = membership
        )
    }
    
    private fun createWorkspaceTestData(
        tenants: Map<String, Tenant>,
        users: Map<String, User>
    ): Map<String, WorkspaceTestData> {
        val workspaceData = mutableMapOf<String, WorkspaceTestData>()
        
        // Create workspaces for Tenant A
        val workspaceA1 = createWorkspaceWithData(
            tenantId = tenants["tenant_a"]!!.id,
            name = "RLS Workspace A1",
            createdBy = users["admin_a"]!!.id
        )
        
        val workspaceA2 = createWorkspaceWithData(
            tenantId = tenants["tenant_a"]!!.id,
            name = "RLS Workspace A2", 
            createdBy = users["regular_a"]!!.id
        )
        
        val workspaceA3 = createWorkspaceWithData(
            tenantId = tenants["tenant_a"]!!.id,
            name = "RLS Workspace A3", 
            createdBy = users["admin_a"]!!.id
        )
        
        workspaceData["workspace_a1"] = workspaceA1
        workspaceData["workspace_a2"] = workspaceA2
        workspaceData["workspace_a3"] = workspaceA3
        
        // Create workspaces for Tenant B
        val workspaceB1 = createWorkspaceWithData(
            tenantId = tenants["tenant_b"]!!.id,
            name = "RLS Workspace B1",
            createdBy = users["admin_b"]!!.id
        )
        
        val workspaceB2 = createWorkspaceWithData(
            tenantId = tenants["tenant_b"]!!.id,
            name = "RLS Workspace B2",
            createdBy = users["regular_b"]!!.id
        )
        
        workspaceData["workspace_b1"] = workspaceB1
        workspaceData["workspace_b2"] = workspaceB2
        
        return workspaceData
    }
    
    private fun createWorkspaceWithData(
        tenantId: TenantId,
        name: String,
        createdBy: UserId
    ): WorkspaceTestData {
        // Set RLS context to create data in correct tenant
        jdbcTemplate.execute("""
            SELECT set_config('app.current_tenant_id', '${tenantId.value}', false);
            SELECT set_config('app.current_user_id', '${createdBy.value}', false);
        """.trimIndent())
        
        // Create workspace
        val workspace = workspaceRepository.save(
            Workspace(
                id = WorkspaceId(UUID.randomUUID()),
                tenantId = tenantId,
                name = name,
                createdBy = createdBy,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create tables in the workspace
        val table1 = tableRepository.save(
            Table(
                id = TableId(UUID.randomUUID()),
                workspaceId = workspace.id,
                name = "RLS Test Table 1",
                properties = emptyMap(),
                propertyOrder = emptyList(),
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        val table2 = tableRepository.save(
            Table(
                id = TableId(UUID.randomUUID()),
                workspaceId = workspace.id,
                name = "RLS Test Table 2",
                properties = emptyMap(),
                propertyOrder = emptyList(),
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        
        // Create records in the tables
        val records = (1..5).map { i ->
            recordRepository.save(
                Record(
                    id = RecordId(UUID.randomUUID()),
                    tableId = if (i % 2 == 0) table1.id else table2.id,
                    data = buildJsonObject {
                        put("name", "Record $i")
                        put("value", i)
                    },
                    position = i.toFloat(),
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
        }
        
        logger.debug("Created workspace test data: workspace={}, tables=2, records={}",
                   workspace.name, records.size)
        
        return WorkspaceTestData(
            workspace = workspace,
            tables = listOf(table1, table2),
            records = records
        )
    }
}

/**
 * Container for complete RLS test environment
 */
data class RLSTestEnvironment(
    val tenants: Map<String, Tenant>,
    val users: Map<String, User>,
    val roles: Map<String, DynamicRole>,
    val memberships: Map<String, TenantMembership>,
    val workspaceData: Map<String, WorkspaceTestData>
) {
    
    // シンプルなアクセス用プロパティ
    val tenantAId: UUID get() = tenants["tenant_a"]!!.id.value
    val tenantBId: UUID get() = tenants["tenant_b"]!!.id.value
    
    // Direct entity access for clean Map-based structure
    val tenantA: Tenant get() = tenants["tenant_a"]!!
    val tenantB: Tenant get() = tenants["tenant_b"]!!
    
    val adminUserA: User get() = users["admin_a"]!!
    val regularUserA: User get() = users["regular_a"]!!
    val adminUserB: User get() = users["admin_b"]!!
    val regularUserB: User get() = users["regular_b"]!!
    
    // ワークスペースへの直接アクセス
    val workspacesA: List<Workspace> get() = listOf(
        workspaceData["workspace_a1"]!!.workspace,
        workspaceData["workspace_a2"]!!.workspace,
        workspaceData["workspace_a3"]!!.workspace
    )
    
    val workspacesB: List<Workspace> get() = listOf(
        workspaceData["workspace_b1"]!!.workspace,
        workspaceData["workspace_b2"]!!.workspace
    )
    
    // テーブルへの直接アクセス
    val tablesA: List<Table> get() = workspacesA.flatMap { workspace ->
        workspaceData.values.find { it.workspace.id == workspace.id }?.tables ?: emptyList()
    }
    
    val tablesB: List<Table> get() = workspacesB.flatMap { workspace ->
        workspaceData.values.find { it.workspace.id == workspace.id }?.tables ?: emptyList()
    }
    
    // レコードへの直接アクセス  
    val recordsA: List<Record> get() = workspacesA.flatMap { workspace ->
        workspaceData.values.find { it.workspace.id == workspace.id }?.records ?: emptyList()
    }
    
    val recordsB: List<Record> get() = workspacesB.flatMap { workspace ->
        workspaceData.values.find { it.workspace.id == workspace.id }?.records ?: emptyList()
    }
    
    /**
     * Get tenant by key with null safety
     */
    fun getTenant(key: String): Tenant = tenants[key] 
        ?: throw IllegalArgumentException("Tenant not found: $key")
    
    /**
     * Get user by key with null safety
     */
    fun getUser(key: String): User = users[key]
        ?: throw IllegalArgumentException("User not found: $key")
    
    /**
     * Get role by key with null safety
     */
    fun getRole(key: String): DynamicRole = roles[key]
        ?: throw IllegalArgumentException("Role not found: $key")
    
    /**
     * Get workspace data by key with null safety
     */
    fun getWorkspaceData(key: String): WorkspaceTestData = workspaceData[key]
        ?: throw IllegalArgumentException("Workspace data not found: $key")
}

/**
 * Container for workspace-related test data
 */
data class WorkspaceTestData(
    val workspace: Workspace,
    val tables: List<Table>,
    val records: List<Record>
)

