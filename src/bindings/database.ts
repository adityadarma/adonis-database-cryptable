import { DatabaseQueryBuilder } from '@adonisjs/lucid/database'
import { cryptable } from '../../services/main.js'

/**
 * Define Method binding to DatabaseQueryBuilder
 */
export function defineMethodDatabase(builder: any) {
  builder.macro(
    'whereEncrypted',
    function (this: DatabaseQueryBuilder, column: string, value: any) {
      const key = cryptable.getKey()
      if (this.client.connectionName === 'mysql') {
        return this.whereRaw(
          `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${key}') USING utf8mb4) = '${value}'`
        )
      } else if (this.client.connectionName === 'postgres') {
        return this.whereRaw(
          `convert_from(pgp_sym_decrypt(decode(${column},'base64')::bytea , '${key}')::bytea, 'UTF-8') = ?`,
          [value]
        )
      }
    }
  )

  builder.macro(
    'orWhereEncrypted',
    function (this: DatabaseQueryBuilder, column: string, value: any) {
      const key = cryptable.getKey()
      if (this.client.connectionName === 'mysql') {
        return this.orWhereRaw(
          `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${key}') USING utf8mb4) = '${value}'`
        )
      } else if (this.client.connectionName === 'postgres') {
        return this.orWhereRaw(
          `convert_from(pgp_sym_decrypt(decode(${column},'base64')::bytea , '${key}')::bytea, 'UTF-8') = ?`,
          [value]
        )
      }
    }
  )

  builder.macro(
    'orderByEncrypted',
    function (this: DatabaseQueryBuilder, column: string, direction: string) {
      const key = cryptable.getKey()
      if (this.client.connectionName === 'mysql') {
        return this.orderByRaw(
          `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${key}') USING utf8mb4) ${direction}`
        )
      } else if (this.client.connectionName === 'postgres') {
        return this.orderByRaw(
          `lower(convert_from(pgp_sym_decrypt(decode(${column},'base64')::bytea , '${key}')::bytea, 'UTF-8')) ${direction}`
        )
      }
    }
  )
}
