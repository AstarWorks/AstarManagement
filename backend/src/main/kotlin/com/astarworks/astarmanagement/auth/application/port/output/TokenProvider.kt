package com.astarworks.astarmanagement.modules.auth.application.port.output

import com.astarworks.astarmanagement.modules.shared.domain.entity.User
import java.util.UUID

interface TokenProvider {
    fun generateAccessToken(user: User): String
    fun generateRefreshToken(user: User): String
    fun validateToken(token: String): Boolean
    fun getUserIdFromToken(token: String): UUID?
    fun getExpirationTime(): Long
}