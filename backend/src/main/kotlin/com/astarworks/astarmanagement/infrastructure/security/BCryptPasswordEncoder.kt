package com.astarworks.astarmanagement.infrastructure.security

import com.astarworks.astarmanagement.application.port.output.PasswordEncoder
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder as SpringBCryptPasswordEncoder
import org.springframework.stereotype.Component

@Component
class BCryptPasswordEncoder : PasswordEncoder {
    
    private val encoder = SpringBCryptPasswordEncoder()
    
    override fun encode(rawPassword: String): String {
        return encoder.encode(rawPassword)
    }
    
    override fun matches(rawPassword: String, encodedPassword: String): Boolean {
        return encoder.matches(rawPassword, encodedPassword)
    }
}