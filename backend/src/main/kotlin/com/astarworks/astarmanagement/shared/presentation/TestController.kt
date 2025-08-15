package com.astarworks.astarmanagement.presentation.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/test")
class TestController {
    
    @GetMapping("/hello")
    fun hello(): Map<String, String> {
        return mapOf("message" to "Hello from auth test!")
    }
    
    @GetMapping("/error")
    fun error(): String {
        throw RuntimeException("Test error for debugging")
    }
}