package com.astarworks.astarmanagement.unit.core.auth.domain.service

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.repository.RolePermissionRepository
import com.astarworks.astarmanagement.core.auth.domain.service.PermissionService
import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import io.mockk.*
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import java.util.*

/**
 * Unit tests for PermissionService.
 * 
 * Tests all core functionality including:
 * - Role to authority conversion
 * - Permission rule to authority conversion
 * - Resource permission checking
 * - Authority validation and expansion
 * - Authority merging
 */
@DisplayName("PermissionService Unit Tests")
class PermissionServiceTest : UnitTestBase() {
    
    private val rolePermissionRepository = mockk<RolePermissionRepository>()
    
    private lateinit var permissionService: PermissionService
    
    @BeforeEach
    fun setup() {
        clearMocks(rolePermissionRepository)
        permissionService = PermissionService(rolePermissionRepository)
    }
    
    @Nested
    @DisplayName("Convert Roles to Authorities")
    inner class ConvertRolesToAuthorities {
        
        @Test
        @DisplayName("Should convert single role with permissions to authorities")
        fun `should convert single role with permissions to authorities`() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val role = createDynamicRole(
                id = roleId,
                name = "admin"
            )
            val roles = setOf(role)
            
            val permissionRule = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.MANAGE,
                scope = Scope.ALL
            )
            val rolePermission = createRolePermission(roleId, permissionRule)
            
            every { rolePermissionRepository.findByRoleId(roleId) } returns listOf(rolePermission)
            
            // When
            val authorities = permissionService.convertRolesToAuthorities(roles)
            
