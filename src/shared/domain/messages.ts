import type { ChatMessage } from '../types'

export interface ApiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function toApiMessages(messages: ChatMessage[]): ApiChatMessage[] {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      role: message.role,
      content: message.content
    }))
}
