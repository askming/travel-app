import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Trash2 } from 'lucide-react'
import MarkdownContent from '../components/MarkdownContent'
import Lightbox from '../components/Lightbox'
import LabelChip from '../components/LabelChip'

function PhotoGrid({ photos, onPhotoClick }) {
  if (!photos.length) return null
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((p, i) => (
        <button key={p.id} onClick={() => onPhotoClick(i)} className="aspect-square overflow-hidden rounded-xl">
          <img src={p.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        </button>
      ))}
    </div>
  )
}

export default function DiaryEntryPage() {
  const { slug, entryId } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    supabase.from('diary_entries').select('*, diary_photos(*)').eq('id', entryId).single()
      .then(({ data }) => setEntry(data))
  }, [entryId])

  async function deletePhoto(photo) {
    if (!confirm('Remove this photo?')) return
    await supabase.storage.from('diary-photos').remove([photo.path])
    await supabase.from('diary_photos').delete().eq('id', photo.id)
    setEntry(e => ({ ...e, diary_photos: e.diary_photos.filter(p => p.id !== photo.id) }))
    if (lightboxIndex !== null) setLightboxIndex(null)
  }

  if (!entry) return null
  const photos = entry.diary_photos || []

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <button onClick={() => navigate(`/trips/${slug}?tab=diary`)} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm">
          <ArrowLeft size={16} /> Back to diary
        </button>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-stone-400 font-medium">
            {entry.date ? new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
          </p>
          {entry.title && <h1 className="text-2xl font-semibold text-stone-800 mt-1">{entry.title}</h1>}
          {entry.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {entry.labels.map(l => <LabelChip key={l} label={l} />)}
            </div>
          )}
        </div>
        {entry.body && <MarkdownContent source={entry.body} />}
        {photos.length > 0 && (
          <div className="relative group">
            <PhotoGrid photos={photos} onPhotoClick={setLightboxIndex} />
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {photos.map(photo => (
                <button key={photo.id} onClick={() => deletePhoto(photo)}
                  className="bg-black/60 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors" title="Remove photo">
                  <Trash2 size={12} />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
      {lightboxIndex !== null && <Lightbox photos={photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />}
    </div>
  )
}
