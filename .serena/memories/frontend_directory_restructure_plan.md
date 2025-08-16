# Frontend Directory Restructure Plan

## 完全なディレクトリツリー（新構造）

```
frontend/
├── app/
│   ├── modules/                    # ビジネスドメイン層
│   │   ├── auth/                   # 認証機能
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.vue
│   │   │   │   ├── AuthFormHeader.vue
│   │   │   │   ├── AuthFormFooter.vue
│   │   │   │   └── DevelopmentDebugPanel.vue
│   │   │   ├── composables/
│   │   │   │   ├── useLoginForm.ts
│   │   │   │   ├── useAuthFormEnhancements.ts
│   │   │   │   ├── useAuthFormFocus.ts
│   │   │   │   ├── useAuthFormFooter.ts
│   │   │   │   ├── usePermissions.ts
│   │   │   │   ├── useSecurityAudit.ts
│   │   │   │   ├── useTokenManager.ts
│   │   │   │   └── useUnauthorizedError.ts
│   │   │   ├── services/
│   │   │   │   ├── authService.ts
│   │   │   │   └── mockAuth.ts
│   │   │   ├── stores/
│   │   │   │   └── auth.ts
│   │   │   ├── types/
│   │   │   │   └── auth.ts
│   │   │   └── tests/
│   │   │       └── LoginForm.stories.ts
│   │   ├── expense/                # 経費管理機能
│   │   │   ├── components/
│   │   │   │   ├── detail/
│   │   │   │   │   ├── ExpenseDetailView.vue
│   │   │   │   │   ├── ExpenseDetailHeader.vue
│   │   │   │   │   ├── ExpenseDetailSkeleton.vue
│   │   │   │   │   ├── ExpenseBasicInfoCard.vue
│   │   │   │   │   ├── ExpenseAttachmentsCard.vue
│   │   │   │   │   ├── ExpenseAuditInfoCard.vue
│   │   │   │   │   ├── ExpenseCaseInfoCard.vue
│   │   │   │   │   ├── ExpenseMemoCard.vue
│   │   │   │   │   └── ExpenseTagsCard.vue
│   │   │   │   ├── form/
│   │   │   │   │   ├── ExpenseForm.vue
│   │   │   │   │   ├── ExpenseBasicInfoStep.vue
│   │   │   │   │   ├── ExpenseAmountStep.vue
│   │   │   │   │   ├── ExpenseAdditionalInfoStep.vue
│   │   │   │   │   ├── ExpenseDeleteDialog.vue
│   │   │   │   │   ├── ExpenseFormNavigation.vue
│   │   │   │   │   ├── ExpenseFormErrorDisplay.vue
│   │   │   │   │   ├── StepProgressIndicator.vue
│   │   │   │   │   ├── ExpenseCaseSelector.vue
│   │   │   │   │   ├── ExpenseMemoInput.vue
│   │   │   │   │   ├── ExpenseTagSelector.vue
│   │   │   │   │   └── ExpenseAdditionalInfoSummary.vue
│   │   │   │   ├── list/
│   │   │   │   │   ├── ExpenseDataTable.vue
│   │   │   │   │   ├── ExpenseDataTableContainer.vue
│   │   │   │   │   ├── ExpenseDataTableMobile.vue
│   │   │   │   │   ├── ExpenseFilters.vue
│   │   │   │   │   ├── ExpenseFiltersContainer.vue
│   │   │   │   │   ├── BasicFilters.vue
│   │   │   │   │   ├── AdvancedFilters.vue
│   │   │   │   │   ├── QuickDateFilters.vue
│   │   │   │   │   ├── ActiveFiltersSummary.vue
│   │   │   │   │   ├── FilterStatistics.vue
│   │   │   │   │   ├── ExpenseListItem.vue
│   │   │   │   │   ├── ExpenseListItemActions.vue
│   │   │   │   │   ├── ExpenseTableRow.vue
│   │   │   │   │   ├── ExpenseTableHeader.vue
│   │   │   │   │   ├── ExpenseTableToolbar.vue
│   │   │   │   │   ├── ExpenseTableEmpty.vue
│   │   │   │   │   ├── ExpensePagination.vue
│   │   │   │   │   ├── ExpensePaginationContainer.vue
│   │   │   │   │   ├── ExpensePaginationDesktop.vue
│   │   │   │   │   ├── ExpensePaginationMobile.vue
│   │   │   │   │   ├── ExpensePaginationSummary.vue
│   │   │   │   │   ├── VirtualExpenseList.vue
│   │   │   │   │   ├── VirtualExpenseListV2.vue
│   │   │   │   │   ├── ConflictResolutionDialog.vue
│   │   │   │   │   ├── ExpenseFormFields.vue
│   │   │   │   │   └── columns.ts
│   │   │   │   └── shared/
│   │   │   │       └── states/
│   │   │   │           ├── ExpenseEmptyState.vue
│   │   │   │           ├── ExpenseListSkeleton.vue
│   │   │   │           └── index.ts
│   │   │   ├── composables/
│   │   │   │   ├── form/
│   │   │   │   │   ├── useExpenseForm.ts
│   │   │   │   │   ├── useExpenseFormSteps.ts
│   │   │   │   │   ├── useExpenseFormDraft.ts
│   │   │   │   │   ├── useExpenseFormErrorHandling.ts
│   │   │   │   │   └── useExpenseAmountStep.ts
│   │   │   │   ├── list/
│   │   │   │   │   ├── useExpenseData.ts
│   │   │   │   │   ├── useExpenseFilters.ts
│   │   │   │   │   ├── useExpenseListBehavior.ts
│   │   │   │   │   └── useVirtualExpenseList.ts
│   │   │   │   ├── actions/
│   │   │   │   │   ├── useExpenseActions.ts
│   │   │   │   │   ├── useExpenseNavigation.ts
│   │   │   │   │   └── useExpenseDelete.ts
│   │   │   │   └── shared/
│   │   │   │       ├── useExpenseCalculations.ts
│   │   │   │       ├── useExpenseFormatters.ts
│   │   │   │       ├── useExpenseAttachments.ts
│   │   │   │       ├── useExpenseCases.ts
│   │   │   │       ├── useExpenseTags.ts
│   │   │   │       ├── useExpenseRouting.ts
│   │   │   │       └── useExpenseCategories.ts
│   │   │   ├── services/
│   │   │   │   └── mockExpenseDataService.ts
│   │   │   ├── stores/
│   │   │   │   └── expense.ts (新規作成予定)
│   │   │   ├── types/
│   │   │   │   ├── expense.ts
│   │   │   │   └── expense/
│   │   │   │       ├── api.ts
│   │   │   │       ├── attachment.ts
│   │   │   │       ├── expense.ts
│   │   │   │       ├── tag.ts
│   │   │   │       └── index.ts
│   │   │   └── tests/
│   │   │       ├── expenseFiltering.test.ts
│   │   │       ├── expensePaginationIntegration.test.ts
│   │   │       ├── ExpenseDataTableContainer.test.ts
│   │   │       └── ExpenseDataTableContainer.stories.ts
│   │   └── case/                   # 案件管理機能
│   │       ├── components/
│   │       │   ├── detail/
│   │       │   │   ├── CaseBasicInfo.vue
│   │       │   │   ├── CaseDetailOverview.vue
│   │       │   │   ├── CaseDetailPlaceholder.vue
│   │       │   │   ├── CaseProgressInfo.vue
│   │       │   │   └── CaseDescription.vue
│   │       │   ├── display/
│   │       │   │   ├── CaseCardView.vue
│   │       │   │   ├── CaseCardContainer.vue
│   │       │   │   ├── CaseCardInteractive.vue
│   │       │   │   ├── CaseCardDraggable.vue
│   │       │   │   ├── CaseCardMetadata.vue
│   │       │   │   ├── CaseCardActions.vue
│   │       │   │   ├── CaseCardSkeleton.vue
│   │       │   │   └── CaseDetailModal.vue
│   │       │   ├── layout/
│   │       │   │   ├── KanbanColumn.vue
│   │       │   │   ├── KanbanColumnHeader.vue
│   │       │   │   ├── KanbanColumnContent.vue
│   │       │   │   ├── KanbanColumnFooter.vue
│   │       │   │   ├── KanbanDropZone.vue
│   │       │   │   ├── KanbanFilters.vue
│   │       │   │   ├── BasicFilters.vue
│   │       │   │   ├── AdvancedFilters.vue
│   │       │   │   └── ActiveFiltersSummary.vue
│   │       │   └── ui/
│   │       │       ├── CasePriorityBadge.vue
│   │       │       ├── CaseProgressIndicator.vue
│   │       │       ├── CaseTag.vue
│   │       │       ├── ClientTypeBadge.vue
│   │       │       └── DueDateAlert.vue
│   │       ├── composables/
│   │       │   ├── useCaseData.ts
│   │       │   ├── useCaseFilters.ts
│   │       │   ├── useCaseModal.ts
│   │       │   ├── useCaseFormatting.ts
│   │       │   ├── useCaseDragDrop.ts
│   │       │   └── useCaseDragDropEnhanced.ts
│   │       ├── stores/
│   │       │   └── case.ts (新規作成予定)
│   │       ├── types/
│   │       │   └── case.ts
│   │       └── tests/
│   │           ├── CaseTypes.test.ts
│   │           └── CaseCard.test.ts.disabled
│   ├── foundation/                 # 基盤層
│   │   ├── ui/                    # デザインシステム
│   │   │   ├── alert/
│   │   │   ├── avatar/
│   │   │   ├── badge/
│   │   │   ├── breadcrumb/
│   │   │   ├── button/
│   │   │   ├── calendar/
│   │   │   ├── card/
│   │   │   ├── checkbox/
│   │   │   ├── collapsible/
│   │   │   ├── command/
│   │   │   ├── data-table/
│   │   │   ├── dialog/
│   │   │   ├── dropdown-menu/
│   │   │   ├── form/
│   │   │   ├── input/
│   │   │   ├── label/
│   │   │   ├── language-switcher/
│   │   │   ├── navigation-menu/
│   │   │   ├── pagination/
│   │   │   ├── password-input/
│   │   │   ├── popover/
│   │   │   ├── radio-group/
│   │   │   ├── scroll-area/
│   │   │   ├── select/
│   │   │   ├── separator/
│   │   │   ├── sheet/
│   │   │   ├── skeleton/
│   │   │   ├── sonner/
│   │   │   ├── table/
│   │   │   ├── tabs/
│   │   │   ├── textarea/
│   │   │   ├── toggle/
│   │   │   ├── toggle-group/
│   │   │   ├── tooltip/
│   │   │   └── virtual-list/
│   │   ├── api/                   # API通信層
│   │   │   ├── useApi.ts
│   │   │   ├── useApiAuth.ts
│   │   │   ├── useAsyncData.ts
│   │   │   └── useMockExpenseApi.ts
│   │   ├── stores/                # グローバル状態管理
│   │   │   ├── auth.ts
│   │   │   ├── ui.ts
│   │   │   └── navigation.ts
│   │   ├── composables/           # 基盤Composables
│   │   │   ├── table/
│   │   │   │   ├── usePagination.ts
│   │   │   │   ├── useTableColumns.ts
│   │   │   │   ├── useTablePagination.ts
│   │   │   │   ├── useTablePersistence.ts
│   │   │   │   ├── useTableSelection.ts
│   │   │   │   ├── useTableSorting.ts
│   │   │   │   └── useVirtualScrolling.ts
│   │   │   ├── form/
│   │   │   │   ├── useFormDirtyState.ts
│   │   │   │   ├── useFormNavigationGuards.ts
│   │   │   │   ├── useFormSubmission.ts
│   │   │   │   └── useFormSubmissionOptimistic.ts
│   │   │   └── ui/
│   │   │       ├── useErrorBoundary.ts
│   │   │       ├── useLoadingState.ts
│   │   │       └── useDueDateAlert.ts
│   │   ├── components/            # 基盤コンポーネント
│   │   │   ├── states/
│   │   │   │   ├── EmptyState.vue
│   │   │   │   ├── ErrorBoundary.vue
│   │   │   │   ├── ErrorDisplay.vue
│   │   │   │   ├── FilterEmptyState.vue
│   │   │   │   ├── LoadingButton.vue
│   │   │   │   ├── LoadingOverlay.vue
│   │   │   │   ├── LoadingSpinner.vue
│   │   │   │   ├── NetworkError.vue
│   │   │   │   ├── SearchEmptyState.vue
│   │   │   │   ├── ValidationError.vue
│   │   │   │   └── index.ts
│   │   │   ├── navigation/
│   │   │   │   ├── NavigationGroup.vue
│   │   │   │   ├── NavigationItem.vue
│   │   │   │   ├── MobileNavigation.vue
│   │   │   │   ├── MobileNavItem.vue
│   │   │   │   └── SidebarMenuItem.vue
│   │   │   ├── user/
│   │   │   │   ├── avatar/
│   │   │   │   │   └── UserAvatar.vue
│   │   │   │   ├── menu/
│   │   │   │   │   ├── UserMenu.vue
│   │   │   │   │   ├── UserMenuDropdown.vue
│   │   │   │   │   ├── UserMenuItem.vue
│   │   │   │   │   ├── UserMenuSection.vue
│   │   │   │   │   ├── UserMenuTrigger.vue
│   │   │   │   │   └── UserMenuRefactored.vue
│   │   │   │   └── profile/
│   │   │   │       ├── UserInfo.vue
│   │   │   │       └── UserQuickStats.vue
│   │   │   └── dashboard/
│   │   │       ├── DashboardQuickActions.vue
│   │   │       └── QuickActionCard.vue
│   │   ├── config/                # 設定
│   │   │   ├── apiConfig.ts
│   │   │   ├── authConfig.ts
│   │   │   ├── authFormConfig.ts
│   │   │   ├── expenseTableConfig.ts
│   │   │   ├── filterConfig.ts
│   │   │   ├── i18nConfig.ts
│   │   │   ├── kanbanStatusConfig.ts
│   │   │   ├── languageConfig.ts
│   │   │   ├── navigationConfig.ts
│   │   │   └── userMenuConfig.ts
│   │   └── utils/                 # ユーティリティ
│   │       ├── cn.ts
│   │       ├── currency.ts
│   │       ├── navigation.ts
│   │       ├── route-guards.ts
│   │       └── validationHelpers.ts
│   ├── shared/                    # 共有リソース
│   │   ├── composables/
│   │   │   ├── useI18n.ts
│   │   │   ├── useFilters.ts
│   │   │   ├── useDashboardData.ts
│   │   │   ├── useActiveRoute.ts
│   │   │   ├── useHeaderBreadcrumb.ts
│   │   │   ├── useHeaderSearch.ts
│   │   │   ├── useNavigation.ts
│   │   │   └── useNavigationPermissions.ts
│   │   ├── types/
│   │   │   ├── common/
│   │   │   │   ├── api.ts
│   │   │   │   ├── ui.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── index.ts
│   │   │   ├── i18n.ts
│   │   │   ├── navigation.ts
│   │   │   └── index.ts
│   │   ├── schemas/
│   │   │   ├── auth.ts
│   │   │   ├── expense.ts
│   │   │   └── matter.ts
│   │   └── constants/
│   │       ├── expenseFormConstants.ts
│   │       └── expenseFormSteps.ts
│   ├── pages/                     # Nuxtページ
│   │   ├── auth/
│   │   │   └── login.vue
│   │   ├── cases/
│   │   │   └── kanban.vue
│   │   ├── expenses/
│   │   │   ├── index.vue
│   │   │   ├── new.vue
│   │   │   ├── import.vue
│   │   │   ├── reports.vue
│   │   │   └── [id]/
│   │   │       ├── index.vue
│   │   │       ├── edit.vue
│   │   │       └── attachments.vue
│   │   ├── dashboard.vue
│   │   ├── index.vue
│   │   ├── unauthorized.vue
│   │   ├── dev-test.vue
│   │   └── i18n-demo.vue
│   ├── layouts/                   # Nuxtレイアウト
│   │   ├── default.vue
│   │   ├── auth.vue
│   │   └── components/
│   │       ├── AppHeader.vue
│   │       ├── AppSidebar.vue
│   │       ├── AppFooter.vue
│   │       ├── SidebarHeader.vue
│   │       ├── SidebarNavigation.vue
│   │       ├── SidebarUserInfo.vue
│   │       └── header/
│   │           ├── HeaderActions.vue
│   │           ├── HeaderBreadcrumb.vue
│   │           ├── HeaderSearch.vue
│   │           └── HeaderToggleButtons.vue
│   ├── middleware/                # Nuxtミドルウェア
│   │   ├── auth.ts
│   │   ├── guest.ts
│   │   ├── rbac.ts
│   │   ├── redirect.ts
│   │   ├── role.ts
│   │   └── __tests__/
│   │       ├── auth.test.ts
│   │       └── guest.test.ts
│   ├── plugins/                   # Nuxtプラグイン
│   │   └── i18n-typed.ts
│   ├── app.vue                   # ルートコンポーネント
│   └── assets/                    # スタイルシート
│       └── css/
│           ├── main.css
│           └── tailwind.css
├── locales/                       # i18n翻訳ファイル
│   └── ja/
│       ├── admin.json
│       ├── auth.json
│       ├── cases.json
│       ├── client.json
│       ├── common.json
│       ├── dashboard.json
│       ├── document.json
│       ├── error.json
│       ├── expense.json
│       ├── finance.json
│       ├── header.json
│       ├── language.json
│       ├── matter.json
│       ├── navigation.json
│       ├── notification.json
│       ├── settings.json
│       ├── states.json
│       └── index.ts
├── tests/                         # テスト
│   ├── setup.ts
│   ├── mockExpenseService.test.ts
│   └── stories/
│       ├── DataTable.stories.ts
│       └── states/
│           ├── EmptyState.stories.ts
│           ├── ErrorBoundary.stories.ts
│           └── LoadingSpinner.stories.ts
├── mocks/                         # MSWモック
│   ├── browser.ts
│   ├── server.ts
│   └── handlers/
│       ├── auth.ts
│       ├── expense.ts
│       ├── attachment.ts
│       └── tag.ts
├── types/                         # グローバル型定義
│   ├── vue.d.ts
│   ├── vue-i18n.d.ts
│   └── locale-messages.ts
├── public/                        # 静的ファイル
│   ├── favicon.ico
│   ├── robots.txt
│   └── mockServiceWorker.js
├── scripts/                       # ビルドスクリプト
│   ├── convert-locales-to-json.js
│   ├── migrate-i18n-keys.ts
│   ├── ts-to-json-converter.ts
│   └── update-*.sh
├── docs/                          # ドキュメント
│   ├── mock-expense-service.md
│   ├── tanstack-table-migration.md
│   └── tanstack-table-testing-summary.md
├── config/                        # 設定ファイル
│   ├── nuxt.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── eslint.config.js
│   └── components.json
└── package.json
```

