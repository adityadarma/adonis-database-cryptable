import { CryptableDecorator } from '../types/index.js'
import { BaseModel } from '@adonisjs/lucid/orm'
import { cryptable } from '@adityadarma/adonis-database-cryptable/cryptable'

export const columnCryptable: CryptableDecorator = () => {
  return function decorateAsColumn(target, property) {
    const Model = target.constructor as typeof BaseModel
    Model.boot()

    Model.$addColumn(property, {
      consume: (value) => cryptable.decrypt(value),
      prepare: (value) => (value ? cryptable.encrypt(value) : null),
    })
  }
}
