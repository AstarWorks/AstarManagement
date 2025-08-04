package com.astarworks.astarmanagement.application.port.output

interface PasswordEncoder {
    fun encode(rawPassword: String): String
    fun matches(rawPassword: String, encodedPassword: String): Boolean
}