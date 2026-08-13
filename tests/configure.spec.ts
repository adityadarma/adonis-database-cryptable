/*
 * adonis-database-cryptable
 *
 * (c) Aditya Darma <adhit.boys1@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { test } from '@japa/runner'
import { AceFactory } from '@adonisjs/core/factories/core/ace'
import { setupApp } from './helpers.js'

await setupApp()

const { configure } = await import('../configure.js')
const { default: ConfigureCommand } = await import('@adonisjs/core/commands/configure')

/**
 * Scaffolds a throwaway AdonisJS application on disk and runs the package
 * "configure" hook against it.
 *
 * A "tsconfig.json" is required in the app root, otherwise the codemods
 * cannot create the ts-morph project and silently skip the rc file update.
 */
async function runConfigure() {
  const root = await mkdtemp(join(tmpdir(), 'cryptable-configure-'))

  await mkdir(join(root, 'config'), { recursive: true })
  await writeFile(
    join(root, 'adonisrc.ts'),
    [
      `import { defineConfig } from '@adonisjs/core/app'`,
      ``,
      `export default defineConfig({`,
      `  providers: [],`,
      `})`,
      ``,
    ].join('\n')
  )
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'test-app', type: 'module' }))
  await writeFile(
    join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: { module: 'NodeNext', moduleResolution: 'NodeNext', target: 'ESNext' },
    })
  )

  const ace = await new AceFactory().make(new URL(`${pathToFileURL(root).href}/`), {
    importer: (path: string) => import(path),
  })

  await ace.app.init()
  await ace.app.boot()
  ace.ui.switchMode('raw')

  const command = await ace.create(ConfigureCommand, ['@adityadarma/adonis-database-cryptable'])
  await configure(command as any)

  return {
    root,
    logs: ace.ui.logger.getLogs().map((log: any) => log.message),
    read: (file: string) => readFile(join(root, file), 'utf8'),
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}

test.group('Configure', () => {
  test('publish the config file', async ({ assert }) => {
    const result = await runConfigure()

    try {
      const config = await result.read('config/cryptable.ts')

      assert.include(config, `from '@adityadarma/adonis-database-cryptable'`)
      assert.include(config, 'defineConfig(')
      assert.include(config, `key: env.get('APP_KEY')`)
      assert.include(config, `default: 'mysql'`)
    } finally {
      await result.cleanup()
    }
  }).timeout(20000)

  test('register the provider inside the rc file', async ({ assert }) => {
    const result = await runConfigure()

    try {
      const rcFile = await result.read('adonisrc.ts')

      assert.include(rcFile, `import('@adityadarma/adonis-database-cryptable/cryptable_provider')`)
    } finally {
      await result.cleanup()
    }
  }).timeout(20000)

  test('report both codemods as done', async ({ assert }) => {
    const result = await runConfigure()

    try {
      const logs = result.logs.join('\n')

      assert.include(logs, 'create config/cryptable.ts')
      assert.include(logs, 'update adonisrc.ts file')
    } finally {
      await result.cleanup()
    }
  }).timeout(20000)

  test('publish a config file that matches the exported defineConfig', async ({ assert }) => {
    const result = await runConfigure()

    try {
      const config = await result.read('config/cryptable.ts')
      const { defineConfig } = await import('../src/define_config/index.js')

      // Mirrors the published stub to keep the two in sync.
      assert.deepEqual(defineConfig({ key: 'app-key', default: 'mysql' }), {
        key: 'app-key',
        default: 'mysql',
      })
      assert.include(config, 'export default cryptableConfig')
    } finally {
      await result.cleanup()
    }
  }).timeout(20000)
})
