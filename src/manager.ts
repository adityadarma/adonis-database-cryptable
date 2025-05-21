import { RuntimeException } from '@adonisjs/core/exceptions'
import MySql from './adapters/mysql.js'
import PostgreSql from './adapters/postgres.js'
import { CryptableDriver } from './types/index.js'
import { ModelQueryBuilder } from '@adonisjs/lucid/orm'
import { defineMethodDatabaseMySql, defineMethodModelMySql } from './bindings/mysql.js'
import { DatabaseQueryBuilder } from '@adonisjs/lucid/database'
import { defineMethodDatabasePostgres, defineMethodModelPostgres } from './bindings/postgres.js'

export default class CryptableManager {
  constructor(
    public key: string,
    public driver: string
  ) {}

  getKey(): string {
    return this.key
  }

  use(name?: string): CryptableDriver {
    switch (name || this.driver) {
      case 'mysql':
        defineMethodModelMySql(ModelQueryBuilder)
        defineMethodDatabaseMySql(DatabaseQueryBuilder)
        return new MySql(this.key)

      case 'postgres':
        defineMethodModelPostgres(ModelQueryBuilder)
        defineMethodDatabasePostgres(DatabaseQueryBuilder)
        return new PostgreSql(this.key)

      default:
        throw new RuntimeException('Driver not found')
    }
  }
}
