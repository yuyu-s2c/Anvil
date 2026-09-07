import { describe, expect, it } from 'vitest'
import { toApiMessages } from '../../src/shared/domain/messages'
import type { ChatMessage } from '../../src/shared/types'

describe('toApiMessages', () => {
  it('drops empty content and keeps role/text only', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'hi', createdAt: 1 },
      { id: '2', role: 'assistant', content: '  ', reasoningContent: 'think', createdAt: 2 },
      { id: '3', role: 'assistant', content: 'hello', reasoningContent: 'hidden', createdAt: 3 }
    ]
    expect(toApiMessages(messages)).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' }
    ])
  })
})
