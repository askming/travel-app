import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Image, Pencil, ArrowRight, X } from 'lucide-react'
import MarkdownEditor from './MarkdownEditor'

const MAX_PHOTOS = 10

function stripMarkdown(md) {
  if (!md) return ''
  return md
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^[-*+]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/^>\s/gm, '')
    .trim()
}

function DiaryEntryCard({ entry, tripId, tripSlug, onEdit, onDelete }) {
  const navigate = useNavigate()
  const hero = entry.diary_photos?.[0]
  const extraPhotos = entry.diary_photos?.slice(1, 4) || []
  const plainText = stripMarkdown(entry.body)
  const hasMore = plainText.length > 280
  const entryUrl = `/trips/${tripSlug || tripId}/diary/${entry.id}`

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden group">
      <div className="p-5">
        <div className="flex items-stretch gap-4">
          {/* Thumbnail — height matches text column */}
          {hero && (
            <button onClick={() => navigate(entryUrl)} className="shrink-0 w-[120px] rounded-lg overflow-hidden border border-stone-200">
              <img src={hero.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <p className="text-xs text-stone-400 font-medium">
                  {entry.date ? new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                </p>
                {entry.title && (
                  <button onClick={() => navigate(entryUrl)} className="font-semibold text-stone-800 mt-0.5 hover:text-stone-500 transition-colors text-left block">
                    {entry.title}
                  </button>
                )}
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(entry)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"><Pencil size={14} /></button>
                <button onClick={() => onDelete(entry)} className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
              </div>
            </div>

            {plainText && (
              <p className="text-sm text-stone-600 leading-relaxed line-clamp-4 mt-1">{plainText}</p>
            )}
          </div>
        </div>

        {(hasMore || entry.diary_photos?.length > 0) && (
          <div className="flex justify-end mt-3">
            <button onClick={() => navigate(entryUrl)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 font-medium transition-colors">
              Read more <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DiaryTab({ tripId, tripSlug }) {
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ date: '', title: '', body: '' })
  const [existingPhotos, setExistingPhotos] = useState([])
  const [files, setFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef()

  useEffect(() => { fetchEntries() }, [tripId])

  async function fetchEntries() {
    const { data } = await supabase
      .from('diary_entries')
      .select('*, diary_photos(*)')
      .eq('trip_id', tripId)
      .order('date')
    setEntries(data || [])
  }

  function openNew() {
    setForm({ date: '', title: '', body: '' })
    setFiles([]); setFilePreviews([]); setExistingPhotos([])
    setUploadError(''); setEditing(null); setShowForm(true)
  }

  function openEdit(entry) {
    setForm({ date: entry.date, title: entry.title || '', body: entry.body || '' })
    setFiles([]); setFilePreviews([]); setExistingPhotos(entry.diary_photos || [])
    setUploadError(''); setEditing(entry.id); setShowForm(true)
  }

  function handleFileSelect(e) {
    const selected = Array.from(e.target.files).slice(0, MAX_PHOTOS - existingPhotos.length)
    setFiles(selected)
    setFilePreviews(selected.map(f => URL.createObjectURL(f)))
  }

  async function removeExistingPhoto(photo) {
    await supabase.storage.from('diary-photos').remove([photo.path])
    await supabase.from('diary_photos').delete().eq('id', photo.id)
    setExistingPhotos(prev => prev.filter(p => p.id !== photo.id))
    setEntries(prev => prev.map(e => e.id === editing
      ? { ...e, diary_photos: e.diary_photos.filter(p => p.id !== photo.id) }
      : e
    ))
  }

  function removeNewFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function saveEntry(e) {
    e.preventDefault()
    setUploading(true); setUploadError('')
    const { data: { user } } = await supabase.auth.getUser()

    let entryId = editing
    if (editing) {
      await supabase.from('diary_entries').update({ ...form, trip_id: tripId }).eq('id', editing)
    } else {
      const { data, error: entryError } = await supabase.from('diary_entries')
        .insert({ ...form, trip_id: tripId, user_id: user.id }).select().single()
      if (entryError) { setUploadError(`Failed to save entry: ${entryError.message}`); setUploading(false); return }
      entryId = data.id
    }

    const errors = []
    for (const file of files) {
      const path = `${user.id}/${entryId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error } = await supabase.storage.from('diary-photos').upload(path, file)
      if (error) {
        errors.push(`${file.name}: ${error.message}`)
      } else {
        const { data: { publicUrl } } = supabase.storage.from('diary-photos').getPublicUrl(path)
        await supabase.from('diary_photos').insert({ entry_id: entryId, url: publicUrl, path })
      }
    }

    setUploading(false)
    if (errors.length) {
      setUploadError(`Photo upload failed — ${errors.join('; ')}`)
      fetchEntries()
    } else {
      setShowForm(false)
      fetchEntries()
    }
  }

  async function deleteEntry(entry) {
    if (!confirm('Delete this diary entry and its photos?')) return
    for (const photo of entry.diary_photos || []) {
      await supabase.storage.from('diary-photos').remove([photo.path])
      await supabase.from('diary_photos').delete().eq('id', photo.id)
    }
    await supabase.from('diary_entries').delete().eq('id', entry.id)
    fetchEntries()
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400'
  const totalPhotos = existingPhotos.length + files.length

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-1.5 bg-stone-800 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-stone-700">
          <Plus size={14} /> Add entry
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <Image size={32} className="mx-auto mb-3 opacity-40" />
          <p>No diary entries yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {entries.map(entry => (
            <DiaryEntryCard key={entry.id} entry={entry} tripId={tripId} tripSlug={tripSlug} onEdit={openEdit} onDelete={deleteEntry} />
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl my-4">
            <h2 className="text-lg font-semibold text-stone-800 mb-4">{editing ? 'Edit entry' : 'New diary entry'}</h2>
            <form onSubmit={saveEntry} className="space-y-4">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className={inputCls} />
              <input placeholder="Title (optional)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Entry</label>
                <MarkdownEditor
                  value={form.body}
                  onChange={v => setForm(f => ({ ...f, body: v }))}
                  placeholder="Write about your day… use **bold**, - lists, [links](url), emojis 🌸"
                  height={260}
                />
              </div>

              {/* Existing photos */}
              {existingPhotos.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-2 block">Current photos</label>
                  <div className="grid grid-cols-3 gap-2">
                    {existingPhotos.map(photo => (
                      <div key={photo.id} className="relative group/photo bg-stone-100 rounded-lg overflow-hidden">
                        <img src={photo.url} alt="" className="w-full h-auto max-h-32 object-contain" />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(photo)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover/photo:opacity-100 transition-opacity"
                          title="Remove photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New file previews */}
              {filePreviews.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-2 block">New photos to upload</label>
                  <div className="grid grid-cols-3 gap-2">
                    {filePreviews.map((src, i) => (
                      <div key={i} className="relative group/photo bg-stone-100 rounded-lg overflow-hidden">
                        <img src={src} alt="" className="w-full h-auto max-h-32 object-contain" />
                        <button
                          type="button"
                          onClick={() => removeNewFile(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover/photo:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add photos button */}
              {totalPhotos < MAX_PHOTOS && (
                <div>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                  <button type="button" onClick={() => fileRef.current.click()}
                    className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 border border-dashed border-stone-300 rounded-lg px-3 py-2 w-full hover:border-stone-400"
                  >
                    <Image size={15} />
                    {totalPhotos > 0 ? `Add more photos (${totalPhotos}/${MAX_PHOTOS})` : `Add photos (up to ${MAX_PHOTOS})`}
                  </button>
                </div>
              )}

              {uploadError && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{uploadError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-stone-300 text-sm text-stone-600 hover:bg-stone-50">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 disabled:opacity-50">
                  {uploading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
