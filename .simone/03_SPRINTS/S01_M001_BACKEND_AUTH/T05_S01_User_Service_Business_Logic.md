# T05_S01 - User Service & Business Logic

## Task Overview
**Duration**: 8 hours  
**Priority**: High  
**Dependencies**: T04_S01_User_Entity_Repository_Layer  
**Sprint**: S01_M001_BACKEND_AUTH  

## Objective
Implement the User service layer containing business logic for user management operations, including user creation, updates, password management, and role assignments following Clean Architecture principles.

## Background
This task completes AUTH-003 (User Management API) by implementing the application layer business logic. The service must provide secure user management operations suitable for Japanese legal practice requirements with proper validation and audit logging.

## Technical Requirements

### 1. User Application Service
Create application service coordinating user operations:

**Location**: `backend/modules/auth/application/service/UserService.kt`

**Core Operations**:
- User creation with validation and password hashing
- User profile updates with audit logging
- Password change and reset functionality
- User role management and permission assignments
- User search and filtering with multi-tenant support

### 2. User Management Use Cases
Implement specific use cases following CQRS patterns:

**Location**: `backend/modules/auth/application/usecase/`

**Use Cases to Create**:
- `CreateUserUseCase.kt` - New user registration
- `UpdateUserProfileUseCase.kt` - Profile information updates
- `ChangePasswordUseCase.kt` - Password management
- `ManageUserRoleUseCase.kt` - Role and permission management
- `SearchUsersUseCase.kt` - User search and filtering

### 3. Command and Query Models
Create CQRS command and query objects:

**Location**: `backend/modules/auth/application/command/` and `backend/modules/auth/application/query/`

**Commands**:
- `CreateUserCommand.kt`
- `UpdateUserProfileCommand.kt`
- `ChangePasswordCommand.kt`
- `AssignUserRoleCommand.kt`

**Queries**:
- `GetUserQuery.kt`
- `SearchUsersQuery.kt`
- `GetUserPermissionsQuery.kt`

### 4. Validation and Business Rules
Implement comprehensive validation logic:

**Business Rules**:
- Email uniqueness validation
- Password strength requirements
- Role assignment permissions
- Multi-tenant user isolation
- Legal practice specific validations

## Implementation Guidance

### User Service Implementation
Create comprehensive service with proper error handling:

