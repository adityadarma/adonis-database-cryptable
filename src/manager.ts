import { RuntimeException } from '@adonisjs/core/exceptions'
import MySql from './adapters/mysql.js'
import PostgreSql from './adapters/postgres.js'
import { CryptableDriver } from './types/index.js'
import { ModelQueryBuilder } from '@adonisjs/lucid/orm'
import { defineMethodModelMySql } from './bindings/model_mysql.js'
import { defineMethodModelPostgres } from './bindings/model_postgres.js'

export default class CryptableManager {
  constructor(
    private key: string,
    private driver: string
  ) {
    this.use(driver)
  }

  getKey(): string {
    return this.key
  }

  getDriver(): string {
    return this.driver
  }

  use(name?: string): CryptableDriver {
    switch (name || this.driver) {
      case 'mysql':
        defineMethodModelMySql(ModelQueryBuilder)
        return new MySql(this.key)

      case 'postgres':
        defineMethodModelPostgres(ModelQueryBuilder)
        return new PostgreSql(this.key)

      default:
        throw new RuntimeException('Driver not found')
    }
  }
}
