import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, MapPin, Pencil, Trash2 } from 'lucide-react'
import TripMap from './TripMap'
import MarkdownEditor from './MarkdownEditor'
import MarkdownContent from './MarkdownContent'

const EMPTY_STOP = { start_date: '', end_date: '', destination: '', lat: '', lng: '', activities: '', hotel: '', transportation: '', notes: '' }

function getDays(start, end) {
  if (!start) return []
  const s = new Date(start + 'T00:00:00')
  const e = end ? new Date(end + 'T00:00:00') : s
  const days = []
  const cur = new Date(s)
  while (cur <= e && days.length < 30) {
    days.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function parseActivities(raw, startDate) {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
  } catch {}
  return startDate ? { [startDate]: raw } : {}
}

function serializeActivities(dayActivities) {
  const filtered = Object.fromEntries(Object.entries(dayActivities).filter(([, v]) => v.trim()))
  return Object.keys(filtered).length ? JSON.stringify(filtered) : ''
}

function formatDateRange(start, end) {
  if (!start) return 'No date'
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (!end || end === start) return fmt(start)
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  if (sameMonth) {
    return `${s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

function dayLabel(dateStr, index) {
  return `Day ${index + 1} — ${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
}

export default function ItineraryTab({ tripId }) {
  const [stops, setStops] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_STOP)
  const [dayActivities, setDayActivities] = useState({})
  const [view, setView] = useState('timeline')

  useEffect(() => { fetchStops() }, [tripId])

  async function fetchStops() {
    const { data } = await supabase.from('stops').select('*').eq('trip_id', tripId).order('start_date')
    setStops(data || [])
  }

  function openNew() {
    setForm(EMPTY_STOP)
    setDayActivities({})
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(stop) {
    setForm(stop)
    setDayActivities(parseActivities(stop.activities, stop.start_date))
    setEditing(stop.id)
    setShowForm(true)
  }

  function handleDateChange(key, value) {
    const newForm = { ...form, [key]: value }
    setForm(newForm)
    const days = getDays(newForm.start_date, newForm.end_date)
    setDayActivities(prev => Object.fromEntries(days.map(d => [d, prev[d] ?? ''])))
  }

  async function saveStop(e) {
    e.preventDefault()
    const payload = {
      ...form,
      trip_id: tripId,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      end_date: form.end_date || null,
      activities: serializeActivities(dayActivities),
    }
    if (editing) {
      await supabase.from('stops').update(payload).eq('id', editing)
    } else {
      await supabase.from('stops').insert(payload)
    }
    setShowForm(false)
    fetchStops()
  }

  async function deleteStop(id) {
    if (!confirm('Delete this stop?')) return
    await supabase.from('stops').delete().eq('id', id)
    fetchStops()
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400'
  const mapStops = stops.filter(s => s.lat && s.lng)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {['timeline', 'map'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-sm capitalize transition-colors ${view === v ? 'bg-stone-200 text-stone-800 font-medium' : 'text-stone-500 hover:bg-stone-100'}`}
            >{v}</button>
          ))}
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-stone-800 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-stone-700">
          <Plus size={14} /> Add stop
        </button>
      </div>

      {view === 'map' ? (
        <TripMap stops={mapStops} />
      ) : stops.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <MapPin size={32} className="mx-auto mb-3 opacity-40" />
          <p>No stops yet. Add your first destination.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-stone-200" />
          <div className="space-y-4">
            {stops.map((stop, i) => {
              const days = getDays(stop.start_date, stop.end_date)
              const acts = parseActivities(stop.activities, stop.start_date)
              const multiDay = days.length > 1
              return (
                <div key={stop.id} className="relative pl-12">
                  <div className="absolute left-2 top-4 w-5 h-5 rounded-full bg-stone-800 text-white text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </div>
                  <div className="bg-white border border-stone-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-stone-400 font-medium">{formatDateRange(stop.start_date, stop.end_date)}</p>
                        <h3 className="font-semibold text-stone-800 mt-0.5 flex items-center gap-1">
                          <MapPin size={14} className="text-stone-400 shrink-0" />{stop.destination}
                        </h3>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(stop)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"><Pencil size={14} /></button>
                        <button onClick={() => deleteStop(stop.id)} className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-100"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-3 text-sm">
                      {stop.activities && (
                        multiDay ? (
                          <div className="space-y-3">
                            {days.map((d, di) => acts[d]?.trim() ? (
                              <div key={d}>
                                <p className="text-xs font-semibold text-stone-500 mb-1">{dayLabel(d, di)}</p>
                                <MarkdownContent source={acts[d]} />
                              </div>
                            ) : null)}
                          </div>
                        ) : (
                          <MarkdownContent source={Object.values(acts)[0]} />
                        )
                      )}
                      {stop.hotel && (
                        <div>
                          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-0.5">Hotel</p>
                          <MarkdownContent source={stop.hotel} />
                        </div>
                      )}
                      {stop.transportation && (
                        <div>
                          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-0.5">Transport</p>
                          <MarkdownContent source={stop.transportation} />
                        </div>
                      )}
                      {stop.notes && (
                        <div>
                          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-0.5">Notes</p>
                          <MarkdownContent source={stop.notes} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl my-4">
            <h2 className="text-lg font-semibold text-stone-800 mb-4">{editing ? 'Edit stop' : 'Add stop'}</h2>
            <form onSubmit={saveStop} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-stone-500">Start date *</label>
                  <input type="date" value={form.start_date} onChange={e => handleDateChange('start_date', e.target.value)} required className={inputCls} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-500">End date</label>
                  <input type="date" value={form.end_date ?? ''} onChange={e => handleDateChange('end_date', e.target.value)} min={form.start_date || undefined} className={inputCls} />
                </div>
              </div>
              <input placeholder="Destination *" value={form.destination} onChange={e => set('destination', e.target.value)} required className={inputCls} />
              <div className="flex gap-2">
                <input placeholder="Latitude (e.g. 35.6762)" value={form.lat ?? ''} onChange={e => set('lat', e.target.value)} className={inputCls} />
                <input placeholder="Longitude (e.g. 139.6503)" value={form.lng ?? ''} onChange={e => set('lng', e.target.value)} className={inputCls} />
              </div>
              <p className="text-xs text-stone-400 -mt-2">Tip: right-click on maps.google.com to copy coordinates</p>

              {getDays(form.start_date, form.end_date).length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-stone-500">Activities</label>
                  {getDays(form.start_date, form.end_date).map((d, di) => (
                    <div key={d}>
                      <p className="text-xs font-semibold text-stone-500 mb-1">{dayLabel(d, di)}</p>
                      <MarkdownEditor
                        value={dayActivities[d] ?? ''}
                        onChange={v => setDayActivities(prev => ({ ...prev, [d]: v }))}
                        placeholder="- Visit Senso-ji Temple&#10;- Tsukiji fish market"
                        height={120}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-stone-500">Hotel / accommodation</label>
                <MarkdownEditor value={form.hotel ?? ''} onChange={v => set('hotel', v)} placeholder="e.g. [Park Hyatt Tokyo](https://...)" height={90} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500">Transportation</label>
                <MarkdownEditor value={form.transportation ?? ''} onChange={v => set('transportation', v)} placeholder="e.g. Shinkansen Tokyo → Kyoto" height={90} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500">Notes</label>
                <MarkdownEditor value={form.notes ?? ''} onChange={v => set('notes', v)} placeholder="Any other notes..." height={110} />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-stone-300 text-sm text-stone-600 hover:bg-stone-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
