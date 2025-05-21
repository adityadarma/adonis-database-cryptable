import { Cryptable } from '../types/index.js'

export default class PostgreSql implements Cryptable {
  private key: string

  constructor(key: string) {
    this.key = key
  }

  async encrypt(value: any): Promise<string> {
    const openpgp = await import('openpgp')
    const message = await openpgp.createMessage({ text: value })
    const encryptedBinary = await openpgp.encrypt({
      message,
      passwords: this.key,
      format: 'binary',
      config: {
        preferredSymmetricAlgorithm: openpgp.enums.symmetric.aes256,
        preferredCompressionAlgorithm: openpgp.enums.compression.zip,
      },
    })
    const encrypted = Buffer.from(encryptedBinary as Uint8Array).toString('base64')
    return encrypted
  }

  async decrypt(value: string): Promise<any> {
    const openpgp = await import('openpgp')
    const binaryToDecrypt = Uint8Array.from(Buffer.from(value, 'base64'))
    const decrypted = await openpgp.decrypt({
      message: await openpgp.readMessage({ binaryMessage: binaryToDecrypt }),
      passwords: this.key,
    })
    return decrypted.data
  }

  async isEncrypted(value: any): Promise<boolean> {
    try {
      return (await this.decrypt(value)) !== false ? true : false
    } catch (error) {
      return false
    }
  }
}
