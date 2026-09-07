import { describe, expect, it } from 'vitest'
import {
  createEmptyConversation,
  lastPreview,
  titleFromPrompt,
  toConversationSummary
} from '../../src/shared/domain/conversation'

describe('titleFromPrompt', () => {
  it('uses compact text and truncates long prompts', () => {
    expect(titleFromPrompt('  hello   world  ')).toBe('hello world')
    expect(titleFromPrompt('')).toBe('新对话')
    expect(titleFromPrompt('abcdefghijklmnopqrstuvwxyz')).toBe('abcdefghijklmnopqrstuvwx…')
  })
})

describe('conversation summary', () => {
  it('falls back when there are no messages', () => {
    const conversation = createEmptyConversation(1, 'c1')
    expect(lastPreview(conversation)).toBe('暂无消息')
    expect(toConversationSummary(conversation).preview).toBe('暂无消息')
  })

  it('uses the latest non-empty message', () => {
    const conversation = createEmptyConversation(1, 'c1')
    conversation.messages = [
      { id: '1', role: 'user', content: 'first', createdAt: 1 },
      { id: '2', role: 'assistant', content: '   ', createdAt: 2 },
      { id: '3', role: 'assistant', content: 'later answer', createdAt: 3 }
    ]
    expect(lastPreview(conversation)).toBe('later answer')
  })
})
