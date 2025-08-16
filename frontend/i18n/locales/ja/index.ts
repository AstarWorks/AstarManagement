/**
 * 日本語翻訳ファイル - メインエクスポート
 * Japanese Language Messages - Main Export
 * 
 * 新しい構造：
 * - shared/: 共通翻訳（旧common）
 * - modules/: 機能別翻訳
 */

// Shared translations
import sharedApp from './shared/app.json'
import sharedActions from './shared/actions.json'
import sharedMetadata from './shared/metadata.json'
import sharedValidation from './shared/validation.json'
import sharedUI from './shared/ui.json'
import sharedTable from './shared/table.json'
import sharedForm from './shared/form.json'
import sharedDateTime from './shared/date-time.json'
import sharedStatus from './shared/status.json'
import sharedMessages from './shared/messages.json'
import sharedSearch from './shared/search.json'
import sharedFilters from './shared/filters.json'
import sharedPagination from './shared/pagination.json'
import sharedUser from './shared/user.json'

// Module translations - Expense
import expenseDomain from './modules/expense/domain.json'
import expenseList from './modules/expense/list.json'
import expenseForm from './modules/expense/form.json'
import expenseStatistics from './modules/expense/statistics.json'
import expenseImportExport from './modules/expense/import-export.json'

// Other module translations (keeping original structure for now)
import authData from './auth.json'
import navigationData from './navigation.json'
import statesData from './states.json'
import matterData from './matter.json'
import casesData from './cases.json'
import clientData from './client.json'
import documentData from './document.json'
import financeData from './finance.json'
import adminData from './admin.json'
import notificationData from './notification.json'
import dashboardData from './dashboard.json'
import settingsData from './settings.json'
import errorData from './error.json'
import headerData from './header.json'
import languageData from './language.json'

// Merge all translations
export default {
  // Shared translations
  ...sharedApp,
  ...sharedActions,
  ...sharedMetadata,
  ...sharedValidation,
  ...sharedUI,
  ...sharedTable,
  ...sharedForm,
  ...sharedDateTime,
  ...sharedStatus,
  ...sharedMessages,
  ...sharedSearch,
  ...sharedFilters,
  ...sharedPagination,
  ...sharedUser,
  
  // Expense module (merged)
  ...expenseDomain,
  ...expenseList,
  ...expenseForm,
  ...expenseStatistics,
  ...expenseImportExport,
  
  // Other modules (keeping original structure)
  ...authData,
  ...navigationData,
  ...statesData,
  ...matterData,
  ...casesData,
  ...clientData,
  ...documentData,
  ...financeData,
  ...adminData,
  ...notificationData,
  ...dashboardData,
  ...settingsData,
  ...errorData,
  ...headerData,
  ...languageData
}