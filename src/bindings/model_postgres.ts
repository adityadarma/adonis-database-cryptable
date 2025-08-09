import { ModelQueryBuilder } from '@adonisjs/lucid/orm'
import { cryptable } from '../../services/main.js'

/**
 * Define Postgres Method binding to ModelQueryBuilder
 */
export function defineMethodModelPostgres(builder: any) {
  builder.macro(
    'whereEncrypted',
    function (this: ModelQueryBuilder, key: string, operator: any, value?: any) {
      const secretKey = cryptable.getKey()

      if (value === undefined) {
        value = operator
        operator = '='
      }

      return this.whereRaw(
        `convert_from(pgp_sym_decrypt(decode(${key},'base64')::bytea , '${secretKey}')::bytea, 'UTF-8') ${operator} ?`,
        [value]
      )
    }
  )

  builder.macro(
    'orWhereEncrypted',
    function (this: ModelQueryBuilder, key: string, operator: any, value?: any) {
      const secretKey = cryptable.getKey()

      if (value === undefined) {
        value = operator
        operator = '='
      }

      return this.orWhereRaw(
        `convert_from(pgp_sym_decrypt(decode(${key},'base64')::bytea , '${secretKey}')::bytea, 'UTF-8') ${operator} ?`,
        [value]
      )
    }
  )

  builder.macro(
    'orderByEncrypted',
    function (this: ModelQueryBuilder, column: string, direction: string) {
      const secretKey = cryptable.getKey()
      return this.orderByRaw(
        `lower(convert_from(pgp_sym_decrypt(decode(${column},'base64')::bytea , '${secretKey}')::bytea, 'UTF-8')) ${direction}`
      )
    }
  )
}
