import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { labelColor } from './LabelChip'

export default function TagInput({ value, onChange, suggestions = [] }) {
  const [input, setInput] = useState('')
  const ref = useRef()

  function add(tag) {
    const t = tag.trim().toLowerCase()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
  }

  function remove(tag) { onChange(value.filter(t => t !== tag)) }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    else if (e.key === 'Backspace' && !input && value.length > 0) remove(value[value.length - 1])
  }

  const hints = suggestions.filter(s => s.startsWith(input.toLowerCase()) && !value.includes(s) && input.length > 0).slice(0, 6)

  return (
    <div>
      <div
        className="min-h-[38px] w-full px-2 py-1.5 rounded-lg border border-stone-300 flex flex-wrap gap-1.5 items-center cursor-text focus-within:ring-2 focus-within:ring-stone-400"
        onClick={() => ref.current?.focus()}
      >
        {value.map(tag => (
          <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${labelColor(tag)}`}>
            {tag}
            <button type="button" onClick={e => { e.stopPropagation(); remove(tag) }} className="hover:opacity-70 leading-none">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={ref}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => { if (input.trim()) add(input) }}
          placeholder={value.length === 0 ? 'Add labels…' : ''}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent"
        />
      </div>
      {hints.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {hints.map(s => (
            <button key={s} type="button" onClick={() => add(s)}
              className={`text-xs px-2 py-0.5 rounded-full ${labelColor(s)} opacity-60 hover:opacity-100 transition-opacity`}>
              + {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-stone-400 mt-1">Enter or comma to add · Backspace to remove</p>
    </div>
  )
}
