/// <reference types="vitest" />

import { describe as vitestDescribe, it as vitestIt, expect as vitestExpect, vi as vitestVi, beforeEach as vitestBeforeEach, afterEach as vitestAfterEach } from 'vitest'

declare global {
  const describe: typeof vitestDescribe
  const it: typeof vitestIt
  const expect: typeof vitestExpect
  const vi: typeof vitestVi
  const beforeEach: typeof vitestBeforeEach
  const afterEach: typeof vitestAfterEach
}

export {}