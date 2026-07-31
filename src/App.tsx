import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import MainLayout from './layouts/MainLayout'
import Shows from './pages/Shows'
import ShowDetail from './pages/ShowDetail'
import ShowEdit from './pages/ShowEdit'
import Musicals from './pages/Musicals'
import MusicalDetail from './pages/MusicalDetail'
import MusicalEdit from './pages/MusicalEdit'
import Artists from './pages/Artists'
import ArtistDetail from './pages/ArtistDetail'
import ArtistEdit from './pages/ArtistEdit'
import Login from './pages/Login'
import ToastContainer from './components/Toast'
import ScrollToTop from './components/ScrollToTop'
import type { User } from '@supabase/supabase-js'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初始检查登录状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听登录状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf9f6' }}>
        <span style={{ color: '#707979', fontSize: '14px' }}>加载中...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Login onSuccess={() => {}} />
        <ToastContainer />
      </>
    )
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Shows />} />
          <Route path="shows/:id" element={<ShowDetail />} />
          <Route path="shows/:id/edit" element={<ShowEdit />} />
          <Route path="shows/new" element={<ShowEdit />} />
          <Route path="musicals" element={<Musicals />} />
          <Route path="musicals/:name" element={<MusicalDetail />} />
          <Route path="musicals/:name/edit" element={<MusicalEdit />} />
          <Route path="musicals/new" element={<MusicalEdit />} />
          <Route path="artists" element={<Artists />} />
          <Route path="artists/:name" element={<ArtistDetail />} />
          <Route path="artists/:name/edit" element={<ArtistEdit />} />
          <Route path="artists/new" element={<ArtistEdit />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App
