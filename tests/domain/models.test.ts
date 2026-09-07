import { describe, expect, it } from 'vitest'
import { migrateModel } from '../../src/shared/domain/models'
import { DEFAULT_MODEL } from '../../src/shared/types'

describe('migrateModel', () => {
  it('maps legacy DeepSeek names to v4', () => {
    expect(migrateModel('deepseek-chat')).toBe('deepseek-v4-flash')
    expect(migrateModel('deepseek-reasoner')).toBe('deepseek-v4-pro')
  })

  it('keeps current and custom names', () => {
    expect(migrateModel(DEFAULT_MODEL)).toBe(DEFAULT_MODEL)
    expect(migrateModel('deepseek-v4-pro')).toBe('deepseek-v4-pro')
    expect(migrateModel('my-local-model')).toBe('my-local-model')
  })
})
