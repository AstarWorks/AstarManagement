# api-english

**Interface (API) Guidelines**

* Layer Separation

  * Client ↔ **REST API (OpenAPI/JSON)** :

    * JSON encoding over HTTP/1.1 or HTTP/2
    * Provide Swagger / OpenAPI auto-generated docs to ensure cross-platform compatibility (web, desktop, mobile)
    * tRPC and gRPC-Web are future options and will **not** be adopted for the initial release
  * **BFF (Backend-for-Frontend) Option** :

    * Deployed only when UI aggregation or caching is required, consolidating and optimizing REST calls
  * BFF ↔ **Microservice Mesh** :

    * API style: gRPC (Protocol Buffers) over HTTP/2
    * Message schema: strictly versioned via proto IDL (`v1.X`)
  * **Asynchronous Events** :

    * NATS JetStream / Apache Kafka with Protobuf payloads
    * Key domain events: `DocumentIngested`, `MatterStageChanged`, `MemoCreated`, `ExpenseLogged`


#### REST API Endpoint List (Draft)

* **Authentication / User Management**

  * `POST   /auth/login` – Authenticate and issue JWT
  * `POST   /auth/refresh` – Refresh access token
  * `POST   /auth/logout` – End session
  * `GET    /users` – List users
  * `POST   /users` – Create user
  * `GET    /users/{userId}` – User details
  * `PATCH  /users/{userId}` – Update user
  * `DELETE /users/{userId}` – Delete user

* **Cases / Progress (Matter)**

  * `GET    /matters` – List matters
  * `POST   /matters` – Create new matter
  * `GET    /matters/{matterId}` – Matter details
  * `PATCH  /matters/{matterId}` – Update matter
  * `DELETE /matters/{matterId}` – Delete matter
  * `GET    /matters/{matterId}/stages` – Stage history
  * `POST   /matters/{matterId}/stages` – Add stage

* **Documents**

  * `POST   /documents` – File upload (multipart or returned pre-signed URL)
  * `GET    /documents/{docId}` – Get metadata
  * `GET    /documents/{docId}/content` – Download file / fetch PDF
  * `DELETE /documents/{docId}` – Delete
  * `GET    /documents?matterId=&tag=` – Query search

* **OCR / Ingestion Jobs**

  * `POST   /ingest/jobs` – Register NAS / scanner ingestion job
  * `GET    /ingest/jobs/{jobId}` – Job status

* **Search**

  * `GET    /search` – Parameters: `q=`, `topK=`, `vec=true`

* **Memos (Client / Internal)**

  * `GET    /memos?matterId=` – List memos
  * `POST   /memos` – Add memo
  * `GET    /memos/{memoId}` – Memo details
  * `PATCH  /memos/{memoId}` – Update memo
  * `DELETE /memos/{memoId}` – Delete memo

* **Expenses / Per-Diem**

  * `GET    /expenses?matterId=&month=` – List / filter
  * `POST   /expenses` – Register
  * `GET    /expenses/{expenseId}` – Details
  * `PATCH  /expenses/{expenseId}` – Update
  * `DELETE /expenses/{expenseId}` – Delete

* **Templates / Document Generation**

  * `GET    /templates` – List templates
  * `POST   /templates` – Register new template
  * `GET    /templates/{templateId}` – Details
  * `PATCH  /templates/{templateId}` – Update
  * `POST   /templates/{templateId}/generate` – Generate document

* **Notifications**

  * `GET    /notifications` – List notifications
  * `POST   /notifications/test` – Send test notification
  * `PATCH  /notifications/{id}/read` – Mark as read

* **Audit Logs**

  * `GET    /audit-logs` – Search / download (CSV)

> **Note**: Endpoint design complies with OpenAPI 3.1. Error responses will follow HTTP status codes and the JSON:API Problem format.
