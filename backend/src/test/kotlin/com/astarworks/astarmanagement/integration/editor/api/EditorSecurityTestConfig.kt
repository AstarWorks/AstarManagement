package com.astarworks.astarmanagement.integration.editor.api

import com.astarworks.astarmanagement.core.auth.domain.model.Action
import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import com.astarworks.astarmanagement.core.auth.domain.model.Scope
import com.astarworks.astarmanagement.core.auth.domain.service.AuthorizationProvider
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import java.time.Instant
import java.util.UUID
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Component
import org.springframework.core.convert.converter.Converter

@TestConfiguration
class EditorSecurityTestConfig(
    private val tenantContextService: TenantContextService,
) {

    @Bean
    @Primary
    fun testTenantAwareJwtAuthenticationConverter(): Converter<Jwt, AbstractAuthenticationToken> {
        return Converter { jwt ->
            val tenantId = jwt.getClaimAsString("tenant_id")?.let(UUID::fromString)
                ?: tenantContextService.getTenantContext()
                ?: throw IllegalStateException("tenant_id claim is required for editor tests")
            val userId = jwt.getClaimAsString("user_id")?.let(UUID::fromString)
                ?: UUID.randomUUID()
            val tenantUserId = jwt.getClaimAsString("tenant_user_id")?.let(UUID::fromString)
                ?: UUID.randomUUID()

            val permissionRules = setOf(
                PermissionRule.GeneralRule(ResourceType.DIRECTORY, Action.MANAGE, Scope.ALL),
                PermissionRule.GeneralRule(ResourceType.DOCUMENT, Action.MANAGE, Scope.ALL)
            )

            val context = AuthenticatedUserContext(
                auth0Sub = jwt.subject,
                userId = userId,
                tenantUserId = tenantUserId,
                tenantId = tenantId,
                roles = emptySet<DynamicRole>(),
                permissions = permissionRules,
                email = jwt.getClaimAsString("email"),
                isActive = true,
                lastAccessedAt = Instant.now()
            )

            val authorities: MutableSet<GrantedAuthority> = permissionRules
                .map { SimpleGrantedAuthority(it.toDatabaseString()) }
                .toMutableSet()
            authorities.add(SimpleGrantedAuthority("ROLE_TEST_EDITOR"))

            object : JwtAuthenticationToken(jwt, authorities, jwt.subject) {
                override fun getPrincipal(): Any = context
                override fun getAuthorities(): MutableCollection<GrantedAuthority> = authorities
            }
        }
    }

    @Bean
    @Primary
    fun testAuthorizationProvider(): AuthorizationProvider {
        return object : AuthorizationProvider {
            override fun hasPermission(tenantUserId: UUID, permissionRule: PermissionRule): Boolean = true
            override fun hasAnyPermission(tenantUserId: UUID, permissionRules: Set<PermissionRule>): Boolean = true
            override fun hasAllPermissions(tenantUserId: UUID, permissionRules: Set<PermissionRule>): Boolean = true
            override fun hasPermissionForResource(
                tenantUserId: UUID,
                resourceType: ResourceType,
                action: Action,
                scope: Scope
            ): Boolean = true
            override fun canAccessResource(
                tenantUserId: UUID,
                resourceId: UUID,
                resourceType: ResourceType,
                action: Action
            ): Boolean = true
            override fun getUserEffectiveRoles(tenantUserId: UUID): Set<DynamicRole> = emptySet()
            override fun getUserEffectivePermissions(tenantUserId: UUID): Set<PermissionRule> = emptySet()
        }
    }
}
