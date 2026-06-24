import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, LogOut, MapPin, Calendar, Pencil, Trash2 } from 'lucide-react'
import EmojiPicker from '../components/EmojiPicker'

const inputCls = 'w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400'

function tripDuration(start, end) {
  if (!start || !end) return null
  const days = Math.round((new Date(end + 'T00:00:00') - new Date(start + 'T00:00:00')) / 86400000) + 1
  return `${days} day${days !== 1 ? 's' : ''}`
}

function TripFormModal({ title, form, setForm, onSubmit, onClose, submitLabel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-stone-800 mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Icon</label>
            <div className="mt-1">
              <EmojiPicker value={form.cover_emoji} onChange={e => setForm(f => ({ ...f, cover_emoji: e }))} />
            </div>
          </div>
          <input
            placeholder="Trip title *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            className={inputCls}
          />
          <input
            placeholder="Destination"
            value={form.destination}
            onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
            className={inputCls}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-stone-500">Start date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-stone-500">End date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} min={form.start_date || undefined} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-stone-300 text-sm text-stone-600 hover:bg-stone-50">Cancel</button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EMPTY_FORM = { title: '', destination: '', start_date: '', end_date: '', cover_emoji: '✈️' }

export default function TripsPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const navigate = useNavigate()

  useEffect(() => { fetchTrips() }, [])

  async function fetchTrips() {
    const { data } = await supabase.from('trips').select('*').order('start_date', { ascending: false })
    setTrips(data || [])
    setLoading(false)
  }

  async function createTrip(e) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('trips').insert({ ...form, user_id: user.id }).select().single()
    if (!error) {
      setShowForm(false)
      navigate(`/trips/${data.id}`)
    }
  }

  function openEdit(e, trip) {
    e.stopPropagation()
    setEditingTrip(trip)
    setForm({ title: trip.title, destination: trip.destination || '', start_date: trip.start_date || '', end_date: trip.end_date || '', cover_emoji: trip.cover_emoji })
  }

  async function saveEdit(e) {
    e.preventDefault()
    await supabase.from('trips').update(form).eq('id', editingTrip.id)
    setEditingTrip(null)
    fetchTrips()
  }

  async function deleteTrip(e, trip) {
    e.stopPropagation()
    if (!confirm(`Delete "${trip.title}" and all its stops, diary entries, and photos? This cannot be undone.`)) return
    // clean up storage files before cascade-deleting the trip row
    const { data: photos } = await supabase
      .from('diary_photos')
      .select('path, diary_entries!inner(trip_id)')
      .eq('diary_entries.trip_id', trip.id)
    if (photos?.length) {
      await supabase.storage.from('diary-photos').remove(photos.map(p => p.path))
    }
    await supabase.from('trips').delete().eq('id', trip.id)
    fetchTrips()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-800">Ming's Travel Log</h1>
        <div className="flex gap-3">
          <button
            onClick={() => { setForm(EMPTY_FORM); setShowForm(true) }}
            className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors"
          >
            <Plus size={16} /> New trip
          </button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-stone-400 hover:text-stone-600">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-stone-400 text-center py-16">Loading…</p>
        ) : trips.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🗺️</p>
            <p className="text-stone-500">No trips yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => {
              const duration = tripDuration(trip.start_date, trip.end_date)
              return (
                <div key={trip.id} className="relative group">
                  <button
                    onClick={() => navigate(`/trips/${trip.id}`)}
                    className="w-full bg-white border border-stone-200 rounded-xl p-5 text-left hover:border-stone-400 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{trip.cover_emoji}</span>
                      <div className="flex-1 min-w-0 pr-8">
                        <h2 className="font-semibold text-stone-800 truncate">{trip.title}</h2>
                        <div className="flex items-center gap-4 mt-1 text-sm text-stone-500 flex-wrap">
                          {trip.destination && <span className="flex items-center gap-1"><MapPin size={13} />{trip.destination}</span>}
                          {trip.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={13} />
                              {new Date(trip.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {trip.end_date && ` – ${new Date(trip.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                              {duration && <span className="text-stone-400">· {duration}</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => openEdit(e, trip)}
                      className="p-1.5 text-stone-300 hover:text-stone-600 rounded-lg hover:bg-stone-100"
                      title="Edit trip"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={e => deleteTrip(e, trip)}
                      className="p-1.5 text-stone-300 hover:text-red-500 rounded-lg hover:bg-red-50"
                      title="Delete trip"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showForm && (
        <TripFormModal
          title="New trip"
          form={form}
          setForm={setForm}
          onSubmit={createTrip}
          onClose={() => setShowForm(false)}
          submitLabel="Create trip"
        />
      )}

      {editingTrip && (
        <TripFormModal
          title="Edit trip"
          form={form}
          setForm={setForm}
          onSubmit={saveEdit}
          onClose={() => setEditingTrip(null)}
          submitLabel="Save changes"
        />
      )}
    </div>
  )
}
