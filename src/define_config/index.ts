import { CryptableConfig, CryptableDriverName } from '../types/index.js'

export function defineConfig<Driver extends CryptableDriverName>(
  config: CryptableConfig<Driver>
): CryptableConfig<Driver> {
  return config
}
