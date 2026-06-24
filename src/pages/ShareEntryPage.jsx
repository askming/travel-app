import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft } from 'lucide-react'
import MarkdownContent from '../components/MarkdownContent'
import Lightbox from '../components/Lightbox'

function PhotoGrid({ photos, onPhotoClick }) {
  if (!photos.length) return null
  return (
    <div className="grid grid-cols-3 gap-1">
      {photos.map((p, i) => (
        <button key={p.id} onClick={() => onPhotoClick(i)} className="aspect-square overflow-hidden rounded-sm">
          <img src={p.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        </button>
      ))}
    </div>
  )
}

export default function ShareEntryPage() {
  const { tripId, entryId } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    supabase.from('diary_entries').select('*, diary_photos(*)').eq('id', entryId).single()
      .then(({ data }) => setEntry(data))
  }, [entryId])

  if (!entry) return null
  const photos = entry.diary_photos || []

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <button onClick={() => navigate(`/share/${tripId}?tab=diary`)} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm">
          <ArrowLeft size={16} /> Back to diary
        </button>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-stone-400 font-medium">
            {entry.date ? new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
          </p>
          {entry.title && <h1 className="text-2xl font-semibold text-stone-800 mt-1">{entry.title}</h1>}
        </div>
        {entry.body && <MarkdownContent source={entry.body} />}
        {photos.length > 0 && <PhotoGrid photos={photos} onPhotoClick={setLightboxIndex} />}
      </main>
      {lightboxIndex !== null && <Lightbox photos={photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />}
    </div>
  )
}
