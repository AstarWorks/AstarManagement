package com.astarworks.astarmanagement.shared.domain.value

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import java.util.UUID

/**
 * Generic strongly-typed entity identifier using Kotlin value classes.
 * Provides type safety to prevent mixing different entity IDs.
 * 
 * @param T The entity type this ID belongs to
 * @property value The underlying UUID value
 */
@JvmInline
@Serializable
value class EntityId<T>(@Contextual val value: UUID) {
    
    override fun toString(): String = value.toString()
}