import type { ApplicationService } from '@adonisjs/core/types'
import CryptableManager from '../src/manager.js'
import { defineMethodDatabase } from '../src/bindings/database.js'

export default class CryptableProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.bind('cryptable.manager', async () => {
      const key = this.app.config.get<string>(`cryptable.key`)
      const driver = this.app.config.get<string>(`cryptable.default`)

      return new CryptableManager(key, driver)
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    const { DatabaseQueryBuilder } = await this.app.import('@adonisjs/lucid/database')
    defineMethodDatabase(DatabaseQueryBuilder)
  }
}

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'cryptable.manager': CryptableManager
  }
}

declare module '@adonisjs/lucid/types/querybuilder' {
  export interface ChainableContract {
    whereEncrypted: WhereEncrypted<this>
    orWhereEncrypted: WhereEncrypted<this>
    orderByEncrypted: OrderByEncrypted<this>
  }

  interface WhereEncrypted<Builder extends ChainableContract> {
    (key: string | RawQuery, value: StrictValues | ChainableContract): Builder
    (key: string | RawQuery, operator: string, value: StrictValues | ChainableContract): Builder
  }

  interface OrderByEncrypted<Builder extends ChainableContract> {
    (column: string, direction?: 'asc' | 'desc'): Builder
  }
}

declare module '@adonisjs/lucid/orm' {
  export interface ModelQueryBuilder {
    whereEncrypted(key: any, operator: any, value?: any): this
    orWhereEncrypted(key: any, operator: any, value?: any): this
    orderByEncrypted(columns: string, direction?: string): this
  }
}
