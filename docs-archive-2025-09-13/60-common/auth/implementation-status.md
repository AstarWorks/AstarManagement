# 権限システム再設計 - 実装状況

## 完了した作業

### Phase 1: 設計ドキュメント作成 ✅
- permission-system-redesign.md - 全体設計
- resource-group-architecture.md - ResourceGroup設計
- scope-hierarchy-design.md - スコープ階層設計
- migration-guide.md - 移行ガイド
- permission-model-cleanup.md - 概念統一

### Phase 2: Domain Model層 ✅
- ✅ Scope.kt - RESOURCE_GROUP, RESOURCE_ID追加
- ✅ Action.kt - EXPORT, IMPORT追加、String処理削除
- ✅ ResourceType.kt - RECORD, TENANT等追加
- ✅ PermissionRule.kt - 3種類のルール実装（GeneralRule, ResourceGroupRule, ResourceIdRule）
- ✅ ResourceGroup.kt - 新規作成
- ✅ ResourceGroupMembership.kt - 新規作成
- ✅ ResourceGroupPermission.kt - 新規作成
- ✅ RolePermission.kt - PermissionRuleオブジェクト使用
- ✅ AuthenticatedUserContext.kt - 型安全メソッド追加

### Phase 3: Mapper層 ✅
- ✅ RolePermissionMapper.kt - String ↔ PermissionRule変換を担当
- 醜悪String処理メソッドをすべて削除
- toDatabaseString()/fromDatabaseString()のみ残存

### Phase 4: Persistence層 ✅
- ✅ ResourceGroupTable.kt - 新規Entity作成
- ✅ ResourceGroupMembershipTable.kt - 新規Entity作成
- ✅ ResourceGroupPermissionTable.kt - 新規Entity作成
- ✅ RolePermissionTable.kt - コメント更新
- ✅ V018__Add_resource_groups.sql - マイグレーション作成

### Phase 5: Repository層 ✅
- ✅ RolePermissionRepository.kt - PermissionRuleベースに変更
- String版メソッドをすべて削除
- 型安全なenum版メソッドに置き換え

## 残作業

### コンパイルエラー修正（多数）
主なエラー箇所：
1. **AuthorizationService.kt**
   - SpecificRule参照を新しいルール型に修正
   - when式の網羅性修正（ResourceGroupRule, ResourceIdRule追加）

2. **RolePermissionService.kt**
   - String版パラメータをPermissionRuleに変更
   - isValidPermissionRule()呼び出し削除
   - Repository呼び出しの修正

3. **PermissionService.kt**
   - RolePermissionMapping参照削除
   - toAuthorityString()呼び出し削除

4. **RolePermissionController.kt**
   - parseRule()、isWildcard()等の削除されたメソッド参照修正

### 削除されたもの
- ResourceReference.kt（既に削除済み）
- String版のpermission処理メソッド多数
- ワイルドカード関連の全メソッド

## 重要な変更点

### ビジネスロジックでの文字列排除
- **Before**: `permission: String = "table.edit.all"`
- **After**: `permission: PermissionRule.GeneralRule(TABLE, EDIT, ALL)`

### データベース保存形式
```
# 従来形式も維持
table.edit.all
document.view.team

# 新形式追加
table.edit.resource_group:123e4567-e89b-12d3-a456-426614174000
document.delete.resource_id:987f6543-e21b-12d3-a456-426614174000
```

### Mapper層での変換
```kotlin
// データベース → ドメイン
val rule = PermissionRule.fromDatabaseString(entity.permissionRule)

// ドメイン → データベース  
val dbString = rule.toDatabaseString()
```

## 次のステップ
1. Service層のコンパイルエラー修正（推定100箇所以上）
2. Controller層の権限アノテーション修正
3. 統合テストの実装
4. パフォーマンステスト