```kotlin
@Service
@Transactional
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val auditService: AuditService,
    private val emailService: EmailService,
    private val tenantContext: TenantContext
) {

    fun createUser(command: CreateUserCommand): User {
        // Validate business rules
        validateCreateUserCommand(command)
        
        // Check email uniqueness
        if (userRepository.existsByEmail(command.email)) {
            throw BusinessException("User with email ${command.email} already exists")
        }
        
        // Create user with hashed password
        val hashedPassword = passwordEncoder.encode(command.password)
        val user = User(
            username = command.username,
            email = command.email,
            passwordHash = hashedPassword,
            firstName = command.firstName,
            lastName = command.lastName,
            role = command.role,
            isActive = true
        )
        
        val savedUser = userRepository.save(user)
        
        // Send welcome email
        emailService.sendWelcomeEmail(savedUser)
        
        // Log user creation
        auditService.logUserCreated(savedUser, getCurrentUserId())
        
        return savedUser
    }

    fun updateUserProfile(command: UpdateUserProfileCommand): User {
        val user = userRepository.findById(command.userId)
            ?: throw EntityNotFoundException("User not found: ${command.userId}")
        
        // Validate update permissions
        validateUpdatePermissions(user, getCurrentUserId())
        
        val updatedUser = user.copy(
            firstName = command.firstName ?: user.firstName,
            lastName = command.lastName ?: user.lastName,
            email = command.email ?: user.email,
            updatedAt = LocalDateTime.now()
        )
        
        // Validate email uniqueness if changed
        if (command.email != null && command.email != user.email) {
            if (userRepository.existsByEmailAndIdNot(command.email, user.id!!)) {
                throw BusinessException("Email ${command.email} is already in use")
            }
        }
        
        val savedUser = userRepository.save(updatedUser)
        auditService.logUserUpdated(savedUser, getCurrentUserId())
        
        return savedUser
    }

    fun changePassword(command: ChangePasswordCommand): Unit {
        val user = userRepository.findById(command.userId)
            ?: throw EntityNotFoundException("User not found: ${command.userId}")
        
        // Validate current password
        if (!passwordEncoder.matches(command.currentPassword, user.passwordHash)) {
            throw BusinessException("Current password is incorrect")
        }
        
        // Validate new password strength
        validatePasswordStrength(command.newPassword)
        
        val hashedNewPassword = passwordEncoder.encode(command.newPassword)
        val updatedUser = user.withHashedPassword(hashedNewPassword)
        
        userRepository.save(updatedUser)
        auditService.logPasswordChanged(user.id!!, getCurrentUserId())
    }

    @Transactional(readOnly = true)
    fun searchUsers(query: SearchUsersQuery): Page<User> {
        // Apply tenant isolation
        val tenantId = tenantContext.getCurrentTenantId()
        
        return when {
            query.role != null -> userRepository.findByRoleAndTenantId(
                query.role, tenantId, query.pageable
            )
            query.searchTerm != null -> userRepository.searchByNameOrEmail(
                query.searchTerm, tenantId, query.pageable
            )
            else -> userRepository.findByTenantId(tenantId, query.pageable)
        }
    }

    private fun validateCreateUserCommand(command: CreateUserCommand) {
        // Validate email format
        if (!isValidEmail(command.email)) {
            throw ValidationException("Invalid email format: ${command.email}")
        }
        
        // Validate password strength
        validatePasswordStrength(command.password)
        
        // Validate name fields
        if (command.firstName.isBlank() || command.lastName.isBlank()) {
            throw ValidationException("First name and last name are required")
        }
        
        // Validate role assignment permissions
        if (!canAssignRole(command.role, getCurrentUserRole())) {
            throw SecurityException("Insufficient permissions to assign role: ${command.role}")
        }
    }

    private fun validatePasswordStrength(password: String) {
        if (password.length < 8) {
            throw ValidationException("Password must be at least 8 characters long")
        }
        
        if (!password.matches(Regex(".*[A-Z].*"))) {
            throw ValidationException("Password must contain at least one uppercase letter")
        }
        
        if (!password.matches(Regex(".*[a-z].*"))) {
            throw ValidationException("Password must contain at least one lowercase letter")
        }
        
        if (!password.matches(Regex(".*\\d.*"))) {
            throw ValidationException("Password must contain at least one digit")
        }
        
        if (!password.matches(Regex(".*[!@#$%^&*(),.?\":{}|<>].*"))) {
            throw ValidationException("Password must contain at least one special character")
        }
    }

    private fun canAssignRole(roleToAssign: UserRole, assignerRole: UserRole): Boolean {
        return when (assignerRole) {
            UserRole.LAWYER -> true // Lawyers can assign any role
            UserRole.CLERK -> roleToAssign in listOf(UserRole.CLERK, UserRole.CLIENT)
            UserRole.CLIENT -> false // Clients cannot assign roles
        }
    }
}
```

### Use Case Implementation
Implement specific use cases with focused responsibilities:

