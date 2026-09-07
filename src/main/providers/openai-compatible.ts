import OpenAI from 'openai'
import { toApiMessages } from '../../shared/domain/messages'
import type { Logger } from '../logging/logger'
import type { ChatProvider, StreamChatRequest } from './chat-provider'

export class OpenAICompatibleProvider implements ChatProvider {
  constructor(private readonly logger?: Logger) {}

  async stream(request: StreamChatRequest): Promise<void> {
    const client = new OpenAI({
      apiKey: request.settings.apiKey,
      baseURL: request.settings.baseURL.replace(/\/+$/, ''),
      timeout: 120_000
    })

    this.logger?.info('provider stream start', {
      baseURL: request.settings.baseURL,
      model: request.settings.model,
      messages: toApiMessages(request.messages).length
    })

    const stream = await client.chat.completions.create(
      {
        model: request.settings.model,
        messages: toApiMessages(request.messages),
        stream: true
      },
      { signal: request.signal }
    )

    for await (const part of stream) {
      const delta = part.choices[0]?.delta as {
        content?: string | null
        reasoning_content?: string | null
      }
      const content = delta?.content || undefined
      const reasoning = delta?.reasoning_content || undefined
      if (content || reasoning) {
        request.onChunk({ content, reasoning })
      }
    }
  }
}
