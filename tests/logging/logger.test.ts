import { describe, expect, it } from 'vitest'
import { Logger, MemoryLogSink, parseLogLevel } from '../../src/main/logging/logger'

describe('Logger', () => {
  it('writes redacted structured records above min level', () => {
    const sink = new MemoryLogSink()
    const logger = new Logger(sink, 'anvil', 'info').child('chat')
    logger.debug('skip me')
    logger.info('chat send', { apiKey: 'sk-secret', model: 'deepseek-v4-flash' })
    expect(sink.records).toHaveLength(1)
    expect(sink.records[0]).toMatchObject({
      level: 'info',
      scope: 'anvil.chat',
      message: 'chat send'
    })
    expect(sink.records[0].context).toEqual({
      apiKey: '[redacted]',
      model: 'deepseek-v4-flash'
    })
  })

  it('parses log levels', () => {
    expect(parseLogLevel('debug')).toBe('debug')
    expect(parseLogLevel('nope', 'warn')).toBe('warn')
  })
})
