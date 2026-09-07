import type { ChatMessage, Conversation, ConversationSummary } from '../types'

export function titleFromPrompt(prompt: string): string {
  const compact = prompt.replace(/\s+/g, ' ').trim()
  if (!compact) return '新对话'
  return compact.length > 24 ? `${compact.slice(0, 24)}…` : compact
}

export function lastPreview(conversation: Conversation): string {
  const last = [...conversation.messages].reverse().find((item) => item.content.trim())
  if (!last) return '暂无消息'
  return last.content.replace(/\s+/g, ' ').slice(0, 48)
}

export function toConversationSummary(conversation: Conversation): ConversationSummary {
  return {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
    preview: lastPreview(conversation)
  }
}

export function createEmptyConversation(now: number, id: string): Conversation {
  return {
    id,
    title: '新对话',
    messages: [],
    createdAt: now,
    updatedAt: now
  }
}

export function createTurnMessages(
  content: string,
  now: number,
  ids: { user: string; assistant: string }
): { userMessage: ChatMessage; assistantMessage: ChatMessage } {
  return {
    userMessage: {
      id: ids.user,
      role: 'user',
      content,
      createdAt: now
    },
    assistantMessage: {
      id: ids.assistant,
      role: 'assistant',
      content: '',
      createdAt: now + 1
    }
  }
}
