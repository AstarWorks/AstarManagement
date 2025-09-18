# エディタ機能（ドキュメントサービス）

## 概要
- 法律事務所向けドキュメントをツリー構造で管理する新モジュール。
- 2025-09 時点では平文 CRUD を提供し、暗号化は M2 で導入予定。
- Postgres の `document_nodes` / `document_revisions` / `document_metadata` テーブルを使用。
- 既存のテナント / ワークスペース / RBAC と統合し、`EditorApiResponse` でレスポンスを返却。

## フィーチャートグル
- プロパティ: `app.features.editor.enabled`
  - 既定値（`application.yml`）は `false`。
  - `application-local.yml` では `true` になっており、ローカル実行で自動有効化。
- 有効化方法:
  1. Spring プロファイルに `local` を指定する。
     ```bash
     SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
     ```
  2. もしくは任意プロファイルで環境変数を渡す。
     ```bash
     APP_FEATURES_EDITOR_ENABLED=true ./gradlew bootRun
     ```
- `@ConditionalOnProperty` によりトグルが `true` の時だけ REST コントローラが配備される。

## REST API
エンドポイントは `/api/v1/editor/...` 配下で公開され、すべて `EditorApiResponse` エンベロープを使用する。

### フォルダ
| メソッド | パス | 説明 |
|----------|------|------|
| `POST` | `/api/v1/editor/folders` | フォルダ作成（親フォルダ指定可）。 |
| `PATCH` | `/api/v1/editor/folders/{id}/rename` | タイトル変更。 |
| `PATCH` | `/api/v1/editor/folders/{id}/move` | 親フォルダや並び順の更新。 |
| `PATCH` | `/api/v1/editor/folders/{id}/archive` | アーカイブ / 復元。 |
| `DELETE` | `/api/v1/editor/folders/{id}` | フォルダ削除（再帰）。 |
| `GET` | `/api/v1/editor/folders?workspaceId=...` | 直下ノード一覧（任意でアーカイブ含む）。 |
| `GET` | `/api/v1/editor/folders/{id}/children` | 特定フォルダ配下のノード一覧。 |
| `GET` | `/api/v1/editor/folders/{id}/breadcrumb` | パンくず情報。 |

### ドキュメント
| メソッド | パス | 説明 |
|----------|------|------|
| `POST` | `/api/v1/editor/documents` | ドキュメント作成（初回リビジョンを登録）。 |
| `PUT` | `/api/v1/editor/documents/{id}` | ドキュメント更新（新規リビジョンを生成）。 |
| `GET` | `/api/v1/editor/documents/{id}` | 最新リビジョンを含むドキュメント取得。 |
| `GET` | `/api/v1/editor/documents/{id}/revisions` | リビジョン一覧（メタ情報のみ）。 |
| `DELETE` | `/api/v1/editor/documents/{id}` | ドキュメント削除。 |

### リクエスト例（ローカル Mock 認証利用）
```bash
curl -X POST http://localhost:8080/api/v1/editor/folders \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer MOCK' \
  -H 'X-Tenant-ID: 00000000-0000-0000-0000-000000000001' \
  -d '{
    "workspaceId": "00000000-0000-0000-0000-000000000001",
    "title": "案件資料",
    "position": 1
  }'
```

`EditorApiResponse` の成功レスポンスは以下の形式になる。
```json
{
  "success": true,
  "data": {
    "node": {
      "id": "...",
      "type": "FOLDER",
      "title": "案件資料",
      "path": ".root/案件資料",
      "createdAt": "2025-09-17T10:00:00Z"
    }
  },
  "error": null,
  "timestamp": "2025-09-17T10:00:01Z"
}
```

## 依存関係と内部構成
- `EditorFeatureProperties` (`@ConfigurationProperties`) がトグル値をバインド。
- `EditorDocumentController` / `EditorFolderController` はトグル適用済みで、Spring Security の `hasPermissionRule` を用いて RBAC をチェック。
- `DocumentService` / `FolderService` がトランザクション境界を管理し、JSONB メタデータや楽観ロックを扱う。
- インテグレーションテスト: `EditorControllerIntegrationTest` が MockMvc で CRUD / パンくず / リビジョン動作を検証。

## OpenAPI ドキュメント
- `openapi.json` は `backend/` 直下に出力される。最新化するにはローカル環境で次を実行:
  ```bash
  cd backend
  GRADLE_USER_HOME=~/.gradle ./gradlew generateOpenApiDocs
  ```
  `build.gradle.kts` の `openApi` 設定により、コマンド実行時は `local` プロファイルで起動し、`app.features.editor.enabled=true` が強制される。
- 生成された OpenAPI は `/v3/api-docs`（稼働中のアプリ）またはコミットされた `openapi.json` から確認できる。
- フロントエンドの型更新はバックエンドの OpenAPI 更新後に `cd frontend && bun run openapi:all` を実行。

## 楽観ロックと競合検知
- フォルダ / ドキュメントのレスポンスには `version` が含まれる。更新・移動・アーカイブ・削除時は同じ値をリクエストに含める必要がある（例: `FolderRenameRequest.version`、`DocumentUpdateRequest.nodeVersion`）。
- ドキュメントのメタデータも `metadataVersion` で管理し、本文更新と同時に送信する。値が一致しない場合は `409 EDITOR_CONFLICT` が返り、クライアントは再読み込みして最新の `version` を取得する。
- 競合は `OptimisticLockException` を介して検知され、`error.code` に `EDITOR_CONFLICT` が設定される。

## 今後の予定（M2）
- リビジョン本文の暗号化（DEK/KEK 管理）。
- 検索インデックス用ワーカーと監査イベントの実装。
- API 契約の暗号化メタデータ対応。