            // Then
            assertThat(authorities).hasSize(2)
            assertThat(authorities).extracting("authority").containsExactlyInAnyOrder(
                "ROLE_admin",
                "table.manage.all"
            )
        }
        
        @Test
        @DisplayName("Should convert multiple roles to authorities")
        fun `should convert multiple roles to authorities`() {
            // Given
            val adminRoleId = RoleId(UUID.randomUUID())
            val userRoleId = RoleId(UUID.randomUUID())
            
            val adminRole = createDynamicRole(id = adminRoleId, name = "admin")
            val userRole = createDynamicRole(id = userRoleId, name = "user")
            val roles = setOf(adminRole, userRole)
            
            val adminPermission = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.MANAGE,
                scope = Scope.ALL
            )
            val userPermission = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.VIEW,
                scope = Scope.OWN
            )
            
            every { rolePermissionRepository.findByRoleId(adminRoleId) } returns listOf(createRolePermission(adminRoleId, adminPermission))
            every { rolePermissionRepository.findByRoleId(userRoleId) } returns listOf(createRolePermission(userRoleId, userPermission))
            
            // When
            val authorities = permissionService.convertRolesToAuthorities(roles)
            
            // Then
            assertThat(authorities).hasSize(4)
            assertThat(authorities).extracting("authority").containsExactlyInAnyOrder(
                "ROLE_admin",
                "ROLE_user",
                "table.manage.all",
                "table.view.own"
            )
        }
        
        @Test
        @DisplayName("Should add ROLE_ prefix correctly")
        fun `should add role prefix correctly`() {
            // Given
            val role = createDynamicRole(name = "custom_role")
            every { rolePermissionRepository.findByRoleId(role.id) } returns emptyList()
            
            // When
            val authorities = permissionService.convertRolesToAuthorities(setOf(role))
            
            // Then
            assertThat(authorities).hasSize(1)
            assertThat(authorities.first().authority).isEqualTo("ROLE_custom_role")
        }
        
        @Test
        @DisplayName("Should handle empty role set")
        fun `should handle empty role set`() {
            // Given
            val emptyRoles = emptySet<DynamicRole>()
            
            // When
            val authorities = permissionService.convertRolesToAuthorities(emptyRoles)
            
            // Then
            assertThat(authorities).isEmpty()
        }
        
        @Test
        @DisplayName("Should handle role without permissions")
        fun `should handle role without permissions`() {
            // Given
            val role = createDynamicRole(name = "empty_role")
            every { rolePermissionRepository.findByRoleId(role.id) } returns emptyList()
            
            // When
            val authorities = permissionService.convertRolesToAuthorities(setOf(role))
            
            // Then
            assertThat(authorities).hasSize(1)
            assertThat(authorities.first().authority).isEqualTo("ROLE_empty_role")
        }
        
        @Test
        @DisplayName("Should convert different permission rule types")
        fun `should convert different permission rule types`() {
            // Given
            val roleId = RoleId(UUID.randomUUID())
            val role = createDynamicRole(id = roleId, name = "test_role")
            
            val generalRule = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.VIEW,
                scope = Scope.ALL
            )
            val resourceGroupRule = PermissionRule.ResourceGroupRule(
                resourceType = ResourceType.DOCUMENT,
                action = Action.EDIT,
                groupId = UUID.randomUUID()
            )
            val resourceIdRule = PermissionRule.ResourceIdRule(
                resourceType = ResourceType.RECORD,
                action = Action.DELETE,
                resourceId = UUID.randomUUID()
            )
            
            every { rolePermissionRepository.findByRoleId(roleId) } returns 
                listOf(
                    createRolePermission(roleId, generalRule),
                    createRolePermission(roleId, resourceGroupRule),
                    createRolePermission(roleId, resourceIdRule)
                )
            
            // When
            val authorities = permissionService.convertRolesToAuthorities(setOf(role))
            
            // Then
            assertThat(authorities).hasSize(4) // 1 role + 3 permissions
            assertThat(authorities).extracting("authority").contains(
                "ROLE_test_role",
                "table.view.all",
                "document.edit.resource_group:${resourceGroupRule.groupId}",
                "record.delete.resource_id:${resourceIdRule.resourceId}"
            )
        }
        
        @Test
        @DisplayName("Should handle duplicate authorities from multiple roles")
        fun `should handle duplicate authorities from multiple roles`() {
            // Given
            val role1Id = RoleId(UUID.randomUUID())
            val role2Id = RoleId(UUID.randomUUID())
            
            val role1 = createDynamicRole(id = role1Id, name = "role1")
            val role2 = createDynamicRole(id = role2Id, name = "role2")
            
            val samePermission = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.VIEW,
                scope = Scope.ALL
            )
            
            every { rolePermissionRepository.findByRoleId(role1Id) } returns 
                listOf(createRolePermission(role1Id, samePermission))
            every { rolePermissionRepository.findByRoleId(role2Id) } returns 
                listOf(createRolePermission(role2Id, samePermission))
            
            // When
            val authorities = permissionService.convertRolesToAuthorities(setOf(role1, role2))
            
            // Then
            assertThat(authorities).hasSize(3) // 2 roles + 1 unique permission
            assertThat(authorities).extracting("authority").containsExactlyInAnyOrder(
                "ROLE_role1",
                "ROLE_role2",
                "table.view.all"
            )
        }
        
        @Test
        @DisplayName("Should generate correct authorities for roles with no permissions")
        fun `should generate correct authorities for roles with no permissions`() {
            // Given
            val role1 = createDynamicRole(name = "admin")
            val role2 = createDynamicRole(name = "user")
            val roles = setOf(role1, role2)
            
            every { rolePermissionRepository.findByRoleId(role1.id) } returns emptyList()
            every { rolePermissionRepository.findByRoleId(role2.id) } returns emptyList()
            
            // When
            val result = permissionService.convertRolesToAuthorities(roles)
            
            // Then
            assertThat(result).hasSize(2)
            assertThat(result.map { it.authority }).containsExactlyInAnyOrder(
                "ROLE_admin",
                "ROLE_user"
            )
            
            verify { rolePermissionRepository.findByRoleId(role1.id) }
            verify { rolePermissionRepository.findByRoleId(role2.id) }
        }
    }
    
    @Nested
    @DisplayName("Convert Permission Rules to Authorities")
    inner class ConvertPermissionRulesToAuthorities {
        
        @Test
        @DisplayName("Should convert role name and rules to authorities")
        fun `should convert role name and rules to authorities`() {
            // Given
            val roleName = "custom_manager"
            val rules = listOf(
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.MANAGE,
                    scope = Scope.ALL
                ),
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.DOCUMENT,
                    action = Action.VIEW,
                    scope = Scope.TEAM
                )
            )
            
            // When
            val authorities = permissionService.convertPermissionRulesToAuthorities(roleName, rules)
            
            // Then
            assertThat(authorities).hasSize(3) // 1 role + 2 permissions
            assertThat(authorities).extracting("authority").containsExactlyInAnyOrder(
                "ROLE_CUSTOM_MANAGER",
                "table.manage.all",
                "document.view.team"
            )
        }
        
        @Test
        @DisplayName("Should uppercase role name correctly")
        fun `should uppercase role name correctly`() {
            // Given
            val roleName = "lowercase_role"
            val rules = emptyList<PermissionRule>()
            
            // When
            val authorities = permissionService.convertPermissionRulesToAuthorities(roleName, rules)
            
            // Then
            assertThat(authorities).hasSize(1)
            assertThat(authorities.first().authority).isEqualTo("ROLE_LOWERCASE_ROLE")
        }
        
        @Test
        @DisplayName("Should handle empty rules list")
        fun `should handle empty rules list`() {
            // Given
            val roleName = "empty_role"
            val emptyRules = emptyList<PermissionRule>()
            
            // When
            val authorities = permissionService.convertPermissionRulesToAuthorities(roleName, emptyRules)
            
            // Then
            assertThat(authorities).hasSize(1)
            assertThat(authorities.first().authority).isEqualTo("ROLE_EMPTY_ROLE")
        }
        
        @Test
        @DisplayName("Should handle multiple rules of different types")
        fun `should handle multiple rules of different types`() {
            // Given
            val roleName = "mixed_role"
            val resourceId = UUID.randomUUID()
            val groupId = UUID.randomUUID()
            
            val rules = listOf(
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    scope = Scope.ALL
                ),
                PermissionRule.ResourceGroupRule(
                    resourceType = ResourceType.DOCUMENT,
                    action = Action.EDIT,
                    groupId = groupId
                ),
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.RECORD,
                    action = Action.DELETE,
                    resourceId = resourceId
                )
            )
            
            // When
            val authorities = permissionService.convertPermissionRulesToAuthorities(roleName, rules)
            
            // Then
            assertThat(authorities).hasSize(4) // 1 role + 3 permissions
            assertThat(authorities).extracting("authority").contains(
                "ROLE_MIXED_ROLE",
                "table.view.all",
                "document.edit.resource_group:$groupId",
                "record.delete.resource_id:$resourceId"
            )
        }
        
        @Test
        @DisplayName("Should handle special characters in role name")
        fun `should handle special characters in role name`() {
            // Given
            val roleName = "role_with-special.chars"
            val rules = emptyList<PermissionRule>()
            
            // When
            val authorities = permissionService.convertPermissionRulesToAuthorities(roleName, rules)
            
            // Then
            assertThat(authorities).hasSize(1)
            assertThat(authorities.first().authority).isEqualTo("ROLE_ROLE_WITH-SPECIAL.CHARS")
        }
        
        @Test
        @DisplayName("Should handle duplicate rules correctly")
        fun `should handle duplicate rules correctly`() {
            // Given
            val roleName = "duplicate_role"
            val duplicateRule = PermissionRule.GeneralRule(
                resourceType = ResourceType.TABLE,
                action = Action.VIEW,
                scope = Scope.ALL
            )
            val rules = listOf(duplicateRule, duplicateRule)
            
            // When
            val authorities = permissionService.convertPermissionRulesToAuthorities(roleName, rules)
            
            // Then
            assertThat(authorities).hasSize(2) // 1 role + 1 unique permission (duplicates removed by Set)
            assertThat(authorities).extracting("authority").containsExactlyInAnyOrder(
                "ROLE_DUPLICATE_ROLE",
                "table.view.all"
            )
        }
    }
    
    @Nested
    @DisplayName("Resource Permission Check")
    inner class ResourcePermissionCheck {
        
        @Test
        @DisplayName("Should grant access with matching ResourceIdRule")
        fun `should grant access with matching resource id rule`() {
            // Given
            val resourceId = UUID.randomUUID()
            val requiredAction = Action.VIEW
            val rules = listOf(
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.TABLE,
                    action = requiredAction,
                    resourceId = resourceId
                )
            )
            
            // When
            val hasPermission = permissionService.hasPermissionForResource(rules, resourceId, requiredAction)
            
            // Then
            assertThat(hasPermission).isTrue()
        }
        
        @Test
        @DisplayName("Should deny access with mismatched resource ID")
        fun `should deny access with mismatched resource id`() {
            // Given
            val targetResourceId = UUID.randomUUID()
            val differentResourceId = UUID.randomUUID()
            val rules = listOf(
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    resourceId = differentResourceId
                )
            )
            
            // When
            val hasPermission = permissionService.hasPermissionForResource(rules, targetResourceId, Action.VIEW)
            
            // Then
            assertThat(hasPermission).isFalse()
        }
        
        @Test
        @DisplayName("Should deny access with mismatched action")
        fun `should deny access with mismatched action`() {
            // Given
            val resourceId = UUID.randomUUID()
            val rules = listOf(
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    resourceId = resourceId
                )
            )
            
            // When
            val hasPermission = permissionService.hasPermissionForResource(rules, resourceId, Action.EDIT)
            
            // Then
            assertThat(hasPermission).isFalse()
        }
        
        @Test
        @DisplayName("Should grant access with MANAGE action in ResourceIdRule")
        fun `should grant access with manage action in resource id rule`() {
            // Given
            val resourceId = UUID.randomUUID()
            val rules = listOf(
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.MANAGE,
                    resourceId = resourceId
                )
            )
            
            // When
            val hasViewPermission = permissionService.hasPermissionForResource(rules, resourceId, Action.VIEW)
            val hasEditPermission = permissionService.hasPermissionForResource(rules, resourceId, Action.EDIT)
            val hasDeletePermission = permissionService.hasPermissionForResource(rules, resourceId, Action.DELETE)
            
            // Then
            assertThat(hasViewPermission).isTrue()
            assertThat(hasEditPermission).isTrue()
            assertThat(hasDeletePermission).isTrue()
        }
        
        @Test
        @DisplayName("Should grant access with MANAGE action in GeneralRule")
        fun `should grant access with manage action in general rule`() {
            // Given
            val resourceId = UUID.randomUUID()
            val rules = listOf(
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.MANAGE,
                    scope = Scope.ALL
                )
            )
            
            // When
            val hasPermission = permissionService.hasPermissionForResource(rules, resourceId, Action.VIEW)
            
            // Then
            assertThat(hasPermission).isTrue()
        }
        
        @Test
        @DisplayName("Should deny access with non-MANAGE action in GeneralRule")
        fun `should deny access with non manage action in general rule`() {
            // Given
            val resourceId = UUID.randomUUID()
            val rules = listOf(
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    scope = Scope.ALL
                )
            )
            
            // When
            val hasPermission = permissionService.hasPermissionForResource(rules, resourceId, Action.VIEW)
            
            // Then
            assertThat(hasPermission).isFalse()
        }
        
        @Test
        @DisplayName("Should deny access with ResourceGroupRule")
        fun `should deny access with resource group rule`() {
            // Given
            val resourceId = UUID.randomUUID()
            val rules = listOf(
                PermissionRule.ResourceGroupRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    groupId = UUID.randomUUID()
                )
            )
            
            // When
            val hasPermission = permissionService.hasPermissionForResource(rules, resourceId, Action.VIEW)
            
            // Then
            assertThat(hasPermission).isFalse() // ResourceGroupRule returns false as documented
        }
        
        @Test
        @DisplayName("Should grant access if any rule matches")
        fun `should grant access if any rule matches`() {
            // Given
            val resourceId = UUID.randomUUID()
            val rules = listOf(
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.EDIT,
                    resourceId = UUID.randomUUID() // Different resource ID
                ),
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    resourceId = resourceId // Matching resource ID
                )
            )
            
            // When
            val hasPermission = permissionService.hasPermissionForResource(rules, resourceId, Action.VIEW)
            
            // Then
            assertThat(hasPermission).isTrue()
        }
        
        @Test
        @DisplayName("Should deny access if no rules match")
        fun `should deny access if no rules match`() {
            // Given
            val resourceId = UUID.randomUUID()
            val rules = listOf(
                PermissionRule.ResourceIdRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    resourceId = UUID.randomUUID() // Different resource ID
                ),
                PermissionRule.GeneralRule(
                    resourceType = ResourceType.TABLE,
                    action = Action.VIEW,
                    scope = Scope.ALL // Non-MANAGE action
                )
            )
            
            // When
            val hasPermission = permissionService.hasPermissionForResource(rules, resourceId, Action.VIEW)
            
            // Then
            assertThat(hasPermission).isFalse()
        }
        
        @Test
        @DisplayName("Should deny access with empty rules list")
        fun `should deny access with empty rules list`() {
            // Given
            val resourceId = UUID.randomUUID()
            val emptyRules = emptyList<PermissionRule>()
            
            // When
            val hasPermission = permissionService.hasPermissionForResource(emptyRules, resourceId, Action.VIEW)
            
            // Then
            assertThat(hasPermission).isFalse()
        }
        
        @Test
        @DisplayName("Should verify action inclusion logic")
        fun `should verify action inclusion logic`() {
            // Given
            val resourceId = UUID.randomUUID()
            val manageRule = PermissionRule.ResourceIdRule(
                resourceType = ResourceType.TABLE,
                action = Action.MANAGE,
                resourceId = resourceId
            )
            
            // When & Then
            assertThat(permissionService.hasPermissionForResource(listOf(manageRule), resourceId, Action.VIEW)).isTrue()
            assertThat(permissionService.hasPermissionForResource(listOf(manageRule), resourceId, Action.EDIT)).isTrue()
            assertThat(permissionService.hasPermissionForResource(listOf(manageRule), resourceId, Action.DELETE)).isTrue()
            assertThat(permissionService.hasPermissionForResource(listOf(manageRule), resourceId, Action.CREATE)).isTrue()
            assertThat(permissionService.hasPermissionForResource(listOf(manageRule), resourceId, Action.MANAGE)).isTrue()
        }
    }
    
    @Nested
    @DisplayName("Authority Expansion")
    inner class AuthorityExpansion {
        
        @Test
        @DisplayName("Should return authority as-is for normal strings")
        fun `should return authority as-is for normal strings`() {
            // Given
            val authority = "table.view.all"
            
            // When
            val expanded = permissionService.expandAuthority(authority)
            
            // Then
            assertThat(expanded).hasSize(1)
            assertThat(expanded).contains(authority)
        }
        
        @Test
        @DisplayName("Should handle empty string")
        fun `should handle empty string`() {
            // Given
            val emptyAuthority = ""
            
            // When
            val expanded = permissionService.expandAuthority(emptyAuthority)
            
            // Then
            assertThat(expanded).hasSize(1)
            assertThat(expanded).contains("")
        }
        
        @Test
        @DisplayName("Should handle special characters")
        fun `should handle special characters`() {
            // Given
            val specialAuthority = "table.view.resource_id:123-456-789"
            
            // When
            val expanded = permissionService.expandAuthority(specialAuthority)
            
            // Then
            assertThat(expanded).hasSize(1)
            assertThat(expanded).contains(specialAuthority)
        }
        
        @Test
        @DisplayName("Should prepare for future wildcard support")
        fun `should prepare for future wildcard support`() {
            // Given
            val wildcardAuthority = "table.*"
            
            // When
            val expanded = permissionService.expandAuthority(wildcardAuthority)
            
            // Then
            // Currently returns as-is, but structure is ready for future expansion
            assertThat(expanded).hasSize(1)
            assertThat(expanded).contains(wildcardAuthority)
        }
    }
    
    @Nested
    @DisplayName("Authority Validation")
    inner class AuthorityValidation {
        
        @Test
        @DisplayName("Should validate correct ROLE_ authority")
        fun `should validate correct role authority`() {
            // Given
            val validRoleAuthorities = listOf(
                "ROLE_ADMIN",
                "ROLE_USER",
                "ROLE_CUSTOM_ROLE",
                "ROLE_123"
            )
            
            // When & Then
            validRoleAuthorities.forEach { authority ->
                assertThat(permissionService.isValidAuthority(authority))
                    .withFailMessage("Authority '$authority' should be valid")
                    .isTrue()
            }
        }
        
        @Test
        @DisplayName("Should reject invalid ROLE_ authority")
        fun `should reject invalid role authority`() {
            // Given
            val invalidRoleAuthorities = listOf(
                "ROLE_",           // Too short
                "ROLE_.test",      // Contains dot
                "ROLE_ADMIN.SUB"   // Contains dot
            )
            
            // When & Then
            invalidRoleAuthorities.forEach { authority ->
                assertThat(permissionService.isValidAuthority(authority))
                    .withFailMessage("Authority '$authority' should be invalid")
                    .isFalse()
            }
        }
        
        @Test
        @DisplayName("Should validate correct permission authority")
        fun `should validate correct permission authority`() {
            // Given
            val validPermissionAuthorities = listOf(
                "table.view.all",
                "document.edit.own",
                "record.delete.team",
                "workspace.manage.resource_id:123"
            )
            
            // When & Then
            validPermissionAuthorities.forEach { authority ->
                assertThat(permissionService.isValidAuthority(authority))
                    .withFailMessage("Authority '$authority' should be valid")
                    .isTrue()
            }
        }
        
        @Test
        @DisplayName("Should reject invalid permission authority structure")
        fun `should reject invalid permission authority structure`() {
            // Given
            val invalidStructureAuthorities = listOf(
                "table.view",         // Only 2 parts
                "table.view.all.extra", // 4 parts
                "table",              // Only 1 part
                "table.view.all.extra.more" // Too many parts
            )
            
            // When & Then
            invalidStructureAuthorities.forEach { authority ->
                assertThat(permissionService.isValidAuthority(authority))
                    .withFailMessage("Authority '$authority' should be invalid")
                    .isFalse()
            }
        }
        
        @Test
        @DisplayName("Should reject empty parts in permission authority")
        fun `should reject empty parts in permission authority`() {
            // Given
            val emptyPartAuthorities = listOf(
                ".view.all",      // Empty resource type
                "table..all",     // Empty action
                "table.view.",    // Empty scope
                "..all",          // Multiple empty parts
                ".."              // All empty parts
            )
            
            // When & Then
            emptyPartAuthorities.forEach { authority ->
                assertThat(permissionService.isValidAuthority(authority))
                    .withFailMessage("Authority '$authority' should be invalid")
                    .isFalse()
            }
        }
        
        @Test
        @DisplayName("Should handle boundary cases")
        fun `should handle boundary cases`() {
            // Given & When & Then
            assertThat(permissionService.isValidAuthority("ROLE_A")).isTrue()  // Minimum valid role
            assertThat(permissionService.isValidAuthority("a.b.c")).isTrue()   // Minimum valid permission
            assertThat(permissionService.isValidAuthority("")).isFalse()       // Empty string
        }
        
        @Test
        @DisplayName("Should handle special characters in permission parts")
        fun `should handle special characters in permission parts`() {
            // Given
            val specialCharAuthorities = listOf(
                "table-name.view-action.all-scope",
                "table_type.edit_action.own_scope",
                "table1.action2.scope3"
            )
            
            // When & Then
            specialCharAuthorities.forEach { authority ->
                assertThat(permissionService.isValidAuthority(authority))
                    .withFailMessage("Authority '$authority' should be valid")
                    .isTrue()
            }
        }
        
        @Test
        @DisplayName("Should reject malformed authorities")
        fun `should reject malformed authorities`() {
            // Given
            val malformedAuthorities = listOf(
                "ROLE",              // Not ROLE_ prefix and not 3-part permission
                "role_admin",        // Wrong case for ROLE_ prefix and not 3-part permission
                "table.view",        // Only 2 parts
                "table..all",        // Empty middle part
                "",                   // Empty string
                "table.view.all.extra" // Too many parts
            )
            
            // When & Then
            malformedAuthorities.forEach { authority ->
                assertThat(permissionService.isValidAuthority(authority))
                    .withFailMessage("Authority '$authority' should be invalid")
                    .isFalse()
            }
        }
        
        @Test
        @DisplayName("Should validate complex resource identifiers")
        fun `should validate complex resource identifiers`() {
            // Given
            val complexAuthorities = listOf(
                "table.view.resource_id:550e8400-e29b-41d4-a716-446655440000",
                "document.edit.resource_group:my-group-123",
                "record.delete.resource_id:123e4567-e89b-12d3-a456-426614174000",
                "TABLE.VIEW.ALL",     // Uppercase is valid according to current implementation
                "   table.view.all   " // Whitespace in parts is valid if not blank
            )
            
            // When & Then
            complexAuthorities.forEach { authority ->
                assertThat(permissionService.isValidAuthority(authority))
                    .withFailMessage("Authority '$authority' should be valid")
                    .isTrue()
            }
        }
    }
    
    @Nested
    @DisplayName("Authority Merging")
    inner class AuthorityMerging {
        
        @Test
        @DisplayName("Should merge two authority sets")
        fun `should merge two authority sets`() {
            // Given
            val set1 = setOf(
                SimpleGrantedAuthority("ROLE_ADMIN"),
                SimpleGrantedAuthority("table.view.all")
            )
            val set2 = setOf(
                SimpleGrantedAuthority("ROLE_USER"),
                SimpleGrantedAuthority("document.edit.own")
            )
            
            // When
            val merged = permissionService.mergeAuthorities(set1, set2)
            
            // Then
            assertThat(merged).hasSize(4)
            assertThat(merged).extracting("authority").containsExactlyInAnyOrder(
                "ROLE_ADMIN",
                "table.view.all",
                "ROLE_USER",
                "document.edit.own"
            )
        }
        
        @Test
        @DisplayName("Should remove duplicate authorities")
        fun `should remove duplicate authorities`() {
            // Given
            val duplicateAuthority = SimpleGrantedAuthority("ROLE_ADMIN")
            val set1 = setOf(
                duplicateAuthority,
                SimpleGrantedAuthority("table.view.all")
            )
            val set2 = setOf(
                duplicateAuthority,
                SimpleGrantedAuthority("document.edit.own")
            )
            
            // When
            val merged = permissionService.mergeAuthorities(set1, set2)
            
            // Then
            assertThat(merged).hasSize(3) // Duplicate removed
            assertThat(merged).extracting("authority").containsExactlyInAnyOrder(
                "ROLE_ADMIN",
                "table.view.all",
                "document.edit.own"
            )
        }
        
        @Test
        @DisplayName("Should handle empty sets")
        fun `should handle empty sets`() {
            // Given
            val nonEmptySet = setOf(SimpleGrantedAuthority("ROLE_USER"))
            val emptySet = emptySet<GrantedAuthority>()
            
            // When
            val merged1 = permissionService.mergeAuthorities(nonEmptySet, emptySet)
            val merged2 = permissionService.mergeAuthorities(emptySet, nonEmptySet)
            val merged3 = permissionService.mergeAuthorities(emptySet, emptySet)
            
            // Then
            assertThat(merged1).hasSize(1)
            assertThat(merged1.first().authority).isEqualTo("ROLE_USER")
            
            assertThat(merged2).hasSize(1)
            assertThat(merged2.first().authority).isEqualTo("ROLE_USER")
            
            assertThat(merged3).isEmpty()
        }
        
        @Test
        @DisplayName("Should handle single set merge")
        fun `should handle single set merge`() {
            // Given
            val singleSet = setOf(
                SimpleGrantedAuthority("ROLE_ADMIN"),
                SimpleGrantedAuthority("table.view.all")
            )
            
            // When
            val merged = permissionService.mergeAuthorities(singleSet)
            
            // Then
            assertThat(merged).hasSize(2)
            assertThat(merged).extracting("authority").containsExactlyInAnyOrder(
                "ROLE_ADMIN",
                "table.view.all"
            )
        }
        
        @Test
        @DisplayName("Should merge multiple sets")
        fun `should merge multiple sets`() {
            // Given
            val set1 = setOf(SimpleGrantedAuthority("ROLE_ADMIN"))
            val set2 = setOf(SimpleGrantedAuthority("ROLE_USER"))
            val set3 = setOf(SimpleGrantedAuthority("table.view.all"))
            val set4 = setOf(SimpleGrantedAuthority("document.edit.own"))
            
            // When
            val merged = permissionService.mergeAuthorities(set1, set2, set3, set4)
            
            // Then
            assertThat(merged).hasSize(4)
            assertThat(merged).extracting("authority").containsExactlyInAnyOrder(
                "ROLE_ADMIN",
                "ROLE_USER",
                "table.view.all",
                "document.edit.own"
            )
        }
        
        @Test
        @DisplayName("Should preserve authority types in merge")
        fun `should preserve authority types in merge`() {
            // Given
            val roleAuthorities = setOf(
                SimpleGrantedAuthority("ROLE_ADMIN"),
                SimpleGrantedAuthority("ROLE_USER")
            )
            val permissionAuthorities = setOf(
                SimpleGrantedAuthority("table.view.all"),
                SimpleGrantedAuthority("document.edit.own")
            )
            
            // When
            val merged = permissionService.mergeAuthorities(roleAuthorities, permissionAuthorities)
            
            // Then
            assertThat(merged).hasSize(4)
            val roleAuths = merged.filter { it.authority.startsWith("ROLE_") }
            val permAuths = merged.filter { !it.authority.startsWith("ROLE_") }
            
            assertThat(roleAuths).hasSize(2)
            assertThat(permAuths).hasSize(2)
        }
        
        @Test
        @DisplayName("Should handle large datasets efficiently")
        fun `should handle large datasets efficiently`() {
            // Given
            val largeSet1 = (1..500).map { 
                SimpleGrantedAuthority("ROLE_USER_$it") 
            }.toSet()
            val largeSet2 = (1..500).map { 
                SimpleGrantedAuthority("table.view.resource_id:$it") 
            }.toSet()
            
            // When
            val startTime = System.currentTimeMillis()
            val merged = permissionService.mergeAuthorities(largeSet1, largeSet2)
            val endTime = System.currentTimeMillis()
            
            // Then
            assertThat(merged).hasSize(1000) // No duplicates expected
            assertThat(endTime - startTime).isLessThan(1000) // Should complete within 1 second
            
            // Verify both types are present
            val roleCount = merged.count { it.authority.startsWith("ROLE_") }
            val permCount = merged.count { it.authority.startsWith("table.") }
            
            assertThat(roleCount).isEqualTo(500)
            assertThat(permCount).isEqualTo(500)
        }
        
        @Test
        @DisplayName("Should handle overlapping sets with mixed duplicates")
        fun `should handle overlapping sets with mixed duplicates`() {
            // Given
            val commonAuth1 = SimpleGrantedAuthority("ROLE_COMMON")
            val commonAuth2 = SimpleGrantedAuthority("table.view.all")
            
            val set1 = setOf(
                commonAuth1,
                commonAuth2,
                SimpleGrantedAuthority("ROLE_ADMIN")
            )
            val set2 = setOf(
                commonAuth1,
                commonAuth2,
                SimpleGrantedAuthority("ROLE_USER")
            )
            val set3 = setOf(
                commonAuth2,
                SimpleGrantedAuthority("document.edit.own")
            )
            
            // When
            val merged = permissionService.mergeAuthorities(set1, set2, set3)
            
            // Then
            assertThat(merged).hasSize(5) // 2 common + 3 unique = 5 total
            assertThat(merged).extracting("authority").containsExactlyInAnyOrder(
                "ROLE_COMMON",
                "table.view.all",
                "ROLE_ADMIN",
                "ROLE_USER",
                "document.edit.own"
            )
        }
    }
    
    // Helper methods for creating test data
    
    private fun createDynamicRole(
        id: RoleId = RoleId(UUID.randomUUID()),
        name: String = "test_role",
        displayName: String? = null,
        color: String? = null,
        position: Int = 0,
        isSystem: Boolean = false
    ) = DynamicRole(
        id = id,
        tenantId = null,
        name = name,
        displayName = displayName,
        color = color,
        position = position,
        isSystem = isSystem
    )
    
    private fun createRolePermission(
        roleId: RoleId,
        permissionRule: PermissionRule
    ) = RolePermission(
        roleId = roleId,
        permissionRule = permissionRule
    )
}