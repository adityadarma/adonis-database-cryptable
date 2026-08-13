/*
 * adonis-database-cryptable
 *
 * (c) Aditya Darma <adhit.boys1@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { AppFactory } from '@adonisjs/core/factories/app'
import type { ApplicationService } from '@adonisjs/core/types'
import { SECRET_KEY, setupApp } from './helpers.js'

await setupApp()

const { default: CryptableProvider } = await import('../providers/cryptable_provider.js')
const { default: CryptableManager } = await import('../src/manager.js')

/**
 * Builds a booted application with the given cryptable config. The config
 * values are only available after "boot", hence both calls.
 */
async function createApp(config?: Record<string, any>) {
  const app = new AppFactory().create(
    new URL('../', import.meta.url),
    (path) => import(path)
  ) as unknown as ApplicationService

  app.useConfig(config ? { cryptable: config } : {})

  await app.init()
  await app.boot()

  return app
}

test.group('Provider', () => {
  test('register the cryptable.manager binding', async ({ assert }) => {
    const app = await createApp({ key: SECRET_KEY, default: 'mysql' })

    new CryptableProvider(app).register()

    assert.isTrue(app.container.hasBinding('cryptable.manager'))
  })

  test('resolve a manager built from the config', async ({ assert }) => {
    const app = await createApp({ key: SECRET_KEY, default: 'mysql' })

    new CryptableProvider(app).register()
    const manager = await app.container.make('cryptable.manager')

    assert.instanceOf(manager, CryptableManager)
    assert.equal(manager.getKey(), SECRET_KEY)
    assert.equal(manager.getDriver(), 'mysql')
  })

  test('read the postgres driver from the config', async ({ assert }) => {
    const app = await createApp({ key: SECRET_KEY, default: 'postgres' })

    new CryptableProvider(app).register()
    const manager = await app.container.make('cryptable.manager')

    assert.equal(manager.getDriver(), 'postgres')
  })

  test('resolve a fresh manager on every call', async ({ assert }) => {
    const app = await createApp({ key: SECRET_KEY, default: 'mysql' })

    new CryptableProvider(app).register()

    // The binding is registered with "bind", not "singleton".
    assert.notStrictEqual(
      await app.container.make('cryptable.manager'),
      await app.container.make('cryptable.manager')
    )
  })

  test('fail to resolve when the config is missing', async ({ assert }) => {
    const app = await createApp()

    new CryptableProvider(app).register()

    await assert.rejects(() => app.container.make('cryptable.manager'), 'Driver not found')
  })

  test('fail to resolve when the driver is not supported', async ({ assert }) => {
    const app = await createApp({ key: SECRET_KEY, default: 'sqlite' })

    new CryptableProvider(app).register()

    await assert.rejects(() => app.container.make('cryptable.manager'), 'Driver not found')
  })

  test('register the macros on the database query builder while booting', async ({ assert }) => {
    const app = await createApp({ key: SECRET_KEY, default: 'mysql' })
    const provider = new CryptableProvider(app)

    provider.register()
    await provider.boot()

    const { DatabaseQueryBuilder } = await import('@adonisjs/lucid/database')

    assert.isFunction((DatabaseQueryBuilder as any).prototype.whereEncrypted)
    assert.isFunction((DatabaseQueryBuilder as any).prototype.orWhereEncrypted)
    assert.isFunction((DatabaseQueryBuilder as any).prototype.orderByEncrypted)
  })
})
