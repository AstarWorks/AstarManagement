package com.astarworks.astarmanagement.core.editor.api.dto

import java.time.Instant
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable

/**
 * Standard API envelope for editor endpoints.
 */
@Serializable
data class EditorApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: EditorErrorResponse? = null,
    @Contextual
    val timestamp: Instant = Instant.now(),
)

@Serializable
data class EditorErrorResponse(
    val code: String,
    val message: String,
    val details: Map<String, String?>? = null,
)
