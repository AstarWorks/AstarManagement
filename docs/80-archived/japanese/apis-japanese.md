# api-japanese

**インターフェース（API）指針**

* レイヤ分割

    * クライアント ↔ **REST API (OpenAPI/JSON)** :

        * HTTP/1.1 もしくは HTTP/2 上での JSON エンコード
        * Swagger / OpenAPI 自動生成ドキュメントを提供し、Web・デスクトップ・モバイルのクロスプラットフォーム互換性を担保
        * tRPC や gRPC‑Web は将来的な拡張候補とし、初期リリースでは採用しない
    * **BFF (Backend‑for‑Frontend) オプション** :

        * UI 統合やキャッシュが必要な場合にのみ配置し、REST API を集約／最適化
    * BFF ↔ **マイクロサービス群** :

        * API スタイル: gRPC (Protocol Buffers) over HTTP/2
        * メッセージ仕様: proto IDL で厳格バージョニング (`v1.X`)
    * **非同期イベント** :

        * NATS JetStream / Apache Kafka + Protobuf エンコード
        * 主要ドメインイベント: `DocumentIngested`, `MatterStageChanged`, `MemoCreated`, `ExpenseLogged`


#### REST API エンドポイント一覧 (ドラフト)

* **認証／ユーザ管理**

    * `POST   /auth/login` – 認証、JWT 発行
    * `POST   /auth/refresh` – アクセストークン更新
    * `POST   /auth/logout` – セッション終了
    * `GET    /users` – ユーザ一覧取得
    * `POST   /users` – ユーザ作成
    * `GET    /users/{userId}` – ユーザ詳細
    * `PATCH  /users/{userId}` – ユーザ更新
    * `DELETE /users/{userId}` – ユーザ削除

* **事件／進捗 (Matter)**

    * `GET    /matters` – 事件一覧
    * `POST   /matters` – 新規事件登録
    * `GET    /matters/{matterId}` – 事件詳細
    * `PATCH  /matters/{matterId}` – 事件更新
    * `DELETE /matters/{matterId}` – 事件削除
    * `GET    /matters/{matterId}/stages` – ステージ履歴
    * `POST   /matters/{matterId}/stages` – ステージ追加

* **ドキュメント**

    * `POST   /documents` – ファイルアップロード (multipart または Pre‑signed URL 返却)
    * `GET    /documents/{docId}` – メタデータ取得
    * `GET    /documents/{docId}/content` – ファイルダウンロード／PDF 取得
    * `DELETE /documents/{docId}` – 削除
    * `GET    /documents?matterId=&tag=` – クエリ検索

* **OCR／取込ジョブ**

    * `POST   /ingest/jobs` – NAS / スキャナー取込ジョブ登録
    * `GET    /ingest/jobs/{jobId}` – ジョブステータス

* **検索**

    * `GET    /search` – パラメータ: `q=`, `topK=`, `vec=true`

* **メモ (依頼者／社内)**

    * `GET    /memos?matterId=` – メモ一覧
    * `POST   /memos` – メモ追加
    * `GET    /memos/{memoId}` – メモ詳細
    * `PATCH  /memos/{memoId}` – メモ更新
    * `DELETE /memos/{memoId}` – メモ削除

* **実費・日当 (Expenses)**

    * `GET    /expenses?matterId=&month=` – 一覧／フィルタ
    * `POST   /expenses` – 登録
    * `GET    /expenses/{expenseId}` – 詳細
    * `PATCH  /expenses/{expenseId}` – 更新
    * `DELETE /expenses/{expenseId}` – 削除

* **テンプレート／文書生成**

    * `GET    /templates` – テンプレ一覧
    * `POST   /templates` – 新規テンプレ登録
    * `GET    /templates/{templateId}` – 詳細
    * `PATCH  /templates/{templateId}` – 更新
    * `POST   /templates/{templateId}/generate` – ドキュメント生成

* **通知**

    * `GET    /notifications` – 通知一覧
    * `POST   /notifications/test` – テスト送信
    * `PATCH  /notifications/{id}/read` – 既読化

* **監査ログ**

    * `GET    /audit-logs` – 検索／ダウンロード (CSV)

> **備考**: エンドポイント設計は OpenAPI 3.1 に準拠して定義し、HTTP ステータスおよび JSON\:API 形式でエラー応答を返却する予定。
