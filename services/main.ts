import app from '@adonisjs/core/services/app'
import { CryptableInterface } from '../src/types/index.js'

let cryptable: CryptableInterface

/**
 * Returns data storage
 */
await app.booted(async () => {
  cryptable = await app.container.make('cryptable')
})
export { cryptable }
