import MySql from '../adapters/mysql.js'
import PostgreSql from '../adapters/postgres.js'

/**
 * Cryptable config
 */
export type CryptableConfig<Driver extends CryptableDriverName> = {
  key: string
  default: Driver
}

export type CryptableDriverName = 'mysql' | 'postgres'

export type CryptableDriver = MySql | PostgreSql

export interface Cryptable {
  // getKey(): string

  encrypt(value: any): Promise<string>

  decrypt(value: string): Promise<any>

  isEncrypted(value: any): Promise<boolean>
}
