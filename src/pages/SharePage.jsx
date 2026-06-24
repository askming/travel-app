import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MapPin, Calendar, ArrowRight, Send, Trash2 } from 'lucide-react'
import MarkdownContent from '../components/MarkdownContent'
import TripMap from '../components/TripMap'

// ── helpers (shared with ItineraryTab) ──────────────────────────────────────
function getDays(start, end) {
  if (!start) return []
  const s = new Date(start + 'T00:00:00'), e = end ? new Date(end + 'T00:00:00') : s
  const days = [], cur = new Date(s)
  while (cur <= e && days.length < 30) { days.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate() + 1) }
  return days
}
function parseActivities(raw, startDate) {
  if (!raw) return {}
  try { const p = JSON.parse(raw); if (p && typeof p === 'object' && !Array.isArray(p)) return p } catch {}
  return startDate ? { [startDate]: raw } : {}
}
function formatDateRange(start, end) {
  if (!start) return ''
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (!end || end === start) return fmt(start)
  const s = new Date(start + 'T00:00:00'), e = new Date(end + 'T00:00:00')
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
    return `${s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}`
  return `${fmt(start)} – ${fmt(end)}`
}
function dayLabel(dateStr, i) {
  return `Day ${i + 1} — ${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
}
function stripMarkdown(md) {
  if (!md) return ''
  return md.replace(/#{1,6}\s+/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/^[-*+]\s/gm, '').replace(/^\d+\.\s/gm, '').trim()
}

// ── read-only itinerary ──────────────────────────────────────────────────────
function ReadOnlyItinerary({ stops }) {
  const [view, setView] = useState('timeline')
  const mapStops = stops.filter(s => s.lat && s.lng)

  if (stops.length === 0) return <p className="text-center text-stone-400 py-12">No itinerary added yet.</p>

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {['timeline', 'map'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1 rounded-lg text-sm capitalize transition-colors ${view === v ? 'bg-stone-200 text-stone-800 font-medium' : 'text-stone-500 hover:bg-stone-100'}`}>{v}</button>
        ))}
      </div>
      {view === 'map' ? <TripMap stops={mapStops} /> : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-stone-200" />
          <div className="space-y-4">
            {stops.map((stop, i) => {
              const days = getDays(stop.start_date, stop.end_date)
              const acts = parseActivities(stop.activities, stop.start_date)
              return (
                <div key={stop.id} className="relative pl-12">
                  <div className="absolute left-2 top-4 w-5 h-5 rounded-full bg-stone-800 text-white text-xs flex items-center justify-center font-medium">{i + 1}</div>
                  <div className="bg-white border border-stone-200 rounded-xl p-4">
                    <p className="text-xs text-stone-400 font-medium">{formatDateRange(stop.start_date, stop.end_date)}</p>
                    <h3 className="font-semibold text-stone-800 mt-0.5 flex items-center gap-1"><MapPin size={14} className="text-stone-400 shrink-0" />{stop.destination}</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      {stop.activities && (days.length > 1 ? (
                        <div className="space-y-2">
                          {days.map((d, di) => acts[d]?.trim() ? (
                            <div key={d}><p className="text-xs font-semibold text-stone-500 mb-1">{dayLabel(d, di)}</p><MarkdownContent source={acts[d]} /></div>
                          ) : null)}
                        </div>
                      ) : <MarkdownContent source={Object.values(acts)[0]} />)}
                      {stop.hotel && <div><p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-0.5">Hotel</p><MarkdownContent source={stop.hotel} /></div>}
                      {stop.transportation && <div><p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-0.5">Transport</p><MarkdownContent source={stop.transportation} /></div>}
                      {stop.notes && <div><p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-0.5">Notes</p><MarkdownContent source={stop.notes} /></div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── read-only diary ──────────────────────────────────────────────────────────
function ReadOnlyDiary({ entries, slug }) {
  const navigate = useNavigate()
  if (entries.length === 0) return <p className="text-center text-stone-400 py-12">No diary entries yet.</p>
  return (
    <div className="space-y-5">
      {entries.map(entry => {
        const hero = entry.diary_photos?.[0]
        const plain = stripMarkdown(entry.body)
        const entryUrl = `/share/${slug}/diary/${entry.id}`
        return (
          <div key={entry.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-stretch gap-4">
                {hero && (
                  <button onClick={() => navigate(entryUrl)} className="shrink-0 w-[120px] rounded-lg overflow-hidden border border-stone-200">
                    <img src={hero.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-400 font-medium">
                    {entry.date ? new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                  </p>
                  {entry.title && <button onClick={() => navigate(entryUrl)} className="font-semibold text-stone-800 mt-0.5 hover:text-stone-500 transition-colors text-left block">{entry.title}</button>}
                  {plain && <p className="text-sm text-stone-600 leading-relaxed line-clamp-4 mt-1">{plain}</p>}
                  {(plain.length > 280 || (entry.diary_photos?.length || 0) > 0) && (
                    <div className="flex justify-end mt-2">
                      <button onClick={() => navigate(entryUrl)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 font-medium">
                        Read more <ArrowRight size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── comments ─────────────────────────────────────────────────────────────────
function Comments({ tripId, isOwner }) {
  const [comments, setComments] = useState([])
  const [form, setForm] = useState({ author_name: '', author_email: '', body: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchComments() }, [tripId])

  async function fetchComments() {
    const { data } = await supabase.from('comments').select('*').eq('trip_id', tripId).order('created_at')
    setComments(data || [])
  }

  async function submitComment(e) {
    e.preventDefault()
    setSubmitting(true); setError('')
    const { error } = await supabase.from('comments').insert({ ...form, trip_id: tripId })
    if (error) { setError(error.message) }
    else { setForm({ author_name: '', author_email: '', body: '' }); fetchComments() }
    setSubmitting(false)
  }

  async function deleteComment(id) {
    await supabase.from('comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400'

  return (
    <div className="mt-10 border-t border-stone-200 pt-8">
      <h2 className="text-lg font-semibold text-stone-800 mb-6">Comments {comments.length > 0 && <span className="text-stone-400 font-normal text-base">({comments.length})</span>}</h2>

      {comments.length === 0 && <p className="text-stone-400 text-sm mb-6">No comments yet. Be the first to leave one!</p>}

      <div className="space-y-4 mb-8">
        {comments.map(c => (
          <div key={c.id} className="bg-white border border-stone-200 rounded-xl p-4 group">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium text-stone-800 text-sm">{c.author_name}</span>
                <span className="text-stone-400 text-xs ml-2">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {isOwner && (
                <button onClick={() => deleteComment(c.id)} className="p-1 text-stone-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <p className="text-stone-600 text-sm mt-1 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submitComment} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-stone-700">Leave a comment</h3>
        <div className="flex gap-3">
          <input placeholder="Your name *" value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} required className={inputCls} />
          <input placeholder="Email (optional)" value={form.author_email} onChange={e => setForm(f => ({ ...f, author_email: e.target.value }))} className={inputCls} />
        </div>
        <textarea placeholder="Write a comment…" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required rows={3} className={inputCls + ' resize-none'} />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50">
            <Send size={14} /> {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function SharePage() {
  const { slug } = useParams()
  const [trip, setTrip] = useState(null)
  const [stops, setStops] = useState([])
  const [entries, setEntries] = useState([])
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'itinerary')
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
    supabase.from('trips').select('*').eq('slug', slug).eq('is_public', true).single()
      .then(({ data }) => {
        if (!data) { setNotFound(true); setLoading(false); return }
        setTrip(data)
        setLoading(false)
        // fetch sub-data using the UUID
        supabase.from('stops').select('*').eq('trip_id', data.id).order('start_date')
          .then(({ data: s }) => setStops(s || []))
        supabase.from('diary_entries').select('*, diary_photos(*)').eq('trip_id', data.id).order('date')
          .then(({ data: e }) => setEntries(e || []))
      })
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <p className="text-stone-400 text-sm">Loading…</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">🔒</p>
        <p className="text-stone-600 font-medium">This trip is private or doesn't exist.</p>
      </div>
    </div>
  )

  if (!trip) return null  // shouldn't reach here given loading/notFound guards above

  const isOwner = userId === trip.user_id
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const duration = trip.start_date && trip.end_date
    ? Math.round((new Date(trip.end_date + 'T00:00:00') - new Date(trip.start_date + 'T00:00:00')) / 86400000) + 1
    : null

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-stone-400 mb-3">Ming's Travel Log</p>
          <div className="flex items-start gap-3">
            <span className="text-4xl">{trip.cover_emoji}</span>
            <div>
              <h1 className="text-2xl font-semibold text-stone-800">{trip.title}</h1>
              {trip.destination && <p className="flex items-center gap-1 text-stone-500 text-sm mt-0.5"><MapPin size={13} />{trip.destination}</p>}
              {trip.start_date && (
                <p className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                  <Calendar size={12} />
                  {fmt(trip.start_date)}{trip.end_date && ` – ${fmt(trip.end_date)}`}
                  {duration && <span>· {duration} days</span>}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1 mt-4">
            {['itinerary', 'diary'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`}>{t}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {tab === 'itinerary'
          ? <ReadOnlyItinerary stops={stops} />
          : <ReadOnlyDiary entries={entries} slug={slug} />
        }
        <Comments tripId={trip.id} isOwner={isOwner} />
      </main>
    </div>
  )
}
