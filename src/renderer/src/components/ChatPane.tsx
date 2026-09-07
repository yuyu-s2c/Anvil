import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../../shared/types'
import MarkdownView from './MarkdownView'

interface ChatPaneProps {
  title: string
  messages: ChatMessage[]
  streaming: boolean
  error: string | null
  draft: string
  hasApiKey: boolean
  onDraftChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  onOpenSettings: () => void
}

export default function ChatPane({
  title,
  messages,
  streaming,
  error,
  draft,
  hasApiKey,
  onDraftChange,
  onSend,
  onStop,
  onOpenSettings
}: ChatPaneProps): React.JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, streaming])

  useEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 180)}px`
  }, [draft])

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-ink">
      <header className="flex h-14 items-center border-b border-line px-6">
        <h1 className="truncate text-sm font-medium">{title || '新对话'}</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        {messages.length === 0 ? (
          <EmptyState hasApiKey={hasApiKey} onOpenSettings={onOpenSettings} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} streaming={streaming} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-line px-6 py-4">
        <div className="mx-auto max-w-3xl">
          {error ? (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}
          <div className="rounded-2xl border border-line bg-panel px-3 py-2 focus-within:border-gold">
            <textarea
              className="block max-h-44 min-h-[52px] w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none"
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  if (!streaming) onSend()
                }
              }}
              placeholder={hasApiKey ? '输入消息，Enter 发送，Shift+Enter 换行' : '先在设置中填写 API Key'}
              ref={textareaRef}
              rows={1}
              value={draft}
            />
            <div className="flex items-center justify-end gap-2 pb-1 pr-1">
              {streaming ? (
                <button
                  className="rounded-lg bg-raised px-3 py-1.5 text-sm hover:bg-line"
                  onClick={onStop}
                  type="button"
                >
                  停止
                </button>
              ) : (
                <button
                  className="rounded-lg bg-gold px-3 py-1.5 text-sm font-medium text-ink hover:bg-gold-soft disabled:opacity-40"
                  disabled={!draft.trim()}
                  onClick={onSend}
                  type="button"
                >
                  发送
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function EmptyState({
  hasApiKey,
  onOpenSettings
}: {
  hasApiKey: boolean
  onOpenSettings: () => void
}): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold text-xl font-bold text-ink">
        A
      </div>
      <h2 className="text-lg font-semibold">从一条消息开始</h2>
      <p className="mt-2 max-w-sm text-sm text-mute">
        第一版走 OpenAI Chat Completions，默认接入 DeepSeek。之后换任何兼容端点只需改 Base URL。
      </p>
      {!hasApiKey ? (
        <button
          className="mt-5 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft"
          onClick={onOpenSettings}
          type="button"
        >
          填写 API Key
        </button>
      ) : null}
    </div>
  )
}

function MessageBubble({
  message,
  streaming
}: {
  message: ChatMessage
  streaming: boolean
}): React.JSX.Element {
  const isUser = message.role === 'user'
  const showCursor = !isUser && streaming && !message.content && !message.reasoningContent

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 select-text ${
          isUser ? 'bg-[#2a2418] text-[#f4e6c3]' : 'bg-panel'
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap text-[15px] leading-7">{message.content}</div>
        ) : message.content ? (
          <MarkdownView content={message.content} />
        ) : (
          <div className="text-sm text-mute">{showCursor ? '正在思考…' : ''}</div>
        )}
      </div>
    </div>
  )
}
