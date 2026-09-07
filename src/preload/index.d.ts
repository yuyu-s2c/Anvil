import type { AnvilAPI } from '../shared/types'

declare global {
  interface Window {
    anvil: AnvilAPI
  }
}

export {}
