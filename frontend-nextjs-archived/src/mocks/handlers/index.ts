import { authHandlers } from './auth'
import { matterHandlers } from './matters'

export const handlers = [
  ...authHandlers,
  ...matterHandlers
]