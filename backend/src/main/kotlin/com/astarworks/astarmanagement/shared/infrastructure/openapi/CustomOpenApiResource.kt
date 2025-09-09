package com.astarworks.astarmanagement.shared.infrastructure.openapi

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import org.springdoc.webmvc.api.OpenApiWebMvcResource
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import java.util.*

/**
 * Custom OpenAPI endpoint that uses Gson for JSON serialization.
 * 
 * This controller provides OpenAPI documentation using Gson instead of 
 * the application's configured message converters (Kotlin Serialization).
 * This ensures that OpenAPI documentation is properly serialized to JSON
 * without interfering with the main application's serialization strategy.
 */
@RestController
@RequestMapping("/v3")
class CustomOpenApiResource(
    private val openApiResource: OpenApiWebMvcResource
) {
    
    private val gson: Gson = GsonBuilder()
        .setPrettyPrinting()
        .disableHtmlEscaping()
        .create()
    
    @GetMapping(
        value = ["/api-docs"],
        produces = [MediaType.APPLICATION_JSON_VALUE]
    )
    fun openapiJson(
        request: HttpServletRequest,
        locale: Locale,
        response: HttpServletResponse
    ) {
        // Get byte array from SpringDoc's OpenApiWebMvcResource
        val openApiBytes = openApiResource.openapiJson(
            request,
            "/v3/api-docs-original",
            locale
        )
        
        // Convert byte array to string and parse with Gson
        val jsonString = String(openApiBytes)
        val jsonObject = gson.fromJson(jsonString, Any::class.java)
        
        // Write the re-serialized JSON to response
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.characterEncoding = "UTF-8"
        response.writer.use { writer ->
            gson.toJson(jsonObject, writer)
        }
    }
}