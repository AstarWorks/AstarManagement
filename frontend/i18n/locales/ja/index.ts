/**
 * 日本語翻訳ファイル - メインエクスポート
 * Japanese Language Messages - Main Export
 *
 * Clean Architecture構造：
 * - foundation/: 基盤層共通翻訳
 * - modules/: 機能別翻訳
 */

// Foundation translations
import foundationActions from './foundation/actions.json'
import foundationCommon from './foundation/common.json'
import foundationDatetime from './foundation/datetime.json'
import foundationForm from './foundation/form.json'
import foundationMessages from './foundation/messages.json'
import foundationNavigation from './foundation/navigation.json'
import foundationSearch from './foundation/search.json'
import foundationTable from './foundation/table.json'

// Module translations
import adminDomain from './modules/admin/domain.json'
import authDomain from './modules/auth/domain.json'
import clientDomain from './modules/client/domain.json'
import dashboardDomain from './modules/dashboard/domain.json'
import documentDomain from './modules/document/domain.json'
import errorDomain from './modules/error/domain.json'
import expenseDomain from './modules/expense/domain.json'
import headerDomain from './modules/header/domain.json'
import languageDomain from './modules/language/domain.json'
import matterDomain from './modules/matter/domain.json'
import moduleNavigationDomain from './modules/navigation/domain.json'
import notificationDomain from './modules/notification/domain.json'
import settingsDomain from './modules/settings/domain.json'
import moduleStatesDomain from './modules/states/domain.json'

// Merge with deep nesting support - JSON structure is guaranteed
export default {
    // Foundation layer - extract nested keys from JSON files
    foundation: {
        actions: foundationActions.foundation.actions,
        common: foundationCommon.foundation.common,
        datetime: foundationDatetime.foundation.datetime,
        form: foundationForm.foundation.form,
        messages: foundationMessages.foundation.messages,
        navigation: foundationNavigation.foundation.navigation,
        search: foundationSearch.foundation.search,
        table: foundationTable.foundation.table
    },
    
    // Modules layer - extract nested keys from JSON files
    modules: {
        admin: adminDomain.modules.admin,
        auth: authDomain.modules.auth,
        client: clientDomain.modules.client,
        dashboard: dashboardDomain.modules.dashboard,
        document: documentDomain.modules.document,
        error: errorDomain.modules.error,
        expense: expenseDomain.modules.expense,
        header: headerDomain.modules.header,
        language: languageDomain.modules.language,
        matter: matterDomain.modules.matter,
        navigation: moduleNavigationDomain.modules.navigation,
        notification: notificationDomain.modules.notification,
        settings: settingsDomain.modules.settings,
        states: moduleStatesDomain.modules.states
    }
}