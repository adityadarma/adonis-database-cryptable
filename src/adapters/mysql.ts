import { CryptableInterface } from '../types/index.js'
import { createCipheriv, createDecipheriv } from 'node:crypto'

export default class MySql implements CryptableInterface {
  private algorithm: string
  private key: Buffer
  private iv: null

  constructor(key: string) {
    this.algorithm = 'aes-128-ecb'
    this.key = Buffer.from(key).slice(0, 16)
    this.iv = null
  }

  getKey(): string {
    return this.key.toString()
  }

  encrypt(value: any): string {
    if (typeof value !== 'string') {
      value = value.toString()
    }
    const cipher = createCipheriv(this.algorithm, this.key, this.iv)
    let encrypted = cipher.update(value, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return encrypted
  }

  decrypt(encryptedValue: string): any {
    const decipher = createDecipheriv(this.algorithm, this.key, this.iv)
    let decrypted = decipher.update(encryptedValue, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  isEncrypted(value: any): boolean {
    try {
      return this.decrypt(value) !== false ? true : false
    } catch (error) {
      return false
    }
  }
}
