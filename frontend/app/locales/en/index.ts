/**
 * English locale index
 * 英語ロケールのインデックス
 */

import auth from './auth'
import business from './business'
import common from './common'
import navigation from './navigation'

export default {
  ...auth,
  ...business,
  ...common,
  ...navigation,
} as const