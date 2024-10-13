import { DatabaseQueryBuilder } from '@adonisjs/lucid/database'
import { cryptable } from '../../services/main.js'

/**
 * Define Method binding to DatabaseQueryBuilder
 */
export function extendMethodDatabase(builder: any) {
  builder.macro(
    'whereEncrypted',
    function (this: DatabaseQueryBuilder, columns: string, value: any) {
      const key = cryptable.getKey()
      return this.whereRaw(
        `CONVERT(AES_DECRYPT(FROM_BASE64(${columns}), '${key}') USING utf8mb4) = '${value}'`
      )
    }
  )

  builder.macro(
    'orWhereEncrypted',
    function (this: DatabaseQueryBuilder, columns: string, value: any) {
      const key = cryptable.getKey()
      return this.orWhereRaw(
        `CONVERT(AES_DECRYPT(FROM_BASE64(${columns}), '${key}') USING utf8mb4) = '${value}'`
      )
    }
  )

  builder.macro(
    'orderByEncrypted',
    function (this: DatabaseQueryBuilder, columns: string, direction: string) {
      const key = cryptable.getKey()
      return this.orderByRaw(
        `CONVERT(AES_DECRYPT(FROM_BASE64(${columns}), '${key}') USING utf8mb4) ${direction}`
      )
    }
  )
}
