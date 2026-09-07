import { safeStorage } from 'electron'
import type { PersistedSecrets, SecretCodec } from './secret-codec'

export function createElectronSecretCodec(): SecretCodec {
  return {
    encrypt(plain: string) {
      if (!plain) return {}
      if (safeStorage.isEncryptionAvailable()) {
        return { apiKeyEnc: safeStorage.encryptString(plain).toString('base64') }
      }
      return { apiKeyPlain: plain }
    },
    decrypt(persisted: PersistedSecrets) {
      if (persisted.apiKeyEnc) {
        try {
          return safeStorage.decryptString(Buffer.from(persisted.apiKeyEnc, 'base64'))
        } catch {
          return persisted.apiKeyPlain ?? ''
        }
      }
      return persisted.apiKeyPlain ?? ''
    }
  }
}
