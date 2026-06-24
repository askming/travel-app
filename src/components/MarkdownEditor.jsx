import MDEditor, { commands } from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import remarkEmoji from 'remark-emoji'

const TOOLBAR = [
  commands.bold, commands.italic, commands.strikethrough,
  commands.divider,
  commands.title1, commands.title2,
  commands.divider,
  commands.unorderedListCommand, commands.orderedListCommand, commands.checkedListCommand,
  commands.divider,
  commands.link,
  commands.quote,
]

const PREVIEW_OPTIONS = {
  remarkPlugins: [[remarkEmoji, { accessible: true }]],
}

export default function MarkdownEditor({ value, onChange, placeholder, height = 140 }) {
  return (
    <div data-color-mode="light" className="rounded-lg overflow-hidden">
      <MDEditor
        value={value || ''}
        onChange={v => onChange(v ?? '')}
        preview="edit"
        commands={TOOLBAR}
        extraCommands={[commands.fullscreen]}
        visibleDragbar
        height={height}
        textareaProps={{ placeholder }}
        previewOptions={PREVIEW_OPTIONS}
        style={{ '--md-editor-box-shadow': 'none' }}
      />
    </div>
  )
}
