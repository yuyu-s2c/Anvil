import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IpcEvent, IpcInvoke } from '../shared/ipc'
import type {
  ChatChunkPayload,
  ChatDonePayload,
  ChatErrorPayload,
  ChatStartedPayload,
  Conversation,
  ConversationSummary,
  Settings
} from '../shared/types'

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void => {
    callback(payload)
  }
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const anvil = {
  getSettings: (): Promise<Settings> => ipcRenderer.invoke(IpcInvoke.settingsGet),
  saveSettings: (settings: Settings): Promise<Settings> =>
    ipcRenderer.invoke(IpcInvoke.settingsSet, settings),
  listConversations: (): Promise<ConversationSummary[]> =>
    ipcRenderer.invoke(IpcInvoke.conversationsList),
  getConversation: (id: string): Promise<Conversation | null> =>
    ipcRenderer.invoke(IpcInvoke.conversationsGet, id),
  createConversation: (): Promise<Conversation> =>
    ipcRenderer.invoke(IpcInvoke.conversationsCreate),
  deleteConversation: (id: string): Promise<void> =>
    ipcRenderer.invoke(IpcInvoke.conversationsDelete, id),
  renameConversation: (id: string, title: string): Promise<Conversation | null> =>
    ipcRenderer.invoke(IpcInvoke.conversationsRename, id, title),
  sendMessage: (
    conversationId: string,
    content: string
  ): Promise<ChatStartedPayload> =>
    ipcRenderer.invoke(IpcInvoke.chatSend, { conversationId, content }),
  stopGeneration: (conversationId: string): Promise<void> =>
    ipcRenderer.invoke(IpcInvoke.chatStop, conversationId),
  openLogs: (): Promise<void> => ipcRenderer.invoke(IpcInvoke.logsOpen),
  onChatStarted: (callback: (payload: ChatStartedPayload) => void): (() => void) =>
    subscribe(IpcEvent.chatStarted, callback),
  onChatChunk: (callback: (payload: ChatChunkPayload) => void): (() => void) =>
    subscribe(IpcEvent.chatChunk, callback),
  onChatDone: (callback: (payload: ChatDonePayload) => void): (() => void) =>
    subscribe(IpcEvent.chatDone, callback),
  onChatError: (callback: (payload: ChatErrorPayload) => void): (() => void) =>
    subscribe(IpcEvent.chatError, callback),
  onConversationsChanged: (callback: () => void): (() => void) =>
    subscribe(IpcEvent.conversationsChanged, callback)
}

contextBridge.exposeInMainWorld('anvil', anvil)
