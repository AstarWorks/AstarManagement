/// <reference types="vitest" />
/// <reference types="vitest/globals" />

import type { 
  describe as describeType,
  it as itType,
  test as testType,
  expect as expectType,
  vi as viType,
  beforeEach as beforeEachType,
  afterEach as afterEachType,
  beforeAll as beforeAllType,
  afterAll as afterAllType
} from 'vitest'

declare global {
  const describe: typeof describeType
  const it: typeof itType
  const test: typeof testType
  const expect: typeof expectType
  const vi: typeof viType
  const beforeEach: typeof beforeEachType
  const afterEach: typeof afterEachType
  const beforeAll: typeof beforeAllType
  const afterAll: typeof afterAllType
}