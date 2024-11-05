import app from '@adonisjs/core/services/app'
import { Cryptable } from '../src/types/index.js'

let cryptable: Cryptable

/**
 * Returns data cryptable
 */
await app.booted(async () => {
  cryptable = await app.container.make('cryptable')
})
export { cryptable }
