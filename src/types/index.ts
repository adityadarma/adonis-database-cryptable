export type DriverCryptable = 'mysql'

/**
 * Cryptable config
 */
export type CryptableConfig = {
  default: DriverCryptable
  drivers: ['mysql']
  key: string
}

/**
 * Define the disk config. The config object must have a default property
 * pointing to the key within the disk object.
 */
export declare function defineConfig(config: CryptableConfig): CryptableConfig

export type DecoratorStorage = (target: any, property: string) => void

export type StorageDecorator = () => DecoratorStorage

export interface CryptableInterface {
  getKey(): string

  encrypt(value: any): string

  decrypt(value: string): any

  isEncrypted(value: any): boolean
}

export type DecoratorCryptableFn = (target: any, property: string) => void

export type CryptableDecorator = () => DecoratorCryptableFn
