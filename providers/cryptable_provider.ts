import type { ApplicationService } from '@adonisjs/core/types'
import CryptableManager from '../src/manager.js'

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
}

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'cryptable.manager': CryptableManager
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
