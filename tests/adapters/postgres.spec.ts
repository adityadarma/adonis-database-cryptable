/*
 * adonis-database-cryptable
 *
 * (c) Aditya Darma <adhit.boys1@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { SECRET_KEY } from '../helpers.js'

const { default: PostgreSql } = await import('../../src/adapters/postgres.js')

test.group('Adapters | PostgreSql', () => {
  test('encrypt then decrypt returns the original value', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)

    const encrypted = await adapter.encrypt('john doe')

    assert.notEqual(encrypted, 'john doe')
    assert.equal(await adapter.decrypt(encrypted), 'john doe')
  })

  test('encrypt returns a base64 encoded string', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)

    const encrypted = await adapter.encrypt('john doe')

    assert.isString(encrypted)
    assert.match(encrypted, /^[A-Za-z0-9+/]+={0,2}$/)
  })

  test('encryption is not deterministic', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)

    // OpenPGP uses a random session key, so two ciphertexts of the same
    // input never match. Both must still decrypt to the same value.
    const first = await adapter.encrypt('john doe')
    const second = await adapter.encrypt('john doe')

    assert.notEqual(first, second)
    assert.equal(await adapter.decrypt(first), 'john doe')
    assert.equal(await adapter.decrypt(second), 'john doe')
  })

  test('handle an empty string', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)

    assert.equal(await adapter.decrypt(await adapter.encrypt('')), '')
  })

  test('handle multi byte characters', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)
    const value = 'héllo 日本 🎉'

    assert.equal(await adapter.decrypt(await adapter.encrypt(value)), value)
  })

  test('handle a long value', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)
    const value = 'lorem ipsum '.repeat(200)

    assert.equal(await adapter.decrypt(await adapter.encrypt(value)), value)
  })

  test('reject non string values', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)

    // Unlike the MySql adapter this one does not cast the value, openpgp
    // requires a string or a stream.
    await assert.rejects(() => adapter.encrypt(12345))
  })

  test('fail to decrypt a value encrypted with another key', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)
    const otherAdapter = new PostgreSql('a-completely-different-password')

    const encrypted = await adapter.encrypt('john doe')

    await assert.rejects(() => otherAdapter.decrypt(encrypted))
  })

  test('isEncrypted returns true for a value encrypted with the same key', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)

    assert.isTrue(await adapter.isEncrypted(await adapter.encrypt('john doe')))
  })

  test('isEncrypted returns false for a plain value', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)

    assert.isFalse(await adapter.isEncrypted('john doe'))
  })

  test('isEncrypted returns false instead of throwing on invalid input', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)

    assert.isFalse(await adapter.isEncrypted(null))
    assert.isFalse(await adapter.isEncrypted(undefined))
    assert.isFalse(await adapter.isEncrypted('!!!not base64!!!'))
  })

  test('isEncrypted returns false when the key does not match', async ({ assert }) => {
    const adapter = new PostgreSql(SECRET_KEY)
    const otherAdapter = new PostgreSql('a-completely-different-password')

    assert.isFalse(await otherAdapter.isEncrypted(await adapter.encrypt('john doe')))
  })

  test('a value encrypted by the mysql adapter is not readable', async ({ assert }) => {
    const { default: MySql } = await import('../../src/adapters/mysql.js')

    const mysql = new MySql(SECRET_KEY)
    const postgres = new PostgreSql(SECRET_KEY)

    assert.isFalse(await postgres.isEncrypted(await mysql.encrypt('john doe')))
  })
})
