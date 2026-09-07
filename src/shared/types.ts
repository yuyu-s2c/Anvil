export const DEFAULT_BASE_URL = 'https://api.deepseek.com'
export const DEFAULT_MODEL = 'deepseek-v4-flash'

export const MODEL_PRESETS = [
  'deepseek-v4-flash',
  'deepseek-v4-pro',
  'deepseek-v4-flash-vision-exp'
] as const

export interface Settings {
  baseURL: string
  apiKey: string
  model: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoningContent?: string
  createdAt: number
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export interface ConversationSummary {
  id: string
  title: string
  updatedAt: number
  preview: string
}

export interface ChatChunkPayload {
  conversationId: string
  messageId: string
  content?: string
  reasoning?: string
}

export interface ChatDonePayload {
  conversationId: string
  message: ChatMessage
}

export interface ChatErrorPayload {
  conversationId: string
  error: string
}

export interface ChatStartedPayload {
  conversationId: string
  userMessage: ChatMessage
  assistantMessage: ChatMessage
}

export interface AnvilAPI {
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<Settings>
  listConversations: () => Promise<ConversationSummary[]>
  getConversation: (id: string) => Promise<Conversation | null>
  createConversation: () => Promise<Conversation>
  deleteConversation: (id: string) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<Conversation | null>
  sendMessage: (conversationId: string, content: string) => Promise<ChatStartedPayload>
  stopGeneration: (conversationId: string) => Promise<void>
  onChatStarted: (callback: (payload: ChatStartedPayload) => void) => () => void
  onChatChunk: (callback: (payload: ChatChunkPayload) => void) => () => void
  onChatDone: (callback: (payload: ChatDonePayload) => void) => () => void
  onChatError: (callback: (payload: ChatErrorPayload) => void) => () => void
  onConversationsChanged: (callback: () => void) => () => void
  openLogs: () => Promise<void>
}
