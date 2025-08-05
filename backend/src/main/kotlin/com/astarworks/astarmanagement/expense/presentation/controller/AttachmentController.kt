package com.astarworks.astarmanagement.expense.presentation.controller

import com.astarworks.astarmanagement.expense.application.service.AttachmentService
import com.astarworks.astarmanagement.expense.presentation.response.AttachmentResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

/**
 * REST controller for file attachment operations.
 * Handles file uploads, downloads, and attachment management for expenses.
 */
@RestController
@RequestMapping("/api/v1/attachments")
@Tag(name = "Attachment Management", description = "File upload and management")
@Validated
class AttachmentController(
    private val attachmentService: AttachmentService
) {
    
    /**
     * Uploads a new file attachment.
     * Supports receipt images and document files.
     * 
     * @param file The multipart file to upload
     * @return The attachment metadata response
     */
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload attachment")
    fun uploadAttachment(
        @RequestParam("file") file: MultipartFile
    ): AttachmentResponse {
        return attachmentService.upload(file)
    }
    
    /**
     * Retrieves attachment metadata by ID.
     * 
     * @param id The attachment ID
     * @return The attachment metadata
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get attachment metadata")
    fun getAttachment(@PathVariable id: UUID): AttachmentResponse {
        return attachmentService.findById(id)
            ?: throw IllegalArgumentException("Attachment not found with id: $id")
    }
    
    /**
     * Downloads the actual file content of an attachment.
     * 
     * @param id The attachment ID
     * @return The file resource with appropriate headers
     */
    @GetMapping("/{id}/download")
    @Operation(summary = "Download attachment file")
    fun downloadAttachment(
        @PathVariable id: UUID
    ): ResponseEntity<Resource> {
        val (resource, attachment) = attachmentService.downloadFile(id)
            ?: throw IllegalArgumentException("Attachment not found with id: $id")
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${attachment.originalName}\"")
            .header(HttpHeaders.CONTENT_TYPE, attachment.mimeType)
            .body(resource)
    }
    
    /**
     * Deletes an attachment.
     * This removes both the file and its metadata.
     * 
     * @param id The attachment ID to delete
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete attachment")
    fun deleteAttachment(@PathVariable id: UUID) {
        attachmentService.delete(id)
    }
}