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

const { defineMethodModelMySql } = await import('../../src/bindings/model_mysql.js')
const { defineMethodModelPostgres } = await import('../../src/bindings/model_postgres.js')
const { BaseModel, column, Adapter, ModelQueryBuilder } = await import('@adonisjs/lucid/orm')

test.group('Bindings | model query builder', (group) => {
  let User: any

  group.setup(async () => {
    const db = await createDatabase()
    BaseModel.useAdapter(new Adapter(db) as any)

    class UserModel extends BaseModel {
      static table = 'users'
      static connection = 'mysql'

      @column({ isPrimary: true })
      declare id: number

      @column()
      declare name: string

      @column()
      declare email: string
    }

    UserModel.boot()
    User = UserModel

    return () => db.manager.closeAll()
  })

  /**
   * Both binding files register macros under the same names on the shared
   * "ModelQueryBuilder" prototype, so the driver under test has to be
   * re-applied before every assertion.
   */
  const query = (driver: 'mysql' | 'postgres') => {
    if (driver === 'mysql') {
      defineMethodModelMySql(ModelQueryBuilder)
    } else {
      defineMethodModelPostgres(ModelQueryBuilder)
    }

    return User.query() as any
  }

  test('register the macros on the model query builder', ({ assert }) => {
    const builder = query('mysql')

    assert.isFunction(builder.whereEncrypted)
    assert.isFunction(builder.orWhereEncrypted)
    assert.isFunction(builder.orderByEncrypted)
  })

  test('mysql | whereEncrypted builds an AES_DECRYPT clause', ({ assert }) => {
    const sql = query('mysql').whereEncrypted('name', 'john doe').toQuery()

    assert.include(sql, `AES_DECRYPT(FROM_BASE64(name), '${SECRET_KEY}')`)
    assert.include(sql, 'USING utf8mb4')
    assert.include(sql, `= 'john doe'`)
  })

  test('mysql | whereEncrypted defaults the operator to "="', ({ assert }) => {
    assert.equal(
      query('mysql').whereEncrypted('name', 'john doe').toQuery(),
      query('mysql').whereEncrypted('name', '=', 'john doe').toQuery()
    )
  })

  test('mysql | whereEncrypted honours a custom operator', ({ assert }) => {
    const sql = query('mysql').whereEncrypted('name', 'like', '%john%').toQuery()

    assert.include(sql, `like '%john%'`)
  })

  test('mysql | orWhereEncrypted appends an "or" clause', ({ assert }) => {
    const sql = query('mysql')
      .whereEncrypted('name', 'john')
      .orWhereEncrypted('email', 'jane@example.com')
      .toQuery()

    assert.include(sql, ' or ')
    assert.include(sql, `AES_DECRYPT(FROM_BASE64(email), '${SECRET_KEY}')`)
  })

  test('mysql | orWhereEncrypted defaults the operator to "="', ({ assert }) => {
    assert.equal(
      query('mysql').orWhereEncrypted('name', 'john doe').toQuery(),
      query('mysql').orWhereEncrypted('name', '=', 'john doe').toQuery()
    )
  })

  test('mysql | orderByEncrypted decrypts the column', ({ assert }) => {
    const sql = query('mysql').orderByEncrypted('name', 'desc').toQuery()

    assert.include(sql, 'order by')
    assert.include(sql, `AES_DECRYPT(FROM_BASE64(name), '${SECRET_KEY}')`)
    assert.include(sql, 'desc')
  })

  test('postgres | whereEncrypted builds a pgp_sym_decrypt clause', ({ assert }) => {
    const sql = query('postgres').whereEncrypted('name', 'john doe').toQuery()

    assert.include(sql, `pgp_sym_decrypt(decode(name,'base64')::bytea , '${SECRET_KEY}')`)
    assert.include(sql, `'UTF-8'`)
    assert.include(sql, `= 'john doe'`)
  })

  test('postgres | whereEncrypted defaults the operator to "="', ({ assert }) => {
    assert.equal(
      query('postgres').whereEncrypted('name', 'john doe').toQuery(),
      query('postgres').whereEncrypted('name', '=', 'john doe').toQuery()
    )
  })

  test('postgres | whereEncrypted honours a custom operator', ({ assert }) => {
    const sql = query('postgres').whereEncrypted('name', 'like', '%john%').toQuery()

    assert.include(sql, `like '%john%'`)
  })

  test('postgres | orWhereEncrypted appends an "or" clause', ({ assert }) => {
    const sql = query('postgres')
      .whereEncrypted('name', 'john')
      .orWhereEncrypted('email', 'jane@example.com')
      .toQuery()

    assert.include(sql, ' or ')
    assert.include(sql, `pgp_sym_decrypt(decode(email,'base64')::bytea , '${SECRET_KEY}')`)
  })

  test('postgres | orWhereEncrypted defaults the operator to "="', ({ assert }) => {
    assert.equal(
      query('postgres').orWhereEncrypted('name', 'john doe').toQuery(),
      query('postgres').orWhereEncrypted('name', '=', 'john doe').toQuery()
    )
  })

  test('postgres | orderByEncrypted lowercases the decrypted column', ({ assert }) => {
    const sql = query('postgres').orderByEncrypted('name', 'asc').toQuery()

    assert.include(sql, 'order by')
    assert.include(sql, 'lower(convert_from(')
    assert.include(sql, 'asc')
  })

  test('return the builder to keep the chain fluent', ({ assert }) => {
    const builder = query('mysql')

    assert.strictEqual(builder.whereEncrypted('name', 'john'), builder)
    assert.strictEqual(builder.orWhereEncrypted('name', 'john'), builder)
    assert.strictEqual(builder.orderByEncrypted('name', 'asc'), builder)
  })

  test('combine with the regular model query builder methods', ({ assert }) => {
    const sql = query('mysql')
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

  test('the binding applied last wins on the shared prototype', ({ assert }) => {
    // Both bindings patch the same prototype under the same names, so they
    // cannot be active at once. The manager re-applies the right one on
    // every "use()" call, which is what keeps this safe in practice.
    defineMethodModelMySql(ModelQueryBuilder)
    defineMethodModelPostgres(ModelQueryBuilder)

    const sql = (User.query() as any).whereEncrypted('name', 'john').toQuery()

    assert.include(sql, 'pgp_sym_decrypt')
    assert.notInclude(sql, 'AES_DECRYPT')
  })

  test('re-applying the mysql binding takes the prototype back over', ({ assert }) => {
    defineMethodModelPostgres(ModelQueryBuilder)
    defineMethodModelMySql(ModelQueryBuilder)

    const sql = (User.query() as any).whereEncrypted('name', 'john').toQuery()

    assert.include(sql, 'AES_DECRYPT')
    assert.notInclude(sql, 'pgp_sym_decrypt')
  })
})
