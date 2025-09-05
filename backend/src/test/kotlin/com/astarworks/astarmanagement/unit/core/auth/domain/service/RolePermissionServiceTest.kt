package com.astarworks.astarmanagement.unit.core.auth.domain.service

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.domain.exception.RoleManagementException
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.RolePermissionRepository
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import io.kotest.matchers.shouldBe
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldNotBeEmpty
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.string.shouldContain
import io.kotest.matchers.ints.shouldBeGreaterThanOrEqual
import io.kotest.matchers.shouldNotBe
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.util.*

/**
 * RolePermissionService の単体テスト (MockK版)
 * 
 * 主要機能のテスト:
 * - 権限付与 (文字列・オブジェクト・複数)
 * - 権限取り消し (文字列・オブジェクト・複数・全削除)  
 * - 権限クエリ (取得・チェック・カウント)
 * - 権限バリデーション (型安全・文字列変換・階層)
 * - 高度な操作 (同期・比較・コピー・置換)
 * - 分析機能 (使用統計・提案・有効権限)
 * - 型安全操作 (PermissionRule オブジェクト)
 * - 文字列→列挙型変換
 * - データモデル (SyncResult・PermissionDiff等)
 * - エラーハンドリング・エッジケース
 */
@DisplayName("RolePermissionService Unit Tests (MockK)")
class RolePermissionServiceTest : UnitTestBase() {

    companion object {
        // Fixed UUID values for consistent testing
        private val FIXED_TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001")
        private val FIXED_ROLE_ID = UUID.fromString("00000000-0000-0000-0000-000000000002")
        private val FIXED_RESOURCE_ID = UUID.fromString("00000000-0000-0000-0000-000000000003")
        private val FIXED_ROLE_ID_2 = UUID.fromString("00000000-0000-0000-0000-000000000004")
        private val FIXED_ROLE_ID_3 = UUID.fromString("00000000-0000-0000-0000-000000000005")
        private val FIXED_RESOURCE_GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000006")
    }

    // Dependencies - MockK style (lateinit to reset in setUp)
    private lateinit var rolePermissionRepository: RolePermissionRepository
    private lateinit var dynamicRoleRepository: DynamicRoleRepository
    
    // Service under test
    private lateinit var rolePermissionService: RolePermissionService
    
    // Test data - using fixed values
    private val tenantId = TenantId(FIXED_TENANT_ID)
    private val roleId = RoleId(FIXED_ROLE_ID)
    private lateinit var testRole: DynamicRole
    private lateinit var tableViewOwnRule: PermissionRule.GeneralRule
    private lateinit var tableEditAllRule: PermissionRule.GeneralRule
    private lateinit var documentEditTeamRule: PermissionRule.GeneralRule
    private lateinit var specificResourceRule: PermissionRule.ResourceIdRule

    @BeforeEach
    fun setUp() {
        // Create fresh mocks for each test
        rolePermissionRepository = mockk<RolePermissionRepository>()
        dynamicRoleRepository = mockk<DynamicRoleRepository>()
        
        testRole = DynamicRole(
            id = roleId,
            tenantId = tenantId,
            name = "test_role",
            displayName = "Test Role",
            color = "#FF0000",
            isSystem = false
        )
        
        tableViewOwnRule = PermissionRule.GeneralRule(
            resourceType = ResourceType.TABLE,
            action = Action.VIEW,
            scope = Scope.OWN
        )
        
        tableEditAllRule = PermissionRule.GeneralRule(
            resourceType = ResourceType.TABLE,
            action = Action.EDIT,
            scope = Scope.ALL
        )
        
        documentEditTeamRule = PermissionRule.GeneralRule(
            resourceType = ResourceType.DOCUMENT,
            action = Action.EDIT,
            scope = Scope.TEAM
        )
        
        specificResourceRule = PermissionRule.ResourceIdRule(
            resourceType = ResourceType.DOCUMENT,
            action = Action.MANAGE,
            resourceId = FIXED_RESOURCE_ID
        )
        
        rolePermissionService = RolePermissionService(
            rolePermissionRepository = rolePermissionRepository,
            dynamicRoleRepository = dynamicRoleRepository
        )
    }

    @Nested
    @DisplayName("Group 1: Permission Granting Tests")
    inner class PermissionGrantingTests {

        @Test
        @DisplayName("grantPermissionFromString should grant permission when role exists and permission is valid")
        fun `should grant permission from string when role exists and permission is valid`() {
            // Arrange
            val permissionString = "table.view.own"
            val savedPermission = RolePermission(roleId, tableViewOwnRule)
            val capturedPermission = slot<RolePermission>()

            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns false
            every { rolePermissionRepository.save(capture(capturedPermission)) } returns savedPermission

            // Act
            val result = rolePermissionService.grantPermissionFromString(roleId, permissionString)

            // Assert
            result.roleId shouldBe roleId
            result.permissionRule shouldBe tableViewOwnRule
            verify { rolePermissionRepository.save(any<RolePermission>()) }
        }

        @Test
        @DisplayName("grantPermissionFromString should throw exception when role not found")
        fun `should throw exception when role not found for grant permission from string`() {
            // Arrange
            val permissionString = "table.view.own"
            every { dynamicRoleRepository.findById(roleId) } returns null

            // Act & Assert
            assertThrows<RoleManagementException.RoleNotFoundException> {
                rolePermissionService.grantPermissionFromString(roleId, permissionString)
            }
        }

        @Test
        @DisplayName("grantPermissionFromString should throw exception when permission format is invalid")
        fun `should throw exception when permission format is invalid for grant permission from string`() {
            // Arrange
            val invalidPermissionString = "invalid.permission.format.extra"
            
            // Act & Assert
            assertThrows<IllegalArgumentException> {
                rolePermissionService.grantPermissionFromString(roleId, invalidPermissionString)
            }
        }

        @Test
        @DisplayName("grantPermissionFromString should return existing permission when already granted")
        fun `should return existing permission when already granted from string`() {
            // Arrange
            val permissionString = "table.view.own"
            val existingPermission = RolePermission(roleId, tableViewOwnRule)

            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true
            every { rolePermissionRepository.findByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns existingPermission

            // Act
            val result = rolePermissionService.grantPermissionFromString(roleId, permissionString)

            // Assert
            result shouldBe existingPermission
            verify(exactly = 0) { rolePermissionRepository.save(any<RolePermission>()) }
        }

        @Test
        @DisplayName("grantPermission should grant permission when role exists and permission is valid")
        fun `should grant permission when role exists and permission is valid`() {
            // Arrange
            val savedPermission = RolePermission(roleId, tableViewOwnRule)
            val capturedPermission = slot<RolePermission>()

            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns false
            every { rolePermissionRepository.save(capture(capturedPermission)) } returns savedPermission

            // Act
            val result = rolePermissionService.grantPermission(roleId, tableViewOwnRule)

            // Assert
            result.roleId shouldBe roleId
            result.permissionRule shouldBe tableViewOwnRule
            capturedPermission.captured.roleId shouldBe roleId
            capturedPermission.captured.permissionRule shouldBe tableViewOwnRule
        }

        @Test
        @DisplayName("grantPermission should throw exception when role not found")
        fun `should throw exception when role not found for grant permission`() {
            // Arrange
            every { dynamicRoleRepository.findById(roleId) } returns null

            // Act & Assert
            assertThrows<RoleManagementException.RoleNotFoundException> {
                rolePermissionService.grantPermission(roleId, tableViewOwnRule)
            }
        }

        @Test
        @DisplayName("grantPermission should return existing permission when already granted")
        fun `should return existing permission when already granted`() {
            // Arrange
            val existingPermission = RolePermission(roleId, tableViewOwnRule)

            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true
            every { rolePermissionRepository.findByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns existingPermission

            // Act
            val result = rolePermissionService.grantPermission(roleId, tableViewOwnRule)

            // Assert
            result shouldBe existingPermission
            verify(exactly = 0) { rolePermissionRepository.save(any<RolePermission>()) }
        }

        @Test
        @DisplayName("grantPermissions should grant multiple permissions when role exists")
        fun `should grant multiple permissions when role exists`() {
            // Arrange
            val permissionStrings = listOf("table.view.own", "table.edit.all")
            val permission1 = RolePermission(roleId, tableViewOwnRule)
            val permission2 = RolePermission(roleId, tableEditAllRule)
            val capturedPermissions = mutableListOf<RolePermission>()

            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns false
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableEditAllRule) } returns false
            every { rolePermissionRepository.save(capture(capturedPermissions)) } returnsMany listOf(permission1, permission2)

            // Act
            val result = rolePermissionService.grantPermissions(roleId, permissionStrings)

            // Assert
            result shouldHaveSize 2
            capturedPermissions shouldHaveSize 2
            verify(exactly = 2) { rolePermissionRepository.save(any<RolePermission>()) }
        }

        @Test
        @DisplayName("grantPermissions should skip already granted permissions")
        fun `should skip already granted permissions when granting multiple`() {
            // Arrange
            val permissionStrings = listOf("table.view.own", "table.edit.all")
            val permission2 = RolePermission(roleId, tableEditAllRule)
            val capturedPermissions = mutableListOf<RolePermission>()

            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true // Already exists
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableEditAllRule) } returns false
            every { rolePermissionRepository.save(capture(capturedPermissions)) } returns permission2