## 移行計画

### Phase 1: ディレクトリ作成（リスクなし）
1. `app/modules/` ディレクトリ作成
2. `app/foundation/` ディレクトリ作成
3. `app/shared/` ディレクトリ作成

### Phase 2: Features → Modules 移行
1. `app/features/auth/` → `app/modules/auth/`
2. `app/features/expense/` → `app/modules/expense/`
3. `app/features/case/` → `app/modules/case/`

### Phase 3: Infrastructure → Foundation 移行
1. `app/infrastructure/ui/` → `app/foundation/ui/`
2. `app/infrastructure/config/` → `app/foundation/config/`
3. `app/infrastructure/layouts/` → `app/layouts/`
4. `app/infrastructure/middleware/` → `app/middleware/`

### Phase 4: Shared層の整理
1. `app/shared/composables/api/` → `app/foundation/api/`
2. `app/shared/composables/table/` → `app/foundation/composables/table/`
3. `app/shared/composables/form/` → `app/foundation/composables/form/`
4. `app/shared/composables/ui/` → `app/foundation/composables/ui/`
5. `app/shared/components/` → `app/foundation/components/`
6. `app/shared/utils/` → `app/foundation/utils/`
7. 残りの共有composables → `app/shared/composables/`

### Phase 5: その他の移行
1. `app/stores/` → `app/foundation/stores/`
2. `app/schemas/` → `app/shared/schemas/`
3. `app/constants/` → `app/shared/constants/`
4. `app/types/` → グローバル `types/` と `app/shared/types/`に分割
5. `app/i18n/locales/` → `locales/`
6. `app/test/` → `tests/`
7. `app/stories/` → `tests/stories/`

### Phase 6: Import Pathsの更新
1. TypeScriptパスエイリアスの設定（tsconfig.json）
2. Nuxt自動インポートの設定（nuxt.config.ts）
3. 全ファイルのimport文を更新（スクリプト使用）

### Phase 7: クリーンアップ
1. 空ディレクトリの削除
2. 不要な設定ファイルの削除
3. ドキュメントの更新

## リスク管理

1. **段階的移行**: 一度に全部移動せず、機能ごとに移行
2. **バックアップ**: 移行前にブランチ作成
3. **テスト実行**: 各フェーズ後にテスト実行
4. **ビルド確認**: 各フェーズ後にビルド成功確認
5. **ロールバック計画**: git resetで即座に戻せる状態を維持

## 成功基準

- [ ] すべてのテストがパス
- [ ] ビルドが成功
- [ ] 型チェックがパス
- [ ] Storybookが正常動作
- [ ] 開発サーバーが正常起動
- [ ] import文にエラーなし