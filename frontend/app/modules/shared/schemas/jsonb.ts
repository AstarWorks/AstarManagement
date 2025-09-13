import { z } from 'zod'
import type { VersionedSchema } from './base'
import { parseWithFallback, parseWithMigration } from './base'

export const JsonPrimitive = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
])

export type JsonPrimitive = z.infer<typeof JsonPrimitive>

export type JsonValue = JsonPrimitive | JsonObject | JsonArray
export interface JsonObject {
  [key: string]: JsonValue
}
export type JsonArray = JsonValue[]

export const JsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([JsonPrimitive, JsonObject, JsonArray])
)

export const JsonObject: z.ZodType<JsonObject> = z.lazy(() =>
  z.record(z.string(), JsonValue)
)

export const JsonArray: z.ZodType<JsonArray> = z.lazy(() =>
  z.array(JsonValue)
)

export function parseJsonbField<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  fallback: T
): T {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch (e) {
      console.warn('[JSONB] Failed to parse JSON string:', e)
      return fallback
    }
  }
  
  return parseWithFallback(data, schema, fallback)
}

export function parseVersionedJsonbField<T>(
  data: unknown,
  versionedSchema: VersionedSchema<T>,
  version?: number
): T | null {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch (e) {
      console.warn('[JSONB] Failed to parse JSON string:', e)
      return null
    }
  }
  
  return parseWithMigration(data, versionedSchema, version)
}

export function stringifyJsonbField<T>(data: T): string {
  try {
    return JSON.stringify(data)
  } catch (e) {
    console.error('[JSONB] Failed to stringify data:', e)
    return '{}'
  }
}

export function createJsonbSchema<T>(innerSchema: z.ZodSchema<T>) {
  return z.union([
    z.string().transform((val) => {
      try {
        return JSON.parse(val)
      } catch {
        throw new Error('Invalid JSON string')
      }
    }),
    innerSchema
  ]).pipe(innerSchema)
}