package com.astarworks.astarmanagement.presentation.controller

import com.astarworks.astarmanagement.infrastructure.external.SupabaseClientService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/supabase-test")
class SupabaseTestController(
    private val supabaseService: SupabaseClientService
) {
    
    @GetMapping("/connection")
    fun testConnection(): ResponseEntity<Map<String, Any>> {
        val connected = supabaseService.testConnection()
        return ResponseEntity.ok(
            mapOf(
                "connected" to connected,
                "message" to if (connected) "Successfully connected to Supabase" else "Failed to connect to Supabase"
            )
        )
    }
    
    @GetMapping("/data/{table}")
    fun fetchTestData(@PathVariable table: String): ResponseEntity<List<Map<String, Any>>> {
        val data = supabaseService.fetchData(table)
        return if (data.isNotEmpty()) {
            ResponseEntity.ok(data)
        } else {
            ResponseEntity.noContent().build()
        }
    }
    
    @PostMapping("/data/{table}")
    fun insertTestData(
        @PathVariable table: String,
        @RequestBody data: Map<String, Any>
    ): ResponseEntity<Map<String, Any>> {
        val result = supabaseService.insertData(table, data)
        return if (result.isNotEmpty()) {
            ResponseEntity.ok(result)
        } else {
            ResponseEntity.internalServerError().build()
        }
    }
}