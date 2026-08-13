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

const { default: MySql } = await import('../../src/adapters/mysql.js')

test.group('Adapters | MySql', () => {
  test('encrypt then decrypt returns the original value', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)

    const encrypted = await adapter.encrypt('john doe')

    assert.notEqual(encrypted, 'john doe')
    assert.equal(await adapter.decrypt(encrypted), 'john doe')
  })

  test('encrypt returns a base64 encoded string', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)

    const encrypted = await adapter.encrypt('john doe')

    assert.isString(encrypted)
    assert.match(encrypted, /^[A-Za-z0-9+/]+={0,2}$/)
  })

  test('encryption is deterministic', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)

    // "aes-128-ecb" has no IV, so the same input always yields the same
    // output. This is what makes "whereEncrypted" lookups possible.
    assert.equal(await adapter.encrypt('john doe'), await adapter.encrypt('john doe'))
  })

  test('different values produce different ciphertexts', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)

    assert.notEqual(await adapter.encrypt('john'), await adapter.encrypt('jane'))
  })

  test('cast non string values to string before encrypting', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)

    assert.equal(await adapter.decrypt(await adapter.encrypt(12345)), '12345')
    assert.equal(await adapter.decrypt(await adapter.encrypt(true)), 'true')
    assert.equal(await adapter.decrypt(await adapter.encrypt(10.5)), '10.5')
  })

  test('handle an empty string', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)

    const encrypted = await adapter.encrypt('')

    assert.equal(await adapter.decrypt(encrypted), '')
  })

  test('handle multi byte characters', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)
    const value = 'héllo 日本 🎉'

    assert.equal(await adapter.decrypt(await adapter.encrypt(value)), value)
  })

  test('handle a value longer than a single cipher block', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)
    const value = 'a'.repeat(500)

    assert.equal(await adapter.decrypt(await adapter.encrypt(value)), value)
  })

  test('use only the first 16 bytes of the key', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)
    const adapterWithLongKey = new MySql(`${SECRET_KEY}this-part-is-ignored`)

    assert.equal(await adapter.encrypt('john doe'), await adapterWithLongKey.encrypt('john doe'))
  })

  test('fail to decrypt a value encrypted with another key', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)
    const otherAdapter = new MySql('ponmlkjihgfedcba')

    const encrypted = await adapter.encrypt('john doe')

    await assert.rejects(() => otherAdapter.decrypt(encrypted))
  })

  test('isEncrypted returns true for a value encrypted with the same key', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)

    assert.isTrue(await adapter.isEncrypted(await adapter.encrypt('john doe')))
  })

  test('isEncrypted returns false for a plain value', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)

    assert.isFalse(await adapter.isEncrypted('john doe'))
  })

  test('isEncrypted returns false instead of throwing on invalid input', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)

    assert.isFalse(await adapter.isEncrypted(null))
    assert.isFalse(await adapter.isEncrypted(undefined))
    assert.isFalse(await adapter.isEncrypted(12345))
    assert.isFalse(await adapter.isEncrypted('!!!not base64!!!'))
  })

  test('isEncrypted returns false when the key does not match', async ({ assert }) => {
    const adapter = new MySql(SECRET_KEY)
    const otherAdapter = new MySql('ponmlkjihgfedcba')

    assert.isFalse(await otherAdapter.isEncrypted(await adapter.encrypt('john doe')))
  })
})
