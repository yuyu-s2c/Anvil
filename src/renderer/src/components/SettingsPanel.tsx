import { DEFAULT_BASE_URL, DEFAULT_MODEL, MODEL_PRESETS, type Settings } from '../../../shared/types'

interface SettingsPanelProps {
  open: boolean
  settings: Settings
  saving: boolean
  onChange: (settings: Settings) => void
  onSave: () => void
  onClose: () => void
  onOpenLogs: () => void
}

export default function SettingsPanel({
  open,
  settings,
  saving,
  onChange,
  onSave,
  onClose,
  onOpenLogs
}: SettingsPanelProps): React.JSX.Element | null {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-black/45" onClick={onClose}>
      <aside
        className="flex h-full w-[380px] flex-col border-l border-line bg-panel shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">设置</h2>
            <p className="mt-1 text-xs text-mute">兼容任意 OpenAI 协议端点，默认 DeepSeek</p>
          </div>
          <button
            className="rounded-md px-2 py-1 text-sm text-mute hover:bg-raised hover:text-white"
            onClick={onClose}
            type="button"
          >
            关闭
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-auto px-5 py-5">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-mute">API Key</span>
            <input
              autoComplete="off"
              className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
              onChange={(event) => onChange({ ...settings, apiKey: event.target.value })}
              placeholder="sk-..."
              type="password"
              value={settings.apiKey}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-mute">Base URL</span>
            <input
              className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
              onChange={(event) => onChange({ ...settings, baseURL: event.target.value })}
              placeholder={DEFAULT_BASE_URL}
              value={settings.baseURL}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-mute">模型</span>
            <input
              className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
              list="model-presets"
              onChange={(event) => onChange({ ...settings, model: event.target.value })}
              placeholder={DEFAULT_MODEL}
              value={settings.model}
            />
            <datalist id="model-presets">
              {MODEL_PRESETS.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
            <span className="text-xs leading-5 text-mute">
              默认 deepseek-v4-flash。deepseek-v4-pro 更强；deepseek-v4-flash-vision-exp
              为实验性视觉模型。
            </span>
          </label>

          <button
            className="rounded-lg border border-line px-3 py-2 text-left text-sm text-mute hover:bg-raised hover:text-white"
            onClick={onOpenLogs}
            type="button"
          >
            打开日志目录
          </button>
        </div>

        <footer className="border-t border-line px-5 py-4">
          <button
            className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-ink hover:bg-gold-soft disabled:opacity-60"
            disabled={saving}
            onClick={onSave}
            type="button"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </footer>
      </aside>
    </div>
  )
}