```kotlin
@Component
class CreateUserUseCase(
    private val userService: UserService,
    private val emailValidator: EmailValidator,
    private val passwordValidator: PasswordValidator
) {

    fun execute(command: CreateUserCommand): CreateUserResult {
        return try {
            // Pre-validation
            validateCommand(command)
            
            // Execute business logic
            val user = userService.createUser(command)
            
            CreateUserResult.Success(user)
        } catch (e: BusinessException) {
            CreateUserResult.ValidationError(e.message ?: "Validation failed")
        } catch (e: Exception) {
            CreateUserResult.SystemError("Failed to create user")
        }
    }

    private fun validateCommand(command: CreateUserCommand) {
        if (!emailValidator.isValid(command.email)) {
            throw BusinessException("Invalid email format")
        }
        
        if (!passwordValidator.isStrong(command.password)) {
            throw BusinessException("Password does not meet strength requirements")
        }
    }
}

sealed class CreateUserResult {
    data class Success(val user: User) : CreateUserResult()
    data class ValidationError(val message: String) : CreateUserResult()
    data class SystemError(val message: String) : CreateUserResult()
}
```

### Command and Query Objects
Create structured command objects for type safety:

```kotlin
data class CreateUserCommand(
    val username: String,
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val role: UserRole
) {
    init {
        require(username.isNotBlank()) { "Username cannot be blank" }
        require(email.isNotBlank()) { "Email cannot be blank" }
        require(password.isNotBlank()) { "Password cannot be blank" }
        require(firstName.isNotBlank()) { "First name cannot be blank" }
        require(lastName.isNotBlank()) { "Last name cannot be blank" }
    }
}

data class UpdateUserProfileCommand(
    val userId: UUID,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null
)

data class ChangePasswordCommand(
    val userId: UUID,
    val currentPassword: String,
    val newPassword: String
) {
    init {
        require(currentPassword.isNotBlank()) { "Current password cannot be blank" }
        require(newPassword.isNotBlank()) { "New password cannot be blank" }
        require(currentPassword != newPassword) { "New password must be different from current password" }
    }
}

data class SearchUsersQuery(
    val searchTerm: String? = null,
    val role: UserRole? = null,
    val isActive: Boolean? = null,
    val pageable: Pageable = Pageable.unpaged()
)
```

### Validation Services
Create dedicated validation services:

```kotlin
@Component
class PasswordValidator {
    
    fun isStrong(password: String): Boolean {
        return password.length >= 8 &&
                password.contains(Regex("[A-Z]")) &&
                password.contains(Regex("[a-z]")) &&
                password.contains(Regex("\\d")) &&
                password.contains(Regex("[!@#$%^&*(),.?\":{}|<>]"))
    }
    
    fun getStrengthRequirements(): List<String> {
        return listOf(
            "最低8文字以上",
            "英大文字を含む",
            "英小文字を含む",
            "数字を含む",
            "特殊文字を含む"
        )
    }
}

@Component
class EmailValidator {
    
    private val emailPattern = Regex("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$")
    
    fun isValid(email: String): Boolean {
        return email.matches(emailPattern)
    }
}
```

## Integration Points

### Repository Layer Integration
- Use UserRepository for data persistence
- Handle repository exceptions and convert to business exceptions
- Implement proper transaction management

### Security Integration
- Password encoding with BCrypt
- Role-based authorization checks
- Audit logging for compliance
- Multi-tenant context awareness

### External Service Integration
- Email service for user notifications
- Audit service for compliance logging
- Tenant context for multi-tenancy

## Implementation Steps

1. **Create Command and Query Objects** (1 hour)
   - Define all command and query data classes
   - Add validation annotations and constraints
   - Create result types for use cases

2. **Implement Core User Service** (3 hours)
   - User creation with validation
   - Profile update functionality
   - Password management operations
   - Business rule validation

3. **Create Use Case Implementations** (2 hours)
   - Individual use cases for each operation
   - Error handling and result mapping
   - Integration with core service

4. **Implement Validation Services** (1 hour)
   - Password strength validation
   - Email format validation
   - Business rule validation

5. **Testing and Integration** (1 hour)
   - Unit tests for all service methods
   - Integration tests with repository layer
   - Validation testing

## Testing Requirements

