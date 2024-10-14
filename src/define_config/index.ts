import { CryptableConfig } from '../types/index.js'

export function defineConfig<CryptableDriver extends string[]>(
  config: CryptableConfig<CryptableDriver>
): CryptableConfig<CryptableDriver> {
  return config
}
