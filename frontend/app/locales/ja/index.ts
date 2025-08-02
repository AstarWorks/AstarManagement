/**
 * 日本語翻訳メインファイル
 * Japanese Language Messages - Main Index
 */

import type { LocaleMessages } from '~/types/i18n'
import common from './common'
import auth from './auth'
import navigation from './navigation'
import business from './business'

export default {
  ...common,
  ...auth,
  ...navigation,
  ...business
} as const satisfies LocaleMessages