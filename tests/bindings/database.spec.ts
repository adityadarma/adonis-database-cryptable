/*
 * adonis-database-cryptable
 *
 * (c) Aditya Darma <adhit.boys1@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { SECRET_KEY, createDatabase, setupApp } from '../helpers.js'

await setupApp()

const { defineMethodDatabase } = await import('../../src/bindings/database.js')
const { DatabaseQueryBuilder } = await import('@adonisjs/lucid/database')

defineMethodDatabase(DatabaseQueryBuilder)

test.group('Bindings | database query builder', (group) => {
  let db: any

  group.setup(async () => {
    db = await createDatabase()
    return () => db.manager.closeAll()
  })

  const query = (connection: string) => db.connection(connection).query().from('users') as any

  test('register the macros on the database query builder', ({ assert }) => {
    const builder = query('mysql')

    assert.isFunction(builder.whereEncrypted)
    assert.isFunction(builder.orWhereEncrypted)
    assert.isFunction(builder.orderByEncrypted)
  })

  test('whereEncrypted builds an AES_DECRYPT clause on mysql', ({ assert }) => {
    const sql = query('mysql').whereEncrypted('name', 'john doe').toQuery()

    assert.include(sql, `AES_DECRYPT(FROM_BASE64(name), '${SECRET_KEY}')`)
    assert.include(sql, 'USING utf8mb4')
    assert.include(sql, `= 'john doe'`)
  })

  test('whereEncrypted builds a pgp_sym_decrypt clause on postgres', ({ assert }) => {
    const sql = query('postgres').whereEncrypted('name', 'john doe').toQuery()

    assert.include(sql, `pgp_sym_decrypt(decode(name,'base64')::bytea , '${SECRET_KEY}')`)
    assert.include(sql, `'UTF-8'`)
    assert.include(sql, `= 'john doe'`)
  })

  test('whereEncrypted defaults the operator to "="', ({ assert }) => {
    const withDefault = query('mysql').whereEncrypted('name', 'john doe').toQuery()
    const explicit = query('mysql').whereEncrypted('name', '=', 'john doe').toQuery()

    assert.equal(withDefault, explicit)
  })

  test('whereEncrypted honours a custom operator', ({ assert }) => {
    const sql = query('mysql').whereEncrypted('name', 'like', '%john%').toQuery()

    assert.include(sql, `like '%john%'`)
  })

  test('orWhereEncrypted appends an "or" clause', ({ assert }) => {
    const sql = query('mysql')
      .whereEncrypted('name', 'john')
      .orWhereEncrypted('email', 'jane@example.com')
      .toQuery()

    assert.include(sql, ' or ')
    assert.include(sql, `AES_DECRYPT(FROM_BASE64(email), '${SECRET_KEY}')`)
  })

  test('orWhereEncrypted works on postgres', ({ assert }) => {
    const sql = query('postgres')
      .whereEncrypted('name', 'john')
      .orWhereEncrypted('email', 'jane@example.com')
      .toQuery()

    assert.include(sql, ' or ')
    assert.include(sql, `pgp_sym_decrypt(decode(email,'base64')::bytea , '${SECRET_KEY}')`)
  })

  test('orWhereEncrypted defaults the operator to "="', ({ assert }) => {
    const withDefault = query('mysql').orWhereEncrypted('name', 'john doe').toQuery()
    const explicit = query('mysql').orWhereEncrypted('name', '=', 'john doe').toQuery()

    assert.equal(withDefault, explicit)
  })

  test('orderByEncrypted decrypts the column on mysql', ({ assert }) => {
    const sql = query('mysql').orderByEncrypted('name', 'desc').toQuery()

    assert.include(sql, 'order by')
    assert.include(sql, `AES_DECRYPT(FROM_BASE64(name), '${SECRET_KEY}')`)
    assert.include(sql, 'desc')
  })

  test('orderByEncrypted lowercases the value on postgres', ({ assert }) => {
    const sql = query('postgres').orderByEncrypted('name', 'asc').toQuery()

    assert.include(sql, 'order by')
    assert.include(sql, 'lower(convert_from(')
    assert.include(sql, 'asc')
  })

  test('leave the query untouched on an unsupported connection', ({ assert }) => {
    const plain = query('sqlite').toQuery()

    assert.equal(query('sqlite').whereEncrypted('name', 'john').toQuery(), plain)
    assert.equal(query('sqlite').orWhereEncrypted('name', 'john').toQuery(), plain)
    assert.equal(query('sqlite').orderByEncrypted('name', 'asc').toQuery(), plain)
  })

  test('return the builder to keep the chain fluent', ({ assert }) => {
    const builder = query('mysql')

    assert.strictEqual(builder.whereEncrypted('name', 'john'), builder)
    assert.strictEqual(builder.orWhereEncrypted('name', 'john'), builder)
    assert.strictEqual(builder.orderByEncrypted('name', 'asc'), builder)
  })

  test('combine with the regular query builder methods', ({ assert }) => {
    const sql = query('mysql')
      .select('id')
      .where('id', '>', 1)
      .whereEncrypted('name', 'john')
      .orderByEncrypted('name', 'asc')
      .limit(10)
      .toQuery()

    assert.include(sql, 'select `id`')
    assert.include(sql, 'where `id` > 1')
    assert.include(sql, 'AES_DECRYPT')
    assert.include(sql, 'order by')
    assert.include(sql, 'limit 10')
  })
})
