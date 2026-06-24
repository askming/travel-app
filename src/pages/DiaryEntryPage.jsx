import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import MarkdownContent from '../components/MarkdownContent'

function Lightbox({ photos, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex)

  const prev = useCallback(() => setIndex(i => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setIndex(i => (i + 1) % photos.length), [photos.length])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
        <X size={24} />
      </button>

      {/* Counter */}
      <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {index + 1} / {photos.length}
      </p>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Image */}
      <img
        src={photos[index].url}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        onClick={e => e.stopPropagation()}
      />

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronRight size={32} />
        </button>
      )}
    </div>
  )
}

function PhotoGrid({ photos, onPhotoClick }) {
  if (!photos.length) return null
  return (
    <div className="grid grid-cols-3 gap-1">
      {photos.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onPhotoClick(i)}
          className="aspect-square overflow-hidden rounded-sm"
        >
          <img
            src={p.url}
            alt=""
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </button>
      ))}
    </div>
  )
}

export default function DiaryEntryPage() {
  const { tripId, entryId } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    supabase
      .from('diary_entries')
      .select('*, diary_photos(*)')
      .eq('id', entryId)
      .single()
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
        <button onClick={() => navigate(`/trips/${tripId}?tab=diary`)} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm">
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

        {photos.length > 0 && (
          <div>
            <PhotoGrid photos={photos} onPhotoClick={setLightboxIndex} />
          </div>
        )}
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
