import app from '@adonisjs/core/services/app'
import CryptableManager from '../src/manager.js'

let cryptable: CryptableManager

/**
 * Returns data cryptable
 */
await app.booted(async () => {
  cryptable = await app.container.make('cryptable.manager')
})
export { cryptable }
