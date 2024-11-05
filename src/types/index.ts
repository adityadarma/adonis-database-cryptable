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

export interface Cryptable {
  getKey(): string

  encrypt(value: any): Promise<string>

  decrypt(value: string): Promise<any>

  isEncrypted(value: any): Promise<boolean>
}
