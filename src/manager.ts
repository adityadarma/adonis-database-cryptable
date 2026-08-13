import { RuntimeException } from '@adonisjs/core/exceptions'
import MySql from './adapters/mysql.js'
import PostgreSql from './adapters/postgres.js'
import { CryptableDriver } from './types/index.js'

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
        return new MySql(this.key)

      case 'postgres':
        return new PostgreSql(this.key)

      default:
        throw new RuntimeException('Driver not found')
    }
  }
}
