package com.astarworks.astarmanagement.core.auth.domain.model

/**
 * Business roles enum for authorization.
 * Maps from Auth0 roles to internal business roles.
 * 
 * @deprecated MVP期の仮実装。今後DynamicRoleへ移行予定。
 *            新規機能ではDynamicRoleを使用してください。
 */
@Deprecated(
    message = "MVP期の仮実装。DynamicRoleへ移行してください",
    replaceWith = ReplaceWith("DynamicRole", "com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole")
)
enum class Role {
    ADMIN,
    USER,
    VIEWER
}