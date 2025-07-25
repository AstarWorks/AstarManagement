# T04_S01 - User Entity & Repository Layer

## Task Overview
**Duration**: 6 hours  
**Priority**: High  
**Dependencies**: T01_S01_Spring_Security_Configuration  
**Sprint**: S01_M001_BACKEND_AUTH  

## Objective
Implement the User entity and data access layer following Clean Architecture principles, providing secure and efficient data persistence for user management in the legal practice management system.

## Background
This task implements the foundation for AUTH-003 (User Management API) by creating the data layer. The implementation must support multi-tenant architecture and provide audit capabilities required for legal practice compliance.

## Technical Requirements

### 1. User Entity
Create JPA entity following established database schema:

**Location**: `backend/modules/auth/infrastructure/persistence/entity/UserEntity.kt`

**Key Features**:
- UUID primary key (aligning with V001 migration)
- Audit fields (created_at, updated_at, created_by, updated_by)
- Multi-tenant support with tenant isolation
- Password hashing integration
- Role and permission relationships

### 2. User Repository
Implement JPA repository with custom queries:

**Location**: `backend/modules/auth/infrastructure/persistence/repository/UserRepositoryImpl.kt`

**Repository Methods**:
- User authentication queries (findByEmail, findByUsername)
- Multi-tenant user queries with row-level security
- User management CRUD operations
- Custom queries for complex user searches

### 3. Domain Model
Create domain representation separate from JPA entity:

**Location**: `backend/modules/auth/domain/model/User.kt`

**Domain Features**:
- Clean domain model without JPA annotations
- Business logic methods
- Value objects for user properties
- Immutable design patterns

### 4. Repository Interface
Define repository contract in domain layer:

**Location**: `backend/modules/auth/domain/repository/UserRepository.kt`

**Interface Definition**:
- Domain-focused method signatures
- No JPA dependencies in domain layer
- Exception handling contracts
- Multi-tenant query specifications

## Implementation Guidance

### User Entity Implementation
Follow JPA best practices with audit support:

```kotlin
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener::class)
data class UserEntity(
    @Id
    @Column(name = "id", columnDefinition = "UUID")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "username", nullable = false, unique = true, length = 255)
    val username: String,

    @Column(name = "email", nullable = false, unique = true, length = 255)
    val email: String,

    @Column(name = "password_hash", length = 255)
    val passwordHash: String?,

    @Column(name = "first_name", nullable = false, length = 255)
    val firstName: String,

    @Column(name = "last_name", nullable = false, length = 255)
    val lastName: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 50)
    val role: UserRole,

    @Column(name = "is_active", nullable = false)
    val isActive: Boolean = true,

    @Column(name = "last_login_at")
    val lastLoginAt: LocalDateTime?,

    @CreatedDate
    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "created_by")
    val createdBy: UUID?,

    @Column(name = "updated_by")
    val updatedBy: UUID?
) {
    // JPA requires no-arg constructor
    constructor() : this(
        username = "",
        email = "",
        passwordHash = null,
        firstName = "",
        lastName = "",
        role = UserRole.CLIENT
    )
}

enum class UserRole {
    LAWYER, CLERK, CLIENT
}
```

### Repository Implementation with Multi-Tenant Support
Implement custom queries with tenant isolation:

```kotlin
@Repository
class UserRepositoryImpl(
    private val jpaRepository: UserJpaRepository,
    private val entityManager: EntityManager
) : UserRepository {

    override fun findByEmail(email: String): User? {
        return jpaRepository.findByEmailAndIsActiveTrue(email)
            ?.let { mapToDomain(it) }
    }

    override fun findByUsername(username: String): User? {
        return jpaRepository.findByUsernameAndIsActiveTrue(username)
            ?.let { mapToDomain(it) }
    }

    override fun findById(id: UUID): User? {
        return jpaRepository.findByIdAndIsActiveTrue(id)
            ?.let { mapToDomain(it) }
    }

    override fun save(user: User): User {
        val entity = mapToEntity(user)
        val savedEntity = jpaRepository.save(entity)
        return mapToDomain(savedEntity)
    }

    override fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<User> {
        // Multi-tenant query with row-level security
        val query = entityManager.createQuery("""
            SELECT u FROM UserEntity u 
            WHERE u.tenantId = :tenantId 
            AND u.isActive = true
            ORDER BY u.lastName, u.firstName
        """, UserEntity::class.java)
        
        query.setParameter("tenantId", tenantId)
        query.setFirstResult(pageable.offset.toInt())
        query.setMaxResults(pageable.pageSize)
        
        val users = query.resultList.map { mapToDomain(it) }
        val total = countByTenantId(tenantId)
        
        return PageImpl(users, pageable, total)
    }

    private fun mapToDomain(entity: UserEntity): User {
        return User(
            id = entity.id,
            username = entity.username,
            email = entity.email,
            passwordHash = entity.passwordHash,
            firstName = entity.firstName,
            lastName = entity.lastName,
            role = entity.role,
            isActive = entity.isActive,
            lastLoginAt = entity.lastLoginAt,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }

    private fun mapToEntity(user: User): UserEntity {
        return UserEntity(
            id = user.id ?: UUID.randomUUID(),
            username = user.username,
            email = user.email,
            passwordHash = user.passwordHash,
            firstName = user.firstName,
            lastName = user.lastName,
            role = user.role,
            isActive = user.isActive,
            lastLoginAt = user.lastLoginAt
        )
    }
}
```

