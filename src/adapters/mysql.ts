import { createCipheriv, createDecipheriv } from 'node:crypto'
import { Cryptable } from '../types/index.js'
import * as _ from 'lodash'

export default class MySql implements Cryptable {
  private algorithm: string
  private key: string

  constructor(key: string) {
    this.key = key
    this.algorithm = 'aes-128-ecb'
  }

  getKey(): string {
    return this.key
  }

  async encrypt(value: any): Promise<string> {
    const cipher = createCipheriv(this.algorithm, this.getKey(), null)
    let encrypted = cipher.update(
      _.cloneDeepWith(value, (val) => val.toString()),
      'utf8',
      'base64'
    )
    encrypted += cipher.final('base64')
    return encrypted
  }

  async decrypt(value: string): Promise<any> {
    const decipher = createDecipheriv(this.algorithm, this.getKey(), null)
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
