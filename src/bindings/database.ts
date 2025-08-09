import { DatabaseQueryBuilder } from '@adonisjs/lucid/database'
import { cryptable } from '../../services/main.js'

/**
 * Define Method binding to DatabaseQueryBuilder
 */
export function defineMethodDatabase(builder: any) {
  builder.macro(
    'whereEncrypted',
    function (this: DatabaseQueryBuilder, key: string, operator: any, value?: any) {
      const secretKey = cryptable.getKey()

      if (value === undefined) {
        value = operator
        operator = '='
      }

      if (this.client.connectionName === 'mysql') {
        return this.whereRaw(
          `CONVERT(AES_DECRYPT(FROM_BASE64(${key}), '${secretKey}') USING utf8mb4) ${operator} '${value}'`
        )
      } else if (this.client.connectionName === 'postgres') {
        return this.whereRaw(
          `convert_from(pgp_sym_decrypt(decode(${key},'base64')::bytea , '${secretKey}')::bytea, 'UTF-8') ${operator} ?`,
          [value]
        )
      }

      return this
    }
  )

  builder.macro(
    'orWhereEncrypted',
    function (this: DatabaseQueryBuilder, key: string, operator: any, value?: any) {
      const secretKey = cryptable.getKey()

      if (value === undefined) {
        value = operator
        operator = '='
      }

      if (this.client.connectionName === 'mysql') {
        return this.orWhereRaw(
          `CONVERT(AES_DECRYPT(FROM_BASE64(${key}), '${secretKey}') USING utf8mb4) ${operator} '${value}'`
        )
      } else if (this.client.connectionName === 'postgres') {
        return this.orWhereRaw(
          `convert_from(pgp_sym_decrypt(decode(${key},'base64')::bytea , '${secretKey}')::bytea, 'UTF-8') ${operator} ?`,
          [value]
        )
      }

      return this
    }
  )

  builder.macro(
    'orderByEncrypted',
    function (this: DatabaseQueryBuilder, column: string, direction: string) {
      const secretKey = cryptable.getKey()
      if (this.client.connectionName === 'mysql') {
        return this.orderByRaw(
          `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${secretKey}') USING utf8mb4) ${direction}`
        )
      } else if (this.client.connectionName === 'postgres') {
        return this.orderByRaw(
          `lower(convert_from(pgp_sym_decrypt(decode(${column},'base64')::bytea , '${secretKey}')::bytea, 'UTF-8')) ${direction}`
        )
      }

      return this
    }
  )
}