### Domain Model Implementation
Create clean domain model without infrastructure concerns:

```kotlin
data class User(
    val id: UUID? = null,
    val username: String,
    val email: String,
    val passwordHash: String?,
    val firstName: String,
    val lastName: String,
    val role: UserRole,
    val isActive: Boolean = true,
    val lastLoginAt: LocalDateTime? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun getFullName(): String = "$firstName $lastName"
    
    fun isLawyer(): Boolean = role == UserRole.LAWYER
    
    fun isClerk(): Boolean = role == UserRole.CLERK
    
    fun isClient(): Boolean = role == UserRole.CLIENT
    
    fun hasManagementRole(): Boolean = role in listOf(UserRole.LAWYER, UserRole.CLERK)
    
    fun withUpdatedLoginTime(): User = copy(
        lastLoginAt = LocalDateTime.now(),
        updatedAt = LocalDateTime.now()
    )
    
    fun withHashedPassword(hashedPassword: String): User = copy(
        passwordHash = hashedPassword,
        updatedAt = LocalDateTime.now()
    )
}
```

### Custom UserDetailsService Implementation
Integrate with Spring Security:

```kotlin
@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    @Transactional(readOnly = true)
    override fun loadUserByUsername(username: String): UserDetails {
        val user = userRepository.findByEmail(username)
            ?: userRepository.findByUsername(username)
            ?: throw UsernameNotFoundException("User not found: $username")

        if (!user.isActive) {
            throw DisabledException("User account is disabled: $username")
        }

        return CustomUserDetails(
            userId = user.id!!,
            username = user.username,
            email = user.email,
            password = user.passwordHash ?: "",
            firstName = user.firstName,
            lastName = user.lastName,
            role = user.role,
            authorities = mapRoleToAuthorities(user.role),
            isEnabled = user.isActive,
            lastLoginAt = user.lastLoginAt
        )
    }

    private fun mapRoleToAuthorities(role: UserRole): Collection<GrantedAuthority> {
        return when (role) {
            UserRole.LAWYER -> listOf(
                SimpleGrantedAuthority("ROLE_LAWYER"),
                SimpleGrantedAuthority("ROLE_USER"),
                SimpleGrantedAuthority("PERMISSION_CASE_MANAGE"),
                SimpleGrantedAuthority("PERMISSION_CLIENT_MANAGE"),
                SimpleGrantedAuthority("PERMISSION_FINANCIAL_MANAGE")
            )
            UserRole.CLERK -> listOf(
                SimpleGrantedAuthority("ROLE_CLERK"),
                SimpleGrantedAuthority("ROLE_USER"),
                SimpleGrantedAuthority("PERMISSION_CASE_READ"),
                SimpleGrantedAuthority("PERMISSION_CLIENT_READ")
            )
            UserRole.CLIENT -> listOf(
                SimpleGrantedAuthority("ROLE_CLIENT"),
                SimpleGrantedAuthority("ROLE_USER"),
                SimpleGrantedAuthority("PERMISSION_OWN_CASE_READ")
            )
        }
    }
}
```

## Integration Points

### Database Integration
- Utilizes existing V001 migration (users table)
- Row-level security for multi-tenant isolation
- Optimized queries with proper indexing
- Audit trail integration

### Spring Security Integration
- UserDetailsService implementation
- Password encoding integration
- Authority and role mapping
- Authentication manager integration

### Domain Layer Integration
- Clean separation between domain and infrastructure
- Repository pattern implementation
- Domain model validation
- Business logic encapsulation

