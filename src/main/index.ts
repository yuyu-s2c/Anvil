import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { ChatRuntime } from './agent/chat-runtime'
import { registerIpc } from './ipc/register'
import {
  ConsoleLogSink,
  FileLogSink,
  Logger,
  MultiLogSink,
  parseLogLevel
} from './logging/logger'
import { OpenAICompatibleProvider } from './providers/openai-compatible'
import { FileConversationStore } from './storage/conversation-store'
import { createElectronSecretCodec } from './storage/electron-secret-codec'
import { FileSettingsStore } from './storage/settings-store'
import { createWindow } from './window'

function createLogger(logsDir: string): Logger {
  const minLevel = parseLogLevel(process.env.ANVIL_LOG_LEVEL, app.isPackaged ? 'info' : 'debug')
  const sink = app.isPackaged
    ? new FileLogSink(logsDir)
    : new MultiLogSink([new ConsoleLogSink(), new FileLogSink(logsDir)])
  return new Logger(sink, 'anvil', minLevel)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.anvil.agent')
  app.setName('Anvil')

  const userData = app.getPath('userData')
  const logsDir = join(userData, 'logs')
  const logger = createLogger(logsDir)

  logger.info('app ready', {
    packaged: app.isPackaged,
    userData
  })

  process.on('uncaughtException', (error) => {
    logger.error('uncaught exception', { error: error.message, stack: error.stack })
  })
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled rejection', {
      error: reason instanceof Error ? reason.message : String(reason)
    })
  })

  const settings = new FileSettingsStore(
    join(userData, 'settings.json'),
    createElectronSecretCodec(),
    logger.child('settings')
  )
  const conversations = new FileConversationStore(
    join(userData, 'conversations.json'),
    logger.child('conversations')
  )
  const runtime = new ChatRuntime({
    settings,
    conversations,
    provider: new OpenAICompatibleProvider(logger.child('provider')),
    logger: logger.child('chat')
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpc({ runtime, settings, conversations, logsDir, logger })
  createWindow()
  logger.info('window created')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('before-quit', () => {
    logger.info('app quitting')
    runtime.abortAll()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
