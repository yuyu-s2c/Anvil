const SECRET_KEY = /api[-_]?key|authorization|token|secret|password/i
const SECRET_VALUE = /sk-[a-zA-Z0-9]{6,}/g

export function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(SECRET_VALUE, 'sk-***')
  }
  if (Array.isArray(value)) {
    return value.map(redactValue)
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      if (SECRET_KEY.test(key)) return [key, '[redacted]']
      return [key, redactValue(item)]
    })
    return Object.fromEntries(entries)
  }
  return value
}
