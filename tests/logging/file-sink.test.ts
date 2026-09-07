import { readFileSync } from 'fs'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { FileLogSink, Logger } from '../../src/main/logging/logger'
import { makeTempDir, removeTempDir } from '../helpers/temp-dir'

describe('FileLogSink', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) removeTempDir(dir)
  })

  it('appends a daily log file', () => {
    const dir = makeTempDir()
    dirs.push(dir)
    const now = new Date('2026-09-07T01:02:03.000Z')
    const logger = new Logger(new FileLogSink(dir, () => now, 7), 'anvil', 'debug')
    logger.info('hello', { model: 'deepseek-v4-flash' })
    const text = readFileSync(join(dir, 'anvil-2026-09-07.log'), 'utf-8')
    expect(text).toContain('[anvil] hello')
    expect(text).toContain('deepseek-v4-flash')
  })
})
