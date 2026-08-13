/*
 * adonis-database-cryptable
 *
 * (c) Aditya Darma <adhit.boys1@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { defineConfig } from '../src/define_config/index.js'

test.group('Define config', () => {
  test('return the config as it is', ({ assert }) => {
    const config = defineConfig({ key: 'abcdefghijklmnop', default: 'mysql' })

    assert.deepEqual(config, { key: 'abcdefghijklmnop', default: 'mysql' })
  })

  test('accept the postgres driver', ({ assert }) => {
    const config = defineConfig({ key: 'abcdefghijklmnop', default: 'postgres' })

    assert.equal(config.default, 'postgres')
  })

  test('preserve the object reference', ({ assert }) => {
    const input = { key: 'abcdefghijklmnop', default: 'mysql' } as const

    assert.strictEqual(defineConfig(input), input)
  })
})
