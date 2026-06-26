import { useState, useRef, useEffect } from 'react'
import { Delete, X } from 'lucide-react'

const TRAVEL = [
  '✈️','🚂','🚢','⛵','🚁','🏍️','🚗','🛸',
  '🏖️','🏔️','🏕️','🏝️','🗺️','🌍','🌏','🌎',
  '🗼','🏰','🎡','🎭','🎨','🎪','🧳','📸',
  '🍜','🍣','🥘','🍷','🍹','🧉','🥐','🍕',
  '🎿','🏄','🧗','🤿','🎯','🎸','🌸','🌺',
  '🌴','🦁','🐘','🦒','🐠','🦅','🦋','🌋',
]

const FLAGS = {
  Americas: ['🇺🇸','🇨🇦','🇲🇽','🇧🇷','🇦🇷','🇨🇱','🇨🇴','🇵🇪','🇻🇪','🇪🇨','🇧🇴','🇵🇾','🇺🇾','🇨🇷','🇵🇦','🇬🇹','🇭🇳','🇸🇻','🇳🇮','🇨🇺','🇩🇴','🇯🇲','🇹🇹','🇧🇧'],
  Europe:   ['🇬🇧','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇵🇹','🇳🇱','🇧🇪','🇨🇭','🇦🇹','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇮🇸','🇮🇪','🇬🇷','🇹🇷','🇵🇱','🇨🇿','🇭🇺','🇷🇴','🇧🇬','🇷🇸','🇭🇷','🇸🇮','🇸🇰','🇱🇺','🇲🇹','🇨🇾','🇱🇻','🇱🇹','🇪🇪','🇺🇦','🇷🇺','🇦🇱','🇲🇰','🇧🇦','🇲🇪'],
  Asia:     ['🇯🇵','🇨🇳','🇰🇷','🇮🇳','🇹🇭','🇻🇳','🇸🇬','🇲🇾','🇮🇩','🇵🇭','🇹🇼','🇭🇰','🇲🇴','🇰🇭','🇱🇦','🇲🇲','🇧🇩','🇵🇰','🇱🇰','🇳🇵','🇮🇷','🇮🇶','🇸🇾','🇯🇴','🇱🇧','🇮🇱','🇸🇦','🇦🇪','🇶🇦','🇰🇼','🇧🇭','🇴🇲','🇾🇪','🇦🇿','🇬🇪','🇦🇲','🇰🇿','🇺🇿','🇲🇳'],
  Africa:   ['🇿🇦','🇰🇪','🇹🇿','🇺🇬','🇷🇼','🇪🇹','🇬🇭','🇳🇬','🇸🇳','🇨🇮','🇨🇲','🇦🇴','🇲🇿','🇿🇲','🇿🇼','🇲🇬','🇪🇬','🇲🇦','🇹🇳','🇩🇿','🇱🇾','🇸🇩','🇪🇷','🇩🇯','🇸🇴'],
  Oceania:  ['🇦🇺','🇳🇿','🇫🇯','🇵🇬','🇸🇧','🇻🇺','🇼🇸','🇹🇴','🇰🇮','🇫🇲'],
}

function removeLastEmoji(str) {
  if (!str) return ''
  const segmenter = new Intl.Segmenter()
  const segments = [...segmenter.segment(str)]
  return segments.slice(0, -1).map(s => s.segment).join('')
}

export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('travel')
  const ref = useRef()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-3xl p-2 rounded-xl hover:bg-stone-100 transition-colors leading-none min-w-[44px] text-left"
        title="Add emoji"
      >
        {value || '✈️'}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-stone-200 rounded-2xl shadow-lg w-72">
          {/* Current selection + controls */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-100">
            <span className="text-2xl leading-none flex-1 min-w-0 break-all">{value || <span className="text-stone-300 text-sm">click to add…</span>}</span>
            <button type="button" onClick={() => onChange(removeLastEmoji(value))}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg" title="Remove last">
              <Delete size={14} />
            </button>
            <button type="button" onClick={() => onChange('')}
              className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Clear all">
              <X size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-stone-100 px-2 pt-2 gap-1">
            {['travel', 'flags'].map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize mb-1 transition-colors ${tab === t ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>
                {t}
              </button>
            ))}
            <p className="ml-auto text-xs text-stone-400 self-center pr-1">click to append</p>
          </div>

          <div className="overflow-y-auto max-h-56 p-2">
            {tab === 'travel' ? (
              <div className="grid grid-cols-8 gap-0.5">
                {TRAVEL.map(e => (
                  <button key={e} type="button" onClick={() => onChange(value + e)}
                    className="text-xl p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                    {e}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(FLAGS).map(([region, emojis]) => (
                  <div key={region}>
                    <p className="text-xs font-medium text-stone-400 px-1 mb-1">{region}</p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {emojis.map(e => (
                        <button key={e} type="button" onClick={() => onChange(value + e)}
                          className="text-xl p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
