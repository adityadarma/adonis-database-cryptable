import { cryptable } from '../../services/main.js'

/**
 * SQL expression that decrypts a base64 stored column, per driver.
 */
const decryptExpressions: Record<string, (column: string, key: string) => string> = {
  mysql: (column, key) => `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${key}') USING utf8mb4)`,

  postgres: (column, key) =>
    `convert_from(pgp_sym_decrypt(decode(${column},'base64')::bytea , '${key}')::bytea, 'UTF-8')`,
}

/**
 * Returns the decrypt expression for the builder connection, or null when
 * the connection uses an unsupported driver.
 */
function decryptExpression(builder: any, column: string): string | null {
  const buildExpression = decryptExpressions[builder.client?.connectionName]

  if (!buildExpression) {
    return null
  }

  return buildExpression(column, cryptable.getKey())
}

/**
 * Normalizes the "(key, value)" and "(key, operator, value)" signatures.
 */
function normalizeOperator(operator: any, value?: any) {
  if (value === undefined) {
    return { operator: '=', value: operator }
  }

  return { operator, value }
}

/**
 * Define Method binding to ModelQueryBuilder
 *
 * A single set of macros handles every driver by branching on the connection
 * name of the builder. Registering one macro per driver is not possible,
 * because they would share the same names on the same prototype and the last
 * registration would win for all connections.
 */
export function defineMethodModel(builder: any) {
  builder.macro('whereEncrypted', function (this: any, key: string, operator: any, value?: any) {
    const expression = decryptExpression(this, key)

    if (!expression) {
      return this
    }

    const normalized = normalizeOperator(operator, value)

    return this.whereRaw(`${expression} ${normalized.operator} ?`, [normalized.value])
  })

  builder.macro('orWhereEncrypted', function (this: any, key: string, operator: any, value?: any) {
    const expression = decryptExpression(this, key)

    if (!expression) {
      return this
    }

    const normalized = normalizeOperator(operator, value)

    return this.orWhereRaw(`${expression} ${normalized.operator} ?`, [normalized.value])
  })

  builder.macro('orderByEncrypted', function (this: any, column: string, direction: string) {
    const expression = decryptExpression(this, column)

    if (!expression) {
      return this
    }

    /**
     * Postgres sorts case sensitively, so the decrypted value is lowercased
     * to keep the ordering predictable.
     */
    if (this.client.connectionName === 'postgres') {
      return this.orderByRaw(`lower(${expression}) ${direction}`)
    }

    return this.orderByRaw(`${expression} ${direction}`)
  })
}
