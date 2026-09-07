import type { ChatMessage, Settings } from '../../shared/types'

export interface StreamChunk {
  content?: string
  reasoning?: string
}

export interface StreamChatRequest {
  settings: Settings
  messages: ChatMessage[]
  signal: AbortSignal
  onChunk: (chunk: StreamChunk) => void
}

export interface ChatProvider {
  stream(request: StreamChatRequest): Promise<void>
}
