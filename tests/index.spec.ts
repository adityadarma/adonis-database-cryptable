/*
 * adonis-database-cryptable
 *
 * (c) Aditya Darma <adhit.boys1@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { setupApp } from './helpers.js'

await setupApp()

const exports = await import('../index.js')

test.group('Package entrypoint', () => {
  test('export the configure hook', ({ assert }) => {
    assert.isFunction(exports.configure)
  })

  test('export the stubs root', ({ assert }) => {
    assert.isString(exports.stubsRoot)
    assert.isTrue(exports.stubsRoot.endsWith('stubs'))
  })

  test('export defineConfig', ({ assert }) => {
    assert.isFunction(exports.defineConfig)
    assert.deepEqual(exports.defineConfig({ key: 'a-key', default: 'mysql' }), {
      key: 'a-key',
      default: 'mysql',
    })
  })

  test('export the Cryptable mixin', ({ assert }) => {
    assert.isFunction(exports.Cryptable)
  })

  test('the mixin returns a subclass of the given model', async ({ assert }) => {
    const { BaseModel } = await import('@adonisjs/lucid/orm')

    const model = exports.Cryptable(BaseModel)

    assert.isTrue(Object.prototype.isPrototypeOf.call(BaseModel, model))
  })
})
