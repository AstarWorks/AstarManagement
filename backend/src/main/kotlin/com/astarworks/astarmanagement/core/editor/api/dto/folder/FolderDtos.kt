package com.astarworks.astarmanagement.core.editor.api.dto.folder

import com.astarworks.astarmanagement.core.editor.api.dto.common.EditorBreadcrumbItemResponse
import com.astarworks.astarmanagement.core.editor.api.dto.common.EditorNodeResponse
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable

@Serializable
data class FolderCreateRequest(
    @Contextual
    val workspaceId: UUID,
    @field:NotBlank
    @field:Size(max = 255)
    val title: String,
    @Contextual
    val parentId: UUID? = null,
    val position: Double? = null,
)

@Serializable
data class FolderRenameRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val title: String,
)

@Serializable
data class FolderMoveRequest(
    @Contextual
    val targetParentId: UUID? = null,
    val position: Double? = null,
)

@Serializable
data class FolderArchiveRequest(
    val archived: Boolean,
)

@Serializable
data class FolderResponse(
    val node: EditorNodeResponse,
)

@Serializable
data class FolderChildrenResponse(
    val nodes: List<EditorNodeResponse>,
)

@Serializable
data class FolderBreadcrumbResponse(
    val breadcrumb: List<EditorBreadcrumbItemResponse>,
)