### Unit Tests
```kotlin
@ExtendWith(MockKExtension::class)
class UserServiceTest {
    
    @Test
    fun `should create user with valid data`() {
        // Test user creation
    }
    
    @Test
    fun `should throw exception for duplicate email`() {
        // Test email uniqueness validation
    }
    
    @Test
    fun `should validate password strength`() {
        // Test password validation
    }
    
    @Test
    fun `should update user profile with validation`() {
        // Test profile update
    }
}
```

### Integration Tests
```kotlin
@SpringBootTest
@Testcontainers
class UserServiceIntegrationTest {
    
    @Test
    fun `should complete user lifecycle operations`() {
        // Test complete user management flow
    }
    
    @Test
    fun `should enforce multi-tenant isolation`() {
        // Test tenant separation
    }
}
```

## Success Criteria

- [ ] User creation works with proper validation
- [ ] User profile updates maintain data integrity
- [ ] Password management follows security best practices
- [ ] Role assignments respect permission hierarchy
- [ ] Multi-tenant isolation enforced in all operations
- [ ] Audit logging captures all user management events
- [ ] Business rules properly validated
- [ ] Unit tests achieve >95% coverage
- [ ] Integration tests verify complete workflows
- [ ] Performance targets met (<100ms for CRUD operations)

## Security Considerations

### Legal Practice Requirements
- Attorney-client privilege: No confidential data in user profiles
- Multi-tenant isolation: Users cannot access other tenants
- Audit compliance: All user operations logged
- Role hierarchy: Proper permission checks for role assignments

### Security Best Practices
- Password hashing with BCrypt (cost factor 12)
- Input validation and sanitization
- SQL injection prevention through parameterized queries
- Authorization checks for all operations
- Secure error messages without information disclosure

## Performance Considerations

- Database query optimization for user searches
- Efficient pagination for large user lists
- Connection pooling for database operations
- Input validation caching where appropriate
- Bulk operations for multiple user updates

## Files to Create/Modify

- `backend/modules/auth/application/service/UserService.kt`
- `backend/modules/auth/application/usecase/CreateUserUseCase.kt`
- `backend/modules/auth/application/usecase/UpdateUserProfileUseCase.kt`
- `backend/modules/auth/application/usecase/ChangePasswordUseCase.kt`
- `backend/modules/auth/application/command/CreateUserCommand.kt`
- `backend/modules/auth/application/command/UpdateUserProfileCommand.kt`
- `backend/modules/auth/application/command/ChangePasswordCommand.kt`
- `backend/modules/auth/application/query/SearchUsersQuery.kt`
- `backend/modules/auth/application/validation/PasswordValidator.kt`
- `backend/modules/auth/application/validation/EmailValidator.kt`

## Architectural References

### Clean Architecture Guidelines
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md`
- **Relevance**: User service must implement Clean Architecture application layer with business logic properly separated from external concerns
- **Key Guidance**: Place business logic in application services, implement use cases following CQRS patterns, create command/query objects for type safety, maintain transaction boundaries at service level

### Legal Domain Security Requirements  
- **Reference**: `CLAUDE.md` - Legal Domain Implementation Checklist
- **Relevance**: User management must enforce legal practice business rules including role hierarchies and compliance audit logging
- **Key Guidance**: Implement lawyer > clerk > client role hierarchy validation, ensure password policies meet legal data protection standards, log all user management operations for compliance

### Technology Stack Standards
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md` - Technology Stack section
- **Relevance**: Service layer must use Spring framework patterns with proper validation, transaction management, and security integration
- **Key Guidance**: Use Spring @Service and @Transactional annotations, implement comprehensive input validation, integrate with Spring Security for password encoding

## Related Tasks

- T04_S01_User_Entity_Repository_Layer
- T03_S01_Authentication_API_Endpoints
- T06_S01_RBAC_System_Implementation

---

**Note**: This service layer contains critical business logic for user management. Ensure comprehensive testing and security review before integration with API layer.