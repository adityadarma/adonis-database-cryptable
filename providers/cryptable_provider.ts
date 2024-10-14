import type { ApplicationService } from '@adonisjs/core/types'
import { Exception } from '@adonisjs/core/exceptions'
import { CryptableInterface } from '../src/types/index.js'
import MySql from '../src/adapters/mysql.js'
import { defineMethodModel } from '../src/bindings/model.js'
import { defineMethodDatabase } from '../src/bindings/database.js'

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
        case 'mariadb':
          return new MySql(key)

        default:
          throw new Exception('Driver not found')
      }
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    const { DatabaseQueryBuilder } = await this.app.import('@adonisjs/lucid/database')
    const { ModelQueryBuilder } = await this.app.import('@adonisjs/lucid/orm')

    defineMethodDatabase(DatabaseQueryBuilder)
    defineMethodModel(ModelQueryBuilder)
  }

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shut down the app
   */
  async shutdown() {}
}

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    cryptable: CryptableInterface
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

declare module '@adonisjs/lucid/database' {
  export interface DatabaseQueryBuilder {
    whereEncrypted(columns: string, value: any): this
    orWhereEncrypted(columns: string, value: any): this
    orderByEncrypted(columns: string, direction?: string): this
  }
}

declare module '@adonisjs/lucid/orm' {
  export interface ModelQueryBuilder {
    whereEncrypted(columns: string, value: any): this
    orWhereEncrypted(columns: string, value: any): this
    orderByEncrypted(columns: string, direction?: string): this
  }
}
