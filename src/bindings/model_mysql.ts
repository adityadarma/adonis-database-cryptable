import { ModelQueryBuilder } from '@adonisjs/lucid/orm'
import { cryptable } from '../../services/main.js'

/**
 * Define Mysql Method binding to ModelQueryBuilder
 */
export function defineMethodModelMySql(builder: any) {
  builder.macro(
    'whereEncrypted',
    function (this: ModelQueryBuilder, key: string, operator: any, value?: any) {
      const secretKey = cryptable.getKey()

      if (value === undefined) {
        value = operator
        operator = '='
      }

      return this.whereRaw(
        `CONVERT(AES_DECRYPT(FROM_BASE64(${key}), '${secretKey}') USING utf8mb4) ${operator} ?`,
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
        `CONVERT(AES_DECRYPT(FROM_BASE64(${key}), '${secretKey}') USING utf8mb4) ${operator} ?`,
        [value]
      )
    }
  )

  builder.macro(
    'orderByEncrypted',
    function (this: ModelQueryBuilder, column: string, direction: string) {
      const secretKey = cryptable.getKey()
      return this.orderByRaw(
        `CONVERT(AES_DECRYPT(FROM_BASE64(${column}), '${secretKey}') USING utf8mb4) ${direction}`
      )
    }
  )
}
