import type { ConversationSummary } from '../../../shared/types'

interface SidebarProps {
  conversations: ConversationSummary[]
  activeId: string | null
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onOpenSettings: () => void
}

export default function Sidebar({
  conversations,
  activeId,
  onNew,
  onSelect,
  onDelete,
  onOpenSettings
}: SidebarProps): React.JSX.Element {
  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-sm font-bold text-ink">
          A
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">Anvil</div>
          <div className="text-[11px] text-mute">个人 Agent</div>
        </div>
      </div>

      <div className="px-3 pb-3">
        <button
          className="w-full rounded-lg border border-line bg-raised px-3 py-2 text-sm hover:border-gold hover:text-gold-soft"
          onClick={onNew}
          type="button"
        >
          新对话
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-mute">还没有对话</p>
        ) : (
          conversations.map((conversation) => {
            const active = conversation.id === activeId
            return (
              <div
                className={`group flex items-start gap-1 rounded-lg px-2 py-2 ${
                  active ? 'bg-raised' : 'hover:bg-raised/70'
                }`}
                key={conversation.id}
              >
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelect(conversation.id)}
                  type="button"
                >
                  <div className="truncate text-sm">{conversation.title}</div>
                  <div className="mt-0.5 truncate text-[11px] text-mute">{conversation.preview}</div>
                </button>
                <button
                  className="mt-0.5 hidden rounded px-1.5 text-xs text-mute hover:bg-ink hover:text-red-300 group-hover:block"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(conversation.id)
                  }}
                  type="button"
                >
                  删除
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-line p-3">
        <button
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-mute hover:bg-raised hover:text-white"
          onClick={onOpenSettings}
          type="button"
        >
          设置
        </button>
      </div>
    </aside>
  )
}
