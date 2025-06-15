# tasks-frontend-english

### Front-End MVP Task List (Next.js + Bun + Tailwind + shadcn/ui)

---

#### 0. Environment Setup

* **0-1**: Generate `apps/web` with `bunx create-next-app`  
* **0-2**: Configure Tailwind CSS (`tailwind.config.ts`, `globals.css`)  
* **0-3**: Install shadcn/ui & generate dark theme  
* **0-4**: Apply ESLint / Prettier / Husky presets  
* **0-5**: Initialize Vitest & Playwright  

---

#### 1. Auth & RBAC

* **1-1**: Integrate NextAuth.js with Keycloak OIDC provider  
* **1-2**: Extract `roles` from JWT into React Context  
* **1-3**: RBAC HOC/Hook  

    * Implement `<Can roles={['LAWYER']}> ... </Can>`
* **1-4**: `/login` page (SSO redirect)  

---

#### 2. Routing & Layout

* **2-1**: Public layout → `/login`  
* **2-2**: Protected layout → `/dashboard`, `/matters/[id]`  
* **2-3**: Global navigation (sidebar + top-bar)  
* **2-4**: Dark-mode toggle & i18n language switcher  

---

#### 3. Progress Kanban (Dashboard)

* **3-1**: Kanban columns/cards UI (shadcn Card × React-DnD)  
* **3-2**: GET `/matters` → load column data  
* **3-3**: PATCH `/matters/{id}/stages` on drag-and-drop  
* **3-4**: Display KPI badge & due-date indicators  

---

#### 4. Matter Creation & Detail Page

* **4-1**: Matter registration form (react-hook-form + Zod)  
* **4-2**: Detail tabs (Overview / Documents / Memo / Expenses)  
* **4-3**: Edit dialog → PATCH `/matters/{id}`  

---

#### 5. Document Features

* **5-1**: File upload  

    * POST `/documents` → PUT pre-signed URL
* **5-2**: PDF viewer (`pdfjs-dist` dynamic import)  
* **5-3**: Document list table (inside Matter)  

---

#### 6. Memo & Expense UI

* **6-1**: Memo list + new-memo modal (`/memos` CRUD)  
* **6-2**: Expense table + add dialog (`/expenses` CRUD)  
* **6-3**: CSV export (`papaparse`)  

---

#### 7. Search Bar

* **7-1**: Full-text search input in header  
* **7-2**: Call GET `/search?q=` & render results list  
* **7-3**: Click result → navigate to Matter / Document  

---

#### 8. Notification UI

* **8-1**: Notification bell & unread badge  
* **8-2**: Dropdown list from `/notifications`  
* **8-3**: Deep-link to target resource on click  

---

#### 9. i18n Foundation

* **9-1**: Introduce `next-intl` or `next-i18next`  
* **9-2**: Create `ja` / `en` JSON message files  
* **9-3**: Embed locale switcher & route handling  

---

#### 10. Testing

* **10-1**: Vitest unit tests (RBAC hook, utils)  
* **10-2**: Playwright component tests (forms, Kanban)  
* **10-3**: Playwright E2E:  

    1. Login → 2. Create matter → 3. Upload doc → 4. Move Kanban card  

---

#### 11. CI Integration

* **11-1**: GitHub Actions job: `bun test` + headless Playwright  
* **11-2**: Lint / Prettier check job  
* **11-3**: Build `web` & upload artifacts  

---

> **MVP Completion Criteria (Front-end)**  
> Tasks 0–8 function correctly, and tasks 9–11 pass CI quality gates (all green).
