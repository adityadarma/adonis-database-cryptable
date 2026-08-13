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

const { defineMethodModel } = await import('../../src/bindings/model.js')
const { BaseModel, column, Adapter, ModelQueryBuilder } = await import('@adonisjs/lucid/orm')

defineMethodModel(ModelQueryBuilder)

test.group('Bindings | model query builder', (group) => {
  let MysqlUser: any
  let PostgresUser: any
  let SqliteUser: any

  group.setup(async () => {
    const db = await createDatabase()
    BaseModel.useAdapter(new Adapter(db) as any)

    /**
     * One model per connection, all sharing the same macros. This is what
     * the per driver bindings could not support.
     */
    const modelFor = (connectionName: string) => {
      class UserModel extends BaseModel {
        static table = 'users'
        static connection = connectionName

        @column({ isPrimary: true })
        declare id: number

        @column()
        declare name: string

        @column()
        declare email: string
      }

      UserModel.boot()
      return UserModel
    }

    MysqlUser = modelFor('mysql')
    PostgresUser = modelFor('postgres')
    SqliteUser = modelFor('sqlite')

    return () => db.manager.closeAll()
  })

  test('register the macros on the model query builder', ({ assert }) => {
    const builder = MysqlUser.query() as any

    assert.isFunction(builder.whereEncrypted)
    assert.isFunction(builder.orWhereEncrypted)
    assert.isFunction(builder.orderByEncrypted)
  })

  test('mysql | whereEncrypted builds an AES_DECRYPT clause', ({ assert }) => {
    const sql = (MysqlUser.query() as any).whereEncrypted('name', 'john doe').toQuery()

    assert.include(sql, `AES_DECRYPT(FROM_BASE64(name), '${SECRET_KEY}')`)
    assert.include(sql, 'USING utf8mb4')
    assert.include(sql, `= 'john doe'`)
  })

  test('mysql | whereEncrypted defaults the operator to "="', ({ assert }) => {
    assert.equal(
      (MysqlUser.query() as any).whereEncrypted('name', 'john doe').toQuery(),
      (MysqlUser.query() as any).whereEncrypted('name', '=', 'john doe').toQuery()
    )
  })

  test('mysql | whereEncrypted honours a custom operator', ({ assert }) => {
    const sql = (MysqlUser.query() as any).whereEncrypted('name', 'like', '%john%').toQuery()

    assert.include(sql, `like '%john%'`)
  })

  test('mysql | orWhereEncrypted appends an "or" clause', ({ assert }) => {
    const sql = (MysqlUser.query() as any)
      .whereEncrypted('name', 'john')
      .orWhereEncrypted('email', 'jane@example.com')
      .toQuery()

    assert.include(sql, ' or ')
    assert.include(sql, `AES_DECRYPT(FROM_BASE64(email), '${SECRET_KEY}')`)
  })

  test('mysql | orWhereEncrypted defaults the operator to "="', ({ assert }) => {
    assert.equal(
      (MysqlUser.query() as any).orWhereEncrypted('name', 'john doe').toQuery(),
      (MysqlUser.query() as any).orWhereEncrypted('name', '=', 'john doe').toQuery()
    )
  })

  test('mysql | orderByEncrypted decrypts the column', ({ assert }) => {
    const sql = (MysqlUser.query() as any).orderByEncrypted('name', 'desc').toQuery()

    assert.include(sql, 'order by')
    assert.include(sql, `AES_DECRYPT(FROM_BASE64(name), '${SECRET_KEY}')`)
    assert.include(sql, 'desc')
    assert.notInclude(sql, 'lower(')
  })

  test('postgres | whereEncrypted builds a pgp_sym_decrypt clause', ({ assert }) => {
    const sql = (PostgresUser.query() as any).whereEncrypted('name', 'john doe').toQuery()

    assert.include(sql, `pgp_sym_decrypt(decode(name,'base64')::bytea , '${SECRET_KEY}')`)
    assert.include(sql, `'UTF-8'`)
    assert.include(sql, `= 'john doe'`)
  })

  test('postgres | whereEncrypted defaults the operator to "="', ({ assert }) => {
    assert.equal(
      (PostgresUser.query() as any).whereEncrypted('name', 'john doe').toQuery(),
      (PostgresUser.query() as any).whereEncrypted('name', '=', 'john doe').toQuery()
    )
  })

  test('postgres | whereEncrypted honours a custom operator', ({ assert }) => {
    const sql = (PostgresUser.query() as any).whereEncrypted('name', 'like', '%john%').toQuery()

    assert.include(sql, `like '%john%'`)
  })

  test('postgres | orWhereEncrypted appends an "or" clause', ({ assert }) => {
    const sql = (PostgresUser.query() as any)
      .whereEncrypted('name', 'john')
      .orWhereEncrypted('email', 'jane@example.com')
      .toQuery()

    assert.include(sql, ' or ')
    assert.include(sql, `pgp_sym_decrypt(decode(email,'base64')::bytea , '${SECRET_KEY}')`)
  })

  test('postgres | orWhereEncrypted defaults the operator to "="', ({ assert }) => {
    assert.equal(
      (PostgresUser.query() as any).orWhereEncrypted('name', 'john doe').toQuery(),
      (PostgresUser.query() as any).orWhereEncrypted('name', '=', 'john doe').toQuery()
    )
  })

  test('postgres | orderByEncrypted lowercases the decrypted column', ({ assert }) => {
    const sql = (PostgresUser.query() as any).orderByEncrypted('name', 'asc').toQuery()

    assert.include(sql, 'order by')
    assert.include(sql, 'lower(convert_from(')
    assert.include(sql, 'asc')
  })

  test('serve both drivers at the same time', ({ assert }) => {
    // The macros resolve the expression per connection, so a single
    // registration is correct for every driver in the process.
    const mysql = (MysqlUser.query() as any).whereEncrypted('name', 'john').toQuery()
    const postgres = (PostgresUser.query() as any).whereEncrypted('name', 'john').toQuery()

    assert.include(mysql, 'AES_DECRYPT')
    assert.notInclude(mysql, 'pgp_sym_decrypt')

    assert.include(postgres, 'pgp_sym_decrypt')
    assert.notInclude(postgres, 'AES_DECRYPT')
  })

  test('stay correct when the same driver is queried again', ({ assert }) => {
    const first = (MysqlUser.query() as any).whereEncrypted('name', 'john').toQuery()
    void (PostgresUser.query() as any).whereEncrypted('name', 'john').toQuery()
    const second = (MysqlUser.query() as any).whereEncrypted('name', 'john').toQuery()

    assert.equal(first, second)
  })

  test('leave the query untouched on an unsupported connection', ({ assert }) => {
    const plain = (SqliteUser.query() as any).toQuery()

    assert.equal((SqliteUser.query() as any).whereEncrypted('name', 'john').toQuery(), plain)
    assert.equal((SqliteUser.query() as any).orWhereEncrypted('name', 'john').toQuery(), plain)
    assert.equal((SqliteUser.query() as any).orderByEncrypted('name', 'asc').toQuery(), plain)
  })

  test('return the builder to keep the chain fluent', ({ assert }) => {
    const builder = MysqlUser.query() as any

    assert.strictEqual(builder.whereEncrypted('name', 'john'), builder)
    assert.strictEqual(builder.orWhereEncrypted('name', 'john'), builder)
    assert.strictEqual(builder.orderByEncrypted('name', 'asc'), builder)
  })

  test('return the builder on an unsupported connection too', ({ assert }) => {
    const builder = SqliteUser.query() as any

    assert.strictEqual(builder.whereEncrypted('name', 'john'), builder)
    assert.strictEqual(builder.orWhereEncrypted('name', 'john'), builder)
    assert.strictEqual(builder.orderByEncrypted('name', 'asc'), builder)
  })

  test('combine with the regular model query builder methods', ({ assert }) => {
    const sql = (MysqlUser.query() as any)
      .select('id')
      .where('id', '>', 1)
      .whereEncrypted('name', 'john')
      .orderByEncrypted('name', 'asc')
      .limit(10)
      .toQuery()

    assert.include(sql, 'where `id` > 1')
    assert.include(sql, 'AES_DECRYPT')
    assert.include(sql, 'order by')
    assert.include(sql, 'limit 10')
  })
})
