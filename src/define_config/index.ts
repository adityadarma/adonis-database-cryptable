import { CryptableConfig, DriverCryptable } from '../types/index.js'

export function defineConfig(config: CryptableConfig): {
  key: string
  default: DriverCryptable
  drivers: DriverCryptable[]
} {
  return config
}
