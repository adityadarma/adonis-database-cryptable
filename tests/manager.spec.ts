/*
 * adonis-database-cryptable
 *
 * (c) Aditya Darma <adhit.boys1@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { RuntimeException } from '@adonisjs/core/exceptions'
import { SECRET_KEY, setupApp } from './helpers.js'

/**
 * The manager pulls in the query builder bindings which read from
 * "services/main.ts", so the application has to be booted first.
 */
await setupApp()

const { default: CryptableManager } = await import('../src/manager.js')
const { default: MySql } = await import('../src/adapters/mysql.js')
const { default: PostgreSql } = await import('../src/adapters/postgres.js')

test.group('Manager', () => {
  test('expose the configured key', ({ assert }) => {
    const manager = new CryptableManager(SECRET_KEY, 'mysql')

    assert.equal(manager.getKey(), SECRET_KEY)
  })

  test('expose the configured driver', ({ assert }) => {
    assert.equal(new CryptableManager(SECRET_KEY, 'mysql').getDriver(), 'mysql')
    assert.equal(new CryptableManager(SECRET_KEY, 'postgres').getDriver(), 'postgres')
  })

  test('resolve the mysql driver', ({ assert }) => {
    const manager = new CryptableManager(SECRET_KEY, 'mysql')

    assert.instanceOf(manager.use('mysql'), MySql)
  })

  test('resolve the postgres driver', ({ assert }) => {
    const manager = new CryptableManager(SECRET_KEY, 'postgres')

    assert.instanceOf(manager.use('postgres'), PostgreSql)
  })

  test('fall back to the default driver when no name is given', ({ assert }) => {
    assert.instanceOf(new CryptableManager(SECRET_KEY, 'mysql').use(), MySql)
    assert.instanceOf(new CryptableManager(SECRET_KEY, 'postgres').use(), PostgreSql)
  })

  test('resolve a driver other than the default one', ({ assert }) => {
    const manager = new CryptableManager(SECRET_KEY, 'mysql')

    assert.instanceOf(manager.use('postgres'), PostgreSql)
    // Asking for another driver must not change the configured default.
    assert.equal(manager.getDriver(), 'mysql')
  })

  test('return a new driver instance on every call', ({ assert }) => {
    const manager = new CryptableManager(SECRET_KEY, 'mysql')

    assert.notStrictEqual(manager.use('mysql'), manager.use('mysql'))
  })

  test('forward the key to the resolved driver', async ({ assert }) => {
    const manager = new CryptableManager(SECRET_KEY, 'mysql')

    const fromManager = await manager.use('mysql').encrypt('john doe')
    const fromAdapter = await new MySql(SECRET_KEY).encrypt('john doe')

    assert.equal(fromManager, fromAdapter)
  })

  test('throw when the requested driver is unknown', ({ assert }) => {
    const manager = new CryptableManager(SECRET_KEY, 'mysql')

    assert.throws(() => manager.use('sqlite'), 'Driver not found')

    // "assert.throws" cannot take the exception class here, because
    // RuntimeException does not match the "ErrorConstructor" signature.
    try {
      manager.use('mssql')
      assert.fail('Expected manager.use() to throw')
    } catch (error) {
      assert.instanceOf(error, RuntimeException)
    }
  })

  test('throw when constructed with an unknown default driver', ({ assert }) => {
    assert.throws(() => new CryptableManager(SECRET_KEY, 'oracle'), 'Driver not found')
  })
})
