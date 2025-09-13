import type { z } from 'zod'

export interface SchemaVersion {
  version: number
  migrateFrom?: (data: unknown) => unknown
}

export interface VersionedSchema<T> {
  schema: z.ZodSchema<T>
  version: number
  migrations?: Map<number, (data: unknown) => unknown>
}

export function createVersionedSchema<T>(
  schema: z.ZodSchema<T>,
  version: number,
  migrations?: Map<number, (data: unknown) => unknown>
): VersionedSchema<T> {
  return {
    schema,
    version,
    migrations
  }
}

export function parseWithFallback<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  fallback: T
): T {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }
  
  console.warn('[Schema] Parse failed, using fallback:', result.error)
  return fallback
}

export function parseWithMigration<T>(
  data: unknown,
  versionedSchema: VersionedSchema<T>,
  currentVersion?: number
): T | null {
  if (!data) return null
  
  const dataVersion = currentVersion ?? 0
  
  let processedData = data
  if (dataVersion < versionedSchema.version && versionedSchema.migrations) {
    for (let v = dataVersion; v < versionedSchema.version; v++) {
      const migration = versionedSchema.migrations.get(v + 1)
      if (migration) {
        processedData = migration(processedData) as Record<string, unknown>
      }
    }
  }
  
  const result = versionedSchema.schema.safeParse(processedData)
  if (result.success) {
    return result.data
  }
  
  console.error('[Schema] Parse failed after migration:', result.error)
  return null
}

export function mergeWithDefaults<T extends Record<string, unknown>>(
  data: Partial<T>,
  defaults: T
): T {
  return { ...defaults, ...data }
}