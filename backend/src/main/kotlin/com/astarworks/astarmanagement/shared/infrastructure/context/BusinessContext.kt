package com.astarworks.astarmanagement.shared.infrastructure.context

import com.astarworks.astarmanagement.core.auth.domain.model.Role
import java.util.UUID

/**
 * Business context extracted from JWT claims.
 * Contains user identity, tenant information, and business roles.
 */
data class BusinessContext(
    val userId: String,
    val tenantId: UUID?,
    val roles: Set<Role>
)