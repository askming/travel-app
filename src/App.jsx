import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import TripsPage from './pages/TripsPage'
import TripPage from './pages/TripPage'
import DiaryEntryPage from './pages/DiaryEntryPage'
import SharePage from './pages/SharePage'
import ShareEntryPage from './pages/ShareEntryPage'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <TripsPage /> : <Navigate to="/login" />} />
        <Route path="/trips/:id" element={session ? <TripPage /> : <Navigate to="/login" />} />
        <Route path="/trips/:tripId/diary/:entryId" element={session ? <DiaryEntryPage /> : <Navigate to="/login" />} />
        {/* Public routes — no auth required */}
        <Route path="/share/:tripId" element={<SharePage />} />
        <Route path="/share/:tripId/diary/:entryId" element={<ShareEntryPage />} />
      </Routes>
    </BrowserRouter>
  )
}
