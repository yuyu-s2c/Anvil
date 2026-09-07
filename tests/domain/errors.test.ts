import { describe, expect, it } from 'vitest'
import { formatChatError, getErrorStatus, isAbortError } from '../../src/shared/domain/errors'

describe('formatChatError', () => {
  it('maps HTTP statuses', () => {
    expect(formatChatError({ status: 401, message: 'nope' })).toBe('API Key 无效，请在设置中检查。')
    expect(formatChatError({ status: 402 })).toBe('额度不足，请检查账户余额。')
    expect(formatChatError({ status: 429 })).toBe('请求过于频繁，请稍后再试。')
    expect(formatChatError({ status: 500, message: 'boom' })).toBe('boom')
    expect(formatChatError({ status: 500 })).toBe('请求失败（500）')
  })

  it('maps network and abort errors', () => {
    expect(formatChatError(new Error('fetch failed'))).toBe('网络连接失败，请检查网络或 Base URL。')
    const abort = new Error('aborted')
    abort.name = 'AbortError'
    expect(isAbortError(abort)).toBe(true)
    expect(formatChatError(abort)).toBe('已停止生成')
  })

  it('reads status from duck-typed errors', () => {
    expect(getErrorStatus({ status: 401 })).toBe(401)
    expect(getErrorStatus(new Error('x'))).toBeUndefined()
  })
})
