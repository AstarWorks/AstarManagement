# API ガイドライン（REST / OpenAPI 3.1）

> **目的**：フロントエンド開発者・バックエンド開発者・AI コードジェネレーターが一貫した API を設計・実装・利用できるよう、命名・バージョニング・エラーハンドリング等の共通ルールを定義する。

---

## 1. 基本方針

* **アーキテクチャ**：JSON over HTTP/1.1 または HTTP/2。
* **仕様書**：`openapi.yaml`（OpenAPI 3.1）が単一のソースオブトゥルース。
* **エンコード**：`Content-Type: application/json; charset=utf-8`。
* **認証**：`Authorization: Bearer <JWT>`（Keycloak OIDC）。
* **i18n**：`Accept-Language: ja|en` ヘッダを受理。

## 2. エンドポイント命名

| ルール                    | 例                            |
| ---------------------- | ---------------------------- |
| 名詞（複数形）を URI に使用       | `/matters`, `/documents`     |
| 階層構造は 2 レベルまで          | `/matters/{matterId}/stages` |
| 動作は HTTP メソッドで表現       | `POST /documents` アップロード     |
| 管理系は `/admin/*` プレフィクス | `/admin/users`               |

## 3. バージョニング

* パスプレフィクス：`/v1/…`。
* 破壊的変更時のみ `/v2/` を追加。旧バージョンは 6 か月維持。
* ヘッダバージョン（`X-Api-Version`）は使用しない。

## 4. ページネーション・フィルタ

* ページネーション：`GET /matters?page=0&size=20&sort=createdAt,desc`。
* フィルタ：`GET /documents?matterId=123&tag=contract`（AND 接続）。
* レスポンスは以下メタを含む：

```jsonc
{
  "data": [ … ],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 145,
    "totalPages": 8
  }
}
```

## 5. 日付・時刻フォーマット

* **ISO‑8601** 拡張：`2025-06-15T13:45:30+09:00`。
* DB は `timestamptz`、フロントはローカルタイムで表示。

## 6. エラーハンドリング (RFC 7807 / Problem+JSON)

| フィールド      | 型      | 説明                                |
| ---------- | ------ | --------------------------------- |
| `type`     | string | エラー種類 URI（例：`/errors/validation`） |
| `title`    | string | 簡単な説明                             |
| `status`   | int    | HTTP ステータス                        |
| `detail`   | string | 人間向け詳細                            |
| `instance` | string | 発生リソース URI                        |
| `errors`   | array  | フィールド単位の詳細 (任意)                   |

例：

```jsonc
{
  "type": "/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "detail": "amount must be positive",
  "errors": [
    { "field": "amount", "message": "must be > 0" }
  ]
}
```

## 7. 冪等性・リトライ

* 作成系（POST）で再送が起き得る場合、`Idempotency-Key` ヘッダを受け付け、キーごとに 24h 冪等保証。
* クライアントリトライは指数バックオフ（最大 3 回）。

## 8. セキュリティヘッダ

| ヘッダ                         | 値                                     | 備考           |
| --------------------------- | ------------------------------------- | ------------ |
| `X-Frame-Options`           | `DENY`                                | クリックジャッキング防止 |
| `Content-Security-Policy`   | `default-src 'self'`                  | 必要に応じて調整     |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | TLS 強制       |

## 9. 例外的な設計パターン

* **大容量ファイル**：`POST /documents` → サーバがプリサインド URL を返却し、クライアントが直接 PUT。
* **長時間ジョブ**：`202 Accepted` + `Location: /jobs/{id}`。
* **WebSocket チャネル**：リアルタイム通知は `/ws/notifications`。

## 10. テスト契約

* **Buf Breaking Check**：gRPC → REST 移行時の破壊的変更検知。
* **OpenAPI Lint**：Spectral でスキーマ違反を CI で検出。
* **Pact**：フロント ↔ API の契約テストを実行。

---

\*最終更新: 2025-06-15（OpenAI o3）