## Implementation Steps

1. **Create Domain Model and Repository Interface** (1 hour)
   - `User` domain model with business methods
   - `UserRepository` interface definition
   - Custom exceptions for domain operations

2. **Implement JPA Entity** (1.5 hours)
   - `UserEntity` with proper JPA annotations
   - Audit entity listener configuration
   - Enum mapping for user roles

3. **Create Repository Implementation** (2 hours)
   - `UserRepositoryImpl` with custom queries
   - Multi-tenant query support
   - Entity-domain mapping methods

4. **Implement UserDetailsService** (1 hour)
   - Spring Security integration
   - Authority mapping for roles
   - Error handling for authentication

5. **Testing and Validation** (0.5 hours)
   - Repository integration tests
   - UserDetailsService tests
   - Database query performance tests

## Testing Requirements

### Unit Tests
```kotlin
@ExtendWith(MockKExtension::class)
class UserRepositoryImplTest {
    
    @Test
    fun `should find user by email`() {
        // Test user lookup by email
    }
    
    @Test
    fun `should save user with proper audit fields`() {
        // Test user persistence
    }
    
    @Test
    fun `should support multi-tenant queries`() {
        // Test tenant isolation
    }
}
```

### Integration Tests
```kotlin
@DataJpaTest
@Testcontainers
class UserEntityIntegrationTest {
    
    @Test
    fun `should persist user with all fields`() {
        // Test database persistence
    }
    
    @Test
    fun `should enforce unique constraints`() {
        // Test database constraints
    }
}
```

## Success Criteria

- [ ] User entity persists correctly with audit fields
- [ ] Repository methods work with multi-tenant isolation
- [ ] UserDetailsService integrates with Spring Security
- [ ] Domain model provides business logic methods
- [ ] Database queries perform within targets (<50ms)
- [ ] Unit tests achieve >95% coverage
- [ ] Integration tests verify database operations
- [ ] All JPA operations follow established patterns

## Security Considerations

### Legal Practice Requirements
- Multi-tenant data isolation for law firm separation
- Audit trail for all user data changes
- Secure password storage with BCrypt
- Attorney-client privilege data protection

### Data Security Best Practices
- UUID primary keys prevent enumeration attacks
- Soft delete for data retention compliance
- Row-level security for tenant isolation
- Input validation at domain level

## Performance Considerations

- Database queries optimized with proper indexes
- Connection pooling for repository operations
- Lazy loading for related entities
- Query result caching where appropriate
- Efficient pagination for large user lists

## Files to Create/Modify

- `backend/modules/auth/domain/model/User.kt`
- `backend/modules/auth/domain/repository/UserRepository.kt`
- `backend/modules/auth/infrastructure/persistence/entity/UserEntity.kt`
- `backend/modules/auth/infrastructure/persistence/repository/UserRepositoryImpl.kt`
- `backend/modules/auth/infrastructure/persistence/repository/UserJpaRepository.kt`
- `backend/modules/auth/infrastructure/security/CustomUserDetailsService.kt`
- `backend/modules/auth/infrastructure/security/CustomUserDetails.kt`

## Architectural References

### Clean Architecture Guidelines
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md`
- **Relevance**: User entity and repository must follow Clean Architecture data layer patterns with proper domain/infrastructure separation
- **Key Guidance**: Create domain User model separate from JPA UserEntity, implement Repository interface in domain layer with concrete implementation in infrastructure layer, use proper entity-to-domain mapping

### Legal Domain Security Requirements  
- **Reference**: `CLAUDE.md` - Legal Domain Implementation Checklist
- **Relevance**: User data layer must enforce multi-tenant data isolation and audit logging required for legal practice compliance
- **Key Guidance**: Implement Row Level Security (RLS) for tenant isolation, add audit fields to all user operations, ensure UUID primary keys prevent enumeration attacks

### Technology Stack Standards
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md` - Technology Stack section
- **Relevance**: Repository layer must use JPA with PostgreSQL following established Spring Data patterns and performance optimizations
- **Key Guidance**: Use Spring Data JPA repositories, implement custom queries with JPQL, configure proper database indexing, use Testcontainers for integration testing

## Related Tasks

- T01_S01_Spring_Security_Configuration
- T03_S01_Authentication_API_Endpoints
- T05_S01_User_Service_Business_Logic

---

**Note**: This data layer forms the foundation for all user management operations. Ensure proper testing and performance optimization before integration with service layer.