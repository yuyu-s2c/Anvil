import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  type ChatMessage,
  type ConversationSummary,
  type Settings
} from '../../shared/types'
import ChatPane from './components/ChatPane'
import SettingsPanel from './components/SettingsPanel'
import Sidebar from './components/Sidebar'

const emptySettings: Settings = {
  baseURL: DEFAULT_BASE_URL,
  apiKey: '',
  model: DEFAULT_MODEL
}

export default function App(): React.JSX.Element {
  const [settings, setSettings] = useState<Settings>(emptySettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeIdRef = useRef<string | null>(null)
  const messageCache = useRef(new Map<string, ChatMessage[]>())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [title, setTitle] = useState('新对话')
  const [draft, setDraft] = useState('')
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const showMessages = useCallback((id: string, next: ChatMessage[]) => {
    messageCache.current.set(id, next)
    if (activeIdRef.current === id) setMessages(next)
  }, [])

  const patchMessages = useCallback(
    (id: string, updater: (current: ChatMessage[]) => ChatMessage[]) => {
      const current = messageCache.current.get(id) ?? []
      showMessages(id, updater(current))
    },
    [showMessages]
  )

  const loadList = useCallback(async () => {
    const list = await window.anvil.listConversations()
    setConversations(list)
    return list
  }, [])

  const openConversation = useCallback(
    async (id: string) => {
      activeIdRef.current = id
      setActiveId(id)
      setError(null)
      const conversation = await window.anvil.getConversation(id)
      if (!conversation || activeIdRef.current !== id) return
      setTitle(conversation.title)
      const cached = messageCache.current.get(id)
      if (cached && streamingId === id) {
        setMessages(cached)
        return
      }
      showMessages(id, conversation.messages)
    },
    [showMessages, streamingId]
  )

  useEffect(() => {
    let cancelled = false

    async function bootstrap(): Promise<void> {
      const loadedSettings = await window.anvil.getSettings()
      if (cancelled) return
      setSettings(loadedSettings)
      if (!loadedSettings.apiKey) setSettingsOpen(true)

      const list = await window.anvil.listConversations()
      if (cancelled) return
      setConversations(list)
      if (list[0]) {
        await openConversation(list[0].id)
      } else {
        const created = await window.anvil.createConversation()
        if (cancelled) return
        await openConversation(created.id)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const offStarted = window.anvil.onChatStarted((payload) => {
      setStreamingId(payload.conversationId)
      if (payload.conversationId === activeIdRef.current) setError(null)
      patchMessages(payload.conversationId, (current) => {
        const withUser = current.some((item) => item.id === payload.userMessage.id)
          ? current
          : [...current, payload.userMessage]
        if (withUser.some((item) => item.id === payload.assistantMessage.id)) return withUser
        return [...withUser, payload.assistantMessage]
      })
    })

    const offChunk = window.anvil.onChatChunk((payload) => {
      patchMessages(payload.conversationId, (current) =>
        current.map((message) => {
          if (message.id !== payload.messageId) return message
          return {
            ...message,
            content: payload.content ? message.content + payload.content : message.content,
            reasoningContent: payload.reasoning
              ? `${message.reasoningContent ?? ''}${payload.reasoning}`
              : message.reasoningContent
          }
        })
      )
    })

    const offDone = window.anvil.onChatDone((payload) => {
      patchMessages(payload.conversationId, (current) =>
        current.map((message) => (message.id === payload.message.id ? payload.message : message))
      )
      setStreamingId((current) => (current === payload.conversationId ? null : current))
    })

    const offError = window.anvil.onChatError((payload) => {
      setStreamingId((current) => (current === payload.conversationId ? null : current))
      if (payload.conversationId === activeIdRef.current) {
        setError(payload.error)
        void window.anvil.getConversation(payload.conversationId).then((conversation) => {
          if (conversation && activeIdRef.current === payload.conversationId) {
            showMessages(payload.conversationId, conversation.messages)
          }
        })
      }
    })

    const offList = window.anvil.onConversationsChanged(() => {
      void loadList()
      const id = activeIdRef.current
      if (!id) return
      void window.anvil.getConversation(id).then((conversation) => {
        if (conversation && activeIdRef.current === id) setTitle(conversation.title)
      })
    })

    return () => {
      offStarted()
      offChunk()
      offDone()
      offError()
      offList()
    }
  }, [loadList, patchMessages, showMessages])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault()
        setSettingsOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const hasApiKey = useMemo(() => settings.apiKey.trim().length > 0, [settings.apiKey])
  const streaming = streamingId === activeId

  async function handleNewConversation(): Promise<void> {
    const created = await window.anvil.createConversation()
    setDraft('')
    await openConversation(created.id)
    await loadList()
  }

  async function handleDelete(id: string): Promise<void> {
    await window.anvil.deleteConversation(id)
    messageCache.current.delete(id)
    if (streamingId === id) setStreamingId(null)
    const list = await loadList()
    if (id !== activeIdRef.current) return
    if (list[0]) {
      await openConversation(list[0].id)
    } else {
      const created = await window.anvil.createConversation()
      await openConversation(created.id)
      await loadList()
    }
  }

  async function handleSaveSettings(): Promise<void> {
    setSavingSettings(true)
    try {
      const saved = await window.anvil.saveSettings(settings)
      setSettings(saved)
      setSettingsOpen(false)
      setError(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存设置失败')
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleSend(): Promise<void> {
    if (!activeId || streaming || !draft.trim()) return
    const content = draft.trim()
    setDraft('')
    setError(null)
    try {
      setStreamingId(activeId)
      await window.anvil.sendMessage(activeId, content)
    } catch (sendError) {
      setStreamingId((current) => (current === activeId ? null : current))
      setError(sendError instanceof Error ? sendError.message : '发送失败')
    }
  }

  async function handleStop(): Promise<void> {
    if (!activeId) return
    await window.anvil.stopGeneration(activeId)
  }

  return (
    <div className="relative flex h-full">
      <Sidebar
        activeId={activeId}
        conversations={conversations}
        onDelete={(id) => void handleDelete(id)}
        onNew={() => void handleNewConversation()}
        onOpenSettings={() => setSettingsOpen(true)}
        onSelect={(id) => void openConversation(id)}
      />
      <ChatPane
        draft={draft}
        error={error}
        hasApiKey={hasApiKey}
        messages={messages}
        onDraftChange={setDraft}
        onOpenSettings={() => setSettingsOpen(true)}
        onSend={() => void handleSend()}
        onStop={() => void handleStop()}
        streaming={streaming}
        title={title}
      />
      <SettingsPanel
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
        onOpenLogs={() => void window.anvil.openLogs()}
        onSave={() => void handleSaveSettings()}
        open={settingsOpen}
        saving={savingSettings}
        settings={settings}
      />
    </div>
  )
}
