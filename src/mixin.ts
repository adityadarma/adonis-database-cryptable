/*
 * adonis-database-cryptable
 *
 * (c) Aditya Darma <adhit.boys1@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import { afterFetch, afterFind, BaseModel, beforeSave } from '@adonisjs/lucid/orm'
import { cryptable } from '../services/main.js'

export function Cryptable<T extends NormalizeConstructor<typeof BaseModel>>(superclass: T) {
  class ModelCryptable extends superclass {
    $cryptable!: string[]

    @beforeSave()
    static async encryptField<K extends ModelCryptable>(field: K): Promise<void> {
      if (field.$cryptable) {
        for (const key of Object.keys(field.$attributes)) {
          if (
            field.$cryptable.includes(key) &&
            field.$attributes[key] !== null &&
            field.$attributes[key] !== undefined &&
            field.$attributes[key] !== ''
          ) {
            const value = await cryptable.encrypt(field.$attributes[key])
            field.$setAttribute(key, value)
          }
        }
      }
    }

    @afterFind()
    static async decryptField<K extends ModelCryptable>(field: K): Promise<void> {
      if (field.$cryptable) {
        for (const key of Object.keys(field.$attributes)) {
          if (
            field.$cryptable.includes(key) &&
            field.$attributes[key] !== null &&
            field.$attributes[key] !== undefined &&
            field.$attributes[key] !== ''
          ) {
            const value = await cryptable.decrypt(field.$attributes[key])
            field.$setAttribute(key, value)
          }
        }
      }
    }

    @afterFetch()
    static async decryptFields<K extends ModelCryptable>(fields: K): Promise<void> {
      for (const field of Object.values(fields)) {
        if (field.$cryptable) {
          for (const key of Object.keys(field.$attributes)) {
            if (
              field.$cryptable.includes(key) &&
              field.$attributes[key] !== null &&
              field.$attributes[key] !== undefined &&
              field.$attributes[key] !== ''
            ) {
              const value = await cryptable.decrypt(field.$attributes[key])
              field.$setAttribute(key, value)
            }
          }
        }
      }
    }
  }
  return ModelCryptable
}
