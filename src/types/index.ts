export type DriverCryptable = 'mysql' | 'mariadb';

/**
 * Cryptable config
 */
export type CryptableConfig = {
  default: DriverCryptable
  drivers: ['mysql','mariadb']
}

/**
 * Define the disk config. The config object must have a default property
 * pointing to the key within the disk object.
 */
export declare function defineConfig(
  config: CryptableConfig
): CryptableConfig

export type DecoratorStorage = (target: any, property: string) => void

export type StorageDecorator = () => DecoratorStorage
