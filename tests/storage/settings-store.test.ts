import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { FileSettingsStore } from '../../src/main/storage/settings-store'
import { createPassthroughSecretCodec } from '../../src/main/storage/secret-codec'
import { makeTempDir, removeTempDir } from '../helpers/temp-dir'

describe('FileSettingsStore', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) removeTempDir(dir)
  })

  it('persists settings and migrates legacy models', () => {
    const dir = makeTempDir()
    dirs.push(dir)
    const store = new FileSettingsStore(join(dir, 'settings.json'), createPassthroughSecretCodec())
    store.save({
      baseURL: 'https://api.deepseek.com/',
      apiKey: 'sk-test',
      model: 'deepseek-chat'
    })
    const loaded = new FileSettingsStore(
      join(dir, 'settings.json'),
      createPassthroughSecretCodec()
    ).load()
    expect(loaded).toEqual({
      baseURL: 'https://api.deepseek.com/',
      apiKey: 'sk-test',
      model: 'deepseek-v4-flash'
    })
  })
})
