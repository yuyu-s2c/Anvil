import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'anvil-test-'))
}

export function removeTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}
