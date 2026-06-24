import { useState, useRef, useEffect } from 'react'

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

  function select(e) {
    onChange(e)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-3xl p-2 rounded-xl hover:bg-stone-100 transition-colors leading-none"
        title="Change icon"
      >
        {value}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-stone-200 rounded-2xl shadow-lg w-72">
          <div className="flex border-b border-stone-100 px-2 pt-2 gap-1">
            {['travel', 'flags'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize mb-1 transition-colors ${tab === t ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-100'}`}
              >{t}</button>
            ))}
          </div>

          <div className="overflow-y-auto max-h-56 p-2">
            {tab === 'travel' ? (
              <div className="grid grid-cols-8 gap-0.5">
                {TRAVEL.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => select(e)}
                    className={`text-xl p-1.5 rounded-lg hover:bg-stone-100 transition-colors ${value === e ? 'bg-stone-200' : ''}`}
                  >{e}</button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(FLAGS).map(([region, emojis]) => (
                  <div key={region}>
                    <p className="text-xs font-medium text-stone-400 px-1 mb-1">{region}</p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {emojis.map(e => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => select(e)}
                          className={`text-xl p-1.5 rounded-lg hover:bg-stone-100 transition-colors ${value === e ? 'bg-stone-200' : ''}`}
                        >{e}</button>
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
