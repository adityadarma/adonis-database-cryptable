import { ModelQueryBuilder } from '@adonisjs/lucid/orm'
import { cryptable } from '../../services/main.js'

/**
 * Define Postgres Method binding to ModelQueryBuilder
 */
export function defineMethodModelPostgres(builder: any) {
  builder.macro('whereEncrypted', function (this: ModelQueryBuilder, column: string, value: any) {
    const key = cryptable.getKey()
    return this.whereRaw(
      `convert_from(pgp_sym_decrypt(decode(${column},'base64')::bytea , '${key}')::bytea, 'UTF-8') = ?`,
      [value]
    )
  })

  builder.macro('orWhereEncrypted', function (this: ModelQueryBuilder, column: string, value: any) {
    const key = cryptable.getKey()
    return this.orWhereRaw(
      `convert_from(pgp_sym_decrypt(decode(${column},'base64')::bytea , '${key}')::bytea, 'UTF-8') = ?`,
      [value]
    )
  })

  builder.macro(
    'orderByEncrypted',
    function (this: ModelQueryBuilder, column: string, direction: string) {
      const key = cryptable.getKey()
      return this.orderByRaw(
        `lower(convert_from(pgp_sym_decrypt(decode(${column},'base64')::bytea , '${key}')::bytea, 'UTF-8')) ${direction}`
      )
    }
  )
}
