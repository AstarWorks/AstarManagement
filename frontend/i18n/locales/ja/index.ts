/**
 * 日本語翻訳ファイル - メインエクスポート
 * Japanese Language Messages - Main Export
 *
 * 各JSONファイルはnamespaceでラップされているため、
 * 直接マージして使用
 */

import commonData from './common.json'
import authData from './auth.json'
import navigationData from './navigation.json'
import expenseData from './expense.json'
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

// 各ファイルはすでにnamespaceでラップされているので、
// スプレッド演算子でマージ
export default {
    ...commonData,
    ...authData,
    ...navigationData,
    ...expenseData,
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