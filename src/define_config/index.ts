import { CryptableConfig, DriverCryptable } from "../types/index.js"

export function defineConfig(config: CryptableConfig): {
  default: DriverCryptable
  drivers: DriverCryptable[]
} {
  return config
}
