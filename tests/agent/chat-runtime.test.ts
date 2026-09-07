import { join } from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChatRuntime, type ChatRuntimeHost } from '../../src/main/agent/chat-runtime'
import type { ChatProvider } from '../../src/main/providers/chat-provider'
import { FileConversationStore } from '../../src/main/storage/conversation-store'
import { createPassthroughSecretCodec } from '../../src/main/storage/secret-codec'
import { FileSettingsStore } from '../../src/main/storage/settings-store'
import { makeTempDir, removeTempDir } from '../helpers/temp-dir'

function collectHost(): ChatRuntimeHost & { events: string[] } {
  const events: string[] = []
  return {
    events,
    emitStarted: () => events.push('started'),
    emitChunk: (payload) => events.push(`chunk:${payload.content ?? ''}`),
    emitDone: (payload) => events.push(`done:${payload.message.content}`),
    emitError: (payload) => events.push(`error:${payload.error}`),
    emitConversationsChanged: () => events.push('changed')
  }
}

describe('ChatRuntime', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) removeTempDir(dir)
  })

  function setup(provider: ChatProvider) {
    const dir = makeTempDir()
    dirs.push(dir)
    const settings = new FileSettingsStore(join(dir, 'settings.json'), createPassthroughSecretCodec())
    settings.save({
      baseURL: 'https://api.deepseek.com',
      apiKey: 'sk-test',
      model: 'deepseek-v4-flash'
    })
    let now = 1
    let n = 0
    const conversations = new FileConversationStore(
      join(dir, 'conversations.json'),
      undefined,
      () => now,
      () => `id-${++n}`
    )
    const runtime = new ChatRuntime({
      settings,
      conversations,
      provider,
      now: () => now,
      nextId: () => `msg-${++n}`
    })
    return { runtime, conversations, settings }
  }

  it('streams a turn into the store', async () => {
    const provider: ChatProvider = {
      async stream(request) {
        request.onChunk({ content: 'Hel' })
        request.onChunk({ content: 'lo' })
      }
    }
    const { runtime, conversations } = setup(provider)
    const conversation = conversations.create()
    const host = collectHost()
    runtime.send({ conversationId: conversation.id, content: 'hi' }, host)
    await vi.waitFor(() => {
      expect(conversations.get(conversation.id)?.messages[1].content).toBe('Hello')
    })
    expect(host.events.filter((item) => item.startsWith('chunk:'))).toEqual(['chunk:Hel', 'chunk:lo'])
    expect(host.events).toContain('done:Hello')
  })

  it('rejects send without an api key', () => {
    const { runtime, conversations, settings } = setup({ stream: async () => undefined })
    settings.save({
      baseURL: 'https://api.deepseek.com',
      apiKey: '',
      model: 'deepseek-v4-flash'
    })
    const conversation = conversations.create()
    expect(() =>
      runtime.send({ conversationId: conversation.id, content: 'hi' }, collectHost())
    ).toThrow('请先在设置中填写 API Key。')
  })

  it('records provider errors and drops empty assistant messages', async () => {
    const provider: ChatProvider = {
      async stream() {
        const error = new Error('nope') as Error & { status: number }
        error.status = 401
        throw error
      }
    }
    const { runtime, conversations } = setup(provider)
    const conversation = conversations.create()
    const host = collectHost()
    runtime.send({ conversationId: conversation.id, content: 'hi' }, host)
    await vi.waitFor(() => {
      expect(host.events).toContain('error:API Key 无效，请在设置中检查。')
    })
    expect(conversations.get(conversation.id)?.messages).toHaveLength(1)
  })
})
