/*
 * adonis-database-cryptable
 *
 * (c) Aditya Darma <adhit.boys1@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { AppFactory } from '@adonisjs/core/factories/app'
import { EmitterFactory } from '@adonisjs/core/factories/events'
import { LoggerFactory } from '@adonisjs/core/factories/logger'
import { setApp } from '@adonisjs/core/services/app'
import type { ApplicationService } from '@adonisjs/core/types'

import type CryptableManager from '../src/manager.js'

/**
 * The 16 bytes key used across the test suite. "aes-128-ecb" used by the
 * MySql adapter requires exactly 16 bytes, so keep this length in sync.
 */
export const SECRET_KEY = 'abcdefghijklmnop'

/**
 * "services/main.ts" resolves the manager from the container using a
 * top level await and caches it in a module level variable. Therefore the
 * application must be booted before any module importing it is loaded, and
 * the bootstrap can only ever happen once per process.
 *
 * Every import of the package source must be dynamic (and placed after
 * "setApp") for the same reason: static imports are hoisted and would
 * otherwise run before the application exists.
 */
let bootstrapped: Promise<{ app: ApplicationService; cryptable: CryptableManager }> | undefined

async function bootstrap() {
  const app = new AppFactory().create(
    new URL('../', import.meta.url),
    (path) => import(path)
  ) as unknown as ApplicationService

  app.useConfig({
    cryptable: {
      key: SECRET_KEY,
      default: 'mysql',
    },
  })

  setApp(app)
  await app.init()

  const { default: CryptableManagerClass } = await import('../src/manager.js')
  app.container.bind('cryptable.manager', async () => {
    return new CryptableManagerClass(SECRET_KEY, 'mysql')
  })

  await app.boot()

  const { cryptable } = await import('../services/main.js')

  return { app, cryptable }
}

/**
 * Returns the booted application along with the resolved cryptable manager.
 * The result is memoized, so calling it from multiple test files is safe.
 */
export function setupApp() {
  if (!bootstrapped) {
    bootstrapped = bootstrap()
  }

  return bootstrapped
}

/**
 * Creates a Lucid database instance backed by in-memory SQLite.
 *
 * The connections are deliberately named "mysql" and "postgres" because both
 * the manager and the query builder macros branch on the connection name. The
 * pool is capped to a single connection, otherwise SQLite would hand out a
 * separate in-memory database per pooled connection.
 */
export async function createDatabase() {
  const { app } = await setupApp()
  const { Database } = await import('@adonisjs/lucid/database')

  const connection = (client: string) => ({
    client,
    connection: { filename: ':memory:' },
    pool: { min: 1, max: 1 },
    useNullAsDefault: true,
  })

  const db = new Database(
    {
      connection: 'mysql',
      connections: {
        mysql: connection('sqlite3'),
        postgres: connection('sqlite3'),
        sqlite: connection('sqlite3'),
      },
    } as any,
    new LoggerFactory().create(),
    new EmitterFactory().create(app) as any
  )

  return db
}

/**
 * Creates the "users" table used by the model based tests on the given
 * connection.
 */
export async function createUsersTable(db: any, connectionName: string) {
  await db.connection(connectionName).schema.createTable('users', (table: any) => {
    table.increments('id')
    table.string('name').nullable()
    table.string('email').nullable()
    table.string('note').nullable()
  })
}
