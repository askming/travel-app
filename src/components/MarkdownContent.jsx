import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-markdown-preview/markdown.css'
import remarkEmoji from 'remark-emoji'

const REMARK_PLUGINS = [[remarkEmoji, { accessible: true }]]

export default function MarkdownContent({ source }) {
  if (!source?.trim()) return null
  return (
    <div data-color-mode="light" className="prose-sm">
      <MDEditor.Markdown
        source={source}
        remarkPlugins={REMARK_PLUGINS}
        style={{ background: 'transparent', fontSize: '14px' }}
      />
    </div>
  )
}
