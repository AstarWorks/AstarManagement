package com.astarworks.astarmanagement.expense.fixtures

import com.astarworks.astarmanagement.modules.financial.expense.domain.model.Tag
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.TagScope
import java.util.UUID

/**
 * Test data builders for Tag domain objects
 */
object TagFixtures {
    fun tag(
        id: UUID = UUID.randomUUID(),
        tenantId: UUID = UUID.randomUUID(),
        name: String = "Test Tag",
        nameNormalized: String = "test tag",
        color: String = "#FF5733",
        scope: TagScope = TagScope.TENANT,
        ownerId: UUID? = null,
        usageCount: Int = 0
    ) = Tag(
        id = id,
        tenantId = tenantId,
        name = name,
        nameNormalized = nameNormalized,
        color = color,
        scope = scope,
        ownerId = ownerId,
        usageCount = usageCount
    )
}