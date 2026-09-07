import { DEFAULT_BASE_URL, DEFAULT_MODEL, type Settings } from '../../shared/types'
import { migrateModel } from '../../shared/domain/models'
import type { Logger } from '../logging/logger'
import { readJson, writeJsonAtomic } from './json-file'
import type { PersistedSecrets, SecretCodec } from './secret-codec'

export interface SettingsRepository {
  load(): Settings
  save(settings: Settings): Settings
}

interface PersistedSettings extends PersistedSecrets {
  baseURL: string
  model: string
}

export class FileSettingsStore implements SettingsRepository {
  constructor(
    private readonly filePath: string,
    private readonly secrets: SecretCodec,
    private readonly logger?: Logger
  ) {}

  load(): Settings {
    const persisted = readJson<PersistedSettings>(this.filePath, {
      baseURL: DEFAULT_BASE_URL,
      model: DEFAULT_MODEL
    })
    const settings: Settings = {
      baseURL: persisted.baseURL?.trim() || DEFAULT_BASE_URL,
      model: migrateModel(persisted.model?.trim() || DEFAULT_MODEL),
      apiKey: this.secrets.decrypt(persisted)
    }
    this.logger?.debug('settings loaded', {
      baseURL: settings.baseURL,
      model: settings.model,
      hasApiKey: Boolean(settings.apiKey)
    })
    return settings
  }

  save(settings: Settings): Settings {
    const next: Settings = {
      baseURL: settings.baseURL.trim() || DEFAULT_BASE_URL,
      model: settings.model.trim() || DEFAULT_MODEL,
      apiKey: settings.apiKey.trim()
    }
    writeJsonAtomic(this.filePath, {
      baseURL: next.baseURL,
      model: next.model,
      ...this.secrets.encrypt(next.apiKey)
    } satisfies PersistedSettings)
    this.logger?.info('settings saved', {
      baseURL: next.baseURL,
      model: next.model,
      hasApiKey: Boolean(next.apiKey)
    })
    return next
  }
}
