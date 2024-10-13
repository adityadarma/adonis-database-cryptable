import type { ApplicationService } from '@adonisjs/core/types'
import { Exception } from '@adonisjs/core/exceptions'
import { CryptableInterface } from '../src/types/index.js'
import MySql from '../src/adapters/mysql.js'

export default class StorageProvider {
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

        default:
          throw new Exception('Driver not found')
      }
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {}

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
