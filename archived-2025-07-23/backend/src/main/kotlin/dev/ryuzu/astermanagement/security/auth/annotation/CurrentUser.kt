package dev.ryuzu.astermanagement.security.auth.annotation

import org.springframework.security.core.annotation.AuthenticationPrincipal

/**
 * Custom annotation to inject the current authenticated user principal.
 * This is an alias for @AuthenticationPrincipal with additional metadata.
 * 
 * Usage:
 * ```
 * @GetMapping("/profile")
 * fun getProfile(@CurrentUser user: UserPrincipal): ResponseEntity<UserProfile>
 * ```
 */
@Target(AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.ANNOTATION_CLASS)
@Retention(AnnotationRetention.RUNTIME)
@MustBeDocumented
@AuthenticationPrincipal
annotation class CurrentUser