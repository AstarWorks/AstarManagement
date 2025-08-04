#!/usr/bin/env kotlin

@file:DependsOn("io.jsonwebtoken:jjwt-api:0.12.3")
@file:DependsOn("io.jsonwebtoken:jjwt-impl:0.12.3")
@file:DependsOn("io.jsonwebtoken:jjwt-jackson:0.12.3")

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import java.nio.charset.StandardCharsets

val secret = "dev-secret-key-32-characters-long-minimum-required"
val role = "postgres"

val key = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))
val token = Jwts.builder()
    .claim("role", role)
    .signWith(key, SignatureAlgorithm.HS256)
    .compact()

println("Generated JWT token:")
println(token)