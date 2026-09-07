export const IpcInvoke = {
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  conversationsList: 'conversations:list',
  conversationsGet: 'conversations:get',
  conversationsCreate: 'conversations:create',
  conversationsDelete: 'conversations:delete',
  conversationsRename: 'conversations:rename',
  chatSend: 'chat:send',
  chatStop: 'chat:stop',
  logsOpen: 'logs:open'
} as const

export const IpcEvent = {
  chatStarted: 'chat:started',
  chatChunk: 'chat:chunk',
  chatDone: 'chat:done',
  chatError: 'chat:error',
  conversationsChanged: 'conversations:changed'
} as const
