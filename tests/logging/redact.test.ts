import { describe, expect, it } from 'vitest'
import { redactValue } from '../../src/main/logging/redact'

describe('redactValue', () => {
  it('masks api keys and secret fields', () => {
    expect(redactValue('bearer sk-abcdefghijk')).toBe('bearer sk-***')
    expect(
      redactValue({
        apiKey: 'sk-secret',
        nested: { authorization: 'Bearer abc', text: 'ok' }
      })
    ).toEqual({
      apiKey: '[redacted]',
      nested: { authorization: '[redacted]', text: 'ok' }
    })
  })
})
