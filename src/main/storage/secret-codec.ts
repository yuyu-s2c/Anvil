export interface PersistedSecrets {
  apiKeyEnc?: string
  apiKeyPlain?: string
}

export interface SecretCodec {
  encrypt(plain: string): PersistedSecrets
  decrypt(persisted: PersistedSecrets): string
}

export function createPassthroughSecretCodec(): SecretCodec {
  return {
    encrypt(plain: string) {
      return plain ? { apiKeyPlain: plain } : {}
    },
    decrypt(persisted) {
      return persisted.apiKeyPlain ?? ''
    }
  }
}
