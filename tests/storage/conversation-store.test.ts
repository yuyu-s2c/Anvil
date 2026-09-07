import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { FileConversationStore } from '../../src/main/storage/conversation-store'
import { makeTempDir, removeTempDir } from '../helpers/temp-dir'

describe('FileConversationStore', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) removeTempDir(dir)
  })

  it('creates, updates, and lists conversations', () => {
    const dir = makeTempDir()
    dirs.push(dir)
    let now = 1000
    let n = 0
    const store = new FileConversationStore(
      join(dir, 'conversations.json'),
      undefined,
      () => now,
      () => `id-${++n}`
    )

    const created = store.create()
    expect(created.id).toBe('id-1')
    now = 2000
    store.appendMessages(created.id, [
      { id: 'm1', role: 'user', content: 'hello there', createdAt: 2000 }
    ], 'hello there')

    const listed = store.list()
    expect(listed).toHaveLength(1)
    expect(listed[0].title).toBe('hello there')
    expect(listed[0].preview).toBe('hello there')

    store.patchMessage(created.id, 'm1', { content: 'hello there!!' })
    expect(store.get(created.id)?.messages[0].content).toBe('hello there!!')

    store.removeMessage(created.id, 'm1')
    expect(store.get(created.id)?.messages).toHaveLength(0)

    store.delete(created.id)
    expect(store.list()).toHaveLength(0)
  })
})
