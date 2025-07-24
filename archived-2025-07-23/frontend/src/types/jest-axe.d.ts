// Type declarations for jest-axe
declare module 'jest-axe' {
  import type { AxeCore } from 'axe-core'
  
  export interface AxeResults extends AxeCore.AxeResults {}
  
  export interface JestAxeOptions {
    rules?: Record<string, { enabled: boolean }>
  }
  
  export function axe(
    element: Element | string,
    options?: JestAxeOptions
  ): Promise<AxeResults>
  
  export interface ToHaveNoViolations {
    toHaveNoViolations(): any
  }
  
  export const toHaveNoViolations: {
    toHaveNoViolations(received: AxeResults): {
      pass: boolean
      message(): string
    }
  }
}

// Extend Vitest matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): void
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void
  }
}