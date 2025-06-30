# T05_S06: Two-Factor Authentication

**Status**: TODO  
**Sprint**: S06_M01_Authentication_RBAC  
**Complexity**: Medium (16-20 hours)

## Description
Implement TOTP-based two-factor authentication with QR code generation for enhanced security. This feature will integrate with the existing Spring Security authentication flow to provide an additional layer of security through time-based one-time passwords compatible with Google Authenticator and similar apps.

## Goals
- Add 2FA setup and verification endpoints with secure TOTP implementation
- Integrate 2FA seamlessly into the existing authentication flow
- Generate and store secure backup codes for account recovery
- Implement QR code generation for easy mobile app setup
- Provide user-friendly 2FA management interface

## Acceptance Criteria
- [ ] Users can enable/disable 2FA from their account settings
- [ ] QR code is generated for easy setup with authenticator apps
- [ ] TOTP codes are validated correctly with 30-second time windows
- [ ] Backup codes are generated and can be used for recovery
- [ ] 2FA is enforced after successful password authentication
- [ ] Rate limiting prevents brute force attacks on TOTP codes
- [ ] Secrets are encrypted before storage in the database
- [ ] Audit logs track all 2FA-related activities
- [ ] Frontend provides clear UI for 2FA setup and verification
- [ ] API returns appropriate status codes for 2FA states

## Technical Guidance

### Key Interfaces
```kotlin
// TOTPService.kt
interface TOTPService {
    fun generateSecret(): String
    fun generateQRCodeUrl(email: String, secret: String): String
    fun validateCode(secret: String, code: String): Boolean
    fun generateBackupCodes(): List<String>
}

// QRCodeGenerator.kt
interface QRCodeGenerator {
    fun generateQRCode(data: String): ByteArray
    fun generateQRCodeBase64(data: String): String
}
```

### Integration Points
- `/backend/src/main/kotlin/com/astromanagement/auth/twofa/` - Main 2FA implementation
- `/backend/src/main/kotlin/com/astromanagement/auth/security/` - Spring Security integration
- `/frontend/src/pages/auth/` - Frontend authentication pages
- `/frontend/src/components/auth/` - 2FA UI components

### External Libraries
```kotlin
// build.gradle.kts
dependencies {
    implementation("com.warrenstrange:googleauth:1.5.0")  // TOTP implementation
    implementation("com.google.zxing:core:3.5.2")         // QR code generation
    implementation("com.google.zxing:javase:3.5.2")       // QR code image processing
}
```

### Database Models
```kotlin
@Entity
@Table(name = "user_two_factor")
data class UserTwoFactor(
    @Id
    val userId: UUID,
    
    @Column(nullable = false)
    val encryptedSecret: String,
    
    @Column(nullable = false)
    val enabled: Boolean = false,
    
    @Column(name = "backup_codes", columnDefinition = "TEXT")
    val backupCodes: String? = null,  // JSON array of hashed codes
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
    
    @Column(name = "last_used_at")
    val lastUsedAt: Instant? = null
)
```

### Error Handling
```kotlin
sealed class TwoFactorError : RuntimeException() {
    object InvalidCode : TwoFactorError()
    object TooManyAttempts : TwoFactorError()
    object NotEnabled : TwoFactorError()
    object AlreadyEnabled : TwoFactorError()
}
```

## Implementation Notes

### TOTP Algorithm
- Use Google Authenticator compatible TOTP algorithm (RFC 6238)
- 30-second time window with ±1 window tolerance
- 6-digit numeric codes
- SHA-1 hash algorithm for compatibility

### QR Code Generation
- Include app name: "Aster Management"
- Format: `otpauth://totp/AsterManagement:user@email.com?secret=SECRET&issuer=AsterManagement`
- Generate 300x300 pixel QR codes
- Return as Base64-encoded PNG for frontend display

### Secret Storage
- Generate 32-character base32 secrets
- Encrypt secrets using AES-256 before database storage
- Use application-level encryption key from environment
- Never expose raw secrets in API responses

### Backup Codes
- Generate 8 backup codes on 2FA enablement
- Format: XXXX-XXXX (8 alphanumeric characters)
- Hash backup codes with bcrypt before storage
- Each code can only be used once
- Provide option to regenerate all codes

### Authentication Flow Integration
```kotlin
// After successful password validation
if (user.hasTwoFactorEnabled()) {
    // Return 428 Precondition Required
    return ResponseEntity.status(428).body(
        TwoFactorRequiredResponse(
            message = "Two-factor authentication required",
            sessionToken = generateTemporaryToken(user)
        )
    )
}
```

### API Endpoints
```kotlin
// 2FA Setup
POST   /api/auth/2fa/setup         - Generate secret and QR code
POST   /api/auth/2fa/enable        - Enable 2FA with TOTP verification
POST   /api/auth/2fa/disable       - Disable 2FA (requires password)

// 2FA Verification
POST   /api/auth/2fa/verify        - Verify TOTP code during login
POST   /api/auth/2fa/verify-backup - Use backup code

// 2FA Management
GET    /api/auth/2fa/status        - Check 2FA status
POST   /api/auth/2fa/backup-codes  - Regenerate backup codes
```

### Frontend Components
```vue
<!-- TwoFactorSetup.vue -->
<template>
  <div class="two-factor-setup">
    <h3>Set Up Two-Factor Authentication</h3>
    <div v-if="qrCodeUrl" class="qr-code-container">
      <img :src="qrCodeUrl" alt="2FA QR Code" />
      <p>Scan with Google Authenticator or similar app</p>
    </div>
    <form @submit.prevent="enableTwoFactor">
      <input v-model="verificationCode" 
             placeholder="Enter 6-digit code"
             maxlength="6"
             pattern="[0-9]{6}" />
      <button type="submit">Enable 2FA</button>
    </form>
  </div>
</template>
```

### Security Considerations
- Implement rate limiting: 5 attempts per 15 minutes
- Log all 2FA events for audit trail
- Require password re-authentication for 2FA changes
- Clear temporary tokens after successful 2FA verification
- Implement CSRF protection on all 2FA endpoints

## Subtasks
- [ ] Create UserTwoFactor entity and repository
- [ ] Implement TOTPService with Google Authenticator library
- [ ] Create QRCodeGenerator service using ZXing
- [ ] Add encryption service for secret storage
- [ ] Implement 2FA setup endpoints
- [ ] Integrate 2FA into Spring Security authentication flow
- [ ] Create 2FA verification endpoints with rate limiting
- [ ] Implement backup code generation and validation
- [ ] Create Vue components for 2FA setup flow
- [ ] Add 2FA verification screen to login process
- [ ] Create account settings UI for 2FA management
- [ ] Add comprehensive logging and audit trail
- [ ] Write unit tests for TOTP validation
- [ ] Write integration tests for authentication flow
- [ ] Update API documentation with 2FA endpoints
- [ ] Create user documentation for 2FA setup

## Dependencies
- T01_S06: Basic JWT Authentication (must be completed first)
- T02_S06: Discord-Style RBAC (for permission checks)

## Testing Requirements
- Unit tests for TOTP code generation and validation
- Integration tests for complete authentication flow
- Security tests for rate limiting and brute force protection
- UI tests for 2FA setup and verification flows
- Test backup code functionality and one-time use
- Verify encryption/decryption of secrets

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] All tests passing with >90% coverage
- [ ] Security review completed
- [ ] API documentation updated
- [ ] User documentation created
- [ ] Deployed to staging environment
- [ ] QA sign-off received