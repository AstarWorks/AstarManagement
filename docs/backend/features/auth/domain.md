# 認証機能 - Domain Model

## ドメインモデル

### MultiTenantAuthentication
```kotlin
data class MultiTenantAuthentication(
    val userId: UserId,
    val workspaceId: WorkspaceId,
    val email: String,
    val roles: Set<String>,
    val permissions: Set<String>
) : Authentication
```

### AuthenticatedUserContext
```kotlin
data class AuthenticatedUserContext(
    val userId: UserId,
    val workspaceId: WorkspaceId,
    val email: String,
    val name: String,
    val roles: List<Role>,
    val permissions: Set<Permission>
)
```

### SetupModeAuthentication
```kotlin
data class SetupModeAuthentication(
    val isSetupMode: Boolean = true
) : Authentication
```

## サービス層

### AuthorizationService
```kotlin
@Service
@Transactional
class AuthorizationService(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val membershipRepository: MembershipRepository
) {
    fun authenticate(email: String, password: String): AuthResult
    fun refreshToken(refreshToken: String): TokenPair
    fun validateToken(token: String): Claims
    fun logout(userId: UserId)
    fun getUserPermissions(userId: UserId, workspaceId: WorkspaceId): Set<Permission>
}
```

### AuthorizationProvider
```kotlin
interface AuthorizationProvider {
    fun getCurrentUser(): AuthenticatedUserContext?
    fun hasPermission(permission: String): Boolean
    fun hasRole(role: String): Boolean
    fun requirePermission(permission: String)
    fun requireRole(role: String)
}
```

## JWT処理

### TenantAwareJwtAuthenticationConverter
```kotlin
@Component
class TenantAwareJwtAuthenticationConverter : Converter<Jwt, AbstractAuthenticationToken> {
    override fun convert(jwt: Jwt): AbstractAuthenticationToken {
        val userId = UserId(UUID.fromString(jwt.getClaimAsString("sub")))
        val workspaceId = WorkspaceId(UUID.fromString(jwt.getClaimAsString("workspace_id")))
        val email = jwt.getClaimAsString("email")
        val roles = jwt.getClaimAsStringList("roles").toSet()
        val permissions = jwt.getClaimAsStringList("permissions").toSet()
        
        return MultiTenantAuthentication(
            userId = userId,
            workspaceId = workspaceId,
            email = email,
            roles = roles,
            permissions = permissions
        )
    }
}
```

## セキュリティ設定

### CustomAuthorizationManager
```kotlin
@Component
class CustomAuthorizationManager(
    private val authorizationService: AuthorizationService
) : AuthorizationManager<RequestAuthorizationContext> {
    
    override fun check(
        authentication: Supplier<Authentication>, 
        context: RequestAuthorizationContext
    ): AuthorizationDecision {
        val auth = authentication.get()
        
        // セットアップモードチェック
        if (auth is SetupModeAuthentication) {
            return AuthorizationDecision(isSetupEndpoint(context.request))
        }
        
        // マルチテナント認証チェック
        if (auth is MultiTenantAuthentication) {
            return checkTenantAccess(auth, context)
        }
        
        return AuthorizationDecision(false)
    }
    
    private fun checkTenantAccess(
        auth: MultiTenantAuthentication,
        context: RequestAuthorizationContext
    ): AuthorizationDecision {
        // エンドポイント別の権限チェック
        val requiredPermission = getRequiredPermission(context.request)
        return AuthorizationDecision(
            auth.permissions.contains(requiredPermission)
        )
    }
}
```

## トークン仕様

### Access Token Claims
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "workspace_id": "workspace-uuid",
  "roles": ["ADMIN", "USER"],
  "permissions": ["workspace:read", "workspace:write"],
  "iat": 1704067200,
  "exp": 1704070800
}
```

### Refresh Token Claims
```json
{
  "sub": "user-uuid",
  "token_type": "refresh",
  "iat": 1704067200,
  "exp": 1704672000
}
```

## パスワードポリシー

### 要件
- 最小8文字
- 大文字・小文字・数字を含む
- 特殊文字推奨
- BCrypt（コスト係数12）でハッシュ化

### バリデーション
```kotlin
object PasswordValidator {
    fun validate(password: String): ValidationResult {
        val errors = mutableListOf<String>()
        
        if (password.length < 8) {
            errors.add("Password must be at least 8 characters")
        }
        if (!password.any { it.isUpperCase() }) {
            errors.add("Password must contain uppercase letter")
        }
        if (!password.any { it.isLowerCase() }) {
            errors.add("Password must contain lowercase letter")
        }
        if (!password.any { it.isDigit() }) {
            errors.add("Password must contain number")
        }
        
        return if (errors.isEmpty()) {
            ValidationResult.Valid
        } else {
            ValidationResult.Invalid(errors)
        }
    }
}
```