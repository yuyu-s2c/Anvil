export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError')
  )
}

export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || ''
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return ''
}

export function formatChatError(error: unknown): string {
  if (isAbortError(error)) return '已停止生成'
  const status = getErrorStatus(error)
  if (status === 401) return 'API Key 无效，请在设置中检查。'
  if (status === 402) return '额度不足，请检查账户余额。'
  if (status === 429) return '请求过于频繁，请稍后再试。'
  if (status !== undefined) {
    return getErrorMessage(error) || `请求失败（${status}）`
  }
  const message = getErrorMessage(error)
  if (message) {
    if (/fetch|network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(message)) {
      return '网络连接失败，请检查网络或 Base URL。'
    }
    return message
  }
  return '未知错误'
}
