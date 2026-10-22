import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import { registryItemSchema, registrySchema } from 'shadcn/schema'

import lockSource from './schema/lock.json?raw'
import indexSchemaSource from './schema/registry.schema.json?raw'
import itemSchemaSource from './schema/registry-item.schema.json?raw'
import { REGISTRY_ITEM_SCHEMA_URL } from './config'

/**
 * Two independent checks of the same files:
 *
 * - the JSON Schemas shadcn publishes, vendored in `./schema` with the hash and date they were
 *   downloaded (`lock.json`; `pnpm registry:verify-schema` compares them with the live ones);
 * - the Zod schemas inside the `shadcn` package, which are what the CLI enforces when it reads an
 *   item.
 *
 * Neither rejects unknown keys, so `rules.ts` adds that check.
 */

export interface SchemaLock {
  fetchedAt: string
  cli: string
  schemas: Record<string, { url: string; sha256: string }>
}

export const schemaLock = JSON.parse(lockSource) as SchemaLock

/**
 * Ajv knows the draft-07 meta-schema by its `http://` URL; the published files spell it with
 * `https://`. Only that one property is adjusted, and only in memory.
 */
function loadSchema(source: string): object {
  const schema = JSON.parse(source) as { $schema?: string }
  return schema.$schema
    ? { ...schema, $schema: schema.$schema.replace(/^https:/, 'http:') }
    : schema
}

const ajv = new Ajv({ allErrors: true })
// The index schema points at the item schema by URL, and the item schema carries no `$id`.
ajv.addSchema(loadSchema(itemSchemaSource), REGISTRY_ITEM_SCHEMA_URL)
const validateIndexJsonSchema = ajv.compile(loadSchema(indexSchemaSource))

function compiledItemSchema(): ValidateFunction {
  const validate = ajv.getSchema(REGISTRY_ITEM_SCHEMA_URL)
  if (!validate) throw new Error('the item JSON Schema did not compile')
  return validate
}
const validateItemJsonSchema = compiledItemSchema()

function describe(errors: readonly ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map(
    (error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`,
  )
}

/** Problems found by the published JSON Schema; empty when the item passes. */
export function jsonSchemaIssuesForItem(item: unknown): string[] {
  return validateItemJsonSchema(item) ? [] : describe(validateItemJsonSchema.errors)
}

export function jsonSchemaIssuesForIndex(index: unknown): string[] {
  return validateIndexJsonSchema(index) ? [] : describe(validateIndexJsonSchema.errors)
}

/** Problems found by the CLI's own Zod schema; empty when the item passes. */
export function cliSchemaIssuesForItem(item: unknown): string[] {
  const result = registryItemSchema.safeParse(item)
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`)
}

export function cliSchemaIssuesForIndex(index: unknown): string[] {
  const result = registrySchema.safeParse(index)
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`)
}
