package dev.ryuzu.astermanagement.controller.base

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import java.net.URI

/**
 * Base controller providing common functionality for all REST controllers.
 * Includes helper methods for consistent response formatting and URI building.
 */
abstract class BaseController {
    
    /**
     * Creates a ResponseEntity with 201 Created status and Location header.
     * 
     * @param resource The created resource to return in the response body
     * @param id The identifier of the created resource for the Location header
     * @return ResponseEntity with 201 status, Location header, and resource body
     */
    protected fun <T> created(resource: T, id: Any): ResponseEntity<T> {
        val location = buildResourceUri(id)
        return ResponseEntity.created(location).body(resource)
    }
    
    /**
     * Creates a ResponseEntity with 200 OK status.
     * 
     * @param resource The resource to return in the response body
     * @return ResponseEntity with 200 status and resource body
     */
    protected fun <T> ok(resource: T): ResponseEntity<T> {
        return ResponseEntity.ok(resource)
    }
    
    /**
     * Creates a ResponseEntity with 204 No Content status.
     * 
     * @return ResponseEntity with 204 status and no body
     */
    protected fun noContent(): ResponseEntity<Void> {
        return ResponseEntity.noContent().build()
    }
    
    /**
     * Creates a ResponseEntity with 404 Not Found status.
     * 
     * @return ResponseEntity with 404 status
     */
    protected fun <T> notFound(): ResponseEntity<T> {
        return ResponseEntity.notFound().build()
    }
    
    /**
     * Creates a ResponseEntity with 409 Conflict status.
     * 
     * @param body The conflict error details
     * @return ResponseEntity with 409 status
     */
    protected fun <T> conflict(body: T): ResponseEntity<T> {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body)
    }
    
    /**
     * Builds a URI for the created resource using the current request context.
     * 
     * @param id The identifier to append to the current request path
     * @return URI pointing to the created resource
     */
    private fun buildResourceUri(id: Any): URI {
        return ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(id)
            .toUri()
    }
    
    /**
     * Validates pagination parameters and returns adjusted values.
     * 
     * @param page The requested page number
     * @param size The requested page size
     * @return Pair of validated page and size values
     */
    protected fun validatePagination(page: Int?, size: Int?): Pair<Int, Int> {
        val validatedPage = (page ?: 0).coerceAtLeast(0)
        val validatedSize = (size ?: 20).coerceIn(1, 100)
        return validatedPage to validatedSize
    }
}