import { createCipheriv, createDecipheriv } from 'node:crypto'
import { Cryptable } from '../types/index.js'
import * as _ from 'lodash'

export default class MySql implements Cryptable {
  private algorithm: string
  private key: Buffer

  constructor(key: string) {
    this.algorithm = 'aes-128-ecb'
    this.key = Buffer.from(key).slice(0, 16)
  }

  async encrypt(value: any): Promise<string> {
    if (typeof value !== 'string') {
      value = value.toString()
    }
    const cipher = createCipheriv(this.algorithm, this.key, null)
    let encrypted = cipher.update(value, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return encrypted
  }

  async decrypt(value: string): Promise<any> {
    const decipher = createDecipheriv(this.algorithm, this.key, null)
    let decrypted = decipher.update(value, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  async isEncrypted(value: any): Promise<boolean> {
    try {
      return (await this.decrypt(value)) !== false ? true : false
    } catch (error) {
      return false
    }
  }
}
