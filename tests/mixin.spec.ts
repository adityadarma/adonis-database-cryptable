/*
 * adonis-database-cryptable
 *
 * (c) Aditya Darma <adhit.boys1@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { SECRET_KEY, createDatabase, createUsersTable, setupApp } from './helpers.js'

await setupApp()

const { Cryptable } = await import('../src/mixin.js')
const { default: MySql } = await import('../src/adapters/mysql.js')
const { BaseModel, column, Adapter } = await import('@adonisjs/lucid/orm')

test.group('Mixin | Cryptable', (group) => {
  let db: any
  let User: any
  let Plain: any
  const adapter = new MySql(SECRET_KEY)

  group.each.setup(async () => {
    db = await createDatabase()
    BaseModel.useAdapter(new Adapter(db) as any)
    await createUsersTable(db, 'mysql')

    class UserModel extends Cryptable(BaseModel) {
      static table = 'users'
      static connection = 'mysql'

      $cryptable = ['name', 'email']

      @column({ isPrimary: true })
      declare id: number

      @column()
      declare name: string

      @column()
      declare email: string

      @column()
      declare note: string
    }

    /**
     * Same table, but without a "$cryptable" list, to prove the hooks are
     * a no-op when the model does not opt in.
     */
    class PlainModel extends Cryptable(BaseModel) {
      static table = 'users'
      static connection = 'mysql'

      @column({ isPrimary: true })
      declare id: number

      @column()
      declare name: string
    }

    UserModel.boot()
    PlainModel.boot()
    User = UserModel
    Plain = PlainModel

    return () => db.manager.closeAll()
  })

  const rawRow = (id: number) =>
    db.connection('mysql').query().from('users').where('id', id).first()

  test('store the listed fields encrypted', async ({ assert }) => {
    const user = await User.create({ name: 'john doe', email: 'john@example.com' })

    const row = await rawRow(user.id)

    assert.notEqual(row.name, 'john doe')
    assert.notEqual(row.email, 'john@example.com')
    assert.equal(await adapter.decrypt(row.name), 'john doe')
    assert.equal(await adapter.decrypt(row.email), 'john@example.com')
  })

  test('leave the fields outside of $cryptable untouched', async ({ assert }) => {
    const user = await User.create({ name: 'john doe', note: 'not a secret' })

    const row = await rawRow(user.id)

    assert.equal(row.note, 'not a secret')
  })

  test('keep the instance readable right after saving', async ({ assert }) => {
    // "afterSave" decrypts the attributes back, so the instance in memory
    // never holds the ciphertext.
    const user = await User.create({ name: 'john doe', email: 'john@example.com' })

    assert.equal(user.name, 'john doe')
    assert.equal(user.email, 'john@example.com')
  })

  test('decrypt the fields when finding a single row', async ({ assert }) => {
    const created = await User.create({ name: 'john doe', email: 'john@example.com' })

    const user = await User.find(created.id)

    assert.equal(user.name, 'john doe')
    assert.equal(user.email, 'john@example.com')
  })

  test('decrypt the fields when fetching many rows', async ({ assert }) => {
    await User.create({ name: 'john doe', email: 'john@example.com' })
    await User.create({ name: 'jane doe', email: 'jane@example.com' })

    const users = await User.all()

    assert.lengthOf(users, 2)
    assert.deepEqual(users.map((user: any) => user.name).sort(), ['jane doe', 'john doe'])
  })

  test('decrypt the fields when using a query builder', async ({ assert }) => {
    await User.create({ name: 'john doe', email: 'john@example.com' })

    const users = await User.query().where('id', 1)

    assert.equal(users[0].name, 'john doe')
  })

  test('re-encrypt the fields on update', async ({ assert }) => {
    const user = await User.create({ name: 'john doe', email: 'john@example.com' })

    user.name = 'jane doe'
    await user.save()

    const row = await rawRow(user.id)

    assert.notEqual(row.name, 'jane doe')
    assert.equal(await adapter.decrypt(row.name), 'jane doe')
    assert.equal(user.name, 'jane doe')
  })

  test('keep null values as null', async ({ assert }) => {
    const user = await User.create({ name: null, email: 'john@example.com' })

    const row = await rawRow(user.id)

    assert.isNull(row.name)
    assert.isNull(user.name)
  })

  test('keep empty strings as empty strings', async ({ assert }) => {
    const user = await User.create({ name: '', email: 'john@example.com' })

    const row = await rawRow(user.id)

    assert.equal(row.name, '')
    assert.equal(user.name, '')
  })

  test('do nothing when the model has no $cryptable list', async ({ assert }) => {
    const record = await Plain.create({ name: 'john doe' })

    const row = await rawRow(record.id)

    assert.equal(row.name, 'john doe')
    assert.equal(record.name, 'john doe')
  })

  test('encrypt multi byte values', async ({ assert }) => {
    const user = await User.create({ name: 'héllo 日本 🎉', email: 'john@example.com' })

    const found = await User.find(user.id)

    assert.equal(found.name, 'héllo 日本 🎉')
  })

  test('survive a full create, read, update, read cycle', async ({ assert }) => {
    const created = await User.create({ name: 'john doe', email: 'john@example.com' })

    const found = await User.find(created.id)
    found.email = 'updated@example.com'
    await found.save()

    const refetched = await User.find(created.id)

    assert.equal(refetched.name, 'john doe')
    assert.equal(refetched.email, 'updated@example.com')
    const row = await rawRow(created.id)
    assert.equal(await adapter.decrypt(row.email), 'updated@example.com')
  })

  test('expose the mixin hooks as static methods', ({ assert }) => {
    assert.isFunction(User.encryptField)
    assert.isFunction(User.decryptField)
    assert.isFunction(User.decryptFields)
    assert.isFunction(User.decryptSaveField)
  })

  test('extend the given base model', ({ assert }) => {
    const user = new User()

    assert.instanceOf(user, BaseModel)
  })
})
