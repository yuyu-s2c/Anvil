import { appendFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import { redactValue } from './redact'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
}

export interface LogRecord {
  time: string
  level: LogLevel
  scope: string
  message: string
  context?: Record<string, unknown>
}

export interface LogSink {
  write(record: LogRecord): void
}

export class Logger {
  constructor(
    private readonly sink: LogSink,
    private readonly scope = 'anvil',
    private readonly minLevel: LogLevel = 'info'
  ) {}

  child(scope: string): Logger {
    return new Logger(this.sink, `${this.scope}.${scope}`, this.minLevel)
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.write('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, context)
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('error', message, context)
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.minLevel]) return
    const record: LogRecord = {
      time: new Date().toISOString(),
      level,
      scope: this.scope,
      message,
      context: context
        ? (redactValue(context) as Record<string, unknown>)
        : undefined
    }
    this.sink.write(record)
  }
}

export class MemoryLogSink implements LogSink {
  readonly records: LogRecord[] = []

  write(record: LogRecord): void {
    this.records.push(record)
  }
}

export class ConsoleLogSink implements LogSink {
  write(record: LogRecord): void {
    const line = formatRecord(record)
    if (record.level === 'error') {
      console.error(line)
      return
    }
    if (record.level === 'warn') {
      console.warn(line)
      return
    }
    console.log(line)
  }
}

export class FileLogSink implements LogSink {
  constructor(
    private readonly directory: string,
    private readonly now: () => Date = () => new Date(),
    private readonly keepDays = 7
  ) {
    mkdirSync(this.directory, { recursive: true })
    this.prune()
  }

  write(record: LogRecord): void {
    const filePath = join(this.directory, `anvil-${toDayStamp(this.now())}.log`)
    appendFileSync(filePath, `${formatRecord(record)}\n`, 'utf-8')
  }

  private prune(): void {
    const cutoff = this.now().getTime() - this.keepDays * 24 * 60 * 60 * 1000
    for (const name of readdirSync(this.directory)) {
      if (!/^anvil-\d{4}-\d{2}-\d{2}\.log$/.test(name)) continue
      const filePath = join(this.directory, name)
      try {
        if (statSync(filePath).mtimeMs < cutoff) unlinkSync(filePath)
      } catch {
        // ignore prune failures
      }
    }
  }
}

export class MultiLogSink implements LogSink {
  constructor(private readonly sinks: LogSink[]) {}

  write(record: LogRecord): void {
    for (const sink of this.sinks) sink.write(record)
  }
}

export function parseLogLevel(value: string | undefined, fallback: LogLevel = 'info'): LogLevel {
  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') return value
  return fallback
}

export function formatRecord(record: LogRecord): string {
  const context = record.context ? ` ${JSON.stringify(record.context)}` : ''
  return `${record.time} ${record.level.toUpperCase()} [${record.scope}] ${record.message}${context}`
}

function toDayStamp(date: Date): string {
  return date.toISOString().slice(0, 10)
}
