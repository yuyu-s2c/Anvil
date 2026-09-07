import { BrowserWindow, ipcMain, shell, type WebContents } from 'electron'
import { ChatRuntime, type ChatRuntimeHost } from '../agent/chat-runtime'
import type { Logger } from '../logging/logger'
import { IpcEvent, IpcInvoke } from '../../shared/ipc'
import type { ConversationRepository } from '../storage/conversation-store'
import type { SettingsRepository } from '../storage/settings-store'
import type { Settings } from '../../shared/types'

export interface IpcDeps {
  runtime: ChatRuntime
  settings: SettingsRepository
  conversations: ConversationRepository
  logsDir: string
  logger: Logger
}

export function registerIpc(deps: IpcDeps): void {
  const ipcLog = deps.logger.child('ipc')

  ipcMain.handle(IpcInvoke.settingsGet, () => deps.settings.load())
  ipcMain.handle(IpcInvoke.settingsSet, (_event, settings: Settings) => deps.settings.save(settings))

  ipcMain.handle(IpcInvoke.conversationsList, () => deps.conversations.list())
  ipcMain.handle(IpcInvoke.conversationsGet, (_event, id: string) => deps.conversations.get(id))
  ipcMain.handle(IpcInvoke.conversationsCreate, () => {
    const conversation = deps.conversations.create()
    broadcast(IpcEvent.conversationsChanged)
    return conversation
  })
  ipcMain.handle(IpcInvoke.conversationsDelete, (_event, id: string) => {
    deps.runtime.stop(id)
    deps.conversations.delete(id)
    broadcast(IpcEvent.conversationsChanged)
  })
  ipcMain.handle(IpcInvoke.conversationsRename, (_event, id: string, title: string) => {
    const conversation = deps.conversations.rename(id, title)
    broadcast(IpcEvent.conversationsChanged)
    return conversation
  })

  ipcMain.handle(IpcInvoke.chatStop, (_event, conversationId: string) => {
    ipcLog.info('chat stop', { conversationId })
    deps.runtime.stop(conversationId)
  })

  ipcMain.handle(
    IpcInvoke.chatSend,
    async (event, payload: { conversationId: string; content: string }) => {
      return deps.runtime.send(payload, createHost(event.sender))
    }
  )

  ipcMain.handle(IpcInvoke.logsOpen, async () => {
    ipcLog.info('open logs directory')
    const result = await shell.openPath(deps.logsDir)
    if (result) {
      ipcLog.warn('open logs directory failed', { result })
    }
  })
}

function createHost(sender: WebContents): ChatRuntimeHost {
  return {
    emitStarted: (payload) => sender.send(IpcEvent.chatStarted, payload),
    emitChunk: (payload) => sender.send(IpcEvent.chatChunk, payload),
    emitDone: (payload) => sender.send(IpcEvent.chatDone, payload),
    emitError: (payload) => sender.send(IpcEvent.chatError, payload),
    emitConversationsChanged: () => broadcast(IpcEvent.conversationsChanged)
  }
}

function broadcast(channel: string, ...args: unknown[]): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, ...args)
  }
}
