/**
 * Cryptable config
 */
export type CryptableConfig<CryptableDriver extends string[]> = {
  key: string
  default: CryptableDriver[number]
  drivers: CryptableDriver
}

export type DecoratorCryptableFn = (target: any, property: string) => void

export type CryptableDecorator = () => DecoratorCryptableFn

export interface CryptableInterface {
  getKey(): string

  encrypt(value: any): string

  decrypt(value: string): any

  isEncrypted(value: any): boolean
}
