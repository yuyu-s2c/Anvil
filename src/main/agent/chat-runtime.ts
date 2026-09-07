import { titleFromPrompt, createTurnMessages } from '../../shared/domain/conversation'
import { formatChatError, isAbortError } from '../../shared/domain/errors'
import type {
  ChatChunkPayload,
  ChatDonePayload,
  ChatErrorPayload,
  ChatStartedPayload
} from '../../shared/types'
import type { Logger } from '../logging/logger'
import type { ChatProvider } from '../providers/chat-provider'
import type { ConversationRepository } from '../storage/conversation-store'
import type { SettingsRepository } from '../storage/settings-store'

export interface ChatRuntimeHost {
  emitStarted(payload: ChatStartedPayload): void
  emitChunk(payload: ChatChunkPayload): void
  emitDone(payload: ChatDonePayload): void
  emitError(payload: ChatErrorPayload): void
  emitConversationsChanged(): void
}

export interface ChatRuntimeOptions {
  settings: SettingsRepository
  conversations: ConversationRepository
  provider: ChatProvider
  logger?: Logger
  now?: () => number
  nextId?: () => string
}

export class ChatRuntime {
  private readonly abortControllers = new Map<string, AbortController>()
  private readonly now: () => number
  private readonly nextId: () => string

  constructor(private readonly options: ChatRuntimeOptions) {
    this.now = options.now ?? (() => Date.now())
    this.nextId = options.nextId ?? (() => crypto.randomUUID())
  }

  send(
    payload: { conversationId: string; content: string },
    host: ChatRuntimeHost
  ): ChatStartedPayload {
    const settings = this.options.settings.load()
    if (!settings.apiKey) {
      throw new Error('请先在设置中填写 API Key。')
    }

    const conversation = this.options.conversations.get(payload.conversationId)
    if (!conversation) {
      throw new Error('对话不存在。')
    }

    const content = payload.content.trim()
    if (!content) {
      throw new Error('消息不能为空。')
    }

    this.stop(payload.conversationId)

    const { userMessage, assistantMessage } = createTurnMessages(content, this.now(), {
      user: this.nextId(),
      assistant: this.nextId()
    })

    this.options.conversations.appendMessages(
      payload.conversationId,
      [userMessage, assistantMessage],
      titleFromPrompt(content)
    )
    host.emitConversationsChanged()

    const started: ChatStartedPayload = {
      conversationId: payload.conversationId,
      userMessage,
      assistantMessage
    }
    host.emitStarted(started)

    const controller = new AbortController()
    this.abortControllers.set(payload.conversationId, controller)
    this.options.logger?.info('chat send', {
      conversationId: payload.conversationId,
      model: settings.model,
      baseURL: settings.baseURL,
      inputChars: content.length
    })

    void this.runStream({
      host,
      conversationId: payload.conversationId,
      assistantId: assistantMessage.id,
      signal: controller.signal
    })

    return started
  }

  stop(conversationId: string): void {
    this.abortControllers.get(conversationId)?.abort()
    this.abortControllers.delete(conversationId)
  }

  abortAll(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort()
    }
    this.abortControllers.clear()
  }

  private async runStream(input: {
    host: ChatRuntimeHost
    conversationId: string
    assistantId: string
    signal: AbortSignal
  }): Promise<void> {
    const conversation = this.options.conversations.get(input.conversationId)
    if (!conversation) return

    const settings = this.options.settings.load()
    const history = conversation.messages.filter((message) => message.id !== input.assistantId)
    let content = ''
    let reasoning = ''
    const startedAt = this.now()

    try {
      await this.options.provider.stream({
        settings,
        messages: history,
        signal: input.signal,
        onChunk: (chunk) => {
          if (chunk.content) content += chunk.content
          if (chunk.reasoning) reasoning += chunk.reasoning
          input.host.emitChunk({
            conversationId: input.conversationId,
            messageId: input.assistantId,
            content: chunk.content,
            reasoning: chunk.reasoning
          })
        }
      })

      this.finishAssistant(input, content, reasoning)
      this.options.logger?.info('chat completed', {
        conversationId: input.conversationId,
        durationMs: this.now() - startedAt,
        outputChars: content.length,
        reasoningChars: reasoning.length
      })
    } catch (error) {
      if (isAbortError(error)) {
        if (!content && !reasoning) {
          this.options.conversations.removeMessage(input.conversationId, input.assistantId)
          input.host.emitError({
            conversationId: input.conversationId,
            error: '已停止生成'
          })
        } else {
          this.finishAssistant(input, content, reasoning)
        }
        this.options.logger?.info('chat aborted', {
          conversationId: input.conversationId,
          outputChars: content.length
        })
        input.host.emitConversationsChanged()
        return
      }

      const message = formatChatError(error)
      if (!content) {
        this.options.conversations.removeMessage(input.conversationId, input.assistantId)
      } else {
        this.options.conversations.patchMessage(input.conversationId, input.assistantId, {
          content,
          reasoningContent: reasoning || undefined
        })
      }
      this.options.logger?.error('chat failed', {
        conversationId: input.conversationId,
        error: message
      })
      input.host.emitError({
        conversationId: input.conversationId,
        error: message
      })
      input.host.emitConversationsChanged()
    } finally {
      this.abortControllers.delete(input.conversationId)
    }
  }

  private finishAssistant(
    input: { host: ChatRuntimeHost; conversationId: string; assistantId: string },
    content: string,
    reasoning: string
  ): void {
    const saved =
      this.options.conversations.patchMessage(input.conversationId, input.assistantId, {
        content,
        reasoningContent: reasoning || undefined
      }) ?? this.options.conversations.get(input.conversationId)
    const message = saved?.messages.find((item) => item.id === input.assistantId)
    if (message) {
      input.host.emitDone({
        conversationId: input.conversationId,
        message
      })
    }
    input.host.emitConversationsChanged()
  }
}
