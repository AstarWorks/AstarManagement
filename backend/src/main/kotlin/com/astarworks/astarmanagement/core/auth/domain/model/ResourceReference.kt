package com.astarworks.astarmanagement.core.auth.domain.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class ResourceReference(
    val type: ResourceType,
    @Contextual
    val id: UUID
)