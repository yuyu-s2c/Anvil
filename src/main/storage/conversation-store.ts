import {
  createEmptyConversation,
  toConversationSummary
} from '../../shared/domain/conversation'
import type {
  ChatMessage,
  Conversation,
  ConversationSummary
} from '../../shared/types'
import type { Logger } from '../logging/logger'
import { readJson, writeJsonAtomic } from './json-file'

export interface ConversationRepository {
  list(): ConversationSummary[]
  get(id: string): Conversation | null
  create(now?: number, id?: string): Conversation
  delete(id: string): void
  rename(id: string, title: string): Conversation | null
  appendMessages(id: string, messages: ChatMessage[], title?: string): Conversation | null
  patchMessage(
    conversationId: string,
    messageId: string,
    patch: Partial<Pick<ChatMessage, 'content' | 'reasoningContent'>>
  ): Conversation | null
  removeMessage(conversationId: string, messageId: string): Conversation | null
}

interface PersistedStore {
  conversations: Conversation[]
}

export class FileConversationStore implements ConversationRepository {
  constructor(
    private readonly filePath: string,
    private readonly logger?: Logger,
    private readonly now: () => number = () => Date.now(),
    private readonly nextId: () => string = () => crypto.randomUUID()
  ) {}

  list(): ConversationSummary[] {
    return this.load()
      .conversations.slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(toConversationSummary)
  }

  get(id: string): Conversation | null {
    return this.load().conversations.find((item) => item.id === id) ?? null
  }

  create(now = this.now(), id = this.nextId()): Conversation {
    const conversation = createEmptyConversation(now, id)
    const store = this.load()
    store.conversations.unshift(conversation)
    this.save(store)
    this.logger?.info('conversation created', { conversationId: id })
    return conversation
  }

  delete(id: string): void {
    const store = this.load()
    store.conversations = store.conversations.filter((item) => item.id !== id)
    this.save(store)
    this.logger?.info('conversation deleted', { conversationId: id })
  }

  rename(id: string, title: string): Conversation | null {
    return this.update(id, (conversation) => {
      conversation.title = title.trim() || conversation.title
      conversation.updatedAt = this.now()
    })
  }

  appendMessages(id: string, messages: ChatMessage[], title?: string): Conversation | null {
    return this.update(id, (conversation) => {
      conversation.messages.push(...messages)
      if (title && conversation.title === '新对话') {
        conversation.title = title
      }
      conversation.updatedAt = this.now()
    })
  }

  patchMessage(
    conversationId: string,
    messageId: string,
    patch: Partial<Pick<ChatMessage, 'content' | 'reasoningContent'>>
  ): Conversation | null {
    return this.update(conversationId, (conversation) => {
      const message = conversation.messages.find((item) => item.id === messageId)
      if (!message) return
      if (patch.content !== undefined) message.content = patch.content
      if (patch.reasoningContent !== undefined) message.reasoningContent = patch.reasoningContent
      conversation.updatedAt = this.now()
    })
  }

  removeMessage(conversationId: string, messageId: string): Conversation | null {
    return this.update(conversationId, (conversation) => {
      conversation.messages = conversation.messages.filter((item) => item.id !== messageId)
      conversation.updatedAt = this.now()
    })
  }

  private update(id: string, mutator: (conversation: Conversation) => void): Conversation | null {
    const store = this.load()
    const conversation = store.conversations.find((item) => item.id === id)
    if (!conversation) return null
    mutator(conversation)
    this.save(store)
    return conversation
  }

  private load(): PersistedStore {
    return readJson<PersistedStore>(this.filePath, { conversations: [] })
  }

  private save(store: PersistedStore): void {
    writeJsonAtomic(this.filePath, store)
  }
}
