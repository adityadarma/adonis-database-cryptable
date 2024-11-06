import type { ApplicationService } from '@adonisjs/core/types'
import { Cryptable } from '../src/types/index.js'
import { Exception } from '@adonisjs/core/exceptions'
import MySql from '../src/adapters/mysql.js'
import PostgreSql from '../src/adapters/postgres.js'
import { defineMethodDatabaseMySql, defineMethodModelMySql } from '../src/bindings/mysql.js'
import {
  defineMethodDatabasePostgres,
  defineMethodModelPostgres,
} from '../src/bindings/postgres.js'

export default class CryptableProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.bind('cryptable', async () => {
      const key = this.app.config.get<string>(`cryptable.key`)
      const driver = this.app.config.get<string>(`cryptable.default`)

      switch (driver) {
        case 'mysql':
          return new MySql(key)

        case 'postgres':
          return new PostgreSql(key)

        default:
          throw new Exception('Driver not found')
      }
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    const { ModelQueryBuilder } = await this.app.import('@adonisjs/lucid/orm')
    const { DatabaseQueryBuilder } = await this.app.import('@adonisjs/lucid/database')
    const driver = this.app.config.get<string>(`cryptable.default`)

    switch (driver) {
      case 'mysql':
        defineMethodModelMySql(ModelQueryBuilder)
        defineMethodDatabaseMySql(DatabaseQueryBuilder)
        break

      case 'postgres':
        defineMethodModelPostgres(ModelQueryBuilder)
        defineMethodDatabasePostgres(DatabaseQueryBuilder)
        break

      default:
        throw new Exception('Driver not found')
    }
  }
}

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    cryptable: Cryptable
  }
}

declare module '@adonisjs/lucid/types/querybuilder' {
  export interface ChainableContract {
    whereEncrypted: Where<this>
    orWhereEncrypted: Where<this>
    orderByEncrypted: OrderByEncrypted<this>
  }

  interface OrderByEncrypted<Builder extends ChainableContract> {
    (column: string, direction?: 'asc' | 'desc'): Builder
  }
}

declare module '@adonisjs/lucid/orm' {
  export interface ModelQueryBuilder {
    whereEncrypted(columns: string, value: any): this
    orWhereEncrypted(columns: string, value: any): this
    orderByEncrypted(columns: string, direction?: string): this
  }
}