            // Act
            val result = rolePermissionService.grantPermissions(roleId, permissionStrings)

            // Assert
            result shouldHaveSize 1
            result.first().permissionRule shouldBe tableEditAllRule
            verify(exactly = 1) { rolePermissionRepository.save(any<RolePermission>()) }
        }

        @Test
        @DisplayName("grantPermissions should skip invalid permission formats and continue with valid ones")
        fun `should skip invalid permission formats and continue with valid ones`() {
            // Arrange
            val permissionStrings = listOf("invalid.format", "table.edit.all", "another.invalid")
            val permission = RolePermission(roleId, tableEditAllRule)

            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableEditAllRule) } returns false
            every { rolePermissionRepository.save(any<RolePermission>()) } returns permission

            // Act
            val result = rolePermissionService.grantPermissions(roleId, permissionStrings)

            // Assert
            result shouldHaveSize 1
            result.first().permissionRule shouldBe tableEditAllRule
            verify(exactly = 1) { rolePermissionRepository.save(any<RolePermission>()) }
        }

        @Test
        @DisplayName("grantPermissions should throw exception when role not found")
        fun `should throw exception when role not found for grant permissions`() {
            // Arrange
            val permissionStrings = listOf("table.view.own")
            every { dynamicRoleRepository.findById(roleId) } returns null

            // Act & Assert
            assertThrows<RoleManagementException.RoleNotFoundException> {
                rolePermissionService.grantPermissions(roleId, permissionStrings)
            }
        }
    }

    @Nested
    @DisplayName("Group 2: Permission Revoking Tests")
    inner class PermissionRevokingTests {

        @Test
        @DisplayName("revokePermission should revoke permission when it exists")
        fun `should revoke permission when it exists`() {
            // Arrange
            val permissionString = "table.view.own"
            
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true
            every { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } just runs

            // Act
            rolePermissionService.revokePermission(roleId, permissionString)

            // Assert
            verify { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableViewOwnRule) }
        }

        @Test
        @DisplayName("revokePermission should handle gracefully when permission does not exist")
        fun `should handle gracefully when permission does not exist for revoke`() {
            // Arrange
            val permissionString = "table.view.own"
            
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns false

            // Act
            rolePermissionService.revokePermission(roleId, permissionString)

            // Assert
            verify(exactly = 0) { rolePermissionRepository.deleteByRoleIdAndPermissionRule(any(), any()) }
        }

        @Test
        @DisplayName("revokePermission should handle gracefully when permission format is invalid")
        fun `should handle gracefully when permission format is invalid for revoke`() {
            // Arrange
            val invalidPermissionString = "invalid.format"

            // Act
            rolePermissionService.revokePermission(roleId, invalidPermissionString)

            // Assert
            verify(exactly = 0) { rolePermissionRepository.deleteByRoleIdAndPermissionRule(any(), any()) }
        }

        @Test
        @DisplayName("revokePermissions should revoke multiple permissions when they exist")
        fun `should revoke multiple permissions when they exist`() {
            // Arrange
            val permissionStrings = listOf("table.view.own", "table.edit.all")
            
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableEditAllRule) } returns true
            every { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } just runs
            every { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableEditAllRule) } just runs

            // Act
            rolePermissionService.revokePermissions(roleId, permissionStrings)

            // Assert
            verify { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableViewOwnRule) }
            verify { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableEditAllRule) }
        }

        @Test
        @DisplayName("revokePermissions should skip non-existing permissions")
        fun `should skip non-existing permissions when revoking multiple`() {
            // Arrange
            val permissionStrings = listOf("table.view.own", "table.edit.all")
            
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns false // Does not exist
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableEditAllRule) } returns true
            every { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableEditAllRule) } just runs

            // Act
            rolePermissionService.revokePermissions(roleId, permissionStrings)

            // Assert
            verify(exactly = 0) { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableViewOwnRule) }
            verify { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableEditAllRule) }
        }

        @Test
        @DisplayName("revokePermissions should skip invalid permission formats and continue with valid ones")
        fun `should skip invalid permission formats and continue with valid ones for revoke`() {
            // Arrange
            val permissionStrings = listOf("invalid.format", "table.edit.all", "another.invalid")
            
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableEditAllRule) } returns true
            every { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableEditAllRule) } just runs

            // Act
            rolePermissionService.revokePermissions(roleId, permissionStrings)

            // Assert
            verify(exactly = 1) { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableEditAllRule) }
        }

        @Test
        @DisplayName("revokeAllPermissions should remove all permissions from role")
        fun `should remove all permissions from role`() {
            // Arrange
            every { rolePermissionRepository.deleteByRoleId(roleId) } just runs

            // Act
            rolePermissionService.revokeAllPermissions(roleId)

            // Assert
            verify { rolePermissionRepository.deleteByRoleId(roleId) }
        }

        @Test
        @DisplayName("revokePermissionRule should revoke permission using PermissionRule object")
        fun `should revoke permission using PermissionRule object`() {
            // Arrange
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true
            every { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } just runs

            // Act
            rolePermissionService.revokePermissionRule(roleId, tableViewOwnRule)

            // Assert
            verify { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableViewOwnRule) }
        }

        @Test
        @DisplayName("revokePermissionRules should revoke multiple permissions using PermissionRule objects")
        fun `should revoke multiple permissions using PermissionRule objects`() {
            // Arrange
            val permissionRules = listOf(tableViewOwnRule, tableEditAllRule)
            
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableEditAllRule) } returns true
            every { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } just runs
            every { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableEditAllRule) } just runs

            // Act
            rolePermissionService.revokePermissionRules(roleId, permissionRules)

            // Assert
            verify { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableViewOwnRule) }
            verify { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, tableEditAllRule) }
        }
    }

    @Nested
    @DisplayName("Group 3: Permission Queries Tests")
    inner class PermissionQueriesTests {

        @Test
        @DisplayName("getRolePermissions should return all permissions for role")
        fun `should return all permissions for role`() {
            // Arrange
            val permission1 = RolePermission(roleId, tableViewOwnRule)
            val permission2 = RolePermission(roleId, tableEditAllRule)
            val expectedPermissions = listOf(permission1, permission2)

            every { rolePermissionRepository.findByRoleId(roleId) } returns expectedPermissions

            // Act
            val result = rolePermissionService.getRolePermissions(roleId)

            // Assert
            result shouldHaveSize 2
            result shouldContainExactly expectedPermissions
        }

        @Test
        @DisplayName("getRolePermissions should return empty list when role has no permissions")
        fun `should return empty list when role has no permissions`() {
            // Arrange
            every { rolePermissionRepository.findByRoleId(roleId) } returns emptyList()

            // Act
            val result = rolePermissionService.getRolePermissions(roleId)

            // Assert
            result.shouldBeEmpty()
        }

        @Test
        @DisplayName("getRolePermissionRules should return permission rule strings")
        fun `should return permission rule strings`() {
            // Arrange
            val permission1 = RolePermission(roleId, tableViewOwnRule)
            val permission2 = RolePermission(roleId, tableEditAllRule)
            val permissions = listOf(permission1, permission2)
            val expectedStrings = listOf("table.view.own", "table.edit.all")

            every { rolePermissionRepository.findByRoleId(roleId) } returns permissions

            // Act
            val result = rolePermissionService.getRolePermissionRules(roleId)

            // Assert
            result shouldHaveSize 2
            result shouldContainExactly expectedStrings
        }

        @Test
        @DisplayName("getRolePermissionRulesAsObjects should return typed PermissionRule objects")
        fun `should return typed PermissionRule objects`() {
            // Arrange
            val permission1 = RolePermission(roleId, tableViewOwnRule)
            val permission2 = RolePermission(roleId, tableEditAllRule)
            val permissions = listOf(permission1, permission2)

            every { rolePermissionRepository.findByRoleId(roleId) } returns permissions

            // Act
            val result = rolePermissionService.getRolePermissionRulesAsObjects(roleId)

            // Assert
            result shouldHaveSize 2
            result shouldContainExactly listOf(tableViewOwnRule, tableEditAllRule)
        }

        @Test
        @DisplayName("hasPermission should return true when permission exists (PermissionRule)")
        fun `should return true when permission exists using PermissionRule`() {
            // Arrange
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true

            // Act
            val result = rolePermissionService.hasPermission(roleId, tableViewOwnRule)

            // Assert
            result shouldBe true
        }

        @Test
        @DisplayName("hasPermission should return false when permission does not exist (PermissionRule)")
        fun `should return false when permission does not exist using PermissionRule`() {
            // Arrange
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns false

            // Act
            val result = rolePermissionService.hasPermission(roleId, tableViewOwnRule)

            // Assert
            result shouldBe false
        }

        @Test
        @DisplayName("hasPermission should return true when permission exists (String)")
        fun `should return true when permission exists using String`() {
            // Arrange
            val permissionString = "table.view.own"
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true

            // Act
            val result = rolePermissionService.hasPermission(roleId, permissionString)

            // Assert
            result shouldBe true
        }

        @Test
        @DisplayName("hasPermission should return false when permission format is invalid (String)")
        fun `should return false when permission format is invalid using String`() {
            // Arrange
            val invalidPermissionString = "invalid.format"

            // Act
            val result = rolePermissionService.hasPermission(roleId, invalidPermissionString)

            // Assert
            result shouldBe false
        }
    }

    @Nested
    @DisplayName("Group 4: Permission Validation Tests")
    inner class PermissionValidationTests {

        @Test
        @DisplayName("hasPermission should return true when role has exact permission rule")
        fun `should return true when role has exact permission rule`() {
            // Arrange
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true

            // Act
            val result = rolePermissionService.hasPermission(roleId, tableViewOwnRule)

            // Assert
            result shouldBe true
            verify { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) }
        }

        @Test
        @DisplayName("hasPermission should return false when role does not have permission rule")
        fun `should return false when role does not have permission rule`() {
            // Arrange
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns false

            // Act
            val result = rolePermissionService.hasPermission(roleId, tableViewOwnRule)

            // Assert
            result shouldBe false
            verify { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) }
        }

        @Test
        @DisplayName("hasPermission should handle repository exceptions gracefully")
        fun `should handle repository exceptions gracefully in hasPermission check`() {
            // Arrange
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } throws RuntimeException("Database error")

            // Act & Assert
            assertThrows<RuntimeException> {
                rolePermissionService.hasPermission(roleId, tableViewOwnRule)
            }
        }

        @Test
        @DisplayName("hasPermission should grant access when role has matching resource, action, and scope")
        fun `should grant access when role has matching resource, action, and scope`() {
            // Arrange
            val rolePermissions = listOf(RolePermission(roleId, tableViewOwnRule))
            every { rolePermissionRepository.findByRoleId(roleId) } returns rolePermissions

            // Act
            val result = rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.VIEW, Scope.OWN)

            // Assert
            result shouldBe true
            verify { rolePermissionRepository.findByRoleId(roleId) }
        }

        @Test
        @DisplayName("hasPermission should deny access when resource type does not match")
        fun `should deny access when resource type does not match`() {
            // Arrange
            val rolePermissions = listOf(RolePermission(roleId, tableViewOwnRule))
            every { rolePermissionRepository.findByRoleId(roleId) } returns rolePermissions

            // Act
            val result = rolePermissionService.hasPermission(roleId, ResourceType.DOCUMENT, Action.VIEW, Scope.OWN)

            // Assert
            result shouldBe false
            verify { rolePermissionRepository.findByRoleId(roleId) }
        }

        @Test
        @DisplayName("hasPermission should grant access when MANAGE action covers specific action")
        fun `should grant access when MANAGE action covers specific action`() {
            // Arrange
            val manageRule = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.MANAGE,
                scope = Scope.ALL
            )
            val rolePermissions = listOf(RolePermission(roleId, manageRule))
            every { rolePermissionRepository.findByRoleId(roleId) } returns rolePermissions

            // Act
            val result = rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.VIEW, Scope.OWN)

            // Assert
            result shouldBe true
            verify { rolePermissionRepository.findByRoleId(roleId) }
        }

        @Test
        @DisplayName("hasPermissionForResource should grant access to specific resource when ResourceIdRule matches")
        fun `should grant access to specific resource when ResourceIdRule matches`() {
            // Arrange
            val specificResourceId = UUID.randomUUID()
            val specificRule = PermissionRule.ResourceIdRule(
                resourceType = ResourceType.DOCUMENT,
                action = Action.EDIT,
                resourceId = specificResourceId
            )
            val rolePermissions = listOf(RolePermission(roleId, specificRule))
            every { rolePermissionRepository.findByRoleId(roleId) } returns rolePermissions

            // Act
            val result = rolePermissionService.hasPermissionForResource(
                roleId.value, specificResourceId, ResourceType.DOCUMENT, Action.EDIT
            )

            // Assert
            result shouldBe true
            verify { rolePermissionRepository.findByRoleId(roleId) }
        }

        @Test
        @DisplayName("hasPermissionForResource should deny access when ResourceIdRule resource ID does not match")
        fun `should deny access when ResourceIdRule resource ID does not match`() {
            // Arrange
            val specificResourceId = UUID.randomUUID()
            val differentResourceId = UUID.randomUUID()
            val specificRule = PermissionRule.ResourceIdRule(
                resourceType = ResourceType.DOCUMENT,
                action = Action.EDIT,
                resourceId = specificResourceId
            )
            val rolePermissions = listOf(RolePermission(roleId, specificRule))
            every { rolePermissionRepository.findByRoleId(roleId) } returns rolePermissions

            // Act
            val result = rolePermissionService.hasPermissionForResource(
                roleId.value, differentResourceId, ResourceType.DOCUMENT, Action.EDIT
            )

            // Assert
            result shouldBe false
            verify { rolePermissionRepository.findByRoleId(roleId) }
        }

        @Test
        @DisplayName("hasPermission should convert valid strings to enums and check permission")
        fun `should convert valid strings to enums and check permission`() {
            // Arrange
            val rolePermissions = listOf(RolePermission(roleId, tableViewOwnRule))
            every { rolePermissionRepository.findByRoleId(roleId) } returns rolePermissions

            // Act
            val result = rolePermissionService.hasPermission(roleId, "table", "view", "own")

            // Assert
            result shouldBe true
            verify { rolePermissionRepository.findByRoleId(roleId) }
        }

        @Test
        @DisplayName("hasPermission should return false for invalid string formats")
        fun `should return false for invalid string formats in enum conversion`() {
            // Arrange - no mocking needed for invalid input

            // Act
            val result = rolePermissionService.hasPermission(roleId, "invalid_resource", "view", "own")

            // Assert
            result shouldBe false
        }

        @Test
        @DisplayName("canGrantPermission should return true when permission can be granted to existing role")
        fun `should return true when permission can be granted to existing role`() {
            // Arrange
            val permissionString = "table.view.own"
            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns false

            // Act
            val result = rolePermissionService.canGrantPermission(roleId, permissionString)

            // Assert
            result shouldBe true
            verify { dynamicRoleRepository.findById(roleId) }
            verify { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) }
        }

        @Test
        @DisplayName("canGrantPermission should return false when role does not exist or permission already granted")
        fun `should return false when role does not exist or permission already granted`() {
            // Arrange - role not found
            val permissionString = "table.view.own"
            every { dynamicRoleRepository.findById(roleId) } returns null

            // Act
            val result = rolePermissionService.canGrantPermission(roleId, permissionString)

            // Assert
            result shouldBe false
            verify { dynamicRoleRepository.findById(roleId) }
        }
    }

    @Nested
    @DisplayName("Group 5: Advanced Operations Tests")
    inner class AdvancedOperationsTests {

        @Test
        @DisplayName("countRolePermissions should return correct count of role permissions")
        fun `should return correct count of role permissions`() {
            // Arrange
            val expectedCount = 5L
            every { rolePermissionRepository.countByRoleId(roleId) } returns expectedCount

            // Act
            val result = rolePermissionService.countRolePermissions(roleId)

            // Assert
            result shouldBe expectedCount
            verify { rolePermissionRepository.countByRoleId(roleId) }
        }

        @Test
        @DisplayName("replaceRolePermissions should replace all permissions with new set using strings")
        fun `should replace all permissions with new set using strings`() {
            // Arrange
            val newPermissions = listOf("table.view.own", "table.edit.team")
            val permission1 = RolePermission(roleId, tableViewOwnRule)
            val permission2 = RolePermission(roleId, PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM))
            
            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.deleteByRoleId(roleId) } just Runs
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, any()) } returns false
            every { rolePermissionRepository.save(any<RolePermission>()) } returnsMany listOf(permission1, permission2)

            // Act
            val result = rolePermissionService.replaceRolePermissions(roleId, newPermissions)

            // Assert
            result shouldHaveSize 2
            verify { rolePermissionRepository.deleteByRoleId(roleId) }
            verify(exactly = 2) { rolePermissionRepository.save(any<RolePermission>()) }
        }

        @Test
        @DisplayName("replaceRolePermissionRules should replace all permissions with new set using PermissionRule objects")
        fun `should replace all permissions with new set using PermissionRule objects`() {
            // Arrange
            val newPermissionRules = listOf(tableViewOwnRule, tableEditAllRule)
            val permission1 = RolePermission(roleId, tableViewOwnRule)
            val permission2 = RolePermission(roleId, tableEditAllRule)
            
            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.deleteByRoleId(roleId) } just Runs
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, any()) } returns false
            every { rolePermissionRepository.save(any<RolePermission>()) } returnsMany listOf(permission1, permission2)

            // Act
            val result = rolePermissionService.replaceRolePermissionRules(roleId, newPermissionRules)

            // Assert
            result shouldHaveSize 2
            verify { rolePermissionRepository.deleteByRoleId(roleId) }
            verify(exactly = 2) { rolePermissionRepository.save(any<RolePermission>()) }
        }

        @Test
        @DisplayName("syncPermissions should sync permissions and return correct SyncResult")
        fun `should sync permissions and return correct SyncResult`() {
            // Arrange
            val currentPermissions = listOf("table.view.own", "table.edit.team")
            val newPermissions = setOf("table.view.own", "document.view.all") // keep one, add one, remove one
            val expectedAdded = listOf("document.view.all")
            val expectedRemoved = listOf("table.edit.team")
            val expectedUnchanged = listOf("table.view.own")
            
            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.findByRoleId(roleId) } returns listOf(
                RolePermission(roleId, tableViewOwnRule),
                RolePermission(roleId, PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM))
            )
            every { rolePermissionRepository.save(any<RolePermission>()) } returns RolePermission(roleId, tableViewOwnRule)
            every { rolePermissionRepository.deleteByRoleIdAndPermissionRule(roleId, any()) } just Runs

            // Act
            val result = rolePermissionService.syncPermissions(roleId, newPermissions)

            // Assert
            result.roleId shouldBe roleId
            result.added shouldContainExactly expectedAdded
            result.removed shouldContainExactly expectedRemoved
            result.unchanged shouldContainExactly expectedUnchanged
            result.isSuccessful shouldBe true
            result.totalChanges shouldBe 2
        }

        @Test
        @DisplayName("syncPermissions should handle sync errors and include failed permissions in result")
        fun `should handle sync errors and include failed permissions in result`() {
            // Arrange
            val currentPermissions = listOf("table.view.own")
            val newPermissions = setOf("table.view.own", "invalid.permission.format")
            
            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.findByRoleId(roleId) } returns listOf(RolePermission(roleId, tableViewOwnRule))

            // Act
            val result = rolePermissionService.syncPermissions(roleId, newPermissions)

            // Assert
            result.roleId shouldBe roleId
            result.failed.size shouldBe 1
            result.failed.keys shouldContainExactly setOf("invalid.permission.format")
            result.isSuccessful shouldBe false
        }

        @Test
        @DisplayName("comparePermissions should compare permissions between two roles and return PermissionDiff")
        fun `should compare permissions between two roles and return PermissionDiff`() {
            // Arrange
            val roleId2 = RoleId(UUID.randomUUID())
            val role1Permissions = listOf("table.view.own", "table.edit.team")
            val role2Permissions = listOf("table.edit.team", "document.view.all")
            
            every { rolePermissionRepository.findByRoleId(roleId) } returns listOf(
                RolePermission(roleId, tableViewOwnRule),
                RolePermission(roleId, PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM))
            )
            every { rolePermissionRepository.findByRoleId(roleId2) } returns listOf(
                RolePermission(roleId2, PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM)),
                RolePermission(roleId2, PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.VIEW, Scope.ALL))
            )

            // Act
            val result = rolePermissionService.comparePermissions(roleId.value, roleId2.value)

            // Assert
            result.role1Id shouldBe roleId.value
            result.role2Id shouldBe roleId2.value
            result.onlyInFirst shouldContainExactly listOf("table.view.own")
            result.onlyInSecond shouldContainExactly listOf("document.view.all")
            result.inBoth shouldContainExactly listOf("table.edit.team")
            result.areIdentical shouldBe false
            result.totalDifferences shouldBe 2
        }

        @Test
        @DisplayName("copyPermissions should copy permissions from source to target role")
        fun `should copy permissions from source to target role`() {
            // Arrange
            val fromRoleId = UUID.randomUUID()
            val toRoleId = UUID.randomUUID()
            val fromRole = DynamicRole.forTenant(tenantId, "from_role", "From Role", "#00FF00")
            val toRole = DynamicRole.forTenant(tenantId, "to_role", "To Role", "#0000FF")
            val sourcePermissions = listOf("table.view.own", "table.edit.team")
            val copiedPermissions = listOf(
                RolePermission(RoleId(toRoleId), tableViewOwnRule),
                RolePermission(RoleId(toRoleId), PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM))
            )
            
            every { dynamicRoleRepository.findById(RoleId(fromRoleId)) } returns fromRole
            every { dynamicRoleRepository.findById(RoleId(toRoleId)) } returns toRole
            every { rolePermissionRepository.findByRoleId(RoleId(fromRoleId)) } returns listOf(
                RolePermission(RoleId(fromRoleId), tableViewOwnRule),
                RolePermission(RoleId(fromRoleId), PermissionRule.GeneralRule(ResourceType.TABLE, Action.EDIT, Scope.TEAM))
            )
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(RoleId(toRoleId), any()) } returns false
            every { rolePermissionRepository.save(any<RolePermission>()) } returnsMany copiedPermissions

            // Act
            val result = rolePermissionService.copyPermissions(fromRoleId, toRoleId, false)

            // Assert
            result shouldHaveSize 2
            verify { rolePermissionRepository.findByRoleId(RoleId(fromRoleId)) }
            verify(exactly = 2) { rolePermissionRepository.save(any<RolePermission>()) }
        }

        @Test
        @DisplayName("copyPermissions should copy permissions with overwrite option")
        fun `should copy permissions with overwrite option`() {
            // Arrange
            val fromRoleId = UUID.randomUUID()
            val toRoleId = UUID.randomUUID()
            val fromRole = DynamicRole.forTenant(tenantId, "from_role", "From Role", "#00FF00")
            val toRole = DynamicRole.forTenant(tenantId, "to_role", "To Role", "#0000FF")
            val copiedPermissions = listOf(RolePermission(RoleId(toRoleId), tableViewOwnRule))
            
            every { dynamicRoleRepository.findById(RoleId(fromRoleId)) } returns fromRole
            every { dynamicRoleRepository.findById(RoleId(toRoleId)) } returns toRole
            every { rolePermissionRepository.findByRoleId(RoleId(fromRoleId)) } returns listOf(
                RolePermission(RoleId(fromRoleId), tableViewOwnRule)
            )
            every { rolePermissionRepository.deleteByRoleId(RoleId(toRoleId)) } just Runs
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(RoleId(toRoleId), any()) } returns false
            every { rolePermissionRepository.save(any<RolePermission>()) } returns copiedPermissions[0]

            // Act
            val result = rolePermissionService.copyPermissions(fromRoleId, toRoleId, true)

            // Assert
            result shouldHaveSize 1
            verify { rolePermissionRepository.deleteByRoleId(RoleId(toRoleId)) }
            verify { rolePermissionRepository.save(any<RolePermission>()) }
        }
    }
    
    @Nested
    @DisplayName("Group 6: Permission Analysis Tests")
    inner class PermissionAnalysisTests {
        
        @Test
        @DisplayName("validatePermissionHierarchy should detect redundant permissions due to broader scope")
        fun `should detect redundant permissions due to broader scope`() {
            // Arrange
            val permissions = listOf(
                "table.view.own",
                "table.view.team",
                "table.view.all",
                "document.edit.own",
                "document.edit.team"
            )
            
            // Act
            val warnings = rolePermissionService.validatePermissionHierarchy(permissions)
            
            // Assert
            warnings.size shouldBe 5
            
            // Redundancy warnings for table.view permissions
            warnings.any { it.contains("table.view.own") && it.contains("redundant") } shouldBe true
            warnings.any { it.contains("table.view.team") && it.contains("redundant") } shouldBe true
            
            // Redundancy warning for document.edit.own (team scope makes own redundant)
            warnings.any { it.contains("document.edit.own") && it.contains("redundant") } shouldBe true
            
            // Prerequisite warnings for document.edit permissions (no view permissions)
            warnings.any { it.contains("document.edit.own") && it.contains("view permission") } shouldBe true
            warnings.any { it.contains("document.edit.team") && it.contains("view permission") } shouldBe true
        }
        
        @Test
        @DisplayName("validatePermissionHierarchy should suggest missing prerequisite permissions")
        fun `should suggest missing prerequisite permissions`() {
            // Arrange
            val permissions = listOf(
                "table.edit.own",
                "table.delete.team",
                "document.view.all"
            )
            
            // Act
            val warnings = rolePermissionService.validatePermissionHierarchy(permissions)
            
            // Assert
            warnings shouldHaveSize 2
            warnings.any { it.contains("table.edit.own") && it.contains("view permission") } shouldBe true
            warnings.any { it.contains("table.delete.team") && it.contains("view permission") } shouldBe true
        }
        
        @Test
        @DisplayName("detectDuplicatePermissions should detect exact duplicate permissions")
        fun `should detect exact duplicate permissions`() {
            // Arrange
            val permissions = listOf(
                "table.view.own",
                "table.view.own",
                "table.edit.all",
                "document.view.team",
                "document.view.team"
            )
            
            // Act
            val warnings = rolePermissionService.detectDuplicatePermissions(permissions)
            
            // Assert
            warnings shouldHaveSize 1
            warnings.first() shouldContain "duplicate permissions"
        }
        
        @Test
        @DisplayName("validatePermissions should categorize permissions as valid, invalid, and warnings")
        fun `should categorize permissions as valid invalid and warnings`() {
            // Arrange
            val permissions = listOf(
                "table.view.own",      // Valid
                "table.edit.all",      // Valid with warning (ALL scope)
                "invalid.format",      // Invalid
                "",                    // Invalid (blank)
                "document.view.team"   // Valid
            )
            
            // Act
            val result = rolePermissionService.validatePermissions(permissions)
            
            // Assert
            result.valid shouldHaveSize 3
            result.invalid.size shouldBe 2
            result.warnings.isNotEmpty() shouldBe true
            result.warnings.any { it.value.contains("ALL scope") } shouldBe true
            result.isValid shouldBe false
        }
        
        @Test
        @DisplayName("validatePermissions should detect scope redundancy in validation")
        fun `should detect scope redundancy in validation`() {
            // Arrange
            val permissions = listOf(
                "table.view.own",
                "table.view.team",
                "table.view.all"
            )
            
            // Act
            val result = rolePermissionService.validatePermissions(permissions)
            
            // Assert
            result.warnings.size shouldBe 3  // ALL warning + 2 redundancy warnings
            result.warnings.any { it.value.contains("redundant") } shouldBe true
        }
        
        @Test
        @DisplayName("suggestPermissions should suggest related actions and scope upgrades")
        fun `should suggest related actions and scope upgrades`() {
            // Arrange
            val currentPermissions = listOf(
                RolePermission(roleId, PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    scope = Scope.OWN
                ))
            )
            
            every { rolePermissionRepository.findByRoleId(roleId) } returns currentPermissions
            
            // Act
            val suggestions = rolePermissionService.suggestPermissions(roleId)
            
            // Assert
            suggestions.isNotEmpty() shouldBe true
            suggestions.any { it == "table.edit.own" } shouldBe true
            suggestions.any { it == "table.create.own" } shouldBe true
            suggestions.any { it == "table.view.team" } shouldBe true
        }
        
        @Test
        @DisplayName("getEffectivePermissions should return direct permissions without wildcard expansion")
        fun `should return direct permissions without wildcard expansion`() {
            // Arrange
            val permissions = listOf(
                RolePermission(roleId, tableViewOwnRule),
                RolePermission(roleId, tableEditAllRule)
            )
            
            every { rolePermissionRepository.findByRoleId(roleId) } returns permissions
            
            // Act
            val effectivePermissions = rolePermissionService.getEffectivePermissions(roleId)
            
            // Assert
            effectivePermissions shouldHaveSize 2
            effectivePermissions shouldContain "table.view.own"
            effectivePermissions shouldContain "table.edit.all"
        }
        
        @Test
        @DisplayName("analyzePermissionUsage should analyze permission usage across all roles")
        fun `should analyze permission usage across all roles`() {
            // Arrange
            val allPermissions = listOf(
                RolePermission(roleId, tableViewOwnRule),
                RolePermission(RoleId(FIXED_ROLE_ID_2), tableViewOwnRule),
                RolePermission(RoleId(FIXED_ROLE_ID_3), tableEditAllRule),
                RolePermission(roleId, tableEditAllRule)
            )
            
            every { rolePermissionRepository.findAll() } returns allPermissions
            
            // Act
            val usageMap = rolePermissionService.analyzePermissionUsage()
            
            // Assert
            usageMap.size shouldBe 2
            usageMap["table.view.own"] shouldBe 2
            usageMap["table.edit.all"] shouldBe 2
        }
    }
    
    @Nested
    @DisplayName("Group 7: Type-Safe Operations Tests")
    inner class TypeSafeOperationsTests {
        
        @Test
        @DisplayName("grantPermissionRules should grant multiple permissions using PermissionRule objects")
        fun `should grant multiple permissions using PermissionRule objects`() {
            // Arrange
            val permissionRules = listOf(tableViewOwnRule, tableEditAllRule)
            val savedPermissions = listOf(
                RolePermission(roleId, tableViewOwnRule),
                RolePermission(roleId, tableEditAllRule)
            )
            
            every { dynamicRoleRepository.findById(roleId) } returns testRole
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns false
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableEditAllRule) } returns false
            every { rolePermissionRepository.save(any<RolePermission>()) } returns savedPermissions[0] andThen savedPermissions[1]
            
            // Act
            val result = rolePermissionService.grantPermissionRules(roleId, permissionRules)
            
            // Assert
            result shouldHaveSize 2
            verify(exactly = 2) { rolePermissionRepository.save(any<RolePermission>()) }
        }
        
        @Test
        @DisplayName("hasPermission should check permission using PermissionRule object")
        fun `should check permission using PermissionRule object`() {
            // Arrange
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) } returns true
            
            // Act
            val result = rolePermissionService.hasPermission(roleId, tableViewOwnRule)
            
            // Assert
            result shouldBe true
            verify { rolePermissionRepository.existsByRoleIdAndPermissionRule(roleId, tableViewOwnRule) }
        }
        
        @Test
        @DisplayName("hasPermission should evaluate GeneralRule with MANAGE action covering other actions")
        fun `should evaluate GeneralRule with MANAGE action covering other actions`() {
            // Arrange
            val manageRule = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.MANAGE,
                scope = Scope.OWN
            )
            val permissions = listOf(RolePermission(roleId, manageRule))
            
            every { rolePermissionRepository.findByRoleId(roleId) } returns permissions
            
            // Act
            val canView = rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.VIEW, Scope.OWN)
            val canEdit = rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.EDIT, Scope.OWN)
            val canDelete = rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.DELETE, Scope.OWN)
            
            // Assert
            canView shouldBe true
            canEdit shouldBe true
            canDelete shouldBe true
        }
        
        @Test
        @DisplayName("hasPermission should evaluate scope hierarchy correctly (ALL > TEAM > OWN)")
        fun `should evaluate scope hierarchy correctly`() {
            // Arrange
            val allScopeRule = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.VIEW,
                scope = Scope.ALL
            )
            val permissions = listOf(RolePermission(roleId, allScopeRule))
            
            every { rolePermissionRepository.findByRoleId(roleId) } returns permissions
            
            // Act
            val canViewAll = rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.VIEW, Scope.ALL)
            val canViewTeam = rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.VIEW, Scope.TEAM)
            val canViewOwn = rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.VIEW, Scope.OWN)
            
            // Assert
            canViewAll shouldBe true
            canViewTeam shouldBe true
            canViewOwn shouldBe true
        }
        
        @Test
        @DisplayName("hasPermissionForResource should grant access for ResourceIdRule with exact resource match")
        fun `should grant access for ResourceIdRule with exact resource match`() {
            // Arrange
            val resourceId = FIXED_RESOURCE_ID
            val resourceIdRule = PermissionRule.ResourceIdRule(
                resourceType = ResourceType.DOCUMENT,
                action = Action.EDIT,
                resourceId = resourceId
            )
            val permissions = listOf(RolePermission(RoleId(FIXED_ROLE_ID), resourceIdRule))
            
            every { rolePermissionRepository.findByRoleId(RoleId(FIXED_ROLE_ID)) } returns permissions
            
            // Act
            val hasAccess = rolePermissionService.hasPermissionForResource(
                FIXED_ROLE_ID,
                resourceId,
                ResourceType.DOCUMENT,
                Action.EDIT
            )
            
            // Assert
            hasAccess shouldBe true
        }
        
        @Test
        @DisplayName("hasPermissionForResource should deny access for ResourceIdRule with different resource")
        fun `should deny access for ResourceIdRule with different resource`() {
            // Arrange
            val resourceId = FIXED_RESOURCE_ID
            val differentResourceId = UUID.randomUUID()
            val resourceIdRule = PermissionRule.ResourceIdRule(
                resourceType = ResourceType.DOCUMENT,
                action = Action.EDIT,
                resourceId = resourceId
            )
            val permissions = listOf(RolePermission(RoleId(FIXED_ROLE_ID), resourceIdRule))
            
            every { rolePermissionRepository.findByRoleId(RoleId(FIXED_ROLE_ID)) } returns permissions
            
            // Act
            val hasAccess = rolePermissionService.hasPermissionForResource(
                FIXED_ROLE_ID,
                differentResourceId,
                ResourceType.DOCUMENT,
                Action.EDIT
            )
            
            // Assert
            hasAccess shouldBe false
        }
    }
    
    @Nested
    @DisplayName("Group 8: String-Enum Conversion Tests")
    inner class StringEnumConversionTests {
        
        @Test
        @DisplayName("PermissionRule.fromDatabaseString should convert valid general rule strings")
        fun `should convert valid general rule strings to PermissionRule`() {
            // Test various valid combinations
            val testCases = listOf(
                "table.view.all" to PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL),
                "document.edit.team" to PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.EDIT, Scope.TEAM),
                "workspace.manage.own" to PermissionRule.GeneralRule(ResourceType.WORKSPACE, Action.MANAGE, Scope.OWN)
            )
            
            testCases.forEach { (input, expected) ->
                val result = PermissionRule.fromDatabaseString(input)
                result shouldBe expected
            }
        }
        
        @Test
        @DisplayName("PermissionRule.fromDatabaseString should convert ResourceGroupRule strings")
        fun `should convert resource group rule strings to PermissionRule`() {
            // Arrange
            val groupId = FIXED_RESOURCE_GROUP_ID
            val input = "table.edit.resource_group:$groupId"
            
            // Act
            val result = PermissionRule.fromDatabaseString(input)
            
            // Assert
            result shouldBe PermissionRule.ResourceGroupRule(
                resourceType = ResourceType.TABLE,
                action = Action.EDIT,
                groupId = groupId
            )
        }
        
        @Test
        @DisplayName("PermissionRule.fromDatabaseString should convert ResourceIdRule strings")
        fun `should convert resource id rule strings to PermissionRule`() {
            // Arrange
            val resourceId = FIXED_RESOURCE_ID
            val input = "document.view.resource_id:$resourceId"
            
            // Act
            val result = PermissionRule.fromDatabaseString(input)
            
            // Assert
            result shouldBe PermissionRule.ResourceIdRule(
                resourceType = ResourceType.DOCUMENT,
                action = Action.VIEW,
                resourceId = resourceId
            )
        }
        
        @Test
        @DisplayName("PermissionRule.fromDatabaseString should throw exception for invalid formats")
        fun `should throw exception for invalid permission string formats`() {
            // Test various invalid formats
            val invalidCases = listOf(
                "invalid" to "Invalid permission format",
                "table.invalid.all" to "Unknown action",
                "invalid.view.all" to "Unknown resource type",
                "table.view.invalid_scope" to "Unknown scope format",
                "table.view.resource_group:invalid-uuid" to "Invalid group ID"
            )
            
            invalidCases.forEach { (input, expectedError) ->
                val exception = assertThrows<IllegalArgumentException> {
                    PermissionRule.fromDatabaseString(input)
                }
                exception.message shouldNotBe null
            }
        }
        
        @Test
        @DisplayName("PermissionRule.toDatabaseString should convert rules to correct string format")
        fun `should convert PermissionRule objects to database strings`() {
            // Test different rule types
            val testCases = listOf(
                PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL) 
                    to "table.view.all",
                PermissionRule.ResourceGroupRule(ResourceType.DOCUMENT, Action.EDIT, FIXED_RESOURCE_GROUP_ID)
                    to "document.edit.resource_group:$FIXED_RESOURCE_GROUP_ID",
                PermissionRule.ResourceIdRule(ResourceType.WORKSPACE, Action.MANAGE, FIXED_RESOURCE_ID)
                    to "workspace.manage.resource_id:$FIXED_RESOURCE_ID"
            )
            
            testCases.forEach { (rule, expected) ->
                val result = rule.toDatabaseString()
                result shouldBe expected
            }
        }
    }
    
    @Nested
    @DisplayName("Group 9: Data Models Tests")
    inner class DataModelsTests {
        
        @Test
        @DisplayName("SyncResult should calculate aggregates correctly")
        fun `should calculate SyncResult aggregates correctly`() {
            // Arrange
            val syncResult = SyncResult(
                roleId = roleId,
                added = listOf("table.view.all", "document.edit.own"),
                removed = listOf("workspace.manage.team"),
                unchanged = listOf("table.edit.own", "document.view.all"),
                failed = mapOf("invalid.permission" to "Invalid format")
            )
            
            // Assert
            syncResult.totalChanges shouldBe 3  // 2 added + 1 removed
            syncResult.isSuccessful shouldBe false  // has failed items
            syncResult.summary shouldContain "2 added"
            syncResult.summary shouldContain "1 removed"
            syncResult.summary shouldContain "2 unchanged"
            syncResult.summary shouldContain "1 failed"
        }
        
        @Test
        @DisplayName("PermissionDiff should calculate differences correctly")
        fun `should calculate PermissionDiff correctly`() {
            // Arrange
            val diff = PermissionDiff(
                role1Id = FIXED_ROLE_ID,
                role2Id = FIXED_ROLE_ID_2,
                onlyInFirst = listOf("table.view.all", "document.edit.own"),
                onlyInSecond = listOf("workspace.manage.team", "table.delete.all"),
                inBoth = listOf("table.edit.own", "document.view.all")
            )
            
            // Assert
            diff.areIdentical shouldBe false
            diff.totalDifferences shouldBe 4  // 2 in first + 2 in second
            diff.getAdditionsForFirst() shouldBe listOf("workspace.manage.team", "table.delete.all")
            diff.getRemovalsForFirst() shouldBe listOf("table.view.all", "document.edit.own")
            diff.getMergedPermissions() shouldHaveSize 6  // All unique permissions
        }
        
        @Test
        @DisplayName("ValidationResult should calculate validation summary")
        fun `should calculate ValidationResult summary correctly`() {
            // Arrange
            val result = ValidationResult(
                valid = listOf("table.view.all", "document.edit.own"),
                invalid = mapOf("invalid.format" to "Bad format", "unknown.resource" to "Unknown resource"),
                warnings = mapOf("table.view.own" to "Redundant permission")
            )
            
            // Assert
            result.isValid shouldBe false  // has invalid items
            result.hasWarnings shouldBe true
            result.totalChecked shouldBe 4  // 2 valid + 2 invalid
            result.getSummary() shouldContain "2/4 valid"
            result.getSummary() shouldContain "2 invalid"
            result.getSummary() shouldContain "1 warnings"
        }
        
        @Test
        @DisplayName("RoleExportData should validate and convert correctly")
        fun `should validate and convert RoleExportData`() {
            // Arrange - valid data
            val validExport = RoleExportData(
                name = "test_role",
                displayName = "Test Role",
                color = "#FF5733",
                position = 1,
                permissions = listOf("table.view.all", "document.edit.own")
            )
            
            // Act & Assert - validation passes
            val errors = validExport.validate()
            errors shouldBe emptyList()
            
            // Act & Assert - conversion works
            val createRequest = validExport.toCreateRequest()
            createRequest.name shouldBe "test_role"
            createRequest.permissions shouldBe listOf("table.view.all", "document.edit.own")
            
            // Arrange - invalid data
            val invalidExport = RoleExportData(
                name = "Invalid-Name!",  // Invalid characters
                displayName = "A".repeat(256),  // Too long
                color = "not-a-color",  // Invalid format
                position = -1  // Negative
            )
            
            // Act & Assert - validation fails
            val invalidErrors = invalidExport.validate()
            invalidErrors shouldHaveSize 4
        }
        
        @Test
        @DisplayName("RoleCreateRequest should validate input on creation")
        fun `should validate RoleCreateRequest on creation`() {
            // Valid request
            val validRequest = RoleCreateRequest(
                name = "test_role",
                displayName = "Test Role",
                color = "#FF5733",
                position = 1,
                permissions = listOf("table.view.all")
            )
            validRequest.name shouldBe "test_role"
            
            // Invalid name - blank
            assertThrows<IllegalArgumentException> {
                RoleCreateRequest(name = "", displayName = "Test")
            }
            
            // Invalid name - special characters
            assertThrows<IllegalArgumentException> {
                RoleCreateRequest(name = "test-role!", displayName = "Test")
            }
            
            // Invalid color format
            assertThrows<IllegalArgumentException> {
                RoleCreateRequest(name = "test", color = "red")
            }
            
            // Invalid position
            assertThrows<IllegalArgumentException> {
                RoleCreateRequest(name = "test", position = -1)
            }
        }
        
        @Test
        @DisplayName("mergePermissions should merge multiple role permissions")
        fun `should merge permissions from multiple roles`() {
            // Arrange
            val role1Permissions = listOf(
                RolePermission(RoleId(FIXED_ROLE_ID), tableViewOwnRule),
                RolePermission(RoleId(FIXED_ROLE_ID), documentEditTeamRule)
            )
            val role2Permissions = listOf(
                RolePermission(RoleId(FIXED_ROLE_ID_2), tableViewOwnRule),  // Duplicate
                RolePermission(RoleId(FIXED_ROLE_ID_2), tableEditAllRule)
            )
            
            every { rolePermissionRepository.findByRoleId(RoleId(FIXED_ROLE_ID)) } returns role1Permissions
            every { rolePermissionRepository.findByRoleId(RoleId(FIXED_ROLE_ID_2)) } returns role2Permissions
            
            // Act
            val merged = rolePermissionService.mergePermissions(listOf(FIXED_ROLE_ID, FIXED_ROLE_ID_2))
            
            // Assert
            merged shouldHaveSize 3  // Duplicates removed
            merged shouldContain "table.view.own"
            merged shouldContain "document.edit.team"
            merged shouldContain "table.edit.all"
        }
    }
    
    @Nested
    @DisplayName("Group 10: Error Handling & Edge Cases Tests")
    inner class ErrorHandlingEdgeCasesTests {
        
        @Test
        @DisplayName("Should handle empty data gracefully")
        fun `should handle empty permission lists and role lists`() {
            // Test empty permission list validation
            val emptyValidation = rolePermissionService.validatePermissions(emptyList())
            emptyValidation.valid shouldBe emptyList()
            emptyValidation.invalid shouldBe emptyMap()
            
            // Test empty role list merge
            val emptyMerge = rolePermissionService.mergePermissions(emptyList())
            emptyMerge shouldBe emptySet()
            
            // Test empty permission hierarchy validation
            val emptyHierarchy = rolePermissionService.validatePermissionHierarchy(emptyList())
            emptyHierarchy shouldBe emptyList()
        }
        
        @Test
        @DisplayName("Should handle non-existent role IDs gracefully")
        fun `should handle operations on non-existent roles`() {
            // Arrange
            val nonExistentRoleId = RoleId(UUID.randomUUID())
            every { rolePermissionRepository.findByRoleId(nonExistentRoleId) } returns emptyList()
            every { dynamicRoleRepository.findById(nonExistentRoleId) } returns null
            
            // Test getting permissions for non-existent role
            val permissions = rolePermissionService.getRolePermissions(nonExistentRoleId)
            permissions shouldBe emptyList()
            
            // Test checking permission for non-existent role
            // Uses the PermissionRule version directly to avoid complex string parsing mock setup
            val testRule = PermissionRule.GeneralRule(ResourceType.TABLE, Action.VIEW, Scope.ALL)
            every { rolePermissionRepository.existsByRoleIdAndPermissionRule(nonExistentRoleId, testRule) } returns false
            
            val hasPermission = rolePermissionService.hasPermission(nonExistentRoleId, testRule)
            hasPermission shouldBe false
        }
        
        @Test
        @DisplayName("Should handle large datasets efficiently")
        fun `should process large number of permissions`() {
            // Arrange - create 1000 permissions
            val largePermissionList = (1..1000).map { index ->
                val resource = ResourceType.values()[index % ResourceType.values().size]
                val action = Action.values()[index % Action.values().size]
                val scope = listOf(Scope.ALL, Scope.TEAM, Scope.OWN)[index % 3]
                "${resource.name.lowercase()}.${action.name.lowercase()}.${scope.name.lowercase()}"
            }
            
            // Test validation with large dataset
            val validationResult = rolePermissionService.validatePermissions(largePermissionList)
            validationResult.totalChecked shouldBe 1000
            
            // Test hierarchy validation with large dataset
            val hierarchyWarnings = rolePermissionService.validatePermissionHierarchy(largePermissionList)
            hierarchyWarnings shouldNotBe null  // Should complete without error
        }
        
        @Test
        @DisplayName("Should handle repository exceptions gracefully")
        fun `should handle repository exceptions during operations`() {
            // Arrange
            val exceptionRoleId = RoleId(UUID.randomUUID())
            every { rolePermissionRepository.findByRoleId(exceptionRoleId) } throws RuntimeException("Database error")
            
            // Test that service methods handle exceptions appropriately
            assertThrows<RuntimeException> {
                rolePermissionService.getRolePermissions(exceptionRoleId)
            }
        }
        
        @Test
        @DisplayName("detectScopeRedundancy should handle complex redundancy patterns")
        fun `should detect complex scope redundancy patterns`() {
            // Arrange - complex permission set with multiple redundancies
            val complexPermissions = listOf(
                "table.view.own",
                "table.view.team",
                "table.view.all",  // Makes own and team redundant
                "table.edit.own",
                "table.edit.team",  // Makes own redundant
                "document.delete.all",
                "document.delete.own",  // Redundant due to all
                "workspace.manage.team"
            )
            
            // Act
            val result = rolePermissionService.validatePermissions(complexPermissions)
            
            // Assert - should detect all redundancies
            result.warnings.size shouldBeGreaterThanOrEqual 4  // At least 4 redundancy warnings
            result.warnings.values.any { it.contains("redundant") } shouldBe true
        }
        
        @Test
        @DisplayName("evaluateGeneralRuleMatch should handle all edge cases")
        fun `should evaluate GeneralRule matching with edge cases`() {
            // Arrange - MANAGE permission that should cover all actions
            val manageAllRule = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.MANAGE,
                scope = Scope.ALL
            )
            val permissions = listOf(RolePermission(roleId, manageAllRule))
            
            every { rolePermissionRepository.findByRoleId(roleId) } returns permissions
            
            // Act & Assert - MANAGE with ALL scope should grant everything
            rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.VIEW, Scope.OWN) shouldBe true
            rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.EDIT, Scope.TEAM) shouldBe true
            rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.DELETE, Scope.ALL) shouldBe true
            rolePermissionService.hasPermission(roleId, ResourceType.TABLE, Action.CREATE, Scope.RESOURCE_GROUP) shouldBe true
            
            // Different resource type should not match
            rolePermissionService.hasPermission(roleId, ResourceType.DOCUMENT, Action.VIEW, Scope.OWN) shouldBe false
        }
    }
}