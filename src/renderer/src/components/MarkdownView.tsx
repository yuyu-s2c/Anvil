import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownViewProps {
  content: string
}

export default function MarkdownView({ content }: MarkdownViewProps): React.JSX.Element {
  return (
    <div className="markdown-body text-[15px] leading-7 text-[#e8eaef]">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  )
}
