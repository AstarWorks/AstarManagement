package com.astarworks.astarmanagement.core.editor.api.controller

import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.editor.api.dto.EditorApiResponse
import com.astarworks.astarmanagement.core.editor.api.dto.folder.FolderArchiveRequest
import com.astarworks.astarmanagement.core.editor.api.dto.folder.FolderBreadcrumbResponse
import com.astarworks.astarmanagement.core.editor.api.dto.folder.FolderChildrenResponse
import com.astarworks.astarmanagement.core.editor.api.dto.folder.FolderCreateRequest
import com.astarworks.astarmanagement.core.editor.api.dto.folder.FolderMoveRequest
import com.astarworks.astarmanagement.core.editor.api.dto.folder.FolderRenameRequest
import com.astarworks.astarmanagement.core.editor.api.dto.folder.FolderResponse
import com.astarworks.astarmanagement.core.editor.api.mapper.EditorDtoMapper
import com.astarworks.astarmanagement.core.editor.domain.service.FolderService
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import jakarta.validation.Valid
import java.util.UUID
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/editor/folders")
@ConditionalOnProperty(prefix = "app.features.editor", name = ["enabled"], havingValue = "true")
@PreAuthorize("isAuthenticated()")
class EditorFolderController(
    private val folderService: FolderService,
    private val dtoMapper: EditorDtoMapper,
) {

    private val logger = LoggerFactory.getLogger(EditorFolderController::class.java)

    @PostMapping
    @PreAuthorize("hasPermissionRule('directory.create.all')")
    fun createFolder(
        @AuthenticationPrincipal principal: AuthenticatedUserContext,
        @Valid @RequestBody request: FolderCreateRequest,
    ): EditorApiResponse<FolderResponse> {
        logger.info("Creating folder '{}' in workspace {}", request.title, request.workspaceId)

        val folder = folderService.createFolder(
            workspaceId = WorkspaceId(request.workspaceId),
            parentId = request.parentId?.let(::DocumentNodeId),
            title = request.title,
            createdBy = UserId(principal.userId),
            position = request.position,
        )

        val response = FolderResponse(node = dtoMapper.toNodeResponse(folder))
        return EditorApiResponse(success = true, data = response)
    }

    @PatchMapping("/{folderId}/rename")
    @PreAuthorize("hasPermissionRule('directory.edit.all')")
    fun renameFolder(
        @PathVariable folderId: UUID,
        @AuthenticationPrincipal principal: AuthenticatedUserContext,
        @Valid @RequestBody request: FolderRenameRequest,
    ): EditorApiResponse<FolderResponse> {
        logger.info("Renaming folder {}", folderId)

        val updated = folderService.renameFolder(
            folderId = DocumentNodeId(folderId),
            newTitle = request.title,
            updatedBy = UserId(principal.userId),
        )

        val response = FolderResponse(node = dtoMapper.toNodeResponse(updated))
        return EditorApiResponse(success = true, data = response)
    }

    @PatchMapping("/{folderId}/move")
    @PreAuthorize("hasPermissionRule('directory.edit.all')")
    fun moveFolder(
        @PathVariable folderId: UUID,
        @AuthenticationPrincipal principal: AuthenticatedUserContext,
        @Valid @RequestBody request: FolderMoveRequest,
    ): EditorApiResponse<FolderResponse> {
        logger.info("Moving folder {}", folderId)

        val updated = folderService.moveFolder(
            folderId = DocumentNodeId(folderId),
            targetParentId = request.targetParentId?.let(::DocumentNodeId),
            updatedBy = UserId(principal.userId),
            newPosition = request.position,
        )

        val response = FolderResponse(node = dtoMapper.toNodeResponse(updated))
        return EditorApiResponse(success = true, data = response)
    }

    @PatchMapping("/{folderId}/archive")
    @PreAuthorize("hasPermissionRule('directory.edit.all')")
    fun archiveFolder(
        @PathVariable folderId: UUID,
        @AuthenticationPrincipal principal: AuthenticatedUserContext,
        @Valid @RequestBody request: FolderArchiveRequest,
    ): EditorApiResponse<FolderResponse> {
        logger.info("{} folder {}", if (request.archived) "Archiving" else "Unarchiving", folderId)

        val updated = folderService.archiveFolder(
            folderId = DocumentNodeId(folderId),
            archived = request.archived,
            updatedBy = UserId(principal.userId),
        )

        val response = FolderResponse(node = dtoMapper.toNodeResponse(updated))
        return EditorApiResponse(success = true, data = response)
    }

    @DeleteMapping("/{folderId}")
    @PreAuthorize("hasPermissionRule('directory.delete.all')")
    fun deleteFolder(
        @PathVariable folderId: UUID,
    ): EditorApiResponse<Unit> {
        logger.info("Deleting folder {}", folderId)

        folderService.deleteFolder(DocumentNodeId(folderId))
        return EditorApiResponse(success = true)
    }

    @GetMapping
    @PreAuthorize("hasPermissionRule('directory.view.all')")
    fun listNodes(
        @RequestParam workspaceId: UUID,
        @RequestParam(required = false) parentId: UUID?,
        @RequestParam(defaultValue = "false") includeArchived: Boolean,
    ): EditorApiResponse<FolderChildrenResponse> {
        logger.debug(
            "Listing nodes for workspace {} under parent {} (includeArchived={})",
            workspaceId,
            parentId,
            includeArchived,
        )

        val nodes = folderService.listChildren(
            workspaceId = WorkspaceId(workspaceId),
            parentId = parentId?.let(::DocumentNodeId),
            includeArchived = includeArchived,
        )

        val response = FolderChildrenResponse(nodes = nodes.map(dtoMapper::toNodeResponse))
        return EditorApiResponse(success = true, data = response)
    }

    @GetMapping("/{folderId}/children")
    @PreAuthorize("hasPermissionRule('directory.view.all')")
    fun listFolderChildren(
        @PathVariable folderId: UUID,
        @RequestParam(defaultValue = "false") includeArchived: Boolean,
    ): EditorApiResponse<FolderChildrenResponse> {
        logger.debug("Listing children for folder {}", folderId)

        val folder = folderService.getFolder(DocumentNodeId(folderId))
        val nodes = folderService.listChildren(
            workspaceId = folder.workspaceId,
            parentId = DocumentNodeId(folderId),
            includeArchived = includeArchived,
        )

        val response = FolderChildrenResponse(nodes = nodes.map(dtoMapper::toNodeResponse))
        return EditorApiResponse(success = true, data = response)
    }

    @GetMapping("/{nodeId}/breadcrumb")
    @PreAuthorize("hasPermissionRule('directory.view.all')")
    fun getBreadcrumb(
        @PathVariable nodeId: UUID,
    ): EditorApiResponse<FolderBreadcrumbResponse> {
        logger.debug("Fetching breadcrumb for node {}", nodeId)

        val nodes = folderService.getBreadcrumb(DocumentNodeId(nodeId))
        val breadcrumb = FolderBreadcrumbResponse(dtoMapper.toBreadcrumb(nodes))
        return EditorApiResponse(success = true, data = breadcrumb)
    }
}
