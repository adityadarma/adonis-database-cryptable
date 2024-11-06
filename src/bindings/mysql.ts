import { ModelQueryBuilder } from '@adonisjs/lucid/orm'
import { DatabaseQueryBuilder } from '@adonisjs/lucid/database'
import { cryptable } from '../../services/main.js'

/**
 * Define Mysql Method binding to ModelQueryBuilder
 */
export function defineMethodModelMySql(builder: any) {
  builder.macro('whereEncrypted', function (this: ModelQueryBuilder, column: string, value: any) {
    const key = cryptable.getKey()
    return this.whereRaw(
      `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${key}') USING utf8mb4) = ?`,
      [value]
    )
  })

  builder.macro('orWhereEncrypted', function (this: ModelQueryBuilder, column: string, value: any) {
    const key = cryptable.getKey()
    return this.orWhereRaw(
      `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${key}') USING utf8mb4) = ?`,
      [value]
    )
  })

  builder.macro(
    'orderByEncrypted',
    function (this: ModelQueryBuilder, column: string, direction: string) {
      const key = cryptable.getKey()
      return this.orderByRaw(
        `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${key}') USING utf8mb4) ${direction}`
      )
    }
  )
}

/**
 * Define Method binding to DatabaseQueryBuilder
 */
export function defineMethodDatabaseMySql(builder: any) {
  builder.macro(
    'whereEncrypted',
    function (this: DatabaseQueryBuilder, column: string, value: any) {
      const key = cryptable.getKey()
      return this.whereRaw(
        `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${key}') USING utf8mb4) = '${value}'`
      )
    }
  )

  builder.macro(
    'orWhereEncrypted',
    function (this: DatabaseQueryBuilder, column: string, value: any) {
      const key = cryptable.getKey()
      return this.orWhereRaw(
        `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${key}') USING utf8mb4) = '${value}'`
      )
    }
  )

  builder.macro(
    'orderByEncrypted',
    function (this: DatabaseQueryBuilder, column: string, direction: string) {
      const key = cryptable.getKey()
      return this.orderByRaw(
        `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${key}') USING utf8mb4) ${direction}`
      )
    }
  )
}
