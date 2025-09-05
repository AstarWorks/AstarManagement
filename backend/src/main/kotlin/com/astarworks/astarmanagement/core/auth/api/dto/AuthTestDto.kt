package com.astarworks.astarmanagement.core.auth.api.dto

import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.UUID

/**
 * 認証テスト用の型安全なレスポンスDTO。
 * Map<String, Any>を完全に排除し、PermissionRuleベースの型安全設計を実現。
 * 
 * 既存のRoleResponseを活用し、重複DTOを作らない設計思想に従う。
 */

/**
 * テスト結果の状態を表すEnum。
 * 型安全性を確保し、文字列の代わりに明確な状態を定義。
 */
@Serializable
enum class TestResult {
    SUCCESS,
    FAILED,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND
}

/**
 * 基本的な認証テストのレスポンスDTO。
 * ロールベースのテスト用。
 * 既存のRoleResponseを活用し、型安全性を保証。
 */
@Serializable
data class AuthTestResponse(
    val message: String,
    val endpoint: String,
    val userRoles: List<RoleResponse>,
    val userId: String,
    val testResult: TestResult
)

/**
 * 権限ベースの認証テストレスポンスDTO。
 * PermissionRuleを活用した型安全な権限情報を提供。
 */
@Serializable
data class PermissionTestResponse(
    val message: String,
    val endpoint: String,
    val requiredPermission: PermissionRule,
    val userPermissions: List<PermissionRule>,
    val hasRequiredPermission: Boolean,
    val userId: String,
    val testResult: TestResult
)

/**
 * ハイブリッド認証テスト（ロール+権限）のレスポンスDTO。
 */
@Serializable
data class HybridAuthTestResponse(
    val message: String,
    val endpoint: String,
    val authMethod: String,
    val userRoles: List<RoleResponse>,
    val userPermissions: List<PermissionRule>,
    val userId: String,
    val testResult: TestResult
)

/**
 * 複数権限チェックのレスポンスDTO。
 * anyViewなどの複数の権限オプションがあるテスト用。
 */
@Serializable
data class MultiPermissionTestResponse(
    val message: String,
    val endpoint: String,
    val requiredPermissions: List<PermissionRule>,
    val userPermissions: List<PermissionRule>,
    val matchedPermissions: List<PermissionRule>,
    val hasAnyRequiredPermission: Boolean,
    val userId: String,
    val testResult: TestResult
)

/**
 * 公開エンドポイント用のレスポンスDTO。
 * 認証不要のエンドポイント用。
 */
@Serializable
data class PublicTestResponse(
    val message: String,
    val endpoint: String,
    val testResult: TestResult
)

/**
 * 認証済みエンドポイント用のレスポンスDTO。
 * 特定の権限は不要だが認証は必要なエンドポイント用。
 */
@Serializable
data class AuthenticatedTestResponse(
    val message: String,
    val endpoint: String,
    val userRoles: List<RoleResponse>,
    val userPermissions: List<PermissionRule>,
    val userId: String,
    val testResult: TestResult
)