import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Pencil, Check, X, Calendar, Globe, Lock, Copy, CheckCheck } from 'lucide-react'
import ItineraryTab from '../components/ItineraryTab'
import DiaryTab from '../components/DiaryTab'
import EmojiPicker from '../components/EmojiPicker'

function formatTripDates(start, end) {
  if (!start) return null
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const duration = end ? Math.round((new Date(end + 'T00:00:00') - new Date(start + 'T00:00:00')) / 86400000) + 1 : null
  return { dateStr: end ? `${fmt(start)} – ${fmt(end)}` : fmt(start), duration }
}

export default function TripPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [trip, setTrip] = useState(null)
  const [tab, setTab] = useState(searchParams.get('tab') || 'itinerary')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.from('trips').select('*').eq('id', id).single().then(({ data }) => setTrip(data))
  }, [id])

  function startEdit() {
    setEditForm({ title: trip.title, destination: trip.destination, cover_emoji: trip.cover_emoji, start_date: trip.start_date || '', end_date: trip.end_date || '' })
    setEditing(true)
  }

  async function saveEdit(e) {
    e.preventDefault()
    const { data } = await supabase.from('trips').update(editForm).eq('id', id).select().single()
    if (data) setTrip(data)
    setEditing(false)
  }

  async function togglePublic() {
    const { data } = await supabase.from('trips').update({ is_public: !trip.is_public }).eq('id', id).select().single()
    if (data) setTrip(data)
  }

  function copyShareLink() {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!trip) return null

  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}share/${id}`

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm mb-3">
          <ArrowLeft size={16} /> All trips
        </button>

        {editing ? (
          <form onSubmit={saveEdit} className="flex items-start gap-3">
            <EmojiPicker value={editForm.cover_emoji} onChange={e => setEditForm(f => ({ ...f, cover_emoji: e }))} />
            <div className="flex-1 space-y-2">
              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required placeholder="Trip title"
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-stone-400" />
              <input value={editForm.destination} onChange={e => setEditForm(f => ({ ...f, destination: e.target.value }))} placeholder="Destination"
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-stone-400">Start date</label>
                  <input type="date" value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-400">End date</label>
                  <input type="date" value={editForm.end_date} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} min={editForm.start_date || undefined}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-stone-700"><Check size={13} /> Save</button>
                <button type="button" onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg text-xs hover:bg-stone-50"><X size={13} /> Cancel</button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-start gap-3 group">
            <span className="text-3xl">{trip.cover_emoji}</span>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-stone-800">{trip.title}</h1>
              {trip.destination && <p className="text-sm text-stone-500">{trip.destination}</p>}
              {(() => {
                const d = formatTripDates(trip.start_date, trip.end_date)
                return d ? (
                  <p className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                    <Calendar size={12} />{d.dateStr}
                    {d.duration && <><span className="text-stone-300">·</span><span>{d.duration} day{d.duration !== 1 ? 's' : ''}</span></>}
                  </p>
                ) : null
              })()}
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              {/* Share toggle */}
              <button onClick={togglePublic}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${trip.is_public ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
              >
                {trip.is_public ? <Globe size={11} /> : <Lock size={11} />}
                {trip.is_public ? 'Public' : 'Private'}
              </button>
              <button onClick={startEdit} className="p-1.5 text-stone-300 hover:text-stone-600 rounded-lg hover:bg-stone-100 opacity-0 group-hover:opacity-100 transition-opacity" title="Edit trip">
                <Pencil size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Share URL bar */}
        {trip.is_public && (
          <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <p className="text-xs text-green-700 truncate flex-1">{shareUrl}</p>
            <button onClick={copyShareLink} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium shrink-0">
              {copied ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
        )}

        <div className="flex gap-1 mt-4">
          {['itinerary', 'diary'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`}>{t}</button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {tab === 'itinerary' ? <ItineraryTab tripId={id} /> : <DiaryTab tripId={id} />}
      </main>
    </div>
  )
}
